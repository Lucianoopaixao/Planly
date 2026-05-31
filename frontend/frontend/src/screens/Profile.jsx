import React, { useEffect, useState } from "react";
import { Moon, Settings, Plus, X, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { scheduleApi } from "../api/index.js";
import { c, fontDisplay } from "../components/ui.jsx";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function safeTimeSlice(val) {
  if (!val) return "--:--";
  if (typeof val === "string") return val.slice(0, 5);
  if (val instanceof Date) return val.toTimeString().slice(0, 5);
  return String(val).slice(0, 5);
}

export default function Profile() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({
    label: "",
    weekday: 1,
    start_time: "08:00",
    end_time: "12:00",
  });

  const reload = () => {
    setLoading(true);
    setError(null);
    scheduleApi
      .list()
      .then((data) => {
        setBlocks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[Profile] erro ao carregar blocos:", err);
        setError(err.message || "Erro ao carregar horários");
        setBlocks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const save = async () => {
    try {
      await scheduleApi.create({ ...draft, weekday: Number(draft.weekday) });
      setAdding(false);
      setDraft({
        label: "",
        weekday: 1,
        start_time: "08:00",
        end_time: "12:00",
      });
      reload();
    } catch (err) {
      console.error("[Profile] erro ao salvar:", err);
    }
  };

  const remove = async (id) => {
    try {
      await scheduleApi.remove(id);
      reload();
    } catch (err) {
      console.error("[Profile] erro ao remover:", err);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 40, color: c.muted }}>Carregando perfil…</div>
    );
  }

  return (
    <div
      className="fu"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        maxWidth: 800,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: c.gold,
          }}
        >
          · Perfil
        </div>
        <h1
          style={{
            fontFamily: fontDisplay,
            fontSize: "2.75rem",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            margin: "8px 0 0",
          }}
        >
          Sobre <em style={{ color: c.forestL }}>você.</em>
        </h1>
      </div>

      <div
        style={{
          background: c.paper,
          border: `1px solid ${c.borderS}`,
          borderRadius: 24,
          padding: 32,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${c.forest}, ${c.forestL})`,
            color: c.creamL,
            fontFamily: fontDisplay,
            fontSize: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {user.name ? user.name[0] : "?"}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: "1.8rem",
              fontWeight: 500,
            }}
          >
            {user.name || "Usuário"}
          </div>
          <div style={{ marginTop: 4, fontSize: 14, color: c.muted }}>
            {user.email || ""} · {user.role || "estudante"}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "inline-block",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              background: `${c.gold}20`,
              color: c.gold,
              fontWeight: 600,
            }}
          >
            Acorda às {safeTimeSlice(user.wake_time)} · Dorme às{" "}
            {safeTimeSlice(user.sleep_time)}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: `${c.rust}10`,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <AlertCircle size={18} color={c.rust} />
          <span style={{ fontSize: 13, color: c.rust }}>{error}</span>
          <button
            onClick={reload}
            style={{
              marginLeft: "auto",
              padding: "4px 12px",
              borderRadius: 999,
              background: c.forest,
              color: c.creamL,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      <div
        style={{
          background: c.paper,
          border: `1px solid ${c.borderS}`,
          borderRadius: 24,
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Moon size={18} color={c.gold} />
            <h3
              style={{
                fontFamily: fontDisplay,
                fontSize: "1.25rem",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Horários fixos
            </h3>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: c.forest,
                color: c.creamL,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <Plus size={14} /> Adicionar
            </button>
          )}
        </div>

        {adding && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 16,
              background: c.creamL,
              border: `1px solid ${c.borderS}`,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <Lbl>Descrição</Lbl>
                <input
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Ex: Aulas"
                />
              </div>
              <div>
                <Lbl>Dia</Lbl>
                <select
                  value={draft.weekday}
                  onChange={(e) =>
                    setDraft({ ...draft, weekday: e.target.value })
                  }
                  style={inputStyle}
                >
                  {WEEKDAYS.map((w, i) => (
                    <option key={i} value={i}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl>Início</Lbl>
                <input
                  type="time"
                  value={draft.start_time}
                  onChange={(e) =>
                    setDraft({ ...draft, start_time: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <Lbl>Fim</Lbl>
                <input
                  type="time"
                  value={draft.end_time}
                  onChange={(e) =>
                    setDraft({ ...draft, end_time: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setAdding(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "transparent",
                  border: `1px solid ${c.border}`,
                  color: c.muted,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={!draft.label}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: c.forest,
                  color: c.creamL,
                  border: "none",
                  cursor: "pointer",
                  opacity: draft.label ? 1 : 0.5,
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          {loading ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: c.muted,
                fontSize: 13,
              }}
            >
              Carregando…
            </div>
          ) : blocks.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: c.muted,
                padding: 20,
                textAlign: "center",
              }}
            >
              Nenhum horário fixo cadastrado ainda.
            </div>
          ) : (
            blocks.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: `1px solid ${c.borderS}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{b.label || "Sem nome"}</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                    {WEEKDAYS[b.weekday] || "?"} · {safeTimeSlice(b.start_time)}
                    –{safeTimeSlice(b.end_time)}
                  </div>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.muted,
                    padding: 6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SettingsCard
          title="Configurações"
          icon={Settings}
          items={[
            { l: "Notificações", v: "Ativadas" },
            { l: "Alerta sobrecarga", v: "> 6h/dia" },
            { l: "Lembretes", v: "10 min antes" },
            { l: "Idioma", v: "Português (BR)" },
          ]}
        />
      </div>
    </div>
  );
}

const Lbl = ({ children }) => (
  <label
    style={{
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: c.muted,
      display: "block",
      marginBottom: 4,
    }}
  >
    {children}
  </label>
);

const inputStyle = {
  width: "100%",
  padding: "6px 0",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid ${c.border}`,
  fontSize: 14,
  color: c.ink,
  fontFamily: "inherit",
};

const SettingsCard = ({ title, icon: Icon, items }) => (
  <div
    style={{
      background: c.paper,
      border: `1px solid ${c.borderS}`,
      borderRadius: 24,
      padding: 24,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 18,
      }}
    >
      <Icon size={18} color={c.gold} />
      <h3
        style={{
          fontFamily: fontDisplay,
          fontSize: "1.15rem",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>
    {items.map((i) => (
      <div
        key={i.l}
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: `1px solid ${c.borderS}`,
        }}
      >
        <span style={{ fontSize: 14, color: c.muted }}>{i.l}</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{i.v}</span>
      </div>
    ))}
  </div>
);
