import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Fonts, c, fontDisplay } from './components/ui.jsx';
import Login        from './screens/Login.jsx';
import Signup       from './screens/Signup.jsx';
import Dashboard    from './screens/Dashboard.jsx';
import CalendarView from './screens/CalendarView.jsx';
import Tasks        from './screens/Tasks.jsx';
import Progress     from './screens/Progress.jsx';
import Achievements from './screens/Achievements.jsx';
import Profile      from './screens/Profile.jsx';
import Shell        from './components/Shell.jsx';
import { NewTaskModal } from './components/Task.jsx';

export default function App() {
  const { user, loading } = useAuth();
  //controla tela de autenticacao
  const [authView, setAuthView] = useState('login');
  const [section, setSection]   = useState('dashboard');
  const [taskKey, setTaskKey]   = useState(0);  // Força atualizacao das telas que exibem tarefas
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  //tela de carregamento
  if (loading) {
    return <>
      <Fonts/>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.cream, color: c.muted, fontFamily: fontDisplay }}>
        Carregando¦
      </div>
    </>;
  }
  //mostra o login ou cadastro se nao tiver usuario autenticado
  if (!user) {
    return <>
      <Fonts/>
      {authView === 'login'
        ? <Login  goSignup={() => setAuthView('signup')} />
        : <Signup goLogin={() => setAuthView('login')} />}
    </>;
  }

  return (
    <>
      <Fonts/>
      <Shell section={section} setSection={setSection} onNewTask={() => setNewTaskOpen(true)}>
        {section === 'dashboard'    && <Dashboard    key={`dash-${taskKey}`}/>}
        {section === 'calendar'     && <CalendarView key={`cal-${taskKey}`}/>}
        {section === 'tasks'        && <Tasks        key={`tasks-${taskKey}`}/>}
        {section === 'progress'     && <Progress/>}
        {section === 'achievements' && <Achievements/>}
        {section === 'profile'      && <Profile/>}
      </Shell>
      {/* Modal para criacao de tarefa */}
      {newTaskOpen && (
        <NewTaskModal
          onClose={() => setNewTaskOpen(false)}
          onCreated={() => { setNewTaskOpen(false); setTaskKey(k => k + 1); }}
        />
      )}
    </>
  );
}
