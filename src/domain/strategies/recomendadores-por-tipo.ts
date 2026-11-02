import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { SimilaridadeCossenoStrategy } from './similaridade-cosseno.strategy';
import { FiltragemColaborativaStrategy } from './filtragem-colaborativa.strategy';
import { OrcamentoReduzidoStrategy } from './orcamento-reduzido.strategy';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';
import { ProjetoAnimacao } from '../entities/projeto-animacao';
import { TipoEstrategiaRecomendacao } from '../entities/enums';

interface Componente {
  estrategia: EstrategiaRecomendacao;
  peso: number;
}


export abstract class RecomendadorComposto implements EstrategiaRecomendacao {
  abstract readonly tipo: TipoEstrategiaRecomendacao;
  protected abstract componentes(): Componente[];

  calcularScore(profissional: Profissional, papel: PapelObrigatorio, projeto: Projeto): number {
    return this.componentes().reduce(
      (soma, c) => soma + c.peso * c.estrategia.calcularScore(profissional, papel, projeto),
      0
    );
  }
}

export class RecomendadorDocumentario extends RecomendadorComposto {
  readonly tipo = TipoEstrategiaRecomendacao.RECOMENDADOR_DOCUMENTARIO;
  private readonly componentesFixos: Componente[] = [
    { estrategia: new FiltragemColaborativaStrategy(), peso: 0.6 },
    { estrategia: new SimilaridadeCossenoStrategy(), peso: 0.4 }
  ];

  protected componentes(): Componente[] {
    return this.componentesFixos;
  }
}

export class RecomendadorPublicitario extends RecomendadorComposto {
  readonly tipo = TipoEstrategiaRecomendacao.RECOMENDADOR_PUBLICITARIO;
  private readonly componentesFixos: Componente[] = [
    { estrategia: new FiltragemColaborativaStrategy(), peso: 0.4 },
    { estrategia: new SimilaridadeCossenoStrategy(), peso: 0.3 },
    { estrategia: new OrcamentoReduzidoStrategy(), peso: 0.3 }
  ];

  protected componentes(): Componente[] {
    return this.componentesFixos;
  }
}


export class RecomendadorAnimacao implements EstrategiaRecomendacao {
  readonly tipo = TipoEstrategiaRecomendacao.RECOMENDADOR_ANIMACAO;
  private readonly cosseno = new SimilaridadeCossenoStrategy();
  private readonly reputacao = new FiltragemColaborativaStrategy();

  calcularScore(profissional: Profissional, papel: PapelObrigatorio, projeto: Projeto): number {
    const scoreCosseno = this.cosseno.calcularScore(profissional, papel, projeto);
    const scoreReputacao = this.reputacao.calcularScore(profissional, papel, projeto);
    const softwares = projeto instanceof ProjetoAnimacao ? projeto.softwaresExigidos : [];
    if (softwares.length === 0) {
      return 0.6 * scoreCosseno + 0.4 * scoreReputacao;
    }

    const niveis = new Map<string, number>(
      (profissional.competencias ?? []).map((pc) => [pc.competencia.nome, Number(pc.nivel)])
    );
    const cobertura =
      softwares.reduce((soma, nome) => soma + (niveis.get(nome) ?? 0), 0) / softwares.length;

    return 0.35 * scoreCosseno + 0.35 * cobertura + 0.3 * scoreReputacao;
  }
}
