import Fastify from 'fastify';
import { registrarRotaComporEquipe } from '../../src/interfaces/http/routes/compor-equipe.route';
import { ComporEquipeService } from '../../src/application/compor-equipe.service';

describe('POST /recomendacoes - tratamento de erro', () => {
  it('retorna 400 com detalhe do erro quando o service falha', async () => {
    const servicoComFalha = {
      executar: jest.fn().mockRejectedValue(new Error('falha simulada na composição'))
    } as unknown as ComporEquipeService;

    const app = Fastify();
    registrarRotaComporEquipe(app, servicoComFalha);
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: {
        projeto: {
          nome: 'X',
          genero: 'X',
          duracaoEstimadaMinutos: 10,
          orcamentoTotal: 1000,
          dataEntrega: '2026-12-01',
          tipoCaptacao: 'FICCAO',
          localizacaoFilmagem: { cidade: 'X', uf: 'SP', pais: 'Brasil' },
          papeisObrigatorios: [{ papel: 'DIRETOR', peso: 1 }]
        },
        profissionaisDisponiveis: [],
        estrategia: 'FILTRAGEM_COLABORATIVA'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().detalhe).toBe('falha simulada na composição');

    await app.close();
  });
});
