
export function similaridadeCosseno(vetorA: number[], vetorB: number[]): number {
  if (vetorA.length !== vetorB.length) {
    throw new Error('Vetores de dimensões diferentes não podem ser comparados por similaridade de cosseno.');
  }

  const produtoEscalar = vetorA.reduce((soma, valor, indice) => soma + valor * vetorB[indice], 0);
  const normaA = Math.sqrt(vetorA.reduce((soma, valor) => soma + valor * valor, 0));
  const normaB = Math.sqrt(vetorB.reduce((soma, valor) => soma + valor * valor, 0));

  if (normaA === 0 || normaB === 0) {
    return 0;
  }

  return produtoEscalar / (normaA * normaB);
}


export function vetorizarCompetencias(
  competenciasDoProfissional: Map<string, number>,
  dimensoes: string[]
): number[] {
  return dimensoes.map((nomeCompetencia) => competenciasDoProfissional.get(nomeCompetencia) ?? 0);
}
