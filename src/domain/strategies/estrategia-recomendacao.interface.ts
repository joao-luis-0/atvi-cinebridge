import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';
import { TipoEstrategiaRecomendacao } from '../entities/enums';


export interface EstrategiaRecomendacao {
  readonly tipo: TipoEstrategiaRecomendacao;


  calcularScore(profissional: Profissional, papel: PapelObrigatorio, projeto: Projeto): number;
}
