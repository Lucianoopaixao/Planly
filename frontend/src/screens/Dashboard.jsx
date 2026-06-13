import React, { useEffect, useState } from "react";
import {
  Target,
  Clock,
  TrendingUp,
  Flame,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { taskApi, analyticsApi, gamificationApi } from "../api/index.js";
import { TaskRow } from "../components/Task.jsx";
import { c, fontDisplay } from "../components/ui.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  // Carrega tarefas estatisticas e analises da aplicacao
  const reload = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    taskApi
      .list({ from: today.toISOString(), to: tomorrow.toISOString() })
      .then(setTasks);
    analyticsApi
      .overview()
      .then(setOverview)
      .catch(() => {});
    analyticsApi
      .suggestions()
      .then((r) => setSuggestions(r.suggestions || []))
      .catch(() => {});
    gamificationApi
      .stats()
      .then(setStats)
      .catch(() => {});
  };
  // responsavel por buscar os dados ao abrir a pagina
  useEffect(reload, []);

  const done = tasks.filter((t) => t.status === "concluida").length;
  const totalMin = tasks.reduce((s, t) => s + t.estimated_min, 0);
  const hour = new Date().getHours();
  // se baseia no horario
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 40 }}
    >
      {/* cabecalho da dashboard */}
      <section>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: c.gold,
          }}
        >
          ·{" "}
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <h1
          style={{
            marginTop: 12,
            fontFamily: fontDisplay,
            fontSize: "3.5rem",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
          }}
        >
          {greet}, <em style={{ color: c.forestL }}>{firstName}.</em>
        </h1>
        <p
          style={{
            marginTop: 12,
            maxWidth: 620,
            color: c.muted,
            fontSize: "1.05rem",
          }}
        >
          Você tem{" "}
          <strong style={{ color: c.ink }}>
            {tasks.length - done} tarefas
          </strong>{" "}
          pendentes hoje, somando{" "}
          <strong style={{ color: c.ink }}>
            {Math.round((totalMin / 60) * 10) / 10}h
          </strong>{" "}
          de trabalho previsto.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <Stat
          Icon={Target}
          title="Tarefas hoje"
          value={`${done}/${tasks.length}`}
          sub="concluídas"
          tint={c.forest}
        />
        <Stat
          Icon={Clock}
          title="Tempo previsto"
          value={`${Math.floor(totalMin / 60)}h${totalMin % 60}m`}
          sub="hoje"
          tint={c.gold}
        />
        <Stat
          Icon={TrendingUp}
          title="Precisão"
          value={`${overview?.precision_pct ?? "?"}%`}
          sub="estimativa vs real"
          tint={c.sage}
        />
        <Stat
          Icon={Flame}
          title="Sequência"
          value={`${stats?.current_streak ?? 0} d`}
          sub={`recorde: ${stats?.longest_streak ?? 0}`}
          tint={c.rust}
        />
      </section>

      <section
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}
      >
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
              alignItems: "baseline",
            }}
          >
            <h2
              style={{
                fontFamily: fontDisplay,
                fontSize: "1.5rem",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Agenda de hoje
            </h2>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: c.muted,
              }}
            >
              {tasks.length} itens
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: c.muted }}>
                <Sparkles size={28} />
                <div style={{ marginTop: 8 }}>Nada agendado para hoje.</div>
              </div>
            ) : (
              tasks.map((t) => (
                <TaskRow key={t.id} task={t} onChange={reload} />
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {suggestions.length > 0 && (
            <div
              style={{
                background: c.forest,
                color: c.creamL,
                borderRadius: 24,
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: c.goldL,
                }}
              >
                · Recalibragem sugerida
              </div>
              <h3
                style={{
                  fontFamily: fontDisplay,
                  fontSize: "1.3rem",
                  fontWeight: 400,
                  lineHeight: 1.3,
                  margin: "12px 0",
                }}
              >
                {suggestions[0].message}
              </h3>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(245,239,227,0.65)",
                  marginTop: 8,
                }}
              >
                Baseado em {suggestions[0].samples} tarefas concluídas.
              </div>
            </div>
          )}

          <div
            style={{
              background: c.paper,
              border: `1px solid ${c.borderS}`,
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h3
              style={{
                fontFamily: fontDisplay,
                fontSize: "1.15rem",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Carga semanal
            </h3>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
              {overview?.workload?.level && (
                <span style={{ textTransform: "capitalize" }}>
                  ● {overview.workload.level}
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: fontDisplay,
                fontSize: "2rem",
              }}
            >
              {overview?.workload?.pending_hours ?? "—"}h
            </div>
            <div style={{ fontSize: 11, color: c.muted }}>
              {overview?.workload?.message}
            </div>
          </div>
        </div>
      </section>
      {/* Grafico de desempenho semanal */}
      {overview?.weekly && (
        <section
          style={{
            background: c.paper,
            border: `1px solid ${c.borderS}`,
            borderRadius: 24,
            padding: 28,
          }}
        >
          <h2
            style={{
              fontFamily: fontDisplay,
              fontSize: "1.5rem",
              fontWeight: 500,
              margin: "0 0 24px",
            }}
          >
            Esta semana - previsto vs real
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={overview.weekly} barGap={4}>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke={c.border}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                stroke={c.muted}
                style={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke={c.muted}
                style={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: c.forest,
                  border: "none",
                  borderRadius: 12,
                  color: c.creamL,
                }}
              />
              <Bar
                dataKey="previsto_h"
                fill={c.border}
                radius={[6, 6, 0, 0]}
                name="Previsto"
              />
              <Bar
                dataKey="real_h"
                fill={c.forest}
                radius={[6, 6, 0, 0]}
                name="Real"
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
//utilizado para exibir metricas da dashboard
const Stat = ({ Icon, title, value, sub, tint }) => (
  <div
    style={{
      background: c.paper,
      border: `1px solid ${c.borderS}`,
      borderRadius: 18,
      padding: 20,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: c.muted,
        }}
      >
        {title}
      </span>
      <Icon size={16} color={tint} />
    </div>
    <div
      style={{
        marginTop: 12,
        fontFamily: fontDisplay,
        fontSize: "2rem",
        lineHeight: 1,
        color: c.ink,
      }}
    >
      {value}
    </div>
    <div style={{ marginTop: 6, fontSize: 11, color: c.muted }}>{sub}</div>
  </div>
);
