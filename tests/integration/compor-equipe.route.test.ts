import { buildApp } from '../../src/interfaces/http/server';

function corpoValido() {
  return {
    projeto: {
      nome: 'Curta-metragem de ficção',
      genero: 'Drama',
      duracaoEstimadaMinutos: 90,
      orcamentoTotal: 20000,
      dataEntrega: '2026-12-01',
      tipoCaptacao: 'FICCAO',
      localizacaoFilmagem: { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
      papeisObrigatorios: [
        { papel: 'DIRETOR', peso: 0.6 },
        { papel: 'EDITOR', peso: 0.4 }
      ]
    },
    profissionaisDisponiveis: [
      {
        id: 'prof-ana',
        nome: 'Ana',
        especialidades: ['DIRETOR'],
        valorMinimo: 5000,
        valorMaximo: 15000,
        localizacao: { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
        avaliacoes: [{ nota: 5 }]
      },
      {
        id: 'prof-bruno',
        nome: 'Bruno',
        especialidades: ['EDITOR'],
        valorMinimo: 3000,
        valorMaximo: 10000,
        localizacao: { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
        avaliacoes: [{ nota: 4 }]
      }
    ],
    estrategia: 'FILTRAGEM_COLABORATIVA'
  };
}

describe('POST /recomendacoes', () => {
  it('retorna 201 com a equipe recomendada, validação e relatório', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: corpoValido()
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();

    expect(body.estrategiaUtilizada).toBe('FILTRAGEM_COLABORATIVA');
    expect(body.alocacoes).toHaveLength(2);

    const alocacaoDiretor = body.alocacoes.find((a: { papel: string }) => a.papel === 'DIRETOR');
    const alocacaoEditor = body.alocacoes.find((a: { papel: string }) => a.papel === 'EDITOR');
    expect(alocacaoDiretor.profissionalId).toBe('prof-ana');
    expect(alocacaoEditor.profissionalId).toBe('prof-bruno');

    expect(body.validacao.valido).toBe(true);
    expect(body.relatorio.nomeProjeto).toBe('Curta-metragem de ficção');
    expect(body.relatorio.custoTotalAlocado).toBe(8000);

    await app.close();
  });

  it('retorna 400 quando o corpo da requisição não respeita o schema', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/recomendacoes',
      payload: { projeto: {} } 
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });

  it('gera recomendação parcial (papel sem alocação) quando nenhum candidato é elegível', async () => {
    const app = buildApp();
    const corpo = corpoValido();
    corpo.profissionaisDisponiveis = corpo.profissionaisDisponiveis.filter(
      (p) => p.id !== 'prof-bruno'
    );

    const response = await app.inject({ method: 'POST', url: '/recomendacoes', payload: corpo });

    expect(response.statusCode).toBe(201);
    const body = response.json();

    expect(body.alocacoes).toHaveLength(1);
    expect(body.validacao.valido).toBe(false); 

    await app.close();
  });
});
