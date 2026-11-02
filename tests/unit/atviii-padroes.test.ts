import { PapelTecnico } from '../../src/domain/entities/enums';
import { PacoteServico, ServicoAtomico } from '../../src/domain/services/servico-projeto';
import { AdaptadorS3, AdaptadorGoogleCloud, AdaptadorStripe, AdaptadorPagSeguro, AdaptadorLinkedIn, AdaptadorInterno, CadastroProfissionalInternoSimulado, ApiProfissionalExterna } from '../../src/infrastructure/adapters/adaptadores';
import { AuditoriaDecorator, CacheDecorator, CompressaoDecorator, montarDecoradores, RecomendacaoStrategy } from '../../src/application/decorators/recomendacao-decorators';

describe('ATVIII - Composite', () => {
  it('calcula custo e prazo recursivamente e valida papéis', () => {
    const edicao = new ServicoAtomico('Edição', 500, 5, PapelTecnico.EDITOR);
    const som = new ServicoAtomico('Som', 300, 3, PapelTecnico.SONOPLASTA);
    const pacote = new PacoteServico('Pós-produção', [edicao, new PacoteServico('Áudio', [som])]);
    expect(pacote.calcularCusto()).toBe(800);
    expect(pacote.obterPrazo()).toBe(5);
    expect(pacote.validar()).toBe(true);
    expect(pacote.clonar().calcularCusto()).toBe(800);
    expect(() => (pacote.listarSubservicos()[1] as PacoteServico).adicionar(pacote)).toThrow();
  });
});
describe('ATVIII - Adapter', () => {
  it.each([new AdaptadorS3(), new AdaptadorGoogleCloud()])('troca provedor de arquivos', async (adaptador) => {
    const id = await adaptador.salvarArquivo(Buffer.from('roteiro'), { nome: 'roteiro' });
    expect((await adaptador.recuperarArquivo(id)).toString()).toBe('roteiro');
    expect(await adaptador.listarArquivos('roteiro')).toContain(id);
  });
  it.each([new AdaptadorStripe(), new AdaptadorPagSeguro()])('troca gateway', async (adaptador) => {
    const id = await adaptador.efetuarPagamento(100, 'produtor', 'editor');
    expect(await adaptador.verificarPagamento(id)).toBe(true);
  });
  it.each([
    new AdaptadorLinkedIn(new ApiProfissionalExterna([{ id: '1', nome: 'Ana', competencias: ['edição'] }])),
    new AdaptadorInterno(new CadastroProfissionalInternoSimulado([{ id: '1', nome: 'Ana', competencias: ['edição'] }]))
  ])('consulta profissionais', async (adaptador) => {
    expect(await adaptador.listarProfissionais('edição')).toHaveLength(1);
    await adaptador.registrarAvaliacao('1', 5);
  });
});
describe('ATVIII - Decorator', () => {
  it('cache evita executar duas vezes; auditoria registra chamadas; compressão mede bytes', async () => {
    let chamadas = 0;
    const resposta = { recomendacao: { estrategiaUtilizada: 'FILTRAGEM_COLABORATIVA', status: 'EM_ANDAMENTO', alocacoes: [] }, validacao: { valido: true }, relatorio: { mensagem: 'exemplo '.repeat(300) } } as unknown as Awaited<ReturnType<RecomendacaoStrategy['recomendar']>>;
    const base: RecomendacaoStrategy = { recomendar: async () => { chamadas++; return resposta; } };
    const cache = new CacheDecorator(base);
    const auditoria = new AuditoriaDecorator(cache);
    const compressao = new CompressaoDecorator(auditoria);
    const requisicao = {} as Parameters<RecomendacaoStrategy['recomendar']>[0];
    await compressao.recomendar(requisicao);
    await compressao.recomendar(requisicao);
    expect(chamadas).toBe(1);
    expect(cache.acertos).toBe(1);
    expect(auditoria.registros).toHaveLength(2);
    expect(compressao.ultimoTamanhoComprimido).toBeLessThan(compressao.ultimoTamanhoOriginal);
    expect(montarDecoradores(base, ['cache', 'auditoria', 'compressao'])).toBeDefined();
  });
});
