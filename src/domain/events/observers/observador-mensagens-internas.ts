import { ObservadorEvento } from '../observador-evento.interface';
import { EventoDominio } from '../evento-dominio';
import { MensagensInternasGateway } from '../gateways/gateways.interface';


export class ObservadorMensagensInternas implements ObservadorEvento {
  constructor(private readonly mensagensGateway: MensagensInternasGateway) {}

  async notificar(evento: EventoDominio): Promise<void> {
    if (evento.tipo !== 'RECOMENDACAO_GERADA') {
      return;
    }

    for (const alocacao of evento.recomendacao.alocacoes) {
      await this.mensagensGateway.enviar(
        alocacao.profissionalSugerido.id,
        `Você recebeu um novo convite para o papel de ${alocacao.papel}.`
      );
    }
  }
}
