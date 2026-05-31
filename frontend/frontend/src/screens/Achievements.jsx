import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, Target, Coffee, Brain, Trophy } from 'lucide-react';
import { gamificationApi } from '../api/index.js';
import { c, fontDisplay } from '../components/ui.jsx';

const ICON = { sparkles: Sparkles, flame: Flame, target: Target, coffee: Coffee, brain: Brain, trophy: Trophy };
const RARITY = { comum: c.sage, incomum: c.gold, raro: c.forestL, epico: c.rust };

export default function Achievements() {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    gamificationApi.achievements().then(setList).catch(() => setList([]));
    gamificationApi.stats().then(setStats).catch(() => {});
  }, []);

  const unlocked = list.filter(a => a.unlocked).length;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold }}>· Conquistas</div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: '2.75rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: '8px 0 0' }}>
          Sua <em style={{ color: c.forestL }}>jornada.</em>
        </h1>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${c.forestD}, ${c.forest})`, color: c.creamL, borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: 999, background: `radial-gradient(circle, ${c.gold}40, transparent 70%)` }}/>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.goldL }}>· Progresso geral</div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: fontDisplay, fontSize: '5rem', fontWeight: 400, lineHeight: 1 }}>{unlocked}</span>
              <span style={{ fontSize: 24, color: 'rgba(245,239,227,0.4)' }}>/ {list.length}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(245,239,227,0.65)' }}>
              conquistas desbloqueadas
              {stats && ` · ${stats.total_completed} tarefas concluídas no total`}
            </div>
          </div>
          <Trophy size={64} color={c.goldL}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {list.map(a => {
          const Icon = ICON[a.icon] || Sparkles;
          const pct = Math.min(100, (a.progress / a.goal) * 100);
          return (
            <div key={a.code} style={{
              background: c.paper, border: `1px solid ${c.borderS}`, borderRadius: 18, padding: 24,
              opacity: a.unlocked ? 1 : 0.95
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: a.unlocked ? `linear-gradient(135deg, ${c.gold}, ${c.goldL})` : c.cream,
                  border: a.unlocked ? 'none' : `1px dashed ${c.border}`
                }}>
                  <Icon size={24} color={a.unlocked ? c.paper : c.border}/>
                </div>
                <span style={{
                  fontSize: 10, padding: '4px 8px', borderRadius: 999, textTransform: 'uppercase',
                  letterSpacing: '0.1em', fontWeight: 600,
                  background: `${RARITY[a.rarity] || c.muted}20`, color: RARITY[a.rarity] || c.muted
                }}>{a.rarity}</span>
              </div>

              <div style={{ marginTop: 20, fontFamily: fontDisplay, fontSize: '1.2rem', fontWeight: 500, color: a.unlocked ? c.ink : c.muted }}>
                {a.name}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: c.muted }}>{a.description}</div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.muted, marginBottom: 8 }}>
                  <span>{a.progress}/{a.goal}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: c.cream, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: a.unlocked ? c.gold : c.border, borderRadius: 999 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
