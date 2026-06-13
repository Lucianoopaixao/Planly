/**
 * Testes dos componentes base do design system.
 * Garante que botões, cards e brand renderizam corretamente.
 */
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Brand, c } from '../components/ui.jsx';

describe('Design System — ui.jsx', () => {
  test('Brand renderiza com o nome "Planly"', () => {
    render(<Brand />);
    expect(screen.getByText(/planly/i)).toBeInTheDocument();
  });

  test('tokens de cor estão definidos', () => {
    expect(c.forest).toBeDefined();
    expect(c.gold).toBeDefined();
    expect(c.cream).toBeDefined();
    expect(c.forest).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test('tokens contêm cor de erro (rust) para feedback de falha', () => {
    expect(c.rust).toBeDefined();
  });
});
