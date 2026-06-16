import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { c, fontDisplay, fontBody, Brand } from "../components/ui.jsx";

export default function Login({ goSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, pwd);
    } catch (e) {
      setErr(e.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: c.cream,
        color: c.ink,
        fontFamily: fontBody,
      }}
    >
      {/* lado esquerdo — manifesto */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: `linear-gradient(135deg, ${c.forestD} 0%, ${c.forest} 60%, ${c.forestL} 100%)`,
        }}
        className="hide-mobile"
      >
        <Brand size="md" color={c.creamL} />

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: -24,
              top: -32,
              fontSize: 144,
              opacity: 0.15,
              fontFamily: fontDisplay,
              color: c.gold,
              fontStyle: "italic",
            }}
          >
            “
          </div>
          <h1
            style={{
              position: "relative",
              fontFamily: fontDisplay,
              color: c.creamL,
              fontSize: "4rem",
              lineHeight: 1.05,
              fontWeight: 400,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Planeje
            <br />
            com{" "}
            <em style={{ color: c.goldL, fontWeight: 300 }}>honestidade.</em>
          </h1>
          <p
            style={{
              marginTop: 32,
              maxWidth: 460,
              color: "rgba(245,239,227,0.78)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
            }}
          >
            O Planly aprende com o seu ritmo. Compara o tempo que você estimou
            com o que realmente gastou — e calibra a sua agenda para algo,
            enfim, realizável.
          </p>
        </div>

        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(245,239,227,0.4)",
          }}
        ></div>
      </div>

      {/* lado direito — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <form
          onSubmit={submit}
          style={{ width: "100%", maxWidth: 360 }}
          className="fade-up"
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: c.gold,
              marginBottom: 12,
            }}
          >
            · Bem-vindo de volta
          </div>
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: "2.75rem",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Entre na sua <em style={{ color: c.forestL }}>rotina.</em>
          </h2>

          <div style={{ marginTop: 40 }}>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <Label>Senha</Label>
            <div style={{ position: "relative" }}>
              <Input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 8,
                  background: "none",
                  border: "none",
                  color: c.muted,
                  cursor: "pointer",
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {err && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: `${c.rust}15`,
                color: c.rust,
                fontSize: 14,
              }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 28,
              padding: "16px 0",
              borderRadius: 999,
              background: c.forest,
              color: c.creamL,
              fontWeight: 500,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontFamily: fontBody,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Entrando…" : "Entrar no Planly"}{" "}
            {!loading && <ArrowRight size={16} />}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: c.border }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: c.muted,
              }}
            >
              ou
            </span>
            <div style={{ flex: 1, height: 1, background: c.border }} />
          </div>

          <button
            type="button"
            onClick={goSignup}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 999,
              background: "transparent",
              border: `1px solid ${c.forest}`,
              color: c.forest,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: fontBody,
            }}
          >
            Criar uma conta
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}

const Label = ({ children }) => (
  <label
    style={{
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: c.muted,
    }}
  >
    {children}
  </label>
);
const Input = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      marginTop: 8,
      paddingBottom: 8,
      paddingRight: 24,
      background: "transparent",
      border: "none",
      borderBottom: `1px solid ${c.border}`,
      fontSize: 16,
      color: c.ink,
      fontFamily: "inherit",
      transition: "border-color 0.2s",
    }}
    onFocus={(e) => (e.target.style.borderBottomColor = c.forest)}
    onBlur={(e) => (e.target.style.borderBottomColor = c.border)}
  />
);
