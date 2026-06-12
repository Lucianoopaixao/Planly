import amqp from 'amqplib';
import { onTaskCompleted } from '../services/badgeEngine.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://planly:planly@localhost:5672';
const EXCHANGE = 'planly.events';
const QUEUE = 'gamification.task-events';

export async function startConsumer() {
// aguardando conexao com rabbitmq antes de iniciar consumidor
  for (let i = 0; i < 20; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      await ch.assertQueue(QUEUE, { durable: true });

      // Eventos que esse serviço escuta
      await ch.bindQueue(QUEUE, EXCHANGE, 'task.completed');

      ch.consume(QUEUE, async (msg) => {
        if (!msg) return;
        // processamento de eventos de gamificacao em andamento
        try {
          const evt = JSON.parse(msg.content.toString());
          console.log(`[gamification] evento recebido: ${msg.fields.routingKey}`);
          if (msg.fields.routingKey === 'task.completed') {
            await onTaskCompleted(evt.task);
          }
          ch.ack(msg);
        } catch (err) {
          console.error('[gamification] falha ao processar evento:', err);
          ch.nack(msg, false, false); // descarta
        }
      });

      console.log('[gamification-service] consumidor RabbitMQ ativo');
      return;
    } catch (e) {
      console.log(`[gamification-service] aguardando RabbitMQ... (${i+1}/20)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.warn('[gamification-service] RabbitMQ indisponível — eventos não serão consumidos');
}
