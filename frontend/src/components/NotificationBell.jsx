import React, { useEffect, useState, useRef } from 'react';
import { Bell, AlertTriangle, Trophy, Info, X } from 'lucide-react';
import { c, fontDisplay } from './ui.jsx';
import { notificationApi } from '../api/index.js';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // carrega notificações do backend
  const load = async () => {
    try {
      setLoading(true);
      const list = await notificationApi.list();
      const arr = Array.isArray(list) ? list : [];
      setItems(arr);
      setUnread(arr.filter((n) => !n.read_at).length);
    } catch (e) {
      // silencioso — não quebra o app se a API falhar
    } finally {
      setLoading(false);
    }
  };

  // polling a cada 30s + carga inicial
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  // recarrega quando abre o dropdown
  useEffect(() => {
    if (open) load();
  }, [open]);

  // fecha ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markRead(id);
      load();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      load();
    } catch {}
  };

  const handleRemove = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.remove(id);
      load();
    } catch {}
  };

  const iconFor = (kind) => {
    if (kind === 'overload') return <AlertTriangle size={16} color={c.rust} />;
    if (kind === 'achievement') return <Trophy size={16} color={c.gold} />;
    return <Info size={16} color={c.teal || c.forest} />;
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 60000; // em minutos
    if (diff < 1) return 'agora';
    if (diff < 60) return `${Math.floor(diff)}min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    if (diff < 10080) return `${Math.floor(diff / 1440)}d atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 40, height: 40, borderRadius: 999,
          background: c.paper, border: `1px solid ${c.borderS}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', padding: 0,
          fontFamily: 'inherit',
        }}
        aria-label="Notificações"
      >
        <Bell size={16} color={c.forest} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            background: c.rust, color: 'white',
            fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
            minWidth: 18, height: 18, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 5px', lineHeight: 1,
            border: `2px solid ${c.cream || '#F3ECDC'}`,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 50, right: 0,
          width: 380, maxHeight: 500, overflowY: 'auto',
          background: c.cream || '#F3ECDC',
          border: `1px solid ${c.borderS}`,
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${c.borderS}`,
            position: 'sticky', top: 0,
            background: c.cream || '#F3ECDC',
            zIndex: 1,
          }}>
            <strong style={{
              fontFamily: fontDisplay, fontSize: 16, color: c.ink,
            }}>
              Notificações
              {unread > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 12, color: c.muted,
                  fontFamily: 'inherit', fontWeight: 400,
                }}>({unread} não lidas)</span>
              )}
            </strong>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: c.forest, fontFamily: 'inherit',
                textDecoration: 'underline', padding: 0,
              }}>
                marcar todas
              </button>
            )}
          </div>

          {/* Conteúdo */}
          {loading && items.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: c.muted, fontSize: 13 }}>
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <Bell size={32} color={c.muted} style={{ opacity: 0.4, marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.5 }}>
                Nada por aqui ainda.<br />
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  Você será avisado quando o dia estiver carregado demais.
                </span>
              </div>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read_at && handleMarkRead(n.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${c.borderS}`,
                  background: n.read_at ? 'transparent' : `${c.gold}15`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: n.read_at ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>{iconFor(n.kind)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: c.ink,
                    marginBottom: 3, fontFamily: 'inherit',
                  }}>
                    {n.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: c.muted, lineHeight: 1.5,
                    fontFamily: 'inherit',
                  }}>
                    {n.message}
                  </div>
                  <div style={{
                    fontSize: 10, color: c.muted, marginTop: 6, opacity: 0.7,
                    fontFamily: 'inherit',
                  }}>
                    {formatTime(n.created_at)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemove(n.id, e)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, opacity: 0.5, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Remover"
                  title="Remover"
                >
                  <X size={14} color={c.muted} />
                </button>
                {!n.read_at && (
                  <div style={{
                    width: 8, height: 8, borderRadius: 4,
                    background: c.rust, marginTop: 6, flexShrink: 0,
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
