import React, { useState, useEffect } from "react";
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

const DIFF_PLURAL = {
  facil: "fáceis",
  media: "médias",
  dificil: "difíceis",
};

//multiplicadores padrao quando o usuario nao tem histórico suficiente
const DEFAULT_MULTIPLIER = {
  facil: 1.0,
  media: 1.15,
  dificil: 1.35,
};

/**
 * Calcula uma sugestão de tempo baseada no historico real de tarefas
 * concluidas do usuario, agrupadas por dificuldade.
 * Nenhum historico para essa dificuldade = usa multiplicador padrao
 * Historico pequeno (1-2 tarefas) = blend entre real e padrao
 * Histrico maior que 3 tarefas = usa apenas o real
 */
function calculateSuggestion(estimated, difficulty, completedTasks) {
  const est = Number(estimated) || 0;
  if (est <= 0) return null;

  //Filtra tarefas concluidas dessa dificuldade que tem dados utilizaveis
  const relevant = (completedTasks || []).filter(
    (task) =>
      task.difficulty === difficulty &&
      task.actual_min != null &&
      task.actual_min > 0 &&
      task.estimated_min != null &&
      task.estimated_min > 0,
  );

  const defaultMult = DEFAULT_MULTIPLIER[difficulty] || 1.15;

  //Sem historico  padrao
  if (relevant.length === 0) {
    return {
      minutes: Math.round(est * defaultMult),
      multiplier: defaultMult,
      source: "default",
      count: 0,
    };
  }

  //Media do erro (quanto realmente leva vs estimado)
  const ratios = relevant.map((t) => t.actual_min / t.estimated_min);
  const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;

  //Historico pequeno blend com padrao (mais peso no padrao)
  let finalMult;
  if (relevant.length < 3) {
    const weight = relevant.length / 3; // 0.33 ou 0.66
    finalMult = avgRatio * weight + defaultMult * (1 - weight);
    return {
      minutes: Math.round(est * finalMult),
      multiplier: finalMult,
      source: "partial",
      count: relevant.length,
    };
  }

  //Histrico bom = usa so o real
  return {
    minutes: Math.round(est * avgRatio),
    multiplier: avgRatio,
    source: "history",
    count: relevant.length,
  };
}

/**
 * Constroi a mensagem da sugestao de acordo com a fonte dos dados.
 * Devolve { primary, secondary } para renderizacao rica.
 */
function buildSuggestionMessage(suggestion, difficulty) {
  const plural = DIFF_PLURAL[difficulty] || "médias";

  if (!suggestion) {
    return {
      primary: "Informe um tempo estimado para receber uma sugestão.",
      tone: "neutral",
    };
  }

  const { minutes, multiplier, source, count } = suggestion;
  const overshootPct = Math.round((multiplier - 1) * 100);

  //Caso "calibrado" (erro menor q 5%) independente da fonte, parabeniza
  if (Math.abs(multiplier - 1) <= 0.05 && source !== "default") {
    return {
      primary: `Você costuma estimar tarefas ${plural} com precisão. Mantenha ${minutes} min.`,
      tone: "good",
    };
  }

  if (source === "default") {
    //Sem dados fala em termos genericos, sem mencionar historico
    if (difficulty === "facil") {
      return {
        primary: `Tarefas ${plural} costumam caber bem no tempo estimado.`,
        secondary: `Sugestão: reservar ${minutes} min.`,
        tone: "neutral",
      };
    }
    const cushion =
      difficulty === "dificil" ? "uma boa margem extra" : "uma margem extra";
    return {
      primary: `Tarefas ${plural} costumam pedir ${cushion}.`,
      secondary: `Sugestão: reservar ${minutes} min.`,
      tone: "neutral",
    };
  }

  if (source === "partial") {
    return {
      primary: `Com base nas suas ${count} tarefa${count > 1 ? "s" : ""} ${plural} concluída${count > 1 ? "s" : ""}, reserve cerca de ${minutes} min.`,
      tone: "info",
    };
  }

  // source 'history' analise real
  if (overshootPct > 0) {
    return {
      primary: `Você costuma gastar ${overshootPct}% a mais em tarefas ${plural}.`,
      secondary: `Sugestão calibrada: reservar ${minutes} min.`,
      tone: "info",
    };
  } else {
    const pct = Math.abs(overshootPct);
    return {
      primary: `Você costuma terminar tarefas ${plural} ${pct}% mais rápido do que estima.`,
      secondary: `Sugestão calibrada: reservar ${minutes} min.`,
      tone: "good",
    };
  }
}

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
        padding: "16px 20px",
        background: c.paper,
        borderRadius: 14,
        marginBottom: 8,
        borderLeft: `3px solid ${meta.color}`,
      }}
    >
      <button
        onClick={handleToggle}
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        {done ? (
          <CheckCircle2 size={22} color={c.sage} />
        ) : (
          <Circle size={22} color={c.muted} />
        )}
      </button>
      <CatIcon size={18} color={meta.color} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            color: done ? c.muted : c.ink,
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 2,
            fontSize: 11,
            color: c.muted,
          }}
        >
          <span>{time}</span>
          <span>·</span>
          <span style={{ color: diff.color }}>{diff.label}</span>
          <span>·</span>
          <span>{task.estimated_min}m</span>
        </div>
      </div>
      {done && task.actual_min != null && (
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

  //Histrico de tarefas concluidas  carregado uma vez quando o modal abre
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const completed = await taskApi.list({ status: "concluida" });
        if (!cancelled) {
          setHistory(Array.isArray(completed) ? completed : []);
          setHistoryLoaded(true);
        }
      } catch (e) {
        //na falha vai usar multiplicadores padrao
        if (!cancelled) setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  //calcula a sugestao atual com base nos campos preenchidos + historico
  const suggestion = calculateSuggestion(
    t.estimated_min,
    t.difficulty,
    history,
  );
  const msg = buildSuggestionMessage(suggestion, t.difficulty);

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

        {/* Caixa de sugestão inteligente */}
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
          <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.55 }}>
            <div style={{ color: c.ink, fontWeight: 500 }}>{msg.primary}</div>
            {msg.secondary && (
              <div style={{ marginTop: 4 }}>{msg.secondary}</div>
            )}
            {!historyLoaded && (
              <div style={{ marginTop: 4, fontSize: 10, opacity: 0.6 }}>
                analisando seu histórico…
              </div>
            )}
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
