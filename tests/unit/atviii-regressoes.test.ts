import { PapelTecnico } from '../../src/domain/entities/enums';
import { PacoteServico, ServicoAtomico, coletarPapeisServico } from '../../src/domain/services/servico-projeto';
import { CacheDecorator, AuditoriaDecorator, RecomendacaoStrategy } from '../../src/application/decorators/recomendacao-decorators';

const resultado = () => ({
  recomendacao: { estrategiaUtilizada: 'FILTRAGEM_COLABORATIVA', status: 'EM_ANDAMENTO', alocacoes: [], criadaEm: new Date() },
  validacao: { valido: true }, relatorio: { mensagem: 'ok' }
} as unknown as Awaited<ReturnType<RecomendacaoStrategy['recomendar']>>);

describe('ATVIII - correções de regressão', () => {
  it('extrai os papéis de todos os níveis do pacote', () => {
    const servicos = new PacoteServico('Pós', [
      new ServicoAtomico('Edição', 100, 2, PapelTecnico.EDITOR),
      new PacoteServico('Áudio', [new ServicoAtomico('Som', 200, 3, PapelTecnico.SONOPLASTA)])
    ]);
    expect(coletarPapeisServico(servicos)).toEqual([PapelTecnico.EDITOR, PapelTecnico.SONOPLASTA]);
  });
  it('cache não compartilha as referências das respostas', async () => {
    let chamadas = 0;
    const base: RecomendacaoStrategy = { recomendar: async () => { chamadas++; return resultado(); } };
    const cache = new CacheDecorator(base);
    const pedido = {} as Parameters<RecomendacaoStrategy['recomendar']>[0];
    const a = await cache.recomendar(pedido);
    a.recomendacao.status = 'MODIFICADO' as typeof a.recomendacao.status;
    const b = await cache.recomendar(pedido);
    expect(b.recomendacao.status).toBe('EM_ANDAMENTO');
    expect(b.recomendacao.criadaEm).toBeInstanceOf(Date);
    expect(chamadas).toBe(1);
  });
  it('cache deduplica chamadas simultâneas e auditoria externa registra todas', async () => {
    let chamadas = 0;
    const base: RecomendacaoStrategy = { recomendar: async () => { chamadas++; await Promise.resolve(); return resultado(); } };
    const cache = new CacheDecorator(base);
    const audit = new AuditoriaDecorator(cache);
    const req = {} as Parameters<RecomendacaoStrategy['recomendar']>[0];
    const resultados = await Promise.all(Array.from({ length: 10 }, () => audit.recomendar(req)));
    expect(resultados).toHaveLength(10);
    expect(chamadas).toBe(1);
    expect(audit.registros).toHaveLength(10);
  });
});
