import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { taskApi, scheduleApi } from '../api/index.js';
import { c, fontDisplay } from '../components/ui.jsx';

const DAY_LABELS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2,'0')}:00`);

export default function CalendarView() {
  const [tasks, setTasks] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0);
    return d;
  });

  useEffect(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart); end.setDate(end.getDate() + 7);
    taskApi.list({ from: start.toISOString(), to: end.toISOString() }).then(setTasks);
    scheduleApi.list().then(setFixed).catch(() => setFixed([]));
  }, [weekStart]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  const shift = (dir) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + dir * 7); setWeekStart(d);
  };
  const goToday = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); setWeekStart(d);
  };

  const taskForCell = (date) => tasks.filter(t => {
    if (!t.scheduled_for) return false;
    const s = new Date(t.scheduled_for);
    return s.toDateString() === date.toDateString();
  });

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold }}>
            · Semana de {weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: '2.75rem', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.1, margin: '8px 0 0' }}>
            {weekStart.toLocaleDateString('pt-BR', { month: 'long' })}, <em style={{ color: c.forestL }}>{weekStart.getFullYear()}.</em>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => shift(-1)} style={navBtn}><ChevronLeft size={16}/></button>
          <button onClick={goToday} style={{ ...navBtn, padding: '8px 16px', width: 'auto', background: c.forest, color: c.creamL }}>Hoje</button>
          <button onClick={() => shift(1)} style={navBtn}><ChevronRight size={16}/></button>
        </div>
      </div>

      <div style={{ background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 24, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: `1px solid ${c.borderS}` }}>
          <div></div>
          {days.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} style={{
                padding: '16px 12px', textAlign: 'center', borderLeft: `1px solid ${c.borderS}`,
                background: isToday ? `${c.gold}10` : 'transparent'
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.muted }}>{DAY_LABELS[d.getDay()].slice(0,3)}</div>
                <div style={{ marginTop: 4, fontFamily: fontDisplay, fontSize: '1.5rem', color: isToday ? c.gold : c.ink }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'relative' }}>
          {HOURS.map((h, hi) => (
            <div key={h} style={{
              display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', height: 56,
              borderBottom: hi === HOURS.length - 1 ? 'none' : `1px dashed ${c.borderS}`
            }}>
              <div style={{ padding: '4px 12px', fontSize: 11, color: c.muted }}>{h}</div>
              {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                return <div key={i} style={{ borderLeft: `1px solid ${c.borderS}`, background: isToday ? `${c.gold}05` : 'transparent' }}/>;
              })}
            </div>
          ))}

          {/* Blocos fixos */}
          {fixed.map((b, i) => days.map((d, di) => {
            if (d.getDay() !== b.weekday) return null;
            const startH = parseInt(b.start_time) - 7;
            const endH = parseInt(b.end_time) - 7;
            if (startH < 0 || endH > 14) return null;
            return (
              <div key={`${i}-${di}`} style={{
                position: 'absolute', borderRadius: 8, padding: 8, fontSize: 11,
                background: `${c.muted}20`, border: `1px dashed ${c.muted}`, color: c.ink,
                left: `calc(60px + ${di} * (100% - 60px) / 7 + 4px)`,
                width: `calc((100% - 60px) / 7 - 8px)`,
                top: startH * 56 + 2, height: (endH - startH) * 56 - 4
              }}>
                <div style={{ fontWeight: 500 }}>{b.label}</div>
                <div style={{ color: c.muted, fontSize: 10 }}>{b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}</div>
              </div>
            );
          }))}

          {/* Tarefas agendadas */}
          {days.map((d, di) => taskForCell(d).map(t => {
            const s = new Date(t.scheduled_for);
            const startH = s.getHours() + s.getMinutes()/60 - 7;
            const durH = t.estimated_min / 60;
            if (startH < 0 || startH + durH > 14) return null;
            const catColor = t.category === 'estudo' ? c.forest : t.category === 'saude' ? c.sage : t.category === 'trabalho' ? c.gold : c.rust;
            return (
              <div key={t.id} style={{
                position: 'absolute', borderRadius: 8, padding: 8, fontSize: 11, overflow: 'hidden',
                background: catColor, color: c.creamL,
                left: `calc(60px + ${di} * (100% - 60px) / 7 + 4px)`,
                width: `calc((100% - 60px) / 7 - 8px)`,
                top: startH * 56 + 2, height: durH * 56 - 4,
                opacity: t.status === 'concluida' ? 0.55 : 1
              }}>
                <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{t.title}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>{s.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {t.estimated_min}min</div>
              </div>
            );
          }))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, fontSize: 12, color: c.muted }}>
        <Legend color={c.forest}>Estudo</Legend>
        <Legend color={c.sage}>Saúde</Legend>
        <Legend color={c.gold}>Trabalho</Legend>
        <Legend color={c.rust}>Pessoal</Legend>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, border: `1px dashed ${c.muted}` }}/> Horário fixo
        </span>
      </div>
    </div>
  );
}

const navBtn = {
  width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: c.paper, border: `1px solid ${c.borderS}`, cursor: 'pointer', color: c.ink
};

const Legend = ({ color, children }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 12, height: 12, borderRadius: 2, background: color }}/> {children}
  </span>
);
