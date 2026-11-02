import { PapelTecnico, TipoCaptacao } from '../entities/enums';

export interface DadosProjeto {
  nome: string;
  genero: string;
  duracaoEstimadaMinutos: number;
  orcamentoTotal: number;
  dataEntrega: string | Date;
  tipoCaptacao: TipoCaptacao;
  localizacaoFilmagem: {
    cidade: string;
    uf: string;
    pais: string;
    latitude?: number;
    longitude?: number;
  };
  papeisObrigatorios?: Array<{ papel: PapelTecnico; peso: number }>;
  atributosEspecificos?: Record<string, unknown>;
}
