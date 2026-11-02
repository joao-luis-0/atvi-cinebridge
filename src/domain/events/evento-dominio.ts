import { Recomendacao } from '../entities/recomendacao';
import { AlocacaoRecomendada } from '../entities/alocacao-recomendada';

export interface RecomendacaoGeradaEvento {
  tipo: 'RECOMENDACAO_GERADA';
  recomendacao: Recomendacao;
}

export interface ConviteAceitoEvento {
  tipo: 'CONVITE_ACEITO';
  recomendacao: Recomendacao;
  alocacao: AlocacaoRecomendada;
}

export interface ConviteRecusadoEvento {
  tipo: 'CONVITE_RECUSADO';
  recomendacao: Recomendacao;
  alocacao: AlocacaoRecomendada;
}

export interface EquipeConsensualEvento {
  tipo: 'EQUIPE_CONSENSUAL';
  recomendacao: Recomendacao;
}


export type EventoDominio =
  | RecomendacaoGeradaEvento
  | ConviteAceitoEvento
  | ConviteRecusadoEvento
  | EquipeConsensualEvento;
