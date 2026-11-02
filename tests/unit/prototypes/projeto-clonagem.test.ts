import { Projeto } from '../../../src/domain/entities/projeto';
import { ProjetoDocumentario } from '../../../src/domain/entities/projeto-documentario';
import { ProjetoAnimacao } from '../../../src/domain/entities/projeto-animacao';
import { ProjetoPublicitario } from '../../../src/domain/entities/projeto-publicitario';
import { PapelObrigatorio } from '../../../src/domain/entities/papel-obrigatorio';
import { Localizacao } from '../../../src/domain/entities/localizacao';
import { PapelTecnico, TecnicaAnimacao, TipoCaptacao } from '../../../src/domain/entities/enums';

function preencher<T extends Projeto>(projeto: T): T {
  const localizacao = new Localizacao();
  localizacao.cidade = 'Recife';
  localizacao.uf = 'PE';
  localizacao.pais = 'Brasil';
  localizacao.latitude = -8.05;

  const diretor = new PapelObrigatorio();
  diretor.papel = PapelTecnico.DIRETOR;
  diretor.peso = 0.6;
  const editor = new PapelObrigatorio();
  editor.papel = PapelTecnico.EDITOR;
  editor.peso = 0.4;

  projeto.id = 'id-original';
  projeto.nome = 'Projeto original';
  projeto.genero = 'Drama';
  projeto.duracaoEstimadaMinutos = 30;
  projeto.orcamentoTotal = 10000;
  projeto.dataEntrega = new Date('2026-12-01');
  projeto.tipoCaptacao = TipoCaptacao.FICCAO;
  projeto.localizacaoFilmagem = localizacao;
  projeto.papeisObrigatorios = [diretor, editor];
  projeto.criadoEm = new Date('2026-01-01');
  return projeto;
}

describe('Projeto.clonar (Prototype)', () => {
  it('copia todos os atributos comuns, mas não o id, e gera um novo criadoEm', () => {
    const original = preencher(new Projeto());

    const copia = original.clonar();

    expect(copia).toBeInstanceOf(Projeto);
    expect(copia).not.toBe(original);
    expect(copia.id).toBeUndefined();
    expect(copia.nome).toBe('Projeto original');
    expect(copia.genero).toBe('Drama');
    expect(copia.duracaoEstimadaMinutos).toBe(30);
    expect(copia.orcamentoTotal).toBe(10000);
    expect(copia.tipoCaptacao).toBe(TipoCaptacao.FICCAO);
    expect(copia.criadoEm.getTime()).toBeGreaterThan(original.criadoEm.getTime());
  });

  it('faz cópia profunda: papéis, localização e data são objetos novos', () => {
    const original = preencher(new Projeto());

    const copia = original.clonar();

    expect(copia.papeisObrigatorios).not.toBe(original.papeisObrigatorios);
    expect(copia.papeisObrigatorios[0]).not.toBe(original.papeisObrigatorios[0]);
    expect(copia.papeisObrigatorios.map((p) => [p.papel, p.peso])).toEqual([
      [PapelTecnico.DIRETOR, 0.6],
      [PapelTecnico.EDITOR, 0.4]
    ]);
    expect(copia.localizacaoFilmagem).not.toBe(original.localizacaoFilmagem);
    expect(copia.localizacaoFilmagem.cidade).toBe('Recife');
    expect(copia.localizacaoFilmagem.latitude).toBeCloseTo(-8.05);
    expect(copia.dataEntrega).not.toBe(original.dataEntrega);
    expect(copia.dataEntrega.getTime()).toBe(original.dataEntrega.getTime());
  });

  it('alterar o clone não afeta o original', () => {
    const original = preencher(new Projeto());
    const copia = original.clonar();

    copia.nome = 'Outro nome';
    copia.papeisObrigatorios[0].peso = 0.1;
    copia.papeisObrigatorios.push(new PapelObrigatorio());
    copia.localizacaoFilmagem.cidade = 'Manaus';
    copia.dataEntrega.setFullYear(2030);

    expect(original.nome).toBe('Projeto original');
    expect(original.papeisObrigatorios).toHaveLength(2);
    expect(original.papeisObrigatorios[0].peso).toBe(0.6);
    expect(original.localizacaoFilmagem.cidade).toBe('Recife');
    expect(original.dataEntrega.getFullYear()).toBe(2026);
  });
});

describe('clonar nas subclasses de Projeto', () => {
  it('ProjetoDocumentario copia o tema e, em profundidade, a lista de entrevistados', () => {
    const original = preencher(new ProjetoDocumentario());
    original.tema = 'Pesca artesanal';
    original.entrevistados = ['Dona Maria'];

    const copia = original.clonar();
    copia.entrevistados.push('Seu João');

    expect(copia).toBeInstanceOf(ProjetoDocumentario);
    expect(copia).not.toBe(original);
    expect(copia.tema).toBe('Pesca artesanal');
    expect(copia.nome).toBe('Projeto original');
    expect(original.entrevistados).toEqual(['Dona Maria']);
    expect(copia.entrevistados).toEqual(['Dona Maria', 'Seu João']);
  });

  it('ProjetoAnimacao copia em profundidade a lista de softwares exigidos', () => {
    const original = preencher(new ProjetoAnimacao());
    original.tecnica = TecnicaAnimacao.STOP_MOTION;
    original.softwaresExigidos = ['Dragonframe'];

    const copia = original.clonar();
    copia.softwaresExigidos.push('Premiere');

    expect(copia).toBeInstanceOf(ProjetoAnimacao);
    expect(copia.tecnica).toBe(TecnicaAnimacao.STOP_MOTION);
    expect(original.softwaresExigidos).toEqual(['Dragonframe']);
    expect(copia.softwaresExigidos).toEqual(['Dragonframe', 'Premiere']);
  });

  it('ProjetoPublicitario copia em profundidade a lista de veículos de exibição', () => {
    const original = preencher(new ProjetoPublicitario());
    original.marcaCliente = 'Marca X';
    original.veiculosDeExibicao = ['TV'];

    const copia = original.clonar();
    copia.veiculosDeExibicao.push('Internet');

    expect(copia).toBeInstanceOf(ProjetoPublicitario);
    expect(copia.marcaCliente).toBe('Marca X');
    expect(original.veiculosDeExibicao).toEqual(['TV']);
    expect(copia.veiculosDeExibicao).toEqual(['TV', 'Internet']);
  });
});
