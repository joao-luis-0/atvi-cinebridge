import { OrcamentoReduzidoStrategy } from '../../../src/domain/strategies/orcamento-reduzido.strategy';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import { criarAvaliacao, criarProfissional, criarPapelObrigatorio, criarProjeto } from './helpers';

describe('OrcamentoReduzidoStrategy', () => {
  const estrategia = new OrcamentoReduzidoStrategy();

  it('expõe o tipo correto', () => {
    expect(estrategia.tipo).toBe(TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO);
  });

  it('dá score 0 quando o valor mínimo do profissional excede o orçamento do papel', () => {
    // orçamento total 10000, papel com peso 1 (único papel) -> orçamento do papel = 10000
    const profissional = criarProfissional({ valorMinimo: 15000 });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });

  it('dá score 0 quando a média de avaliações está abaixo do mínimo aceitável', () => {
    const profissional = criarProfissional({
      valorMinimo: 1000,
      avaliacoes: [criarAvaliacao(2)]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });

  it('favorece o profissional mais barato entre dois com a mesma qualidade', () => {
    const barato = criarProfissional({ valorMinimo: 2000, avaliacoes: [criarAvaliacao(4)] });
    const caro = criarProfissional({ valorMinimo: 8000, avaliacoes: [criarAvaliacao(4)] });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);

    const scoreBarato = estrategia.calcularScore(barato, papel, projeto);
    const scoreCaro = estrategia.calcularScore(caro, papel, projeto);

    expect(scoreBarato).toBeGreaterThan(scoreCaro);
  });

  it('rateia o orçamento proporcionalmente ao peso do papel entre múltiplos papéis', () => {
    const papelPesoAlto = criarPapelObrigatorio(PapelTecnico.DIRETOR, 0.8);
    const papelPesoBaixo = criarPapelObrigatorio(PapelTecnico.EDITOR, 0.2);
    const projeto = criarProjeto(10000, [papelPesoAlto, papelPesoBaixo]);

    // orçamento do papel de peso 0.8 = 8000; profissional pede 7000 -> cabe
    const profissional = criarProfissional({ valorMinimo: 7000 });

    expect(estrategia.calcularScore(profissional, papelPesoAlto, projeto)).toBeGreaterThan(0);
    // no papel de peso 0.2 (orçamento 2000), o mesmo profissional não cabe
    expect(estrategia.calcularScore(profissional, papelPesoBaixo, projeto)).toBe(0);
  });

  it('trata profissional sem avaliações como qualidade neutra (não descarta por falta de nota)', () => {
    const semAvaliacoes = criarProfissional({ valorMinimo: 2000 });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);

    expect(estrategia.calcularScore(semAvaliacoes, papel, projeto)).toBeGreaterThan(0);
  });

  it('dá score 0 quando o projeto não tem peso total de papéis (evita divisão por zero)', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, []); // nenhum papel obrigatório cadastrado -> pesoTotal = 0
    const profissional = criarProfissional({ valorMinimo: 1000 });

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });
});
