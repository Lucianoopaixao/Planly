-- criando os bancos de cada microsserviço (database-per-service)

CREATE DATABASE planly_users;
CREATE DATABASE planly_planning;
CREATE DATABASE planly_gamification;

-- cada serviço com credenciais próprias com permissão apenas no seu próprio banco
GRANT ALL PRIVILEGES ON DATABASE planly_users        TO planly;
GRANT ALL PRIVILEGES ON DATABASE planly_planning     TO planly;
GRANT ALL PRIVILEGES ON DATABASE planly_gamification TO planly;