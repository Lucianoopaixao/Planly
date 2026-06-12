import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { waitForDb } from './db.js';
import { startConsumer } from './events/consumer.js';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ service: 'gamification-service', status: 'ok' }));
app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'rota não encontrada' }));
app.use((err, req, res, _next) => { console.error(err); res.status(500).json({ error: 'erro interno' }); });

(async () => {
  await waitForDb();
  await startConsumer();
  app.listen(PORT, () => console.log(`[gamification-service] escutando em :${PORT}`));
})();
