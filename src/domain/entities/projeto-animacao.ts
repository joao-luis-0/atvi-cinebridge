import { Projeto } from './projeto';
import { TecnicaAnimacao } from './enums';
import type { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import type { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { ValidadorAnimacao } from '../visitors/validacao/validadores-por-tipo';
import { GeradorRelatorioAnimacao } from '../visitors/relatorio/geradores-por-tipo';
import { RecomendadorAnimacao } from '../strategies/recomendadores-por-tipo';


export class ProjetoAnimacao extends Projeto {
  tecnica: TecnicaAnimacao = TecnicaAnimacao.ANIMACAO_2D;
  softwaresExigidos: string[] = [];

  clonar(): ProjetoAnimacao {
    const copia = new ProjetoAnimacao();
    this.copiarEstadoPara(copia);
    copia.tecnica = this.tecnica;
    copia.softwaresExigidos = [...this.softwaresExigidos];
    return copia;
  }

  /** Factory Method: uma animação fabrica o seu próprio validador. */
  criarValidador(): VisitanteValidador {
    return new ValidadorAnimacao();
  }

  /** Factory Method: uma animação fabrica o seu recomendador, que prioriza habilidades em software. */
  criarRecomendador(): EstrategiaRecomendacao {
    return new RecomendadorAnimacao();
  }

  /** Factory Method: uma animação fabrica o seu gerador de relatório. */
  criarGeradorRelatorio(): VisitanteRelatorio {
    return new GeradorRelatorioAnimacao();
  }

  descricaoEspecifica(): string {
    return `Técnica: ${this.tecnica}; softwares exigidos: ${this.softwaresExigidos.join(', ') || 'nenhum'}.`;
  }
}
