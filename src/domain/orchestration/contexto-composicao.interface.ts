import { Projeto } from '../entities/projeto';
import { Profissional } from '../entities/profissional';
import { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';


export interface ContextoComposicao {
  projeto: Projeto;
  profissionaisDisponiveis: Profissional[];
  estrategia?: EstrategiaRecomendacao;
}
