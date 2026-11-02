import { buildApp } from '../../src/interfaces/http/server';

describe('Servidor HTTP - setup inicial', () => {
  it('GET /health deve retornar status ok', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'cinebridge-recomendacao'
    });

    await app.close();
  });
});
