/**
 * Plik: lib/auth.ts
 * Cel: Konfiguracja NextAuth.js — provider credentials (e-mail + hasło z bcrypt),
 *      strategia sesji JWT (httpOnly cookies), wzbogacenie tokenu i sesji o
 *      rolę użytkownika (RBAC). Eksportuje też pomocnicze funkcje serwerowe.
 * Zależności: next-auth, bcryptjs, lib/prisma, lib/audit.
 */
import type { NextAuthOptions, DefaultSession } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { loginSchema } from '@/lib/validations/auth';
import { createAuditLog } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';

// Rozszerzenie typów NextAuth o nasze pola (rola, id).
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dni
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials) {
        // Walidacja wejścia Zod również po stronie serwera.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate limiting prób logowania per e-mail (ochrona przed brute-force).
        const limit = rateLimit(`login:${email.toLowerCase()}`, 5, 60_000);
        if (!limit.success) {
          throw new Error('Zbyt wiele prób logowania. Spróbuj za chwilę.');
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.hashedPassword) return null;
        if (!user.active) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        // Dziennik logowań w AuditLog.
        await createAuditLog({
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Pobiera sesję po stronie serwera (RSC, route handlers, server actions). */
export function auth() {
  return getServerSession(authOptions);
}
