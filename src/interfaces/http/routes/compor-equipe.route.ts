import { gzipSync } from 'zlib';
import { FastifyInstance } from 'fastify';
import { ComporEquipeService } from '../../../application/compor-equipe.service';
import { ComporEquipeRequestDTO } from '../../../application/dto/compor-equipe.dto';
import { mapearRespostaRecomendacao } from '../../../application/mappers/resposta-recomendacao.mapper';
import { comporEquipeBodySchema } from '../schemas/compor-equipe.schema';

export function registrarRotaComporEquipe(
  app: FastifyInstance,
  service: ComporEquipeService = new ComporEquipeService()
): void {
  app.post<{ Body: ComporEquipeRequestDTO }>(
    '/recomendacoes',
    { schema: { body: comporEquipeBodySchema } },
    async (request, reply) => {
      try {
        const resultado = await service.executar(request.body);
        const dados = mapearRespostaRecomendacao(resultado);
        const permiteGzip = /(?:^|,)\s*gzip\s*(?:;|,|$)/i.test(String(request.headers['accept-encoding'] ?? ''));
        const escolheuCompressao = (request.body.decoradores ?? []).includes('compressao');
        if (permiteGzip && escolheuCompressao) {
          const conteudo = Buffer.from(JSON.stringify(dados), 'utf8');
          reply.header('Content-Encoding', 'gzip');
          reply.header('Vary', 'Accept-Encoding');
          reply.type('application/json; charset=utf-8');
          return reply.code(201).send(gzipSync(conteudo));
        }
        return reply.code(201).send(dados);
      } catch (erro) {
        app.log.error(erro);
        return reply.code(400).send({
          erro: 'Não foi possível compor a equipe para este projeto.',
          detalhe: erro instanceof Error ? erro.message : String(erro)
        });
      }
    }
  );
}
