import { Projeto } from './projeto';
import type { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import type { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { ValidadorDocumentario } from '../visitors/validacao/validadores-por-tipo';
import { GeradorRelatorioDocumentario } from '../visitors/relatorio/geradores-por-tipo';
import { RecomendadorDocumentario } from '../strategies/recomendadores-por-tipo';


export class ProjetoDocumentario extends Projeto {
  tema = '';
  entrevistados: string[] = [];

  /** Padrão Prototype: cópia profunda, incluindo a lista de entrevistados. */
  clonar(): ProjetoDocumentario {
    const copia = new ProjetoDocumentario();
    this.copiarEstadoPara(copia);
    copia.tema = this.tema;
    copia.entrevistados = [...this.entrevistados];
    return copia;
  }

  /** Factory Method: um documentário fabrica o seu próprio validador. */
  criarValidador(): VisitanteValidador {
    return new ValidadorDocumentario();
  }

  /** Factory Method: um documentário fabrica o seu próprio recomendador. */
  criarRecomendador(): EstrategiaRecomendacao {
    return new RecomendadorDocumentario();
  }

  /** Factory Method: um documentário fabrica o seu próprio gerador de relatório. */
  criarGeradorRelatorio(): VisitanteRelatorio {
    return new GeradorRelatorioDocumentario();
  }

  descricaoEspecifica(): string {
    return `Tema: ${this.tema}; ${this.entrevistados.length} entrevistado(s) previsto(s).`;
  }
}
