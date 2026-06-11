import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { analyticsApi } from '../api/index.js';
import { c, fontDisplay } from '../components/ui.jsx';

export default function Progress() {
  const [data, setData]   = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    analyticsApi.overview().then(setData).catch(() => {});
    analyticsApi.suggestions().then(r => setSuggestions(r.suggestions || [])).catch(() => {});
  }, []);

  if (!data) return <div style={{ color: c.muted }}>Carregando análises…</div>;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold }}>
          · Análise — últimas 4 semanas
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: '2.75rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: '8px 0 0' }}>
          Sua <em style={{ color: c.forestL }}>evolução.</em>
        </h1>
        <p style={{ marginTop: 12, maxWidth: 620, color: c.muted, fontSize: '1.05rem' }}>
          O Planly aprende com cada tarefa concluída. Veja onde sua percepção do tempo bate — e onde precisa ser recalibrada.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <Big label="Precisão de estimativa" value={`${data.precision_pct}%`} desc="dentro de ±10% do tempo" />
        <Big label="Tarefas concluídas"      value={data.completed_tasks} desc={`de ${data.total_tasks} totais`} />
        <Big label="Carga pendente"          value={`${data.workload?.pending_hours ?? 0}h`} desc={data.workload?.level} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 24, padding: 28 }}>
          <h3 style={{ fontFamily: fontDisplay, fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>Precisão semanal</h3>
          <p style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>% das tarefas concluídas dentro do tempo estimado</p>

          <ResponsiveContainer width="100%" height={280} style={{ marginTop: 24 }}>
            <AreaChart data={data.monthly_trend}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={c.gold} stopOpacity={0.4}/>
                  <stop offset="100%" stopColor={c.gold} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={c.border} vertical={false}/>
              <XAxis dataKey="wk" axisLine={false} tickLine={false} stroke={c.muted} style={{ fontSize: 12 }}/>
              <YAxis axisLine={false} tickLine={false} stroke={c.muted} domain={[0,100]} style={{ fontSize: 12 }}/>
              <Tooltip contentStyle={{ background: c.forest, border: 'none', borderRadius: 12, color: c.creamL }}/>
              <Area type="monotone" dataKey="precisao" stroke={c.gold} strokeWidth={2.5} fill="url(#grad)" dot={{ fill: c.gold, r: 4 }} activeDot={{ r: 6, fill: c.forest }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: c.forest, color: c.creamL, borderRadius: 24, padding: 28 }}>
          <h3 style={{ fontFamily: fontDisplay, fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>Por categoria</h3>
          <p style={{ fontSize: 13, color: 'rgba(245,239,227,0.6)', marginTop: 4 }}>onde você acerta mais</p>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(data.by_category || []).slice(0,4).map(cat => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ textTransform: 'capitalize' }}>{cat.category}</span>
                  <span style={{ fontFamily: fontDisplay }}>{cat.precision_pct}%</span>
                </div>
                <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: 'rgba(245,239,227,0.15)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.precision_pct}%`, background: c.goldL, borderRadius: 999 }}/>
                </div>
              </div>
            ))}
            {(!data.by_category || data.by_category.length === 0) &&
              <div style={{ fontSize: 13, color: 'rgba(245,239,227,0.6)' }}>Conclua mais tarefas para ver o breakdown.</div>}
          </div>

          {suggestions[0] && (
            <div style={{ marginTop: 28, padding: 16, borderRadius: 16, background: 'rgba(245,239,227,0.08)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.goldL, marginBottom: 8 }}>· Insight</div>
              <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{suggestions[0].message}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 24, padding: 28 }}>
        <h3 style={{ fontFamily: fontDisplay, fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>Previsto vs Realizado — esta semana</h3>
        <ResponsiveContainer width="100%" height={240} style={{ marginTop: 24 }}>
          <BarChart data={data.weekly} barGap={4}>
            <CartesianGrid strokeDasharray="2 4" stroke={c.border} vertical={false}/>
            <XAxis dataKey="day" axisLine={false} tickLine={false} stroke={c.muted} style={{ fontSize: 12 }}/>
            <YAxis axisLine={false} tickLine={false} stroke={c.muted} style={{ fontSize: 12 }}/>
            <Tooltip contentStyle={{ background: c.forest, border: 'none', borderRadius: 12, color: c.creamL }}/>
            <Bar dataKey="previsto_h" fill={c.border} radius={[6,6,0,0]} name="Previsto (h)"/>
            <Bar dataKey="real_h"     fill={c.forest} radius={[6,6,0,0]} name="Realizado (h)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const Big = ({ label, value, desc }) => (
  <div style={{ background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 24, padding: 28 }}>
    <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.muted }}>{label}</div>
    <div style={{ marginTop: 12, fontFamily: fontDisplay, fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: c.ink }}>{value}</div>
    <div style={{ marginTop: 8, fontSize: 12, color: c.muted, textTransform: 'capitalize' }}>{desc}</div>
  </div>
);
