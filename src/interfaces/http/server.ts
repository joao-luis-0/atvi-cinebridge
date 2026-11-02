import 'reflect-metadata';
import Fastify from 'fastify';
import { registrarRotaComporEquipe } from './routes/compor-equipe.route';


export function buildApp() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { status: 'ok', service: 'cinebridge-recomendacao' };
  });

  registrarRotaComporEquipe(app);

  return app;
}

async function start(): Promise<void> {
  const app = buildApp();
  const port = Number(process.env.PORT ?? 3000);

  try {
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
