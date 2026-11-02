import type { Projeto } from '../entities/projeto';
import type { PapelObrigatorio } from '../entities/papel-obrigatorio';
import type { Profissional } from '../entities/profissional';
import type { Recomendacao } from '../entities/recomendacao';
import type { AlocacaoRecomendada } from '../entities/alocacao-recomendada';
import type { ResultadoValidacao } from './validacao/validacao-consistencia.visitor';
import type { RelatorioProdutor } from './relatorio/gerador-relatorio.visitor';


export interface Visitante {
  visitarProjeto(projeto: Projeto): void;
  visitarPapelObrigatorio(papel: PapelObrigatorio): void;
  visitarProfissional(profissional: Profissional): void;
  visitarRecomendacao(recomendacao: Recomendacao): void;
  visitarAlocacaoRecomendada(alocacao: AlocacaoRecomendada): void;
}

export interface VisitanteValidador extends Visitante {
  obterResultado(): ResultadoValidacao;
}

export interface VisitanteRelatorio extends Visitante {
  obterResultado(): RelatorioProdutor;
}
