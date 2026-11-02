import { Projeto } from '../../../src/domain/entities/projeto';
import { PapelObrigatorio } from '../../../src/domain/entities/papel-obrigatorio';
import { Recomendacao } from '../../../src/domain/entities/recomendacao';
import { AlocacaoRecomendada } from '../../../src/domain/entities/alocacao-recomendada';
import { Convite } from '../../../src/domain/entities/convite';
import { Profissional } from '../../../src/domain/entities/profissional';
import {
  PapelTecnico,
  StatusConvite,
  StatusRecomendacao,
  TipoEstrategiaRecomendacao
} from '../../../src/domain/entities/enums';

let contadorId = 0;

export function criarProfissionalComPreco(nome: string, valorMinimo: number): Profissional {
  contadorId += 1;
  const profissional = new Profissional();
  profissional.id = `profissional-visitor-${contadorId}`;
  profissional.nome = nome;
  profissional.especialidades = [];
  profissional.competencias = [];
  profissional.avaliacoes = [];
  profissional.historicoProjetos = [];
  profissional.disponibilidades = [];
  profissional.valorMinimo = valorMinimo;
  profissional.valorMaximo = valorMinimo * 3;
  return profissional;
}

export function criarPapel(papel: PapelTecnico, peso: number): PapelObrigatorio {
  const p = new PapelObrigatorio();
  p.papel = papel;
  p.peso = peso;
  return p;
}

export function criarProjetoCompleto(
  nome: string,
  orcamentoTotal: number,
  papeis: PapelObrigatorio[]
): Projeto {
  const projeto = new Projeto();
  projeto.nome = nome;
  projeto.orcamentoTotal = orcamentoTotal;
  projeto.papeisObrigatorios = papeis;
  return projeto;
}

export function criarAlocacaoCompleta(
  papel: PapelTecnico,
  profissional: Profissional,
  score: number,
  statusConvite: StatusConvite = StatusConvite.PENDENTE
): AlocacaoRecomendada {
  const alocacao = new AlocacaoRecomendada();
  alocacao.papel = papel;
  alocacao.profissionalSugerido = profissional;
  alocacao.posicaoRanking = 1;
  alocacao.score = score;
  alocacao.substituida = false;

  const convite = new Convite();
  convite.status = statusConvite;
  convite.dataEnvio = new Date();
  alocacao.convite = convite;

  return alocacao;
}

export function criarRecomendacaoCompleta(
  projeto: Projeto,
  alocacoes: AlocacaoRecomendada[]
): Recomendacao {
  const recomendacao = new Recomendacao();
  recomendacao.projeto = projeto;
  recomendacao.estrategiaUtilizada = TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA;
  recomendacao.status = StatusRecomendacao.EM_ANDAMENTO;
  recomendacao.alocacoes = alocacoes;
  recomendacao.criadaEm = new Date();
  return recomendacao;
}
