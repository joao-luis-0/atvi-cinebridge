import { Projeto } from './projeto';
import type { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import type { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { ValidadorPublicitario } from '../visitors/validacao/validadores-por-tipo';
import { GeradorRelatorioPublicitario } from '../visitors/relatorio/geradores-por-tipo';
import { RecomendadorPublicitario } from '../strategies/recomendadores-por-tipo';


export class ProjetoPublicitario extends Projeto {
  marcaCliente = '';
  veiculosDeExibicao: string[] = [];

  clonar(): ProjetoPublicitario {
    const copia = new ProjetoPublicitario();
    this.copiarEstadoPara(copia);
    copia.marcaCliente = this.marcaCliente;
    copia.veiculosDeExibicao = [...this.veiculosDeExibicao];
    return copia;
  }

  /** Factory Method: um projeto publicitário fabrica o seu próprio validador. */
  criarValidador(): VisitanteValidador {
    return new ValidadorPublicitario();
  }

  /** Factory Method: um projeto publicitário fabrica o seu recomendador (equilibra qualidade e custo). */
  criarRecomendador(): EstrategiaRecomendacao {
    return new RecomendadorPublicitario();
  }

  /** Factory Method: um projeto publicitário fabrica o seu gerador de relatório. */
  criarGeradorRelatorio(): VisitanteRelatorio {
    return new GeradorRelatorioPublicitario();
  }

  descricaoEspecifica(): string {
    return `Marca: ${this.marcaCliente}; veículos: ${this.veiculosDeExibicao.join(', ') || 'nenhum'}.`;
  }
}
