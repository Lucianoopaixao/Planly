// Cores utilizadas na aplicacao
export const c = {
  forest: "#1f3d34",
  forestD: "#102822",
  forestL: "#365a4d",
  cream: "#f3ecdc",
  creamL: "#faf4e6",
  paper: "#fdfaf1",
  gold: "#b8864a",
  goldL: "#dcb87a",
  sage: "#9bb39a",
  rust: "#b15a3f",
  ink: "#1c2520",
  muted: "#7a756a",
  border: "#e2d7bc",
  borderS: "#ecdfc2",
};
//fontes da aplicacao
export const fontDisplay = "'Fraunces', 'Times New Roman', serif";
export const fontBody = "'Manrope', system-ui, sans-serif";

//importacao das fontes e estilos globais
export const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=Manrope:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body, html, #root { margin: 0; padding: 0; font-family: ${fontBody}; }
    input:focus, button:focus { outline: none; }
    input:focus { box-shadow: 0 0 0 3px rgba(184,134,74,0.18); }
    input::placeholder, textarea::placeholder {
      color: ${c.muted};
      opacity: 0.45;
    }
    input:focus::placeholder, textarea:focus::placeholder {
      opacity: 0.3;
    }
    .scroll-soft::-webkit-scrollbar { width: 8px; }
    .scroll-soft::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 8px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .fade-up { animation: fadeUp 0.5s ease-out backwards; }
    .underline-wavy {
      text-decoration: underline;
      text-decoration-style: wavy;
      text-decoration-thickness: 1px;
      text-underline-offset: 5px;
    }
  `}</style>
);

//nome e logo da aplicacao
export const Logo = ({ size = 28, color = c.forest }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="1.5" />
    <path
      d="M12 20 L18 26 L29 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="10" r="2.5" fill={c.gold} />
  </svg>
);

export const Brand = ({ size = "md", color = c.forest }) => {
  const sizes = { sm: "1.25rem", md: "1.5rem", lg: "1.9rem" };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: fontDisplay,
      }}
    >
      <Logo size={size === "lg" ? 32 : 24} color={color} />
      <span
        style={{
          fontSize: sizes[size],
          color,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        Planly
      </span>
    </div>
  );
};
