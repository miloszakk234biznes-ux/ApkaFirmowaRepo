/**
 * Plik: lib/logger.ts
 * Cel: Centralny logger aplikacji (Pino) — strukturalne logi z poziomem zależnym
 *      od środowiska. Używać zamiast console.* w kodzie serwerowym.
 * Zależności: pino. Konfiguracja poziomu: LOG_LEVEL (domyślnie info / debug w dev).
 */
import pino from 'pino';

export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  base: { app: 'apkafirmowa' },
  redact: {
    paths: [
      'password',
      'hashedPassword',
      'token',
      'refreshToken',
      '*.password',
      '*.token',
    ],
    censor: '[redacted]',
  },
});
