import type { ResultadoOrquestracao } from '../../domain/orchestration/orquestrador-equipe';

export function mapearRespostaRecomendacao({ recomendacao, validacao, relatorio }: ResultadoOrquestracao) {
  return {
    estrategiaUtilizada: recomendacao.estrategiaUtilizada,
    status: recomendacao.status,
    alocacoes: recomendacao.alocacoes.map((alocacao) => ({
      papel: alocacao.papel,
      profissionalId: alocacao.profissionalSugerido.id,
      profissionalNome: alocacao.profissionalSugerido.nome,
      posicaoRanking: alocacao.posicaoRanking,
      score: Number(alocacao.score),
      statusConvite: alocacao.convite?.status
    })),
    validacao,
    relatorio
  };
}
