import { criarEstrategiaRecomendacao } from '../../../src/domain/strategies/estrategia-recomendacao.factory';
import { SimilaridadeCossenoStrategy } from '../../../src/domain/strategies/similaridade-cosseno.strategy';
import { FiltragemColaborativaStrategy } from '../../../src/domain/strategies/filtragem-colaborativa.strategy';
import { OrcamentoReduzidoStrategy } from '../../../src/domain/strategies/orcamento-reduzido.strategy';
import {
  RecomendadorAnimacao,
  RecomendadorDocumentario,
  RecomendadorPublicitario
} from '../../../src/domain/strategies/recomendadores-por-tipo';
import { ranquearCandidatos } from '../../../src/domain/strategies/ranking';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import { criarAvaliacao, criarProfissional, criarPapelObrigatorio, criarProjeto } from './helpers';

describe('criarEstrategiaRecomendacao (factory)', () => {
  it('cria a instância correta para cada tipo', () => {
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.SIMILARIDADE_COSSENO))
      .toBeInstanceOf(SimilaridadeCossenoStrategy);
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA))
      .toBeInstanceOf(FiltragemColaborativaStrategy);
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO))
      .toBeInstanceOf(OrcamentoReduzidoStrategy);
  });

  it('cria os recomendadores específicos por tipo de projeto (ATVII)', () => {
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.RECOMENDADOR_DOCUMENTARIO))
      .toBeInstanceOf(RecomendadorDocumentario);
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.RECOMENDADOR_ANIMACAO))
      .toBeInstanceOf(RecomendadorAnimacao);
    expect(criarEstrategiaRecomendacao(TipoEstrategiaRecomendacao.RECOMENDADOR_PUBLICITARIO))
      .toBeInstanceOf(RecomendadorPublicitario);
  });
});

describe('ranquearCandidatos', () => {
  it('ordena os candidatos do maior para o menor score e numera a posição', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);

    const pior = criarProfissional({ valorMinimo: 1000 }); // sem avaliação -> score 0 na colaborativa
    const melhor = criarProfissional({ valorMinimo: 1000, avaliacoes: [criarAvaliacao(5)] });

    const estrategia = new FiltragemColaborativaStrategy();
    const ranking = ranquearCandidatos(estrategia, papel, projeto, [pior, melhor]);

    expect(ranking[0].profissional).toBe(melhor);
    expect(ranking[0].posicao).toBe(1);
    expect(ranking[1].profissional).toBe(pior);
    expect(ranking[1].posicao).toBe(2);
  });
});

describe('troca de estratégia altera o resultado da recomendação', () => {
  it('estrategias diferentes produzem vencedores diferentes para o mesmo cenário', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]); // orçamento do papel = 10000 (único papel, peso 1)

    // Caro, porém excelente reputação: acima do orçamento do papel (12000 > 10000)
    const caroBemAvaliado = criarProfissional({
      valorMinimo: 12000,
      avaliacoes: [criarAvaliacao(5), criarAvaliacao(5)]
    });

    // Barato e com qualidade mediana, mas aceitável
    const baratoQualidadeMediana = criarProfissional({
      valorMinimo: 2000,
      avaliacoes: [criarAvaliacao(4)]
    });

    const candidatos = [caroBemAvaliado, baratoQualidadeMediana];

    const rankingColaborativa = ranquearCandidatos(
      new FiltragemColaborativaStrategy(),
      papel,
      projeto,
      candidatos
    );
    const rankingOrcamento = ranquearCandidatos(
      new OrcamentoReduzidoStrategy(),
      papel,
      projeto,
      candidatos
    );

    // Filtragem colaborativa: reputação pesa mais, o caro bem avaliado vence
    expect(rankingColaborativa[0].profissional).toBe(caroBemAvaliado);

    // Orçamento reduzido: o caro bem avaliado é descartado (score 0, acima do orçamento do papel);
    // o barato de qualidade mediana vence — resultado oposto ao da colaborativa
    expect(rankingOrcamento.find((r) => r.profissional === caroBemAvaliado)?.score).toBe(0);
    expect(rankingOrcamento[0].profissional).toBe(baratoQualidadeMediana);
    expect(rankingOrcamento[0].profissional).not.toBe(rankingColaborativa[0].profissional);
  });
});
