import React, { useEffect, useState } from "react";
import { Moon, Settings, Plus, X, AlertCircle, Pencil, Check, User as UserIcon, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { scheduleApi, authApi } from "../api/index.js";
import { c, fontDisplay } from "../components/ui.jsx";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function safeTimeSlice(val) {
  if (!val) return "--:--";
  if (typeof val === "string") return val.slice(0, 5);
  if (val instanceof Date) return val.toTimeString().slice(0, 5);
  return String(val).slice(0, 5);
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editSettingsOpen, setEditSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
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
    return <div style={{ padding: 40, color: c.muted }}>Carregando perfil…</div>;
  }

  const notifEnabled = user.notifications_enabled !== false;
  const dailyLimitH = user.daily_limit_min != null ? (user.daily_limit_min / 60).toFixed(1).replace(".0", "") : "6";
  const reminderMin = user.reminder_minutes ?? 10;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: c.gold }}>
          · Sua conta
        </div>
        <h1 style={{
          fontFamily: fontDisplay, fontSize: "2.75rem", fontWeight: 400,
          lineHeight: 1.1, letterSpacing: "-0.025em", margin: "8px 0 0"
        }}>
          Seu <em style={{ color: c.forestL }}>perfil.</em>
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader title="Dados pessoais" Icon={UserIcon} onEdit={() => setEditProfileOpen(true)} />
          <Row label="Nome" value={user.name} />
          <Row label="E-mail" value={user.email} />
          <Row label="Acorda" value={safeTimeSlice(user.wake_time)} />
          <Row label="Dorme" value={safeTimeSlice(user.sleep_time)} />
          <button
            onClick={() => setChangePasswordOpen(true)}
            style={{
              marginTop: 12, padding: "10px 0", width: "100%",
              borderRadius: 12, background: "transparent",
              border: `1px solid ${c.borderS}`, color: c.muted,
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Lock size={13} /> Mudar senha
          </button>
        </Card>

        <Card>
          <CardHeader title="Configurações" Icon={Settings} onEdit={() => setEditSettingsOpen(true)} />
          <Row label="Notificações" value={notifEnabled ? "Ativadas" : "Desativadas"} valueColor={notifEnabled ? c.sage : c.muted} />
          <Row label="Alerta de sobrecarga" value={`> ${dailyLimitH}h/dia`} />
          <Row label="Lembretes" value={`${reminderMin} min antes`} />
          <Row label="Idioma" value="Português (BR)" />
        </Card>
      </div>

      <div style={{ background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 24, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Moon size={18} color={c.gold} />
            <h3 style={{ fontFamily: fontDisplay, fontSize: "1.15rem", fontWeight: 500, margin: 0 }}>
              Horários fixos
            </h3>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                padding: "6px 14px", borderRadius: 999,
                background: c.forest, color: c.creamL, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={13} /> Novo
            </button>
          )}
        </div>

        {adding && (
          <div style={{
            padding: 16, marginBottom: 16, borderRadius: 16,
            background: c.creamL, border: `1px solid ${c.borderS}`,
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end",
          }}>
            <div>
              <Lbl>Atividade</Lbl>
              <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="Ex: Aula de cálculo" style={inputStyle} />
            </div>
            <div>
              <Lbl>Dia</Lbl>
              <select value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: e.target.value })} style={inputStyle}>
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <Lbl>Início</Lbl>
              <input type="time" value={draft.start_time}
                onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <Lbl>Fim</Lbl>
              <input type="time" value={draft.end_time}
                onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={save} style={{
                padding: "8px 12px", borderRadius: 999,
                background: c.forest, color: c.creamL, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
              }}><Check size={14} /></button>
              <button onClick={() => setAdding(false)} style={{
                padding: "8px 12px", borderRadius: 999,
                background: "transparent", color: c.muted,
                border: `1px solid ${c.borderS}`, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12,
              }}><X size={14} /></button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: c.muted, fontSize: 13, padding: 16 }}>Carregando…</div>
        ) : error ? (
          <div style={{
            color: c.rust, fontSize: 13, padding: 16, display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        ) : blocks.length === 0 && !adding ? (
          <div style={{ color: c.muted, fontSize: 13, padding: 16, textAlign: "center" }}>
            Nenhum horário fixo cadastrado.
          </div>
        ) : (
          blocks.map((b) => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: `1px solid ${c.borderS}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: c.ink }}>{b.label}</div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                  {WEEKDAYS[b.weekday]} · {safeTimeSlice(b.start_time)} – {safeTimeSlice(b.end_time)}
                </div>
              </div>
              <button onClick={() => remove(b.id)} style={{
                background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 6,
              }}>
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {editProfileOpen && (
        <EditProfileModal user={user} refreshUser={refreshUser} onClose={() => setEditProfileOpen(false)} />
      )}
      {editSettingsOpen && (
        <EditSettingsModal user={user} refreshUser={refreshUser} onClose={() => setEditSettingsOpen(false)} />
      )}
      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}
    </div>
  );
}

function EditProfileModal({ user, refreshUser, onClose }) {
  const [draft, setDraft] = useState({
    name: user.name || "",
    email: user.email || "",
    wake_time: safeTimeSlice(user.wake_time),
    sleep_time: safeTimeSlice(user.sleep_time),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      await authApi.updateProfile(draft);
      await refreshUser();
      onClose();
    } catch (e) {
      setErr(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Editar dados pessoais" onClose={onClose}>
      <Field label="Nome" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
      <Field label="E-mail" type="email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Acorda" type="time" value={draft.wake_time} onChange={(v) => setDraft({ ...draft, wake_time: v })} />
        <Field label="Dorme" type="time" value={draft.sleep_time} onChange={(v) => setDraft({ ...draft, sleep_time: v })} />
      </div>
      {err && <ErrBox>{err}</ErrBox>}
      <Footer onCancel={onClose} onSave={save} saving={saving} />
    </ModalShell>
  );
}

function EditSettingsModal({ user, refreshUser, onClose }) {
  const [draft, setDraft] = useState({
    notifications_enabled: user.notifications_enabled !== false,
    daily_limit_min: user.daily_limit_min ?? 360,
    reminder_minutes: user.reminder_minutes ?? 10,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      await authApi.updateProfile({
        notifications_enabled: draft.notifications_enabled,
        daily_limit_min: Number(draft.daily_limit_min),
        reminder_minutes: Number(draft.reminder_minutes),
      });
      await refreshUser();
      onClose();
    } catch (e) {
      setErr(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Editar configurações" onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <Lbl>Notificações</Lbl>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[
            { v: true, l: "Ativadas" },
            { v: false, l: "Desativadas" },
          ].map((o) => {
            const active = draft.notifications_enabled === o.v;
            return (
              <button
                key={String(o.v)}
                onClick={() => setDraft({ ...draft, notifications_enabled: o.v })}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 999,
                  background: active ? c.forest : "transparent",
                  color: active ? c.creamL : c.ink,
                  border: `1px solid ${active ? c.forest : c.border}`,
                  cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                }}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Sobrecarga após (minutos por dia)"
        type="number"
        value={draft.daily_limit_min}
        onChange={(v) => setDraft({ ...draft, daily_limit_min: v })}
        hint={`Equivalente a ${(Number(draft.daily_limit_min) / 60).toFixed(1).replace(".0", "")}h/dia`}
      />

      <Field
        label="Lembrar tarefas com antecedência de (minutos)"
        type="number"
        value={draft.reminder_minutes}
        onChange={(v) => setDraft({ ...draft, reminder_minutes: v })}
      />

      {err && <ErrBox>{err}</ErrBox>}
      <Footer onCancel={onClose} onSave={save} saving={saving} />
    </ModalShell>
  );
}

function ChangePasswordModal({ onClose }) {
  const [draft, setDraft] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const save = async () => {
    setErr("");
    if (draft.next.length < 6) {
      setErr("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (draft.next !== draft.confirm) {
      setErr("A confirmação não confere com a nova senha.");
      return;
    }
    setSaving(true);
    try {
      await authApi.updatePassword(draft.current, draft.next);
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setErr(e.message || "Erro ao trocar senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Mudar senha" onClose={onClose}>
      {ok ? (
        <div style={{
          padding: 24, textAlign: "center", color: c.sage,
          fontSize: 14, fontWeight: 500,
        }}>
          ✓ Senha atualizada com sucesso!
        </div>
      ) : (
        <>
          <Field label="Senha atual" type="password" value={draft.current} onChange={(v) => setDraft({ ...draft, current: v })} />
          <Field label="Nova senha" type="password" value={draft.next} onChange={(v) => setDraft({ ...draft, next: v })} />
          <Field label="Confirmar nova senha" type="password" value={draft.confirm} onChange={(v) => setDraft({ ...draft, confirm: v })} />
          {err && <ErrBox>{err}</ErrBox>}
          <Footer onCancel={onClose} onSave={save} saving={saving} />
        </>
      )}
    </ModalShell>
  );
}

const ModalShell = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    background: "rgba(16,40,34,0.5)", backdropFilter: "blur(8px)",
  }}>
    <div style={{
      background: c.paper, borderRadius: 24, width: "100%", maxWidth: 440,
      padding: 32, position: "relative",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 20, right: 20,
        background: "none", border: "none", cursor: "pointer",
      }}>
        <X size={20} color={c.muted} />
      </button>
      <div style={{
        fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: c.gold,
      }}>· Edição</div>
      <h2 style={{
        fontFamily: fontDisplay, fontSize: "1.6rem", fontWeight: 500,
        margin: "8px 0 24px", lineHeight: 1.2,
      }}>
        {title}
      </h2>
      {children}
    </div>
  </div>
);

const Footer = ({ onCancel, onSave, saving }) => (
  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
    <button onClick={onCancel} disabled={saving} style={{
      flex: 1, padding: "12px 0", borderRadius: 999,
      border: `1px solid ${c.border}`, color: c.muted,
      background: "transparent", cursor: "pointer", fontFamily: "inherit",
    }}>Cancelar</button>
    <button onClick={onSave} disabled={saving} style={{
      flex: 1, padding: "12px 0", borderRadius: 999,
      background: c.forest, color: c.creamL, border: "none",
      cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
      opacity: saving ? 0.5 : 1,
    }}>
      {saving ? "Salvando…" : "Salvar"}
    </button>
  </div>
);

const ErrBox = ({ children }) => (
  <div style={{
    marginTop: 8, padding: 10, borderRadius: 10,
    background: `${c.rust}15`, color: c.rust, fontSize: 13,
  }}>{children}</div>
);

const Field = ({ label, value, onChange, type = "text", hint }) => (
  <div style={{ marginBottom: 16 }}>
    <Lbl>{label}</Lbl>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", marginTop: 6, paddingBottom: 8,
        background: "transparent", border: "none",
        borderBottom: `1px solid ${c.border}`, fontSize: 15,
        color: c.ink, fontFamily: "inherit",
      }}
    />
    {hint && <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>{hint}</div>}
  </div>
);

const Lbl = ({ children }) => (
  <label style={{
    fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
    color: c.muted, display: "block", marginBottom: 4,
  }}>
    {children}
  </label>
);

const inputStyle = {
  width: "100%", padding: "6px 0", background: "transparent",
  border: "none", borderBottom: `1px solid ${c.border}`,
  fontSize: 14, color: c.ink, fontFamily: "inherit",
};

const Card = ({ children }) => (
  <div style={{
    background: c.paper, border: `1px solid ${c.borderS}`,
    borderRadius: 24, padding: 24,
  }}>{children}</div>
);

const CardHeader = ({ title, Icon, onEdit }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={18} color={c.gold} />
      <h3 style={{ fontFamily: fontDisplay, fontSize: "1.15rem", fontWeight: 500, margin: 0 }}>
        {title}
      </h3>
    </div>
    <button onClick={onEdit} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 999,
      background: "transparent", border: `1px solid ${c.borderS}`,
      color: c.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
    }}>
      <Pencil size={12} /> Editar
    </button>
  </div>
);

const Row = ({ label, value, valueColor }) => (
  <div style={{
    display: "flex", justifyContent: "space-between",
    padding: "10px 0", borderBottom: `1px solid ${c.borderS}`,
  }}>
    <span style={{ fontSize: 14, color: c.muted }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: valueColor || c.ink }}>{value}</span>
  </div>
);