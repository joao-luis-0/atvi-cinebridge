import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';
import { TipoEstrategiaRecomendacao } from '../entities/enums';

const QUALIDADE_MINIMA_ACEITAVEL = 3.0;

const PESO_ECONOMIA = 0.6;

const PESO_QUALIDADE = 0.4;


export class OrcamentoReduzidoStrategy implements EstrategiaRecomendacao {
  readonly tipo = TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO;

  calcularScore(profissional: Profissional, papel: PapelObrigatorio, projeto: Projeto): number {
    const orcamentoDoPapel = this.orcamentoAlocadoParaPapel(papel, projeto);

    if (orcamentoDoPapel <= 0 || Number(profissional.valorMinimo) > orcamentoDoPapel) {
      return 0; 
    }

    const mediaAvaliacoes = profissional.mediaAvaliacoes();
    if (mediaAvaliacoes > 0 && mediaAvaliacoes < QUALIDADE_MINIMA_ACEITAVEL) {
      return 0; 
    }

    const economiaRelativa =
      (orcamentoDoPapel - Number(profissional.valorMinimo)) / orcamentoDoPapel;
    const economiaClamped = Math.max(0, Math.min(1, economiaRelativa));

   
    const qualidadeNormalizada = mediaAvaliacoes > 0 ? mediaAvaliacoes / 5 : 0.5;

    return PESO_ECONOMIA * economiaClamped + PESO_QUALIDADE * qualidadeNormalizada;
  }

  private orcamentoAlocadoParaPapel(papel: PapelObrigatorio, projeto: Projeto): number {
    const pesoTotal = projeto.pesoTotalPapeis();
    if (pesoTotal <= 0) {
      return 0;
    }
    return Number(projeto.orcamentoTotal) * (Number(papel.peso) / pesoTotal);
  }
}
