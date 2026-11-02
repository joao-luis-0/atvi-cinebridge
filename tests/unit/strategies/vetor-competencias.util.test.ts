import { similaridadeCosseno, vetorizarCompetencias } from '../../../src/domain/strategies/vetor-competencias.util';

describe('similaridadeCosseno', () => {
  it('retorna 1 para vetores idênticos', () => {
    expect(similaridadeCosseno([1, 1, 1], [1, 1, 1])).toBeCloseTo(1);
  });

  it('retorna 0 para vetores ortogonais', () => {
    expect(similaridadeCosseno([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('retorna 0 quando um dos vetores é todo zero (evita divisão por zero)', () => {
    expect(similaridadeCosseno([0, 0, 0], [1, 1, 1])).toBe(0);
  });

  it('lança erro para vetores de dimensões diferentes', () => {
    expect(() => similaridadeCosseno([1, 2], [1, 2, 3])).toThrow();
  });
});

describe('vetorizarCompetencias', () => {
  it('preenche com 0 as dimensões que o profissional não possui', () => {
    const niveis = new Map([['Roteirização', 0.9]]);
    const vetor = vetorizarCompetencias(niveis, ['Roteirização', 'Diálogos', 'Estrutura narrativa']);

    expect(vetor).toEqual([0.9, 0, 0]);
  });
});
