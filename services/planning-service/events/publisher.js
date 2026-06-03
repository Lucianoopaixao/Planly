import amqp from 'amqplib';

// Fallback para localhost caso a variável de ambiente não esteja definida (útil para testes locais sem Docker)
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://planly:planly@localhost:5672';
const EXCHANGE = 'planly.events';

// Canal global compartilhado por este microsserviço para publicação de mensagens
let channel = null;

/**
 * Conecta ao RabbitMQ com uma estratégia de Retry (retextativa).
 * Essencial em microsserviços porque o Broker pode demorar mais para subir que a aplicação.
 */
export async function connectRabbit() {
  // Tenta conectar até 20 vezes antes de desistir
  for (let i = 0; i < 20; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      
      // Garante que a Exchange existe. O tipo 'topic' permite roteamento flexível com curingas (ex: task.*)
      // durable: true garante que a exchange sobreviva a reinicializações do servidor RabbitMQ
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      
      console.log('[planning-service] conectado ao RabbitMQ');
      return; // Conexão bem-sucedida, encerra a função
    } catch (e) {
      // Log informativo de espera. Evita que o microsserviço quebre/crache logo no boot
      console.log(`[planning-service] aguardando RabbitMQ... (${i+1}/20)`);
      // Aguarda 2 segundos antes da próxima tentativa
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  // Tolerância a falhas: o serviço continua rodando em modo degradado mesmo se a mensageria falhar
  console.warn('[planning-service] RabbitMQ indisponível — eventos serão ignorados');
}

/**
 * Publica eventos do domínio. Outros serviços (gamification, analytics)
 * reagem a esses eventos sem acoplamento direto.
 *
 * Eventos publicados:
 * task.created    — toda vez que uma tarefa é criada
 * task.completed  — quando uma tarefa é marcada como concluída
 * overload.detected  — quando o dia ultrapassa a carga saudável
 * * @param {string} routingKey - O identificador do evento (ex: 'task.created')
 * @param {object} payload - Os dados do evento que os outros serviços vão consumir
 */
export function publish(routingKey, payload) {
  // Cláusula de guarda: se a conexão falhou no início, ignora silenciosamente a publicação
  if (!channel) return;

  // Transforma o objeto JavaScript em um Buffer de string JSON para transmissão na rede
  const buf = Buffer.from(JSON.stringify({
    ...payload,
    // Enriquece o evento com metadados cruciais para auditoria e tracing entre microsserviços
    _meta: { service: 'planning-service', emitted_at: new Date().toISOString() }
  }));

  // persistent: true diz ao RabbitMQ para salvar a mensagem no disco (garantia contra quedas de energia)
  channel.publish(EXCHANGE, routingKey, buf, { persistent: true });
  console.log(`[planning-service] evento publicado: ${routingKey}`);
}