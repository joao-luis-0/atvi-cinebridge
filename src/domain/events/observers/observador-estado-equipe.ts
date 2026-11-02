import { ObservadorEvento } from '../observador-evento.interface';
import { EventoDominio } from '../evento-dominio';
import { StatusRecomendacao } from '../../entities/enums';


export class ObservadorEstadoEquipe implements ObservadorEvento {
  constructor(private readonly aoRecusar?: (evento: EventoDominio) => void | Promise<void>) {}

  async notificar(evento: EventoDominio): Promise<void> {
    if (evento.tipo === 'CONVITE_ACEITO') {
      if (evento.recomendacao.estaConsensual()) {
        evento.recomendacao.status = StatusRecomendacao.CONSENSUAL;
      }
      return;
    }

    if (evento.tipo === 'CONVITE_RECUSADO') {
      await this.aoRecusar?.(evento);
    }
  }
}
