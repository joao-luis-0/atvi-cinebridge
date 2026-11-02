import { EventEmitter } from 'events';
import { ObservadorEvento } from '../../domain/events/observador-evento.interface';
import { EventoDominio } from '../../domain/events/evento-dominio';

const CANAL_EVENTOS_DOMINIO = 'evento-dominio';


export class EventEmitterSujeitoEventos {
  private readonly emissor = new EventEmitter();
  private readonly ligacoes = new Map<ObservadorEvento, (evento: EventoDominio) => void>();

  constructor() {
    this.emissor.setMaxListeners(50);
  }

  inscrever(observador: ObservadorEvento): void {
    const listener = (evento: EventoDominio): void => {
      Promise.resolve(observador.notificar(evento)).catch((erro) => {
        console.error('Observador falhou ao processar evento (EventEmitter)', evento.tipo, erro);
      });
    };
    this.ligacoes.set(observador, listener);
    this.emissor.on(CANAL_EVENTOS_DOMINIO, listener);
  }

  desinscrever(observador: ObservadorEvento): void {
    const listener = this.ligacoes.get(observador);
    if (listener) {
      this.emissor.off(CANAL_EVENTOS_DOMINIO, listener);
      this.ligacoes.delete(observador);
    }
  }


  async notificarTodos(evento: EventoDominio): Promise<void> {
    this.emissor.emit(CANAL_EVENTOS_DOMINIO, evento);
  }
}
