/**
 * Plik: vitest.setup.ts
 * Cel: Globalny setup testów — matchery jest-dom oraz sprzątanie po każdym teście.
 * Zależności: @testing-library/jest-dom, @testing-library/react.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
