import React, { useEffect, useState } from 'react';
import {
  Home, Calendar as CalIcon, ListTodo, BarChart3, Award, User as UserIcon,
  Flame, ChevronRight, LogOut, Search, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { gamificationApi } from '../api/index.js';
import { c, fontDisplay, fontBody, Brand } from './ui.jsx';
import NotificationBell from './NotificationBell.jsx';

//componente prinecipal responsavel pelo layout da aplicacao
export default function Shell({ section, setSection, onNewTask, children }) {
  //dados do usuario autenticado
  const { user, logout } = useAuth();
  //informacoes da gamificacao do usuario
  const [stats, setStats] = useState({ current_streak: 0, longest_streak: 0 });

  useEffect(() => {
    gamificationApi.stats().then(setStats).catch(() => {});
  }, [section]);
  //iten do menu lateral da aplicacao
  const nav = [
    { id: 'dashboard',    label: 'Visão geral', Icon: Home },
    { id: 'calendar',     label: 'Calendário',  Icon: CalIcon },
    { id: 'tasks',        label: 'Tarefas',     Icon: ListTodo },
    { id: 'progress',     label: 'Progresso',   Icon: BarChart3 },
    { id: 'achievements', label: 'Conquistas',  Icon: Award },
    { id: 'profile',      label: 'Perfil',      Icon: UserIcon }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: c.cream, color: c.ink, fontFamily: fontBody }}>
      {/* sidebar */}
      {/* Barra lateral de navegação */}
      <aside style={{
        width: 256, display: 'flex', flexDirection: 'column', padding: 24,
        background: c.paper, borderRight: `1px solid ${c.borderS}`
      }}>
        {/* Logo da aplicação */}
        <Brand size="md" />
        <nav style={{ marginTop: 48, flex: 1 }}>
          {/* Menu principal */}
          {nav.map(n => {
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => setSection(n.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                  background: active ? c.forest : 'transparent',
                  color: active ? c.creamL : c.ink, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', marginBottom: 4
                }}>
                <n.Icon size={18} color={active ? c.goldL : c.muted}/>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{n.label}</span>
                {active && <ChevronRight size={14} color={c.goldL} style={{ marginLeft: 'auto' }}/>}
              </button>
            );
          })}
        </nav>

        <div style={{ background: c.forest, color: c.creamL, padding: 16, borderRadius: 18, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={18} color={c.goldL}/>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,239,227,0.7)' }}>Sequência</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: fontDisplay, fontSize: '2.5rem', lineHeight: 1 }}>{stats.current_streak}</span>
            <span style={{ fontSize: 14, color: 'rgba(245,239,227,0.7)' }}>dias</span>
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(245,239,227,0.6)' }}>
            Recorde: {stats.longest_streak} dias
          </div>
        </div>
        {/* Botão de logout */}
        <button onClick={logout}
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: c.muted, padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={14}/> Sair
        </button>
      </aside>

      {/* main */}
      <main style={{ flex: 1, overflow: 'auto' }} className="scroll-soft">
        {/* Cabeçalho */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 40px', position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(243,236,220,0.85)', backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${c.borderS}`
        }}>
          {/* Campo de busca */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
            borderRadius: 999, maxWidth: 460, flex: 1, background: c.paper, border: `1px solid ${c.borderS}`
          }}>
            <Search size={15} color={c.muted}/>
            <input placeholder="Buscar…" style={{ background: 'transparent', border: 'none', flex: 1, fontSize: 14, color: c.ink, fontFamily: 'inherit' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Botão para criar tarefa */}
            <button onClick={onNewTask}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRadius: 999, fontSize: 14, background: c.forest, color: c.creamL,
                fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit'
              }}>
              <Plus size={15}/> Nova tarefa
            </button>

            {/* Sino de notificações funcional */}
            <NotificationBell />

            <div style={{
              width: 40, height: 40, borderRadius: 999, background: c.forest, color: c.creamL,
              fontFamily: fontDisplay, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
        </header>
        {/* Conteúdo da página selecionada */}
        <div style={{ padding: 40, maxWidth: 1280 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
