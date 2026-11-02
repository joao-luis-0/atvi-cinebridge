import { gunzipSync } from 'zlib';
import { buildApp } from '../../src/interfaces/http/server';
import { criarSistemaRecomendacaoPadrao } from '../../src/application/sistema-recomendacao';
import { GerenciadorNotificacoes } from '../../src/application/gerenciador-notificacoes';
import { AdaptadorGoogleCloud, AdaptadorPagSeguro, AdaptadorInterno, AdaptadorS3, AdaptadorStripe } from '../../src/infrastructure/adapters/adaptadores';

function corpo() {
  return {
    tipoProjeto: 'PADRAO',
    projeto: {
      nome: 'Filme', genero: 'Drama', duracaoEstimadaMinutos: 50,
      orcamentoTotal: 12000, dataEntrega: '2030-01-01', tipoCaptacao: 'FICCAO',
      localizacaoFilmagem: { cidade: 'São José dos Campos', uf: 'SP', pais: 'Brasil' },
      papeisObrigatorios: [{ papel: 'EDITOR', peso: 1 }],
      servicoPrincipal: {
        tipo: 'PACOTE', nome: 'Pós-produção', servicos: [
          { tipo: 'ATOMICO', nome: 'Edição', custo: 700, prazoDias: 4, papel: 'EDITOR' },
          { tipo: 'PACOTE', nome: 'Áudio', servicos: [
            { tipo: 'ATOMICO', nome: 'Mixagem', custo: 300, prazoDias: 2, papel: 'SONOPLASTA' }
          ] }
        ]
      }
    },
    profissionaisDisponiveis: [
      { id: 'ed1', nome: 'Joana', especialidades: ['EDITOR'], valorMinimo: 1000, valorMaximo: 4000,
        localizacao: { cidade: 'São José dos Campos', uf: 'SP', pais: 'Brasil' } }
    ],
    decoradores: ['cache', 'auditoria', 'compressao']
  };
}

describe('ATVIII - integração real do HTTP e serviços', () => {
  it('aceita Composite aninhado e decoradores selecionados em requisições consecutivas', async () => {
    const app = buildApp();
    try {
      const first = await app.inject({ method: 'POST', url: '/recomendacoes', payload: corpo() });
      const second = await app.inject({ method: 'POST', url: '/recomendacoes', payload: corpo() });
      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(201);
      expect(second.json()).toEqual(first.json());
      expect(first.json().alocacoes).toHaveLength(1);
    } finally { await app.close(); }
  });

  it('envia gzip válido quando o consumidor solicita e o decorator está habilitado', async () => {
    const app = buildApp();
    try {
      const response = await app.inject({
        method: 'POST', url: '/recomendacoes', payload: corpo(),
        headers: { 'accept-encoding': 'gzip' }
      });
      expect(response.statusCode).toBe(201);
      expect(response.headers['content-encoding']).toBe('gzip');
      const bytes = response.rawPayload;
      const body = JSON.parse(gunzipSync(bytes).toString('utf8'));
      expect(body.alocacoes[0].profissionalId).toBe('ed1');
    } finally { await app.close(); }
  });

  it('rejeita serviços estruturalmente inválidos no schema', async () => {
    const app = buildApp();
    try {
      const invalid = corpo();
      invalid.projeto.servicoPrincipal.servicos[0].custo = -3;
      const response = await app.inject({ method: 'POST', url: '/recomendacoes', payload: invalid });
      expect(response.statusCode).toBe(400);
    } finally { await app.close(); }
  });

  it('troca serviços externos sem alterar o núcleo de recomendação', async () => {
    const sistema = criarSistemaRecomendacaoPadrao(new GerenciadorNotificacoes());
    const diferentes = [new AdaptadorS3(), new AdaptadorGoogleCloud()];
    for (const armazenamento of diferentes) {
      const id = await armazenamento.salvarArquivo(Buffer.from('roteiro de filme'), { nome: 'roteiro' });
      expect((await armazenamento.recuperarArquivo(id)).toString()).toBe('roteiro de filme');
    }
    for (const pagamento of [new AdaptadorStripe(), new AdaptadorPagSeguro()]) {
      const id = await pagamento.efetuarPagamento(250, 'produtor', 'editor');
      expect(await pagamento.verificarPagamento(id)).toBe(true);
    }
    expect(sistema.adaptadorProfissional).toBeInstanceOf(AdaptadorInterno);
    const alternativo = criarSistemaRecomendacaoPadrao(new GerenciadorNotificacoes(), {
      armazenamento: new AdaptadorGoogleCloud(), pagamento: new AdaptadorPagSeguro()
    });
    const idArquivo = await alternativo.salvarArquivo(Buffer.from('cena'), { nome: 'cena' });
    expect((await alternativo.recuperarArquivo(idArquivo)).toString()).toBe('cena');
    const idPagamento = await alternativo.efetuarPagamento(100, 'produtor', 'profissional');
    expect(await alternativo.verificarPagamento(idPagamento)).toBe(true);
  });
});
