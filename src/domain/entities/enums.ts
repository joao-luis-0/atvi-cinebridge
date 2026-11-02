
export enum PapelTecnico {
  DIRETOR = 'DIRETOR',
  DIRETOR_DE_FOTOGRAFIA = 'DIRETOR_DE_FOTOGRAFIA',
  SONOPLASTA = 'SONOPLASTA',
  EDITOR = 'EDITOR',
  ROTEIRISTA = 'ROTEIRISTA',
  ESPECIALISTA_EFEITOS_VISUAIS = 'ESPECIALISTA_EFEITOS_VISUAIS'
}

/** Tipo de captação do projeto audiovisual. */
export enum TipoCaptacao {
  DOCUMENTARIO = 'DOCUMENTARIO',
  FICCAO = 'FICCAO',
  ANIMACAO = 'ANIMACAO'
}

/** Status de um convite enviado a um profissional para um papel. */
export enum StatusConvite {
  PENDENTE = 'PENDENTE',
  ACEITO = 'ACEITO',
  RECUSADO = 'RECUSADO'
}


export enum StatusRecomendacao {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONSENSUAL = 'CONSENSUAL',
  REAVALIACAO_SOLICITADA = 'REAVALIACAO_SOLICITADA'
}

/** Identifica qual estratégia de recomendação (Parte 3 - Strategy) foi usada. */
export enum TipoEstrategiaRecomendacao {
  SIMILARIDADE_COSSENO = 'SIMILARIDADE_COSSENO',
  FILTRAGEM_COLABORATIVA = 'FILTRAGEM_COLABORATIVA',
  ORCAMENTO_REDUZIDO = 'ORCAMENTO_REDUZIDO',
  // Recomendadores específicos por tipo de projeto (criados pelas fábricas, ATVII)
  RECOMENDADOR_DOCUMENTARIO = 'RECOMENDADOR_DOCUMENTARIO',
  RECOMENDADOR_ANIMACAO = 'RECOMENDADOR_ANIMACAO',
  RECOMENDADOR_PUBLICITARIO = 'RECOMENDADOR_PUBLICITARIO'
}

/** Tipo de projeto, usado para escolher o protótipo e (nas próximas partes) a fábrica correspondente. */
export enum TipoProjeto {
  DOCUMENTARIO = 'DOCUMENTARIO',
  ANIMACAO = 'ANIMACAO',
  PUBLICITARIO = 'PUBLICITARIO',
  /** Tipo genérico: mantém o comportamento original do microsserviço (sem regras específicas). */
  PADRAO = 'PADRAO'
}

/** Técnica de animação de um ProjetoAnimacao. */
export enum TecnicaAnimacao {
  ANIMACAO_2D = 'ANIMACAO_2D',
  ANIMACAO_3D = 'ANIMACAO_3D',
  STOP_MOTION = 'STOP_MOTION'
}
