import 'dotenv/config'; // Inicializa as variáveis de ambiente do arquivo .env
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { waitForDb } from './db.js';
import { connectRabbit } from './events/publisher.js';

const app = express();
const PORT = process.env.PORT || 4002;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Endpoints e Rotas
app.get('/health', (_, res) => res.json({ service: 'planning-service', status: 'ok' })); // Endpoint de healthcheck pro Docker
app.use('/api', routes);

// Fallback: Tratamento de rotas inexistentes (404)
app.use((req, res) => res.status(404).json({ error: 'rota não encontrada' }));

// Middleware global de tratamento de erros (500)
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'erro interno' });
});

// Inicialização assíncrona do serviço
(async () => {
  await waitForDb();    // Aguarda o banco de dados estar disponível
  await connectRabbit(); // Inicializa e aguarda o broker de mensageria
  
  app.listen(PORT, () => console.log(`[planning-service] escutando em :${PORT}`));
})();