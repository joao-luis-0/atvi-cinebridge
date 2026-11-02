import {
  RecomendadorAnimacao,
  RecomendadorDocumentario,
  RecomendadorPublicitario
} from '../../../src/domain/strategies/recomendadores-por-tipo';
import { FiltragemColaborativaStrategy } from '../../../src/domain/strategies/filtragem-colaborativa.strategy';
import { SimilaridadeCossenoStrategy } from '../../../src/domain/strategies/similaridade-cosseno.strategy';
import { OrcamentoReduzidoStrategy } from '../../../src/domain/strategies/orcamento-reduzido.strategy';
import { ranquearCandidatos } from '../../../src/domain/strategies/ranking';
import { ProjetoAnimacao } from '../../../src/domain/entities/projeto-animacao';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import {
  criarAvaliacao,
  criarCompetencia,
  criarHistorico,
  criarPapelObrigatorio,
  criarProfissional,
  criarProjeto
} from '../strategies/helpers';

describe('RecomendadorDocumentario', () => {
  it('combina 60% filtragem colaborativa e 40% similaridade de cosseno', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.ROTEIRISTA, 1);
    const projeto = criarProjeto(10000, [papel]);
    const profissional = criarProfissional({
      avaliacoes: [criarAvaliacao(4)],
      historicoProjetos: [criarHistorico(PapelTecnico.ROTEIRISTA)],
      competencias: [criarCompetencia('Roteirização', 0.9), criarCompetencia('Diálogos', 0.5)]
    });

    const esperado =
      0.6 * new FiltragemColaborativaStrategy().calcularScore(profissional, papel, projeto) +
      0.4 * new SimilaridadeCossenoStrategy().calcularScore(profissional, papel, projeto);

    const recomendador = new RecomendadorDocumentario();
    expect(recomendador.tipo).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_DOCUMENTARIO);
    expect(recomendador.calcularScore(profissional, papel, projeto)).toBeCloseTo(esperado);
    expect(esperado).toBeGreaterThan(0);
  });
});

describe('RecomendadorPublicitario', () => {
  it('combina 40% colaborativa, 30% cosseno e 30% orçamento reduzido', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.DIRETOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    const profissional = criarProfissional({
      valorMinimo: 2000,
      avaliacoes: [criarAvaliacao(5)],
      competencias: [criarCompetencia('Direção de atores', 1)]
    });

    const esperado =
      0.4 * new FiltragemColaborativaStrategy().calcularScore(profissional, papel, projeto) +
      0.3 * new SimilaridadeCossenoStrategy().calcularScore(profissional, papel, projeto) +
      0.3 * new OrcamentoReduzidoStrategy().calcularScore(profissional, papel, projeto);

    const recomendador = new RecomendadorPublicitario();
    expect(recomendador.tipo).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_PUBLICITARIO);
    expect(recomendador.calcularScore(profissional, papel, projeto)).toBeCloseTo(esperado);
  });

  it('o custo pesa: entre dois profissionais iguais em qualidade, o mais barato fica na frente', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    const caro = criarProfissional({ valorMinimo: 9000, avaliacoes: [criarAvaliacao(4)] });
    const barato = criarProfissional({ valorMinimo: 1500, avaliacoes: [criarAvaliacao(4)] });

    const ranking = ranquearCandidatos(new RecomendadorPublicitario(), papel, projeto, [caro, barato]);

    expect(ranking[0].profissional).toBe(barato);
  });
});

describe('RecomendadorAnimacao', () => {
  const papelEfeitos = criarPapelObrigatorio(PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS, 1);

  function projetoComSoftwares(softwares: string[]): ProjetoAnimacao {
    const projeto = new ProjetoAnimacao();
    projeto.orcamentoTotal = 50000;
    projeto.papeisObrigatorios = [papelEfeitos];
    projeto.softwaresExigidos = softwares;
    return projeto;
  }

  it('sem softwares exigidos (ou em projeto que não é de animação): 60% cosseno + 40% reputação', () => {
    const profissional = criarProfissional({
      avaliacoes: [criarAvaliacao(5)],
      competencias: [criarCompetencia('Efeitos visuais', 1)]
    });
    const cosseno = new SimilaridadeCossenoStrategy();
    const reputacao = new FiltragemColaborativaStrategy();
    const recomendador = new RecomendadorAnimacao();

    const semSoftwares = projetoComSoftwares([]);
    const projetoGenerico = criarProjeto(50000, [papelEfeitos]);

    expect(recomendador.tipo).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_ANIMACAO);
    for (const projeto of [semSoftwares, projetoGenerico]) {
      const esperado =
        0.6 * cosseno.calcularScore(profissional, papelEfeitos, projeto) +
        0.4 * reputacao.calcularScore(profissional, papelEfeitos, projeto);
      expect(recomendador.calcularScore(profissional, papelEfeitos, projeto)).toBeCloseTo(esperado);
    }
  });

  it('com softwares exigidos: 35% cosseno + 35% domínio dos softwares + 30% reputação', () => {
    const projeto = projetoComSoftwares(['Blender', 'Maya']);
    const profissional = criarProfissional({
      avaliacoes: [criarAvaliacao(4)],
      competencias: [
        criarCompetencia('Efeitos visuais', 1),
        criarCompetencia('Blender', 0.8) // não domina Maya: conta 0
      ]
    });
    const cosseno = new SimilaridadeCossenoStrategy().calcularScore(profissional, papelEfeitos, projeto);
    const reputacao = new FiltragemColaborativaStrategy().calcularScore(profissional, papelEfeitos, projeto);

    const score = new RecomendadorAnimacao().calcularScore(profissional, papelEfeitos, projeto);

    expect(score).toBeCloseTo(0.35 * cosseno + 0.35 * ((0.8 + 0) / 2) + 0.3 * reputacao);
  });

  it('quem é bem avaliado mas ainda não cadastrou competências não é descartado (score > 0)', () => {
    const projeto = projetoComSoftwares(['Blender']);
    const semCompetencias = criarProfissional({ avaliacoes: [criarAvaliacao(5)] });

    expect(new RecomendadorAnimacao().calcularScore(semCompetencias, papelEfeitos, projeto)).toBeGreaterThan(0);
  });

  it('prioriza quem domina o software do projeto, mesmo com perfil técnico idêntico', () => {
    const projeto = projetoComSoftwares(['Blender']);
    const comBlender = criarProfissional({
      competencias: [criarCompetencia('Efeitos visuais', 1), criarCompetencia('Blender', 0.9)]
    });
    const semBlender = criarProfissional({ competencias: [criarCompetencia('Efeitos visuais', 1)] });

    const ranking = ranquearCandidatos(new RecomendadorAnimacao(), papelEfeitos, projeto, [semBlender, comBlender]);

    expect(ranking[0].profissional).toBe(comBlender);
    expect(ranking[0].score).toBeGreaterThan(ranking[1].score);
  });

  it('profissional sem competências carregadas (relação indefinida) tem cobertura zero, sem lançar erro', () => {
    const projeto = projetoComSoftwares(['Blender']);
    const profissional = criarProfissional();
    profissional.competencias = undefined as unknown as typeof profissional.competencias;

    expect(new RecomendadorAnimacao().calcularScore(profissional, papelEfeitos, projeto)).toBe(0);
  });
});
