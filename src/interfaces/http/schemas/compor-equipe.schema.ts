const localizacaoSchema = {
  type: 'object',
  required: ['cidade', 'uf', 'pais'],
  properties: {
    cidade: { type: 'string' },
    uf: { type: 'string', minLength: 2, maxLength: 2 },
    pais: { type: 'string' },
    latitude: { type: 'number' },
    longitude: { type: 'number' }
  }
};

const papeisEnum = [
  'DIRETOR',
  'DIRETOR_DE_FOTOGRAFIA',
  'SONOPLASTA',
  'EDITOR',
  'ROTEIRISTA',
  'ESPECIALISTA_EFEITOS_VISUAIS'
];

const papelObrigatorioSchema = {
  type: 'object',
  required: ['papel', 'peso'],
  properties: {
    papel: { type: 'string', enum: papeisEnum },
    peso: { type: 'number', minimum: 0, maximum: 1 }
  }
};

const projetoSchema = {
  type: 'object',
  required: [
    'nome',
    'genero',
    'duracaoEstimadaMinutos',
    'orcamentoTotal',
    'dataEntrega',
    'tipoCaptacao',
    'localizacaoFilmagem'
  ],
  properties: {
    nome: { type: 'string' },
    genero: { type: 'string' },
    duracaoEstimadaMinutos: { type: 'integer', minimum: 1 },
    orcamentoTotal: { type: 'number', minimum: 0 },
    dataEntrega: { type: 'string', format: 'date' },
    tipoCaptacao: { type: 'string', enum: ['DOCUMENTARIO', 'FICCAO', 'ANIMACAO'] },
    localizacaoFilmagem: localizacaoSchema,
    papeisObrigatorios: { type: 'array', minItems: 1, items: papelObrigatorioSchema },
    atributosEspecificos: { type: 'object' },
    servicoPrincipal: { $ref: '#/$defs/servicoProjeto' }
  }
};

const profissionalSchema = {
  type: 'object',
  required: ['id', 'nome', 'especialidades', 'valorMinimo', 'valorMaximo', 'localizacao'],
  properties: {
    id: { type: 'string' },
    nome: { type: 'string' },
    especialidades: { type: 'array', items: { type: 'string', enum: papeisEnum } },
    valorMinimo: { type: 'number', minimum: 0 },
    valorMaximo: { type: 'number', minimum: 0 },
    localizacao: localizacaoSchema,
    competencias: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nome', 'nivel'],
        properties: {
          nome: { type: 'string' },
          nivel: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    },
    avaliacoes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nota'],
        properties: { nota: { type: 'number', minimum: 0, maximum: 5 } }
      }
    },
    historicoProjetos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nomeProjeto', 'papelDesempenhado', 'dataConclusao'],
        properties: {
          nomeProjeto: { type: 'string' },
          papelDesempenhado: { type: 'string', enum: papeisEnum },
          dataConclusao: { type: 'string', format: 'date' }
        }
      }
    },
    disponibilidades: {
      type: 'array',
      items: {
        type: 'object',
        required: ['inicio', 'fim'],
        properties: {
          inicio: { type: 'string', format: 'date' },
          fim: { type: 'string', format: 'date' }
        }
      }
    }
  }
};

export const comporEquipeBodySchema = {
  type: 'object',
  $defs: {
    servicoProjeto: {
      oneOf: [
        {
          type: 'object', additionalProperties: false,
          required: ['tipo', 'nome', 'custo', 'prazoDias', 'papel'],
          properties: {
            tipo: { const: 'ATOMICO' }, nome: { type: 'string', minLength: 1 },
            custo: { type: 'number', minimum: 0 }, prazoDias: { type: 'integer', minimum: 0 },
            papel: { type: 'string', enum: papeisEnum }
          }
        },
        {
          type: 'object', additionalProperties: false,
          required: ['tipo', 'nome', 'servicos'],
          properties: {
            tipo: { const: 'PACOTE' }, nome: { type: 'string', minLength: 1 },
            servicos: { type: 'array', minItems: 1, items: { $ref: '#/$defs/servicoProjeto' } }
          }
        }
      ]
    }
  },
  required: ['projeto', 'profissionaisDisponiveis'],
  properties: {
    projeto: projetoSchema,
    decoradores: {
      type: 'array', uniqueItems: true, maxItems: 3,
      items: { type: 'string', enum: ['cache', 'auditoria', 'compressao'] }
    },
    profissionaisDisponiveis: { type: 'array', items: profissionalSchema },
    consultarProfissionaisExternos: { type: 'boolean' },
    filtroProfissionais: { type: 'string' },
    estrategia: {
      type: 'string',
      enum: ['SIMILARIDADE_COSSENO', 'FILTRAGEM_COLABORATIVA', 'ORCAMENTO_REDUZIDO']
    },
    orquestrador: { type: 'string', enum: ['PADRAO', 'MARGEM_SEGURANCA'] },
    tipoProjeto: { type: 'string', enum: ['DOCUMENTARIO', 'ANIMACAO', 'PUBLICITARIO', 'PADRAO'] }
  }
};
