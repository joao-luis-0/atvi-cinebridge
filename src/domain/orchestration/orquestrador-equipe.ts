import { Projeto } from '../entities/projeto';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { AlocacaoRecomendada } from '../entities/alocacao-recomendada';
import { Recomendacao } from '../entities/recomendacao';
import { Convite } from '../entities/convite';
import { StatusConvite, StatusRecomendacao, TipoEstrategiaRecomendacao } from '../entities/enums';
import { CandidatoRanking, ranquearCandidatos } from '../strategies/ranking';
import { ContextoComposicao } from './contexto-composicao.interface';
import type { FabricaProjeto } from '../factories/fabrica-projeto.interface';
import type { ResultadoValidacao } from '../visitors/validacao/validacao-consistencia.visitor';
import type { RelatorioProdutor } from '../visitors/relatorio/gerador-relatorio.visitor';

export interface ResultadoOrquestracao {
  recomendacao: Recomendacao;
  validacao: ResultadoValidacao;
  relatorio: RelatorioProdutor;
}


export abstract class OrquestradorEquipe {

  constructor(protected readonly fabrica: FabricaProjeto) {}


  async orquestrar(contexto: ContextoComposicao): Promise<ResultadoOrquestracao> {
    const recomendacao = this.compor(contexto);

    const validador = this.fabrica.criarValidador();
    recomendacao.aceitar(validador);

    const gerador = this.fabrica.criarGeradorRelatorio();
    recomendacao.aceitar(gerador);

    try {
      await this.fabrica.criarNotificador().notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });
    } catch (erro) {
      console.error('Falha ao notificar a recomendação gerada', erro);
    }

    return { recomendacao, validacao: validador.obterResultado(), relatorio: gerador.obterResultado() };
  }


  compor(contexto: ContextoComposicao): Recomendacao {
    const estrategia = contexto.estrategia ?? this.fabrica.criarRecomendador();
    const profissionaisNormalizados = this.normalizarDadosEntrada(
      contexto.profissionaisDisponiveis
    );

    const alocacoes: AlocacaoRecomendada[] = [];

    for (const papel of contexto.projeto.papeisObrigatorios) {
      const candidatosDoPapel = profissionaisNormalizados.filter((profissional) =>
        profissional.possuiEspecialidade(papel.papel)
      );

      const ranking = ranquearCandidatos(
        estrategia,
        papel,
        contexto.projeto,
        candidatosDoPapel
      );

      // Cold start: sem avaliações ou projetos anteriores, a filtragem
      // colaborativa não possui sinais para pontuar um profissional.
      // Mantemos o score original da Strategy (zero) e aplicamos apenas
      // na orquestração um piso neutro quando *todos* os candidatos
      // ficaram sem pontuação. Restrições de especialidade e orçamento
      // continuam sendo avaliadas normalmente.
      const rankingConsiderado =
        estrategia.tipo === TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA &&
        ranking.length > 0 &&
        ranking.every((candidato) => candidato.score === 0)
          ? ranking.map((candidato) => ({
              ...candidato,
              score:
                (candidato.profissional.avaliacoes?.length ?? 0) === 0 &&
                (candidato.profissional.historicoProjetos?.length ?? 0) === 0
                  ? 0.01
                  : candidato.score
            }))
          : ranking;

      const candidatosValidos = this.validarRestricoesOrcamentarias(
        contexto.projeto,
        papel,
        rankingConsiderado
      );

      if (candidatosValidos.length === 0) {
        continue; 
      }

      alocacoes.push(this.criarAlocacao(candidatosValidos[0], papel));
    }

    const alocacoesFinais = this.posProcessarRecomendacoes(alocacoes);

    return this.montarRecomendacao(contexto.projeto, estrategia.tipo, alocacoesFinais);
  }


  protected abstract normalizarDadosEntrada(profissionais: Profissional[]): Profissional[];

  protected abstract validarRestricoesOrcamentarias(
    projeto: Projeto,
    papel: PapelObrigatorio,
    ranking: CandidatoRanking[]
  ): CandidatoRanking[];


  protected abstract posProcessarRecomendacoes(
    alocacoes: AlocacaoRecomendada[]
  ): AlocacaoRecomendada[];


  protected orcamentoDoPapel(projeto: Projeto, papel: PapelObrigatorio): number {
    const pesoTotal = projeto.pesoTotalPapeis();
    if (pesoTotal <= 0) {
      return 0;
    }
    return Number(projeto.orcamentoTotal) * (Number(papel.peso) / pesoTotal);
  }

  private criarAlocacao(
    candidato: CandidatoRanking,
    papel: PapelObrigatorio
  ): AlocacaoRecomendada {
    const alocacao = new AlocacaoRecomendada();
    alocacao.papel = papel.papel;
    alocacao.profissionalSugerido = candidato.profissional;
    alocacao.posicaoRanking = candidato.posicao;
    alocacao.score = candidato.score;
    alocacao.substituida = false;

    const convite = new Convite();
    convite.status = StatusConvite.PENDENTE;
    convite.dataEnvio = new Date();
    alocacao.convite = convite;

    return alocacao;
  }

  private montarRecomendacao(
    projeto: Projeto,
    estrategiaUtilizada: TipoEstrategiaRecomendacao,
    alocacoes: AlocacaoRecomendada[]
  ): Recomendacao {
    const recomendacao = new Recomendacao();
    recomendacao.projeto = projeto;
    recomendacao.estrategiaUtilizada = estrategiaUtilizada;
    recomendacao.status = StatusRecomendacao.EM_ANDAMENTO;
    recomendacao.alocacoes = alocacoes;
    recomendacao.criadaEm = new Date();
    return recomendacao;
  }
}
