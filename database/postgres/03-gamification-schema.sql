
--  schema: planly_gamification (vai ser consumido pelo gamification-service)

\connect planly_gamification;

CREATE TABLE IF NOT EXISTS achievements (
  code        VARCHAR(50)  PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  icon        VARCHAR(40),
  rarity      VARCHAR(20)  DEFAULT 'comum',
  goal        INT          NOT NULL,
  metric      VARCHAR(40)  NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id      UUID         NOT NULL,
  code         VARCHAR(50)  REFERENCES achievements(code) ON DELETE CASCADE,
  progress     INT          DEFAULT 0,
  unlocked_at  TIMESTAMPTZ,
  PRIMARY KEY (user_id, code)
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id            UUID PRIMARY KEY,
  total_completed    INT  DEFAULT 0,
  current_streak     INT  DEFAULT 0,
  longest_streak     INT  DEFAULT 0,
  last_activity_date DATE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- conquistas do usurio
INSERT INTO achievements (code, name, description, icon, rarity, goal, metric) VALUES
  ('FIRST_STEP',  'Primeiro Passo',    'Conclua sua primeira tarefa',                  'sparkles', 'comum',   1,  'tasks_completed'),
  ('WEEK_STREAK', 'Sequência de Sete', '7 dias consecutivos cumprindo o plano',        'flame',    'incomum', 7,  'streak_days'),
  ('FOCUS_20',    'Foco de Cristal',   '20 tarefas concluídas dentro do tempo',        'target',   'incomum', 20, 'on_time'),
  ('EARLY_BIRD',  'Madrugador',        'Cumpra tarefas antes das 8h por 10 dias',      'coffee',   'raro',    10, 'early_days'),
  ('CALIBRATED',  'Calibrado',         'Estimativas certeiras em 15 tarefas',          'brain',    'raro',    15, 'accurate'),
  ('TIME_MASTER', 'Mestre do Tempo',   '50 tarefas difíceis concluídas',               'trophy',   'epico',   50, 'hard_done')
ON CONFLICT (code) DO NOTHING;
