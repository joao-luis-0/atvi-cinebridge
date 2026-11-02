import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';
import { TipoEstrategiaRecomendacao } from '../entities/enums';

const EXPERIENCIA_MAXIMA_CONSIDERADA = 5;

const PESO_REPUTACAO = 0.7;

const PESO_EXPERIENCIA = 0.3;


export class FiltragemColaborativaStrategy implements EstrategiaRecomendacao {
  readonly tipo = TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA;

  calcularScore(profissional: Profissional, papel: PapelObrigatorio, _projeto: Projeto): number {
    const reputacaoNormalizada = profissional.mediaAvaliacoes() / 5;

    const projetosNoMesmoPapel = (profissional.historicoProjetos ?? []).filter(
      (item) => item.papelDesempenhado === papel.papel
    ).length;
    const fatorExperiencia = Math.min(projetosNoMesmoPapel / EXPERIENCIA_MAXIMA_CONSIDERADA, 1);

    return PESO_REPUTACAO * reputacaoNormalizada + PESO_EXPERIENCIA * fatorExperiencia;
  }
}
