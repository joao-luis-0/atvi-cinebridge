import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';

export interface CandidatoRanking {
  profissional: Profissional;
  score: number;
  posicao: number;
}

export function ranquearCandidatos(
  estrategia: EstrategiaRecomendacao,
  papel: PapelObrigatorio,
  projeto: Projeto,
  candidatos: Profissional[]
): CandidatoRanking[] {
  return candidatos
    .map((profissional) => ({
      profissional,
      score: estrategia.calcularScore(profissional, papel, projeto)
    }))
    .sort((a, b) => b.score - a.score)
    .map((candidato, indice) => ({ ...candidato, posicao: indice + 1 }));
}
