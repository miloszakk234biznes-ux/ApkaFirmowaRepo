/**
 * Plik: lib/email.ts
 * Cel: Wysyłka e-maili przez nodemailer (SMTP). Używane m.in. do resetu hasła.
 *      W trybie deweloperskim bez konfiguracji SMTP loguje treść do konsoli.
 * Zależności: nodemailer; zmienne SMTP_* z .env.
 */
import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    return null; // brak konfiguracji — fallback do logowania w konsoli
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER
      ? { user: SMTP_USER, pass: SMTP_PASSWORD }
      : undefined,
  });

  return transporter;
}

/** Wysyła e-mail lub — przy braku SMTP — loguje go do konsoli (dev). */
export async function sendMail(options: SendMailOptions): Promise<void> {
  const t = getTransporter();
  const from = process.env.SMTP_FROM ?? 'ApkaFirmowa <no-reply@apkafirmowa.app>';

  if (!t) {
    console.warn(
      '[email] Brak konfiguracji SMTP — e-mail nie został wysłany. Podgląd treści:',
    );
    console.warn(`[email] Do: ${options.to}`);
    console.warn(`[email] Temat: ${options.subject}`);
    console.warn(`[email] Treść:\n${options.text ?? options.html}`);
    return;
  }

  await t.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/** Buduje i wysyła wiadomość z linkiem resetu hasła. */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset hasła</h2>
      <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w aplikacji ApkaFirmowa.</p>
      <p>Kliknij poniższy przycisk, aby ustawić nowe hasło. Link wygasa za 60 minut.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Ustaw nowe hasło
        </a>
      </p>
      <p style="color: #64748b; font-size: 13px;">
        Jeśli to nie Ty wysłałeś tę prośbę, zignoruj tę wiadomość — hasło pozostanie bez zmian.
      </p>
    </div>
  `;

  await sendMail({
    to,
    subject: 'Reset hasła — ApkaFirmowa',
    html,
    text: `Zresetuj hasło, otwierając link: ${resetUrl} (ważny 60 minut).`,
  });
}
