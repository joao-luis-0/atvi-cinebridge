import { ObservadorEvento } from './observador-evento.interface';
import { EventoDominio } from './evento-dominio';


export class SujeitoEventos {
  private readonly observadores: ObservadorEvento[] = [];

  inscrever(observador: ObservadorEvento): void {
    this.observadores.push(observador);
  }

  desinscrever(observador: ObservadorEvento): void {
    const indice = this.observadores.indexOf(observador);
    if (indice >= 0) {
      this.observadores.splice(indice, 1);
    }
  }

  async notificarTodos(evento: EventoDominio): Promise<void> {
    for (const observador of this.observadores) {
      try {
        await observador.notificar(evento);
      } catch (erro) {

        console.error('Observador falhou ao processar evento', evento.tipo, erro);
      }
    }
  }
}
