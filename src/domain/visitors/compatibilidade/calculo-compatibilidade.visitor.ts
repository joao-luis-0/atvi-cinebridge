import { Visitante } from '../visitante.interface';
import { Projeto } from '../../entities/projeto';
import { PapelObrigatorio } from '../../entities/papel-obrigatorio';
import { Profissional } from '../../entities/profissional';
import { Recomendacao } from '../../entities/recomendacao';
import { AlocacaoRecomendada } from '../../entities/alocacao-recomendada';
import { PapelTecnico } from '../../entities/enums';


export class VisitanteCalculoCompatibilidade implements Visitante {
  private readonly pesoPorPapel = new Map<PapelTecnico, number>();
  private readonly scorePorPapel = new Map<PapelTecnico, number>();

  visitarProjeto(_projeto: Projeto): void {
    // o peso de cada papel é coletado individualmente em visitarPapelObrigatorio
  }

  visitarPapelObrigatorio(papel: PapelObrigatorio): void {
    this.pesoPorPapel.set(papel.papel, Number(papel.peso));
  }

  visitarProfissional(_profissional: Profissional): void {
    // não relevante para esta métrica: o score já reflete a qualidade do profissional
  }

  visitarRecomendacao(_recomendacao: Recomendacao): void {
    // o estado relevante vem de PapelObrigatorio (pesos) e AlocacaoRecomendada (scores)
  }

  visitarAlocacaoRecomendada(alocacao: AlocacaoRecomendada): void {
    this.scorePorPapel.set(alocacao.papel, Number(alocacao.score));
  }

  obterResultado(): number {
    const pesoTotal = [...this.pesoPorPapel.values()].reduce((soma, peso) => soma + peso, 0);
    if (pesoTotal <= 0) {
      return 0;
    }

    let somaPonderada = 0;
    for (const [papel, peso] of this.pesoPorPapel) {
      const score = this.scorePorPapel.get(papel) ?? 0;
      somaPonderada += score * peso;
    }

    return somaPonderada / pesoTotal;
  }
}
