/**
 * Plik: tests/unit/components.test.tsx
 * Cel: Testy komponentów (render) — znacznik statusu zlecenia oraz pasek postępu.
 * Zależności: @testing-library/react.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Progress } from '@/components/ui/progress';

describe('OrderStatusBadge', () => {
  it('renderuje polską etykietę statusu DONE', () => {
    render(<OrderStatusBadge status="DONE" />);
    expect(screen.getByText('Zakończone')).toBeInTheDocument();
  });

  it('renderuje etykietę dla NEW', () => {
    render(<OrderStatusBadge status="NEW" />);
    expect(screen.getByText('Nowe')).toBeInTheDocument();
  });
});

describe('Progress', () => {
  it('ustawia szerokość wskaźnika wg wartości', () => {
    const { container } = render(<Progress value={42} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    const indicator = bar?.firstElementChild as HTMLElement;
    expect(indicator.style.width).toBe('42%');
  });

  it('ogranicza wartość do zakresu 0–100', () => {
    const { container } = render(<Progress value={150} />);
    const indicator = container.querySelector('[role="progressbar"]')
      ?.firstElementChild as HTMLElement;
    expect(indicator.style.width).toBe('100%');
  });
});
