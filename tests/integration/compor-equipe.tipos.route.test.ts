import { buildApp } from '../../src/interfaces/http/server';

const local = { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' };

function corpo(tipoProjeto: string | undefined, projetoExtra: Record<string, unknown> = {}) {
  return {
    tipoProjeto,
    projeto: {
      nome: 'Obra via HTTP',
      genero: 'Drama',
      duracaoEstimadaMinutos: 15,
      orcamentoTotal: 100000,
      dataEntrega: '2026-12-01',
      tipoCaptacao: 'FICCAO',
      localizacaoFilmagem: local,
      papeisObrigatorios: [
        { papel: 'DIRETOR', peso: 0.5 },
        { papel: 'EDITOR', peso: 0.5 }
      ],
      ...projetoExtra
    },
    profissionaisDisponiveis: [
      { id: 'dir', nome: 'Diana', especialidades: ['DIRETOR'], valorMinimo: 2000, valorMaximo: 9000, localizacao: local, avaliacoes: [{ nota: 5 }] },
      { id: 'edit', nome: 'Edu', especialidades: ['EDITOR'], valorMinimo: 2000, valorMaximo: 9000, localizacao: local, avaliacoes: [{ nota: 4 }] }
    ]
  };
}

describe('POST /recomendacoes com tipo de projeto', () => {
  let logSilenciado: jest.SpyInstance;
  beforeAll(() => {
    logSilenciado = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterAll(() => logSilenciado.mockRestore());

  it('documentário: usa a fábrica de documentário e devolve métricas próprias', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: corpo('DOCUMENTARIO', { atributosEspecificos: { tema: 'Rios', entrevistados: ['A', 'B'] } })
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.estrategiaUtilizada).toBe('RECOMENDADOR_DOCUMENTARIO');
    expect(body.validacao.valido).toBe(true);
    expect(body.relatorio.metricasEspecificas).toMatchObject({ tema: 'Rios', entrevistadosPrevistos: 2 });
    await app.close();
  });

  it('animação sem informar papéis: usa os papéis do modelo e aponta os que ficaram sem alocação', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: corpo('ANIMACAO', { papeisObrigatorios: undefined })
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.estrategiaUtilizada).toBe('RECOMENDADOR_ANIMACAO');
    expect(body.validacao.valido).toBe(false);
    expect(body.validacao.erros.join(' ')).toContain('ESPECIALISTA_EFEITOS_VISUAIS');
    await app.close();
  });

  it('retorna 400 com o motivo quando um atributo específico é inválido', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: corpo('ANIMACAO', { atributosEspecificos: { tecnica: 'HOLOGRAMA' } })
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detalhe).toContain('tecnica');
    await app.close();
  });

  it('retorna 400 quando o tipo de projeto não existe (schema)', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'POST', url: '/recomendacoes', payload: corpo('REALIDADE_VIRTUAL') });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('retorna 400 para tipo PADRAO sem papéis obrigatórios', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: corpo(undefined, { papeisObrigatorios: undefined })
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detalhe).toContain('Nenhum papel obrigatório');
    await app.close();
  });
});
