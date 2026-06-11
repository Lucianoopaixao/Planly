import React, { useEffect, useState } from "react";
import { Sparkles, Plus, AlertCircle } from "lucide-react";
import { taskApi } from "../api/index.js";
import { TaskRow } from "../components/Task.jsx";
import { c, fontDisplay } from "../components/ui.jsx";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    taskApi
      .list()
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[Tasks] erro ao carregar:", err);
        setError(err.message || "Erro ao carregar tarefas");
        setTasks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered =
    filter === "todas"
      ? tasks
      : filter === "pendentes"
        ? tasks.filter((t) => t.status === "pendente")
        : tasks.filter((t) => t.status === "concluida");

  const cnt = (s) => {
    if (s === "todas") return tasks.length;
    if (s === "pendentes")
      return tasks.filter((t) => t.status === "pendente").length;
    return tasks.filter((t) => t.status === "concluida").length;
  };

  const handleToggle = async (task) => {
    try {
      if (task.status === "concluida") {
        await taskApi.update(task.id, { status: "pendente" });
      } else {
        await taskApi.complete(task.id, task.estimated_min);
      }
      reload();
    } catch (err) {
      console.error("[Tasks] erro ao atualizar:", err);
    }
  };

  return (
    <div
      className="fu"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        fontFamily: "inherit",
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
          · {tasks.length} tarefas no total
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
          Suas <em style={{ color: c.forestL }}>tarefas.</em>
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: `1px solid ${c.borderS}`,
          paddingBottom: 4,
        }}
      >
        {["todas", "pendentes", "concluidas"].map((x) => (
          <button
            key={x}
            onClick={() => setFilter(x)}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              position: "relative",
              color: filter === x ? c.forest : c.muted,
              fontWeight: filter === x ? 600 : 400,
              textTransform: "capitalize",
            }}
          >
            {x}{" "}
            <span style={{ marginLeft: 4, fontSize: 11, color: c.muted }}>
              ({cnt(x)})
            </span>
            {filter === x && (
              <div
                style={{
                  position: "absolute",
                  bottom: -5,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: c.forest,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: `${c.rust}10`,
            border: `1px solid ${c.rust}30`,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <AlertCircle size={20} color={c.rust} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: c.rust }}>
              Erro ao carregar tarefas
            </div>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
              {error}
            </div>
          </div>
          <button
            onClick={reload}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              borderRadius: 999,
              background: c.forest,
              color: c.creamL,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 56, textAlign: "center", color: c.muted }}>
          Carregando…
        </div>
      ) : (
        <div
          style={{
            background: c.paper,
            border: `1px solid ${c.borderS}`,
            borderRadius: 24,
            padding: "4px 16px",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: "center", color: c.muted }}>
              <Sparkles size={28} color={c.border} />
              <div style={{ marginTop: 12, fontSize: 14 }}>
                Nada por aqui ainda.
              </div>
            </div>
          ) : (
            filtered.map((t, i) => (
              <TaskRow key={t.id} task={t} onChange={() => handleToggle(t)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
