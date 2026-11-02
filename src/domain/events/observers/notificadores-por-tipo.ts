import { ObservadorEvento } from '../observador-evento.interface';
import { EventoDominio } from '../evento-dominio';
import { EmailGateway, MensagensInternasGateway } from '../gateways/gateways.interface';
import { ObservadorEmail } from './observador-email';
import { ObservadorMensagensInternas } from './observador-mensagens-internas';

export abstract class NotificadorProjeto implements ObservadorEvento {
  protected constructor(
    private readonly email: EmailGateway,
    private readonly mensagens: MensagensInternasGateway,
    private readonly rotulo: string
  ) {}

  async notificar(evento: EventoDominio): Promise<void> {
    if (evento.tipo !== 'RECOMENDACAO_GERADA') {
      return;
    }

    const { projeto, alocacoes } = evento.recomendacao;
    const detalhe = projeto.descricaoEspecifica();

    for (const alocacao of alocacoes.filter((a) => !a.substituida)) {
      const corpo =
        `Você foi recomendado para o papel de ${alocacao.papel} no ${this.rotulo} "${projeto.nome}".` +
        `${detalhe ? ` ${detalhe}` : ''} Acesse a plataforma para responder ao convite.`;

      await this.email.enviar(
        alocacao.profissionalSugerido.nome,
        `Convite para ${this.rotulo}: ${projeto.nome}`,
        corpo
      );
      await this.mensagens.enviar(alocacao.profissionalSugerido.id, corpo);
    }
  }
}

export class NotificadorDocumentario extends NotificadorProjeto {
  constructor(email: EmailGateway, mensagens: MensagensInternasGateway) {
    super(email, mensagens, 'documentário');
  }
}

export class NotificadorAnimacao extends NotificadorProjeto {
  constructor(email: EmailGateway, mensagens: MensagensInternasGateway) {
    super(email, mensagens, 'projeto de animação');
  }
}

export class NotificadorPublicitario extends NotificadorProjeto {
  constructor(email: EmailGateway, mensagens: MensagensInternasGateway) {
    super(email, mensagens, 'filme publicitário');
  }
}

/** Notificador do tipo genérico: mantém o comportamento original (e-mail e mensagem interna padrão). */
export class NotificadorPadrao implements ObservadorEvento {
  private readonly observadores: ObservadorEvento[];

  constructor(email: EmailGateway, mensagens: MensagensInternasGateway) {
    this.observadores = [new ObservadorEmail(email), new ObservadorMensagensInternas(mensagens)];
  }

  async notificar(evento: EventoDominio): Promise<void> {
    for (const observador of this.observadores) {
      await observador.notificar(evento);
    }
  }
}
