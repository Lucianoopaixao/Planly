/**
 * Testes unitários de autenticação.
 * Testa bcrypt e JWT isoladamente, sem banco nem HTTP.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import { signToken, verifyToken } from '../src/utils/jwt.js';

describe('Hash de senha (bcrypt)', () => {
  test('hash gerado é diferente da senha original', async () => {
    const senha = 'minhasenha123';
    const hash = await bcrypt.hash(senha, 10);
    expect(hash).not.toBe(senha);
    expect(hash.length).toBeGreaterThan(20);
  });

  test('compare aceita a senha correta', async () => {
    const senha = 'planly2026';
    const hash = await bcrypt.hash(senha, 10);
    const valido = await bcrypt.compare(senha, hash);
    expect(valido).toBe(true);
  });

  test('compare rejeita senha errada', async () => {
    const hash = await bcrypt.hash('senha-certa', 10);
    const valido = await bcrypt.compare('senha-errada', hash);
    expect(valido).toBe(false);
  });
});

describe('JWT — geração e validação', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste';
  });

  test('signToken retorna string com 3 partes (header.payload.signature)', () => {
    const token = signToken({ userId: 'abc-123' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  test('verifyToken decodifica corretamente o payload', () => {
    const payload = { userId: 'user-42', email: 'teste@planly.app' };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('user-42');
    expect(decoded.email).toBe('teste@planly.app');
  });

  test('verifyToken lança erro para token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow();
  });
});
