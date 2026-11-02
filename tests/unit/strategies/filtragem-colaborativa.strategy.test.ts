import { FiltragemColaborativaStrategy } from '../../../src/domain/strategies/filtragem-colaborativa.strategy';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import {
  criarAvaliacao,
  criarHistorico,
  criarProfissional,
  criarPapelObrigatorio,
  criarProjeto
} from './helpers';

describe('FiltragemColaborativaStrategy', () => {
  const estrategia = new FiltragemColaborativaStrategy();

  it('expõe o tipo correto', () => {
    expect(estrategia.tipo).toBe(TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA);
  });

  it('dá score 0 para profissional sem avaliações e sem experiência no papel', () => {
    const profissional = criarProfissional();
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });

  it('dá score máximo para profissional com notas 5 e experiência ampla no papel', () => {
    const profissional = criarProfissional({
      avaliacoes: [criarAvaliacao(5), criarAvaliacao(5)],
      historicoProjetos: [
        criarHistorico(PapelTecnico.EDITOR),
        criarHistorico(PapelTecnico.EDITOR),
        criarHistorico(PapelTecnico.EDITOR),
        criarHistorico(PapelTecnico.EDITOR),
        criarHistorico(PapelTecnico.EDITOR)
      ]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBeCloseTo(1);
  });

  it('experiência em outro papel não conta para o fator de experiência deste papel', () => {
    const profissional = criarProfissional({
      avaliacoes: [criarAvaliacao(5)],
      historicoProjetos: [criarHistorico(PapelTecnico.DIRETOR)]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(50000, [papel]);

    // apenas o componente de reputação (0.7 * 1.0) deve contar
    expect(estrategia.calcularScore(profissional, papel, projeto)).toBeCloseTo(0.7);
  });

  it('funciona mesmo quando historicoProjetos vem undefined (relação não carregada)', () => {
    const profissional = criarProfissional({ avaliacoes: [criarAvaliacao(4)] });
    profissional.historicoProjetos = undefined as unknown as typeof profissional.historicoProjetos;
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBeCloseTo(0.7 * (4 / 5));
  });
});
