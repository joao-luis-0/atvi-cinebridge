import { ObservadorEvento } from '../observador-evento.interface';
import { EventoDominio } from '../evento-dominio';
import { AuditoriaGateway } from '../gateways/gateways.interface';


export class ObservadorAuditoria implements ObservadorEvento {
  constructor(private readonly auditoriaGateway: AuditoriaGateway) {}

  async notificar(evento: EventoDominio): Promise<void> {
    await this.auditoriaGateway.registrar({
      acao: evento.tipo,
      detalhes: this.extrairDetalhes(evento),
      timestamp: new Date()
    });
  }

  private extrairDetalhes(evento: EventoDominio): Record<string, unknown> {
    switch (evento.tipo) {
      case 'RECOMENDACAO_GERADA':
        return {
          totalAlocacoes: evento.recomendacao.alocacoes.length,
          estrategia: evento.recomendacao.estrategiaUtilizada
        };
      case 'CONVITE_ACEITO':
      case 'CONVITE_RECUSADO':
        return {
          papel: evento.alocacao.papel,
          profissionalId: evento.alocacao.profissionalSugerido.id
        };
      case 'EQUIPE_CONSENSUAL':
        return { totalAlocacoes: evento.recomendacao.alocacoes.length };
      default: {
        /* istanbul ignore next -- guarda defensiva de exaustividade, inalcançável
           enquanto EventoDominio permanecer uma união fechada dos 4 tipos tratados acima. */
        const eventoNaoTratado: never = evento;
        return { eventoNaoTratado };
      }
    }
  }
}
