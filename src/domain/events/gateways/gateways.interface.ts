/** Porta para o serviço de envio de e-mails, implementada na infraestrutura. */
export interface EmailGateway {
  enviar(destinatario: string, assunto: string, corpo: string): void | Promise<void>;
}

/** Porta para o serviço de mensagens internas da plataforma. */
export interface MensagensInternasGateway {
  enviar(destinatarioId: string, mensagem: string): void | Promise<void>;
}

/** Uma entrada estruturada de log de auditoria. */
export interface RegistroAuditoria {
  acao: string;
  detalhes: Record<string, unknown>;
  timestamp: Date;
}

/** Porta para o módulo de registro de auditoria (logs estruturados, requisito não funcional). */
export interface AuditoriaGateway {
  registrar(entrada: RegistroAuditoria): void | Promise<void>;
}
