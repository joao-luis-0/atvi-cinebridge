import { getMetadataArgsStorage } from 'typeorm';
import '../../../src/domain/entities';


describe('Metadados TypeORM das entidades', () => {
  it('todo resolver de tipo de relação resolve para uma função/classe válida', () => {
    const storage = getMetadataArgsStorage();
    expect(storage.relations.length).toBeGreaterThan(0);

    for (const relacao of storage.relations) {
      expect(typeof relacao.type).toBe('function');
      const tipoResolvido = (relacao.type as () => unknown)();
      expect(tipoResolvido).toBeDefined();
    }
  });

  it('todo resolver de lado inverso da relação resolve sem lançar exceção', () => {
    const storage = getMetadataArgsStorage();
    const comLadoInverso = storage.relations.filter((r) => typeof r.inverseSideProperty === 'function');
    expect(comLadoInverso.length).toBeGreaterThan(0);

    for (const relacao of comLadoInverso) {
      const resolver = relacao.inverseSideProperty as (objeto: unknown) => unknown;

      const objetoModelo = {
        avaliacoes: [],
        disponibilidades: [],
        historicoProjetos: [],
        competencias: [],
        papeisObrigatorios: [],
        alocacoes: [],
        alocacao: {},
        profissional: {}
      };
      expect(() => resolver(objetoModelo)).not.toThrow();
    }
  });

  it('todo valor default de coluna baseado em função resolve para uma string não vazia', () => {
    const storage = getMetadataArgsStorage();
    const comDefaultFuncao = storage.columns.filter(
      (c) => typeof c.options.default === 'function'
    );
    expect(comDefaultFuncao.length).toBeGreaterThan(0);

    for (const coluna of comDefaultFuncao) {
      const resolverDefault = coluna.options.default as () => unknown;
      expect(resolverDefault()).toBe('CURRENT_TIMESTAMP');
    }
  });
});
