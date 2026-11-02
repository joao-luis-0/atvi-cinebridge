import { SimilaridadeCossenoStrategy } from '../../../src/domain/strategies/similaridade-cosseno.strategy';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import { criarCompetencia, criarProfissional, criarPapelObrigatorio, criarProjeto } from './helpers';

describe('SimilaridadeCossenoStrategy', () => {
  const estrategia = new SimilaridadeCossenoStrategy();

  it('expõe o tipo correto', () => {
    expect(estrategia.tipo).toBe(TipoEstrategiaRecomendacao.SIMILARIDADE_COSSENO);
  });

  it('dá score alto para profissional com as competências-chave do papel em nível máximo', () => {
    const profissional = criarProfissional({
      competencias: [
        criarCompetencia('Roteirização', 1),
        criarCompetencia('Estrutura narrativa', 1),
        criarCompetencia('Diálogos', 1)
      ]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.ROTEIRISTA, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBeCloseTo(1);
  });

  it('dá score 0 para profissional sem nenhuma das competências-chave do papel', () => {
    const profissional = criarProfissional({
      competencias: [criarCompetencia('Culinária', 1)]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.ROTEIRISTA, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });

  it('dá score maior para quem tem mais competências-chave relevantes ao papel', () => {
    const especialista = criarProfissional({
      competencias: [
        criarCompetencia('Design de som', 0.9),
        criarCompetencia('Captação de áudio', 0.9),
        criarCompetencia('Mixagem', 0.9)
      ]
    });
    const generalista = criarProfissional({
      competencias: [criarCompetencia('Design de som', 0.9)]
    });
    const papel = criarPapelObrigatorio(PapelTecnico.SONOPLASTA, 1);
    const projeto = criarProjeto(50000, [papel]);

    const scoreEspecialista = estrategia.calcularScore(especialista, papel, projeto);
    const scoreGeneralista = estrategia.calcularScore(generalista, papel, projeto);

    expect(scoreEspecialista).toBeGreaterThan(scoreGeneralista);
  });

  it('funciona mesmo quando competencias vem undefined (relação não carregada)', () => {
    const profissional = criarProfissional();
    profissional.competencias = undefined as unknown as typeof profissional.competencias;
    const papel = criarPapelObrigatorio(PapelTecnico.ROTEIRISTA, 1);
    const projeto = criarProjeto(50000, [papel]);

    expect(estrategia.calcularScore(profissional, papel, projeto)).toBe(0);
  });
});
