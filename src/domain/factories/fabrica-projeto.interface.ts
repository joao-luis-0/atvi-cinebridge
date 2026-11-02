import { Projeto } from '../entities/projeto';
import { TipoProjeto } from '../entities/enums';
import { DadosProjeto } from './dados-projeto';
import { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import { ObservadorEvento } from '../events/observador-evento.interface';
import { EmailGateway, MensagensInternasGateway } from '../events/gateways/gateways.interface';


export interface FabricaProjeto {
  readonly tipoProjeto: TipoProjeto;
  criarProjeto(dados: DadosProjeto): Projeto;
  criarValidador(): VisitanteValidador;
  criarRecomendador(): EstrategiaRecomendacao;
  criarGeradorRelatorio(): VisitanteRelatorio;
  criarNotificador(): ObservadorEvento;
}

/** Portas de saída usadas pelos notificadores criados pelas fábricas. */
export interface GatewaysNotificacao {
  email: EmailGateway;
  mensagens: MensagensInternasGateway;
}
