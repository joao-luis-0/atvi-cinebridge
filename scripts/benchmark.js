/* Benchmark local e reproduzível: NODE_ENV=test npm run benchmark */
const { performance } = require('node:perf_hooks');
const { buildApp } = require('../dist/interfaces/http/server');
const app = buildApp();
const n = Number(process.env.BENCH_REQUESTS || 100);
const concorrencia = Number(process.env.BENCH_CONCORRENCIA || 20);
const json = {
  tipoProjeto: 'PADRAO', projeto: {
    nome: 'Teste de carga', genero: 'Documentário', duracaoEstimadaMinutos: 60,
    orcamentoTotal: 12000, dataEntrega: '2030-01-01', tipoCaptacao: 'DOCUMENTARIO',
    localizacaoFilmagem: { cidade: 'SJC', uf: 'SP', pais: 'Brasil' },
    papeisObrigatorios: [{ papel: 'EDITOR', peso: 1 }]
  }, profissionaisDisponiveis: [{
    id: '1', nome: 'Editor', especialidades: ['EDITOR'], valorMinimo: 100, valorMaximo: 200,
    localizacao: { cidade: 'SJC', uf: 'SP', pais: 'Brasil' }
  }]
};
(async () => {
  const tempos = [];
  let erros = 0;
  const inicio = performance.now();
  for (let i = 0; i < n; i += concorrencia) {
    await Promise.all(Array.from({ length: Math.min(concorrencia, n - i) }, async () => {
      const t = performance.now();
      const r = await app.inject({ method: 'POST', url: '/recomendacoes', payload: json });
      tempos.push(performance.now() - t);
      if (r.statusCode !== 201) erros++;
    }));
  }
  tempos.sort((a, b) => a - b);
  const p95 = tempos[Math.floor(0.95 * (tempos.length - 1))];
  console.log(JSON.stringify({ requisicoes: n, concorrencia, erros, p95Ms: +p95.toFixed(2), maxMs: +tempos.at(-1).toFixed(2), totalMs: +(performance.now()-inicio).toFixed(2) }, null, 2));
  await app.close();
  if (erros || p95 >= 2000) process.exitCode = 1;
})().catch((err) => { console.error(err); process.exitCode = 1; });
