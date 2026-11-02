import { ObservadorEvento } from '../observador-evento.interface';
import { EventoDominio } from '../evento-dominio';
import { EmailGateway } from '../gateways/gateways.interface';


export class ObservadorEmail implements ObservadorEvento {
  constructor(private readonly emailGateway: EmailGateway) {}

  async notificar(evento: EventoDominio): Promise<void> {
    if (evento.tipo !== 'RECOMENDACAO_GERADA') {
      return; // este observador só reage a este tipo de evento
    }

    for (const alocacao of evento.recomendacao.alocacoes) {
      await this.emailGateway.enviar(
        alocacao.profissionalSugerido.nome,
        'Você foi sugerido para um projeto no cinebridge',
        `Você foi recomendado para o papel de ${alocacao.papel}. Acesse a plataforma para responder ao convite.`
      );
    }
  }
}
