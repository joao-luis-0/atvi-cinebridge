import { RegistroPrototiposProjeto } from '../../../src/domain/prototypes/registro-prototipos-projeto';
import { criarRegistroPadraoDePrototipos } from '../../../src/domain/prototypes/modelos-padrao';
import { ProjetoDocumentario } from '../../../src/domain/entities/projeto-documentario';
import { ProjetoAnimacao } from '../../../src/domain/entities/projeto-animacao';
import { ProjetoPublicitario } from '../../../src/domain/entities/projeto-publicitario';
import { PapelTecnico, TipoProjeto } from '../../../src/domain/entities/enums';

describe('RegistroPrototiposProjeto', () => {
  it('criar devolve sempre um clone novo, nunca o protótipo registrado', () => {
    const registro = criarRegistroPadraoDePrototipos();

    const a = registro.criar(TipoProjeto.DOCUMENTARIO);
    const b = registro.criar(TipoProjeto.DOCUMENTARIO);

    expect(a).not.toBe(b);
    expect(a.nome).toBe(b.nome);
  });

  it('ajustes finos valem só para o clone: o próximo clone volta ao modelo original', () => {
    const registro = criarRegistroPadraoDePrototipos();

    const ajustado = registro.criar<ProjetoAnimacao>(TipoProjeto.ANIMACAO, (copia) => {
      copia.nome = 'Minha animação';
      copia.orcamentoTotal = 99999;
      copia.softwaresExigidos.push('Maya');
    });
    const proximo = registro.criar<ProjetoAnimacao>(TipoProjeto.ANIMACAO);

    expect(ajustado.nome).toBe('Minha animação');
    expect(ajustado.softwaresExigidos).toContain('Maya');
    expect(proximo.nome).toBe('Modelo de animação');
    expect(proximo.orcamentoTotal).toBe(60000);
    expect(proximo.softwaresExigidos).not.toContain('Maya');
  });

  it('registrar guarda uma cópia: alterar o objeto original depois não muda o protótipo', () => {
    const registro = new RegistroPrototiposProjeto();
    const base = criarRegistroPadraoDePrototipos().criar<ProjetoDocumentario>(TipoProjeto.DOCUMENTARIO);
    registro.registrar(TipoProjeto.DOCUMENTARIO, base);

    base.nome = 'Alterado depois do registro';

    expect(registro.criar(TipoProjeto.DOCUMENTARIO).nome).toBe('Modelo de documentário');
  });

  it('possui indica se há protótipo para o tipo', () => {
    const registro = new RegistroPrototiposProjeto();
    expect(registro.possui(TipoProjeto.ANIMACAO)).toBe(false);

    registro.registrar(TipoProjeto.ANIMACAO, criarRegistroPadraoDePrototipos().criar(TipoProjeto.ANIMACAO));
    expect(registro.possui(TipoProjeto.ANIMACAO)).toBe(true);
  });

  it('lança erro claro ao criar um tipo sem protótipo registrado', () => {
    const registro = new RegistroPrototiposProjeto();

    expect(() => registro.criar(TipoProjeto.PUBLICITARIO)).toThrow(/PUBLICITARIO/);
  });
});

describe('criarRegistroPadraoDePrototipos', () => {
  const registro = criarRegistroPadraoDePrototipos();

  it('cria a subclasse correta para cada tipo de projeto', () => {
    expect(registro.criar(TipoProjeto.DOCUMENTARIO)).toBeInstanceOf(ProjetoDocumentario);
    expect(registro.criar(TipoProjeto.ANIMACAO)).toBeInstanceOf(ProjetoAnimacao);
    expect(registro.criar(TipoProjeto.PUBLICITARIO)).toBeInstanceOf(ProjetoPublicitario);
  });

  it('cada modelo tem pesos de papéis que somam 1', () => {
    for (const tipo of [TipoProjeto.DOCUMENTARIO, TipoProjeto.ANIMACAO, TipoProjeto.PUBLICITARIO]) {
      expect(registro.criar(tipo).pesoTotalPapeis()).toBeCloseTo(1);
    }
  });

  it('os conjuntos de papéis diferem por tipo (animação exige efeitos visuais, publicitário exige fotografia)', () => {
    const papeis = (tipo: TipoProjeto) => registro.criar(tipo).papeisObrigatorios.map((p) => p.papel);

    expect(papeis(TipoProjeto.ANIMACAO)).toContain(PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS);
    expect(papeis(TipoProjeto.DOCUMENTARIO)).not.toContain(PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS);
    expect(papeis(TipoProjeto.PUBLICITARIO)).toContain(PapelTecnico.DIRETOR_DE_FOTOGRAFIA);
    expect(papeis(TipoProjeto.DOCUMENTARIO)).toContain(PapelTecnico.ROTEIRISTA);
  });
});
