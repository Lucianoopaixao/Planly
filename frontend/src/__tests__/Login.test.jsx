// testes do componente de login busca pelos inputs pelo type HTML
import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../screens/Login.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    login: vi.fn().mockRejectedValue(new Error("Credenciais inválidas")),
  }),
}));

describe("Tela de Login", () => {
  test("renderiza campos de email e senha", () => {
    const { container } = render(<Login goSignup={() => {}} />);
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(
      container.querySelector('input[type="password"]'),
    ).toBeInTheDocument();
  });

  test('renderiza botão "Entrar no Planly"', () => {
    render(<Login goSignup={() => {}} />);
    expect(screen.getByText(/entrar no planly/i)).toBeInTheDocument();
  });

  test('chama goSignup ao clicar em "Criar uma conta"', async () => {
    const goSignup = vi.fn();
    const user = userEvent.setup();
    render(<Login goSignup={goSignup} />);

    await user.click(screen.getByText(/criar uma conta/i));
    expect(goSignup).toHaveBeenCalledTimes(1);
  });

  test("mostra mensagem de erro quando login falha", async () => {
    const user = userEvent.setup();
    const { container } = render(<Login goSignup={() => {}} />);

    const emailInput = container.querySelector('input[type="email"]');
    const senhaInput = container.querySelector('input[type="password"]');

    await user.type(emailInput, "a@b.com");
    await user.type(senhaInput, "123456");
    await user.click(screen.getByText(/entrar no planly/i));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  test("toggle de senha alterna entre password e text", async () => {
    const user = userEvent.setup();
    const { container } = render(<Login goSignup={() => {}} />);

    const senhaInput = container.querySelector('input[type="password"]');
    expect(senhaInput).toBeInTheDocument();

    const toggleBtn = senhaInput.parentElement.querySelector("button");
    await user.click(toggleBtn);

    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
  });
});
