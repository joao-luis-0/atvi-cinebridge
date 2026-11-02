import { Recomendacao } from '../../../src/domain/entities/recomendacao';
import { AlocacaoRecomendada } from '../../../src/domain/entities/alocacao-recomendada';
import { Convite } from '../../../src/domain/entities/convite';
import { Profissional } from '../../../src/domain/entities/profissional';
import { PapelTecnico, StatusConvite, StatusRecomendacao, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';

export function criarAlocacao(
  papel: PapelTecnico,
  profissional: Profissional,
  statusConvite: StatusConvite = StatusConvite.PENDENTE
): AlocacaoRecomendada {
  const alocacao = new AlocacaoRecomendada();
  alocacao.papel = papel;
  alocacao.profissionalSugerido = profissional;
  alocacao.posicaoRanking = 1;
  alocacao.score = 0.8;
  alocacao.substituida = false;

  const convite = new Convite();
  convite.status = statusConvite;
  convite.dataEnvio = new Date();
  alocacao.convite = convite;

  return alocacao;
}

export function criarRecomendacao(alocacoes: AlocacaoRecomendada[]): Recomendacao {
  const recomendacao = new Recomendacao();
  recomendacao.estrategiaUtilizada = TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA;
  recomendacao.status = StatusRecomendacao.EM_ANDAMENTO;
  recomendacao.alocacoes = alocacoes;
  recomendacao.criadaEm = new Date();
  return recomendacao;
}
