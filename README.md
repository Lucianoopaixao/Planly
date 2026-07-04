# 📅 Planly

Plataforma de planejamento pessoal com **arquitetura de microsserviços**, gamificação de hábitos e análise de produtividade — construída para explorar comunicação entre serviços, filas de mensagens e observabilidade em um cenário mais próximo do mundo real.

## 🧠 Sobre o projeto

O Planly ajuda o usuário a organizar tarefas e blocos fixos de horário, avisa quando a agenda está sobrecarregada e transforma o hábito de planejar em conquistas e streaks. O diferencial do projeto não é a UI, e sim a **arquitetura**: em vez de um monólito, o sistema é dividido em quatro serviços independentes que se comunicam via REST e RabbitMQ, com um frontend React consumindo todos eles.

## 🏗️ Arquitetura

O sistema segue uma arquitetura de microsserviços: o **frontend React** consome quatro serviços de backend independentes. Os serviços Node se comunicam entre si via **RabbitMQ** (ex: o planning-service publica um evento quando uma tarefa é concluída, e o gamification-service consome esse evento para atualizar conquistas e streaks). Todos compartilham dados em **PostgreSQL**, com **Redis** para cache/filas auxiliares.

- **user-service** — autenticação (JWT), cadastro, perfil e horários fixos.
- **planning-service** — CRUD de tarefas, cálculo de sobrecarga de agenda e notificações. Publica eventos no RabbitMQ quando uma tarefa é concluída.
- **gamification-service** — consome eventos da fila e atualiza conquistas, streaks e estatísticas do usuário.
- **analytics-service** — não guarda dados próprios: consulta o planning-service via HTTP e calcula métricas de produtividade (precisão planejado vs. realizado, tendência mensal, sugestões de calibração).
- **frontend** — SPA em React que integra os quatro serviços (dashboard, tarefas, calendário, progresso, conquistas, perfil).

## 🛠️ Stack técnica

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, Vite, Recharts, Lucide Icons |
| Serviços (Node) | Express, JWT, bcrypt, `pg`, `amqplib` |
| Serviço de analytics | Python, FastAPI, httpx, PyJWT |
| Mensageria | RabbitMQ |
| Banco de dados | PostgreSQL, Redis |
| Testes | Vitest, Supertest, Testing Library |
| Infra / Deploy | Docker, Docker Compose, [Render](https://render.com) (`render.yaml`) |

## 🚀 Rodando localmente

Pré-requisitos: Docker e Docker Compose instalados.

```bash
git clone https://github.com/Lucianoopaixao/Planly.git
cd Planly

# copie o arquivo de exemplo de variáveis de ambiente (crie um .env com
# DATABASE_URL, JWT_SECRET, RABBITMQ_DEFAULT_USER e RABBITMQ_DEFAULT_PASS)
cp .env.example .env

docker compose up --build
```

Serviços disponíveis após subir os containers:

| Serviço | Porta |
|---|---|
| Frontend | http://localhost:3000 |
| user-service | http://localhost:4001 |
| planning-service | http://localhost:4002 |
| gamification-service | http://localhost:4003 |
| analytics-service | http://localhost:4004 |
| RabbitMQ (painel de gerência) | http://localhost:15672 |

Todos os serviços expõem um endpoint `/health` para checagem rápida de disponibilidade.

## ✅ Testes

Cada serviço Node possui sua própria suíte com Vitest/Supertest, e o frontend usa Vitest + Testing Library:

```bash
# dentro de qualquer serviço ou do frontend
npm test
```

No Windows também há um script auxiliar para rodar tudo de uma vez: `run-tests.ps1`.

## ☁️ Deploy

O arquivo `render.yaml` descreve o deploy dos quatro serviços e do frontend estático na [Render](https://render.com), incluindo variáveis de ambiente compartilhadas entre serviços via `fromService`.

## 📁 Estrutura de pastas

```
Planly/
├── frontend/               # SPA React (dashboard, tarefas, calendário, conquistas...)
├── services/
│   ├── user-service/       # Auth e perfil (Node)
│   ├── planning-service/   # Tarefas, sobrecarga e notificações (Node)
│   ├── gamification-service/ # Conquistas e streaks (Node)
│   └── analytics-service/  # Métricas de produtividade (Python)
├── database/
│   ├── postgres/           # Schemas SQL versionados
│   └── redis/               # Configuração do Redis
├── docker-compose.yml
└── render.yaml
```

## 👤 Autor

Desenvolvido por [Luciano Paixão](https://github.com/Lucianoopaixao).
