import {
  EmailGateway,
  MensagensInternasGateway,
  AuditoriaGateway,
  RegistroAuditoria
} from '../../domain/events/gateways/gateways.interface';


export class ConsoleEmailGateway implements EmailGateway {
  readonly enviados: { destinatario: string; assunto: string; corpo: string }[] = [];

  enviar(destinatario: string, assunto: string, corpo: string): void {
    this.enviados.push({ destinatario, assunto, corpo });
    console.log(`[email] para=${destinatario} assunto="${assunto}"`);
  }
}

export class ConsoleMensagensInternasGateway implements MensagensInternasGateway {
  readonly enviadas: { destinatarioId: string; mensagem: string }[] = [];

  enviar(destinatarioId: string, mensagem: string): void {
    this.enviadas.push({ destinatarioId, mensagem });
    console.log(`[mensagem-interna] para=${destinatarioId} "${mensagem}"`);
  }
}

export class ConsoleAuditoriaGateway implements AuditoriaGateway {
  readonly registros: RegistroAuditoria[] = [];

  registrar(entrada: RegistroAuditoria): void {
    this.registros.push(entrada);
    console.log(`[auditoria] ${entrada.acao}`, entrada.detalhes);
  }
}
