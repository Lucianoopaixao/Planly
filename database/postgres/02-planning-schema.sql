
--  schema: planly_planning (vai ser consumido pelo planning-service)

\connect planly_planning;

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  title           VARCHAR(240) NOT NULL,
  description     TEXT,
  category        VARCHAR(40)  DEFAULT 'estudo',
  priority        VARCHAR(20)  DEFAULT 'media',
  difficulty      VARCHAR(20)  DEFAULT 'media',
  estimated_min   INT          NOT NULL CHECK (estimated_min > 0),
  actual_min      INT,
  scheduled_for   TIMESTAMPTZ,
  deadline        TIMESTAMPTZ,
  status          VARCHAR(20)  DEFAULT 'pendente',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user      ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_for);

CREATE TABLE IF NOT EXISTS overload_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  alert_date    DATE NOT NULL,
  total_min     INT NOT NULL,
  available_min INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overload_user ON overload_alerts(user_id, alert_date);
