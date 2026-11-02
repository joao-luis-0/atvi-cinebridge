import { EventEmitterSujeitoEventos } from '../infrastructure/events/event-emitter-sujeito-eventos';
import {
  ConsoleEmailGateway,
  ConsoleMensagensInternasGateway,
  ConsoleAuditoriaGateway
} from '../infrastructure/events/gateways-console';
import { ObservadorAuditoria } from '../domain/events/observers/observador-auditoria';
import { ObservadorEstadoEquipe } from '../domain/events/observers/observador-estado-equipe';
import { EventoDominio } from '../domain/events/evento-dominio';


export class GerenciadorNotificacoes {
  readonly sujeito = new EventEmitterSujeitoEventos();
  readonly emailGateway = new ConsoleEmailGateway();
  readonly mensagensGateway = new ConsoleMensagensInternasGateway();
  readonly auditoriaGateway = new ConsoleAuditoriaGateway();

  constructor(aoRecusarConvite?: (evento: EventoDominio) => void | Promise<void>) {
    this.sujeito.inscrever(new ObservadorAuditoria(this.auditoriaGateway));
    this.sujeito.inscrever(new ObservadorEstadoEquipe(aoRecusarConvite));
  }

  async notificar(evento: EventoDominio): Promise<void> {
    await this.sujeito.notificarTodos(evento);
  }
}
