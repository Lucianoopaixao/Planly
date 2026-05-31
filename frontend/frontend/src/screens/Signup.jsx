import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, BookOpen, Briefcase, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { c, fontDisplay, fontBody, Brand } from '../components/ui.jsx';

export default function Signup({ goLogin }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: '', email: '', password: '', role: 'estudante', wake_time: '07:00', sleep_time: '23:00' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try { await register(data); }
    catch (e) { setErr(e.message || 'Falha no cadastro'); setStep(1); }
    finally { setLoading(false); }
  };

  const next = () => step < 3 ? setStep(step + 1) : submit();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: c.cream, color: c.ink, fontFamily: fontBody, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 24 }}><Brand size="sm" /></div>
      <button onClick={goLogin} style={{ position: 'absolute', top: 24, right: 24, display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: c.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronLeft size={16}/> Voltar
      </button>

      <div style={{ width: '100%', maxWidth: 440 }} className="fade-up">
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? c.forest : c.border, transition: 'background 0.3s' }}/>
          ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold, marginBottom: 12 }}>
          · Passo {step} de 3
        </div>

        {step === 1 && (
          <>
            <h2 style={{ fontFamily: fontDisplay, fontSize: '2.5rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
              Como podemos<br/>te <em style={{ color: c.forestL }}>chamar?</em>
            </h2>
            <div style={{ marginTop: 40 }}>
              <Field label="Nome completo" value={data.name} onChange={v => setData({...data, name: v})} placeholder="Clarissa Honório" />
              <Field label="E-mail"         value={data.email} onChange={v => setData({...data, email: v})} placeholder="clarissa@email.com" type="email" />
              <Field label="Senha"          value={data.password} onChange={v => setData({...data, password: v})} type="password" placeholder="ao menos 6 caracteres" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontFamily: fontDisplay, fontSize: '2.5rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
              O que <em style={{ color: c.forestL }}>define</em><br/>seus dias?
            </h2>
            <p style={{ marginTop: 12, fontSize: 14, color: c.muted }}>Para o Planly entender seu perfil.</p>
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { id: 'estudante',    label: 'Estudante',    Icon: BookOpen },
                { id: 'profissional', label: 'Profissional', Icon: Briefcase },
                { id: 'misto',        label: 'Os dois',      Icon: Brain },
                { id: 'autonomo',     label: 'Autônomo',     Icon: Sparkles }
              ].map(o => {
                const active = data.role === o.id;
                return (
                  <button key={o.id} onClick={() => setData({...data, role: o.id})}
                    style={{
                      padding: 20, borderRadius: 18, textAlign: 'left', cursor: 'pointer',
                      border: `1px solid ${active ? c.forest : c.border}`,
                      background: active ? c.forest : c.paper,
                      color: active ? c.creamL : c.ink, fontFamily: 'inherit'
                    }}>
                    <o.Icon size={22} color={active ? c.goldL : c.gold} />
                    <div style={{ marginTop: 12, fontWeight: 500 }}>{o.label}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontFamily: fontDisplay, fontSize: '2.5rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0 }}>
              Seus horários<br/><em style={{ color: c.forestL }}>fixos.</em>
            </h2>
            <p style={{ marginTop: 12, fontSize: 14, color: c.muted }}>O Planly só agenda tarefas quando você está realmente disponível.</p>
            <div style={{ marginTop: 32 }}>
              <Field label="Acorda às" value={data.wake_time}  onChange={v => setData({...data, wake_time: v})}  type="time" />
              <Field label="Dorme às"  value={data.sleep_time} onChange={v => setData({...data, sleep_time: v})} type="time" />
            </div>
          </>
        )}

        {err && <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: `${c.rust}15`, color: c.rust, fontSize: 14 }}>{err}</div>}

        <button onClick={next} disabled={loading}
          style={{
            width: '100%', marginTop: 36, padding: '16px 0', borderRadius: 999, background: c.forest,
            color: c.creamL, fontWeight: 500, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: fontBody, opacity: loading ? 0.6 : 1
          }}>
          {loading ? 'Criando…' : (step < 3 ? 'Continuar' : 'Começar a planejar')} {!loading && <ArrowRight size={16}/>}
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 24 }}>
    <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.muted }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', marginTop: 8, paddingBottom: 8, background: 'transparent', border: 'none',
        borderBottom: `1px solid ${c.border}`, fontSize: 16, color: c.ink, fontFamily: 'inherit'
      }}/>
  </div>
);
