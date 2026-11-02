import { PapelTecnico, TipoCaptacao, TipoEstrategiaRecomendacao, TipoProjeto } from '../../domain/entities/enums';

export interface LocalizacaoDTO {
  cidade: string;
  uf: string;
  pais: string;
  latitude?: number;
  longitude?: number;
}

export interface PapelObrigatorioDTO {
  papel: PapelTecnico;
  peso: number;
}

export type ServicoProjetoDTO =
  | { tipo: 'ATOMICO'; nome: string; custo: number; prazoDias: number; papel: PapelTecnico }
  | { tipo: 'PACOTE'; nome: string; servicos: ServicoProjetoDTO[] };

export interface ProjetoInputDTO {
  nome: string;
  /** ATVIII: estrutura opcional de serviços para projetos existentes continuarem funcionando. */
  servicoPrincipal?: ServicoProjetoDTO;
  genero: string;
  duracaoEstimadaMinutos: number;
  orcamentoTotal: number;
  dataEntrega: string;
  tipoCaptacao: TipoCaptacao;
  localizacaoFilmagem: LocalizacaoDTO;
  papeisObrigatorios?: PapelObrigatorioDTO[];
  atributosEspecificos?: Record<string, unknown>;
}

export interface CompetenciaProfissionalDTO {
  nome: string;
  nivel: number;
}

export interface AvaliacaoDTO {
  nota: number;
}

export interface HistoricoProjetoDTO {
  nomeProjeto: string;
  papelDesempenhado: PapelTecnico;
  dataConclusao: string;
}

export interface DisponibilidadeDTO {
  inicio: string;
  fim: string;
}

export interface ProfissionalInputDTO {
  id: string;
  nome: string;
  especialidades: PapelTecnico[];
  valorMinimo: number;
  valorMaximo: number;
  localizacao: LocalizacaoDTO;
  competencias?: CompetenciaProfissionalDTO[];
  avaliacoes?: AvaliacaoDTO[];
  historicoProjetos?: HistoricoProjetoDTO[];
  disponibilidades?: DisponibilidadeDTO[];
}

export type TipoOrquestrador = 'PADRAO' | 'MARGEM_SEGURANCA';

export type DecoradorRecomendacao = 'cache' | 'auditoria' | 'compressao';

export interface ComporEquipeRequestDTO {
  decoradores?: DecoradorRecomendacao[];
  projeto: ProjetoInputDTO;
  profissionaisDisponiveis: ProfissionalInputDTO[];
  consultarProfissionaisExternos?: boolean;
  filtroProfissionais?: string;
  estrategia?: TipoEstrategiaRecomendacao;
  orquestrador?: TipoOrquestrador;
  tipoProjeto?: TipoProjeto;
}
