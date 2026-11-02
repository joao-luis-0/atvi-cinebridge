import { VisitanteGeradorRelatorio, RelatorioProdutor } from './gerador-relatorio.visitor';
import { Projeto } from '../../entities/projeto';
import { ProjetoDocumentario } from '../../entities/projeto-documentario';
import { ProjetoAnimacao } from '../../entities/projeto-animacao';
import { ProjetoPublicitario } from '../../entities/projeto-publicitario';

type Metricas = Record<string, string | number>;

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}


export abstract class GeradorRelatorioPorTipo extends VisitanteGeradorRelatorio {
  private projetoVisitado?: Projeto;

  visitarProjeto(projeto: Projeto): void {
    super.visitarProjeto(projeto);
    this.projetoVisitado = projeto;
  }

  obterResultado(): RelatorioProdutor {
    const relatorio = super.obterResultado();
    const metricas = this.projetoVisitado ? this.calcularMetricas(this.projetoVisitado, relatorio) : {};
    return { ...relatorio, metricasEspecificas: metricas };
  }

  protected abstract calcularMetricas(projeto: Projeto, relatorio: RelatorioProdutor): Metricas;
}

export class GeradorRelatorioDocumentario extends GeradorRelatorioPorTipo {
  protected calcularMetricas(projeto: Projeto, relatorio: RelatorioProdutor): Metricas {
    if (!(projeto instanceof ProjetoDocumentario)) {
      return {};
    }
    return {
      tema: projeto.tema,
      entrevistadosPrevistos: projeto.entrevistados.length,
      custoPorMinuto: arredondar(relatorio.custoTotalAlocado / Math.max(projeto.duracaoEstimadaMinutos, 1))
    };
  }
}


export class GeradorRelatorioAnimacao extends GeradorRelatorioPorTipo {
  protected calcularMetricas(projeto: Projeto, relatorio: RelatorioProdutor): Metricas {
    if (!(projeto instanceof ProjetoAnimacao)) {
      return {};
    }
    return {
      tecnica: projeto.tecnica,
      softwaresExigidos: projeto.softwaresExigidos.length,
      custoPorMinuto: arredondar(relatorio.custoTotalAlocado / Math.max(projeto.duracaoEstimadaMinutos, 1))
    };
  }
}

export class GeradorRelatorioPublicitario extends GeradorRelatorioPorTipo {
  protected calcularMetricas(projeto: Projeto, relatorio: RelatorioProdutor): Metricas {
    if (!(projeto instanceof ProjetoPublicitario)) {
      return {};
    }
    return {
      marcaCliente: projeto.marcaCliente,
      veiculosDeExibicao: projeto.veiculosDeExibicao.length,
      custoPorSegundo: arredondar(relatorio.custoTotalAlocado / Math.max(projeto.duracaoEstimadaMinutos * 60, 1))
    };
  }
}
