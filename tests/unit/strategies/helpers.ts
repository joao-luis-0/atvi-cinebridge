import { Profissional } from '../../../src/domain/entities/profissional';
import { ProfissionalCompetencia } from '../../../src/domain/entities/profissional-competencia';
import { Competencia } from '../../../src/domain/entities/competencia';
import { Avaliacao } from '../../../src/domain/entities/avaliacao';
import { HistoricoProjetoAnterior } from '../../../src/domain/entities/historico-projeto-anterior';
import { Projeto } from '../../../src/domain/entities/projeto';
import { PapelObrigatorio } from '../../../src/domain/entities/papel-obrigatorio';
import { PapelTecnico } from '../../../src/domain/entities/enums';

export function criarCompetencia(nome: string, nivel: number): ProfissionalCompetencia {
  const competencia = new Competencia();
  competencia.nome = nome;

  const pc = new ProfissionalCompetencia();
  pc.competencia = competencia;
  pc.nivel = nivel;
  return pc;
}

export function criarAvaliacao(nota: number): Avaliacao {
  const avaliacao = new Avaliacao();
  avaliacao.nota = nota;
  return avaliacao;
}

export function criarHistorico(papel: PapelTecnico): HistoricoProjetoAnterior {
  const historico = new HistoricoProjetoAnterior();
  historico.papelDesempenhado = papel;
  historico.nomeProjeto = 'Projeto anterior';
  return historico;
}

interface OpcoesProfissional {
  id?: string;
  especialidades?: PapelTecnico[];
  competencias?: ProfissionalCompetencia[];
  avaliacoes?: Avaliacao[];
  historicoProjetos?: HistoricoProjetoAnterior[];
  valorMinimo?: number;
  valorMaximo?: number;
}

let contadorId = 0;

export function criarProfissional(opcoes: OpcoesProfissional = {}): Profissional {
  contadorId += 1;
  const profissional = new Profissional();
  profissional.id = opcoes.id ?? `profissional-teste-${contadorId}`;
  profissional.especialidades = opcoes.especialidades ?? [];
  profissional.competencias = opcoes.competencias ?? [];
  profissional.avaliacoes = opcoes.avaliacoes ?? [];
  profissional.historicoProjetos = opcoes.historicoProjetos ?? [];
  profissional.disponibilidades = [];
  profissional.valorMinimo = opcoes.valorMinimo ?? 1000;
  profissional.valorMaximo = opcoes.valorMaximo ?? 20000;
  return profissional;
}

export function criarPapelObrigatorio(papel: PapelTecnico, peso: number): PapelObrigatorio {
  const papelObrigatorio = new PapelObrigatorio();
  papelObrigatorio.papel = papel;
  papelObrigatorio.peso = peso;
  return papelObrigatorio;
}

export function criarProjeto(orcamentoTotal: number, papeis: PapelObrigatorio[]): Projeto {
  const projeto = new Projeto();
  projeto.orcamentoTotal = orcamentoTotal;
  projeto.papeisObrigatorios = papeis;
  return projeto;
}
