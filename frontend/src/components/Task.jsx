import React, { useState } from "react";
import {
  Circle,
  CheckCircle2,
  Clock,
  BookOpen,
  Dumbbell,
  Briefcase,
  Sparkles,
  X,
  ArrowRight,
  Brain,
} from "lucide-react";
import { c, fontDisplay, fontBody } from "./ui.jsx";
import { taskApi } from "../api/index.js";

const CAT_META = {
  estudo: { color: c.forest, Icon: BookOpen },
  saude: { color: c.sage, Icon: Dumbbell },
  trabalho: { color: c.gold, Icon: Briefcase },
  pessoal: { color: c.rust, Icon: Sparkles },
};

const DIFF_META = {
  facil: { label: "Fácil", color: c.sage },
  media: { label: "Média", color: c.gold },
  dificil: { label: "Difícil", color: c.rust },
};

export function TaskRow({ task, onChange }) {
  if (!task) return null;

  const done = task.status === "concluida";
  const meta = CAT_META[task.category] || CAT_META.estudo;
  const diff = DIFF_META[task.difficulty] || DIFF_META.media;
  const CatIcon = meta.Icon;

  let time = "—";
  try {
    if (task.scheduled_for) {
      const d = new Date(task.scheduled_for);
      if (!isNaN(d.getTime())) {
        time = d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
  } catch (e) {
    time = "—";
  }

  const handleToggle = async () => {
    try {
      if (typeof onChange === "function") {
        await onChange();
      }
    } catch (err) {
      console.error("[TaskRow] erro ao alternar tarefa:", err);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${c.borderS}`,
        fontFamily: fontBody || "inherit",
      }}
    >
      <button
        onClick={handleToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        {done ? (
          <CheckCircle2 size={22} color={c.forest} />
        ) : (
          <Circle size={22} color={c.border} />
        )}
      </button>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${meta.color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CatIcon size={15} color={meta.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 500,
            color: done ? c.muted : c.ink,
            textDecoration: done ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {task.title || "Sem título"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
            fontSize: 12,
            color: c.muted,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {time}
          </span>
          <span>·</span>
          <span style={{ color: diff.color }}>● {diff.label}</span>
          {task.priority === "alta" && (
            <>
              <span>·</span>
              <span style={{ color: c.rust }}>● alta</span>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 18, color: c.ink }}>
          {task.estimated_min || 0}
          <span style={{ fontSize: 11, color: c.muted }}>min</span>
        </div>
        {task.actual_min != null && (
          <div
            style={{
              fontSize: 11,
              color:
                task.actual_min > (task.estimated_min || 0) ? c.rust : c.sage,
            }}
          >
            real: {task.actual_min}m
          </div>
        )}
      </div>
    </div>
  );
}

export function NewTaskModal({ onClose, onCreated }) {
  const [t, setT] = useState({
    title: "",
    priority: "media",
    difficulty: "media",
    estimated_min: 60,
    category: "estudo",
    scheduled_for: new Date().toISOString().slice(0, 16),
  });
  const [err, setErr] = useState("");
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setErr("");
    setLoading(true);
    try {
      const result = await taskApi.create({
        ...t,
        estimated_min: Number(t.estimated_min) || 60,
        scheduled_for: t.scheduled_for
          ? new Date(t.scheduled_for).toISOString()
          : null,
      });
      if (result && result.overload_warning) {
        setWarning(result.overload_warning);
        if (typeof onCreated === "function") onCreated(result.task);
        return;
      }
      if (typeof onCreated === "function")
        onCreated(result ? result.task : null);
      onClose();
    } catch (e) {
      setErr(e.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const diffLabel = DIFF_META[t.difficulty]?.label || "média";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(16,40,34,0.5)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          background: c.paper,
          borderRadius: 24,
          width: "100%",
          maxWidth: 480,
          padding: 32,
          position: "relative",
          fontFamily: fontBody || "inherit",
        }}
        className="fu"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={20} color={c.muted} />
        </button>

        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: c.gold,
          }}
        >
          · Nova tarefa
        </div>
        <h2
          style={{
            fontFamily: fontDisplay,
            fontSize: "2rem",
            fontWeight: 500,
            margin: "8px 0 24px",
          }}
        >
          O que você precisa <em style={{ color: c.forestL }}>fazer?</em>
        </h2>

        <Field
          label="Título"
          value={t.title}
          onChange={(v) => setT({ ...t, title: v })}
          placeholder="Ex: Estudar para a prova"
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <ButtonGroup
            label="Prioridade"
            value={t.priority}
            onChange={(v) => setT({ ...t, priority: v })}
            options={[
              { v: "baixa", l: "baixa" },
              { v: "media", l: "média" },
              { v: "alta", l: "alta" },
            ]}
          />
          <ButtonGroup
            label="Dificuldade"
            value={t.difficulty}
            onChange={(v) => setT({ ...t, difficulty: v })}
            options={[
              { v: "facil", l: "Fácil", co: c.sage },
              { v: "media", l: "Média", co: c.gold },
              { v: "dificil", l: "Difícil", co: c.rust },
            ]}
          />
        </div>

        <ButtonGroup
          label="Categoria"
          value={t.category}
          onChange={(v) => setT({ ...t, category: v })}
          options={[
            { v: "estudo", l: "Estudo" },
            { v: "trabalho", l: "Trabalho" },
            { v: "saude", l: "Saúde" },
            { v: "pessoal", l: "Pessoal" },
          ]}
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}
        >
          <Field
            label="Tempo (min)"
            value={t.estimated_min}
            onChange={(v) => setT({ ...t, estimated_min: v })}
            type="number"
          />
          <Field
            label="Quando"
            value={t.scheduled_for}
            onChange={(v) => setT({ ...t, scheduled_for: v })}
            type="datetime-local"
          />
        </div>

        <div
          style={{
            background: c.creamL,
            border: `1px solid ${c.borderS}`,
            padding: 16,
            borderRadius: 16,
            display: "flex",
            gap: 12,
            marginTop: 16,
          }}
        >
          <Brain
            size={18}
            color={c.gold}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>
            Histórico sugere reservar{" "}
            <strong style={{ color: c.ink }}>
              {Math.round(Number(t.estimated_min) * 1.15)} min
            </strong>{" "}
            para tarefas {diffLabel.toLowerCase()}s.
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
        {warning && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: `${c.rust}10`,
              border: `1px solid ${c.rust}50`,
            }}
          >
            <div
              style={{
                color: c.rust,
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              Dia sobrecarregado
            </div>
            <div style={{ fontSize: 12, color: c.ink }}>
              {warning.total_min}min planejados de {warning.healthy_limit_min}
              min saudáveis.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 999,
                background: c.forest,
                color: c.creamL,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Entendi
            </button>
          </div>
        )}

        {!warning && (
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 999,
                border: `1px solid ${c.border}`,
                color: c.muted,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={loading || !t.title}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 999,
                background: c.forest,
                color: c.creamL,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
                fontWeight: 500,
                opacity: loading || !t.title ? 0.5 : 1,
              }}
            >
              {loading ? "Salvando…" : "Criar tarefa"}{" "}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: c.muted,
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        marginTop: 6,
        paddingBottom: 8,
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${c.border}`,
        fontSize: 15,
        color: c.ink,
        fontFamily: "inherit",
      }}
    />
  </div>
);

const ButtonGroup = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: c.muted,
      }}
    >
      {label}
    </label>
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = value === o.v;
        const bg = active ? o.co || c.forest : "transparent";
        const fg = active ? c.paper : c.ink;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              flex: 1,
              minWidth: 60,
              padding: "8px 0",
              borderRadius: 999,
              background: bg,
              color: fg,
              border: `1px solid ${active ? bg : c.border}`,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  </div>
);
