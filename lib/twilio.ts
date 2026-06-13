/**
 * Plik: lib/twilio.ts
 * Cel: Wysyłka SMS przez Twilio (opcjonalne przypomnienia dla klientów).
 *      Bez konfiguracji loguje treść do konsoli (dev).
 * Zależności: twilio; zmienne TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *      TWILIO_PHONE_NUMBER.
 */
import twilio from 'twilio';

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER,
  );
}

/** Wysyła SMS lub — przy braku konfiguracji — loguje go (dev). Zwraca sukces. */
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.warn(`[sms] Brak konfiguracji Twilio. Do: ${to}\n${body}`);
    return false;
  }
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });
    return true;
  } catch (err) {
    console.error('[sms] Błąd wysyłki:', err);
    return false;
  }
}
