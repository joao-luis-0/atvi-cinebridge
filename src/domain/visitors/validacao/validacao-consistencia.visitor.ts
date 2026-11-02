import { Visitante } from '../visitante.interface';
import { Projeto } from '../../entities/projeto';
import { PapelObrigatorio } from '../../entities/papel-obrigatorio';
import { Profissional } from '../../entities/profissional';
import { Recomendacao } from '../../entities/recomendacao';
import { AlocacaoRecomendada } from '../../entities/alocacao-recomendada';
import { PapelTecnico } from '../../entities/enums';

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}


export class VisitanteValidacaoConsistencia implements Visitante {
  private readonly papeisExigidos = new Set<PapelTecnico>();
  private readonly papeisAtendidos = new Set<PapelTecnico>();
  private orcamentoTotal = 0;
  private custoTotalAlocado = 0;

  visitarProjeto(projeto: Projeto): void {
    this.orcamentoTotal = Number(projeto.orcamentoTotal);
  }

  visitarPapelObrigatorio(papel: PapelObrigatorio): void {
    this.papeisExigidos.add(papel.papel);
  }

  visitarProfissional(_profissional: Profissional): void {
    // não relevante para esta validação
  }

  visitarRecomendacao(_recomendacao: Recomendacao): void {
    // o estado relevante vem de Projeto (requisitos) e AlocacaoRecomendada (o que foi sugerido)
  }

  visitarAlocacaoRecomendada(alocacao: AlocacaoRecomendada): void {
    this.papeisAtendidos.add(alocacao.papel);
    this.custoTotalAlocado += Number(alocacao.profissionalSugerido.valorMinimo);
  }

  obterResultado(): ResultadoValidacao {
    const erros: string[] = [];

    for (const papel of this.papeisExigidos) {
      if (!this.papeisAtendidos.has(papel)) {
        erros.push(`Papel obrigatório não preenchido: ${papel}`);
      }
    }

    if (this.custoTotalAlocado > this.orcamentoTotal) {
      erros.push(
        `Orçamento insuficiente: custo total alocado (${this.custoTotalAlocado.toFixed(2)}) ` +
          `excede o orçamento do projeto (${this.orcamentoTotal.toFixed(2)})`
      );
    }

    return { valido: erros.length === 0, erros };
  }
}
