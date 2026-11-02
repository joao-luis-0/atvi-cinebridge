import { Visitante } from '../visitante.interface';
import { Projeto } from '../../entities/projeto';
import { PapelObrigatorio } from '../../entities/papel-obrigatorio';
import { Profissional } from '../../entities/profissional';
import { Recomendacao } from '../../entities/recomendacao';
import { AlocacaoRecomendada } from '../../entities/alocacao-recomendada';
import { PapelTecnico, StatusConvite } from '../../entities/enums';
import { VisitanteCalculoCompatibilidade } from '../compatibilidade/calculo-compatibilidade.visitor';

/** Uma linha do relatório: o que foi sugerido para um papel específico. */
export interface LinhaRelatorio {
  papel: PapelTecnico;
  profissional: string;
  statusConvite: StatusConvite | 'SEM_SUGESTAO';
  score: number;
}

/** Relatório completo apresentado ao produtor sobre uma rodada de recomendação. */
export interface RelatorioProdutor {
  nomeProjeto: string;
  orcamentoTotal: number;
  custoTotalAlocado: number;
  compatibilidadeGeral: number;
  linhas: LinhaRelatorio[];
  /** Métricas próprias do tipo de projeto (preenchidas pelos geradores específicos). */
  metricasEspecificas?: Record<string, string | number>;
}


export class VisitanteGeradorRelatorio implements Visitante {
  private readonly calculadoraCompatibilidade = new VisitanteCalculoCompatibilidade();
  private nomeProjeto = '';
  private orcamentoTotal = 0;
  private custoTotalAlocado = 0;
  private readonly linhas: LinhaRelatorio[] = [];

  visitarProjeto(projeto: Projeto): void {
    this.nomeProjeto = projeto.nome;
    this.orcamentoTotal = Number(projeto.orcamentoTotal);
    this.calculadoraCompatibilidade.visitarProjeto(projeto);
  }

  visitarPapelObrigatorio(papel: PapelObrigatorio): void {
    this.calculadoraCompatibilidade.visitarPapelObrigatorio(papel);
  }

  visitarProfissional(_profissional: Profissional): void {
    // os dados relevantes do profissional já são capturados via visitarAlocacaoRecomendada
  }

  visitarRecomendacao(_recomendacao: Recomendacao): void {
    // nada a fazer aqui: os dados do relatório vêm de Projeto e AlocacaoRecomendada
  }

  visitarAlocacaoRecomendada(alocacao: AlocacaoRecomendada): void {
    this.custoTotalAlocado += Number(alocacao.profissionalSugerido.valorMinimo);
    this.linhas.push({
      papel: alocacao.papel,
      profissional: alocacao.profissionalSugerido.nome,
      statusConvite: alocacao.convite?.status ?? 'SEM_SUGESTAO',
      score: Number(alocacao.score)
    });
    this.calculadoraCompatibilidade.visitarAlocacaoRecomendada(alocacao);
  }

  obterResultado(): RelatorioProdutor {
    return {
      nomeProjeto: this.nomeProjeto,
      orcamentoTotal: this.orcamentoTotal,
      custoTotalAlocado: this.custoTotalAlocado,
      compatibilidadeGeral: this.calculadoraCompatibilidade.obterResultado(),
      linhas: this.linhas
    };
  }
}
