/**
 * Plik: app/(dashboard)/layout.tsx
 * Cel: Layout chronionej części aplikacji — sidebar (desktop), nagłówek z menu
 *      użytkownika i przełącznikiem motywu, dolna nawigacja (mobile).
 *      Wymusza zalogowanie (zabezpieczenie warstwowe obok middleware).
 * Zależności: lib/auth, components/shared/*.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/shared/sidebar';
import { BottomNav } from '@/components/shared/bottom-nav';
import { UserMenu } from '@/components/shared/user-menu';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NotificationBell } from '@/components/shared/notification-bell';
import { QuickAddFab } from '@/components/orders/quick-add-fab';
import { PwaManager } from '@/components/pwa/pwa-manager';
import { InstallPrompt } from '@/components/pwa/install-prompt';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { user } = session;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-6">
          <span className="text-base font-semibold md:hidden">ApkaFirmowa</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              role={user.role}
            />
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <BottomNav role={user.role} />
      <QuickAddFab isAdmin={user.role === 'ADMIN'} />
      <PwaManager />
      <InstallPrompt />
    </div>
  );
}
