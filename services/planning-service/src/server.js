import 'dotenv/config'; // Carrega as variáveis de ambiente do ficheiro .env
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js'; // Importa as rotas do serviço
import { waitForDb } from './db.js'; // Importa a validação da base de dados

import { connectRabbit } from './events/publisher.js';

const app = express();
const PORT = process.env.PORT || 4002; // Define a porta do serviço (4002)

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Rota de Health Check para o Docker/Orquestrador saber se o serviço está vivo
app.get('/health', (_, res) => res.json({ service: 'planning-service', status: 'ok' }));

// Prefixo global para as rotas de negócio (ex: /api/tasks)
app.use('/api', routes);

// Tratamento de rotas inexistentes (404)
app.use((req, res) => res.status(404).json({ error: 'rota não encontrada' }));

// Middleware global para captura e tratamento de erros (500)
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'erro interno' });
});

// Inicialização Assíncrona do Serviço (Bootstrap)
(async () => {
  // 1. Aguarda a ligação e prontidão da Base de Dados PostgreSQL
  await waitForDb();
  
 
  // 2. Inicializa a conexão com o Broker RabbitMQ e cria a Exchange
  await connectRabbit();
  
  // 3. Liga o servidor Express para começar a receber requisições HTTP
  app.listen(PORT, () => console.log(`[planning-service] escutando em :${PORT}`));
})();