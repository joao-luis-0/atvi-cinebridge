import { Projeto } from '../../src/domain/entities/projeto';
import { Profissional } from '../../src/domain/entities/profissional';
import { PapelObrigatorio } from '../../src/domain/entities/papel-obrigatorio';
import { Localizacao } from '../../src/domain/entities/localizacao';
import { PapelTecnico, TipoCaptacao } from '../../src/domain/entities/enums';

function profissional(nome: string, especialidades: PapelTecnico[]): Profissional {
  const p = new Profissional();
  p.id = `id-${nome}`;
  p.nome = nome;
  p.especialidades = especialidades;
  return p;
}

function projeto(): Projeto {
  const p = new Projeto();
  const localizacao = new Localizacao();
  localizacao.cidade = 'SP';
  localizacao.uf = 'SP';
  localizacao.pais = 'Brasil';
  p.nome = 'Obra';
  p.genero = 'Drama';
  p.duracaoEstimadaMinutos = 10;
  p.orcamentoTotal = 1000;
  p.dataEntrega = new Date('2026-12-01');
  p.tipoCaptacao = TipoCaptacao.FICCAO;
  p.localizacaoFilmagem = localizacao;
  p.papeisObrigatorios = [PapelTecnico.DIRETOR, PapelTecnico.EDITOR].map((papel) => {
    const o = new PapelObrigatorio();
    o.papel = papel;
    o.peso = 0.5;
    return o;
  });
  p.criadoEm = new Date();
  return p;
}

describe('Projeto: equipe confirmada pelo produtor (métodos do diagrama)', () => {
  it('aceitarRecomendacao confirma o profissional no papel', () => {
    const p = projeto();
    const ana = profissional('Ana', [PapelTecnico.DIRETOR]);

    p.aceitarRecomendacao(PapelTecnico.DIRETOR, ana);

    expect(p.equipeConfirmada.get(PapelTecnico.DIRETOR)).toBe(ana);
  });

  it('aceitarRecomendacao rejeita papel que não é obrigatório no projeto', () => {
    const p = projeto();

    expect(() => p.aceitarRecomendacao(PapelTecnico.SONOPLASTA, profissional('Sol', [PapelTecnico.SONOPLASTA]))).toThrow(
      /não é obrigatório/
    );
  });

  it('aceitarRecomendacao rejeita profissional sem a especialidade do papel', () => {
    const p = projeto();

    expect(() => p.aceitarRecomendacao(PapelTecnico.DIRETOR, profissional('Edu', [PapelTecnico.EDITOR]))).toThrow(
      /não se especializa/
    );
    expect(p.equipeConfirmada.size).toBe(0);
  });

  it('substituirMembro troca só o membro do papel e mantém as demais escolhas', () => {
    const p = projeto();
    const ana = profissional('Ana', [PapelTecnico.DIRETOR]);
    const bia = profissional('Bia', [PapelTecnico.DIRETOR]);
    const edu = profissional('Edu', [PapelTecnico.EDITOR]);
    p.aceitarRecomendacao(PapelTecnico.DIRETOR, ana);
    p.aceitarRecomendacao(PapelTecnico.EDITOR, edu);

    p.substituirMembro(PapelTecnico.DIRETOR, bia);

    expect(p.equipeConfirmada.get(PapelTecnico.DIRETOR)).toBe(bia);
    expect(p.equipeConfirmada.get(PapelTecnico.EDITOR)).toBe(edu);
  });

  it('substituirMembro exige que já exista um membro no papel e valida o novo profissional', () => {
    const p = projeto();
    const ana = profissional('Ana', [PapelTecnico.DIRETOR]);

    expect(() => p.substituirMembro(PapelTecnico.DIRETOR, ana)).toThrow(/não há o que substituir/);

    p.aceitarRecomendacao(PapelTecnico.DIRETOR, ana);
    expect(() => p.substituirMembro(PapelTecnico.DIRETOR, profissional('Edu', [PapelTecnico.EDITOR]))).toThrow(
      /não se especializa/
    );
    expect(p.equipeConfirmada.get(PapelTecnico.DIRETOR)).toBe(ana);
  });

  it('solicitarReavaliacao descarta a equipe e marca o pedido; uma nova aceitação encerra o pedido', () => {
    const p = projeto();
    p.aceitarRecomendacao(PapelTecnico.DIRETOR, profissional('Ana', [PapelTecnico.DIRETOR]));

    p.solicitarReavaliacao();
    expect(p.equipeConfirmada.size).toBe(0);
    expect(p.reavaliacaoSolicitada).toBe(true);

    p.aceitarRecomendacao(PapelTecnico.EDITOR, profissional('Edu', [PapelTecnico.EDITOR]));
    expect(p.reavaliacaoSolicitada).toBe(false);
  });

  it('um projeto clonado começa sem equipe confirmada', () => {
    const original = projeto();
    original.aceitarRecomendacao(PapelTecnico.DIRETOR, profissional('Ana', [PapelTecnico.DIRETOR]));
    original.reavaliacaoSolicitada = true;

    const copia = original.clonar();

    expect(copia.equipeConfirmada.size).toBe(0);
    expect(copia.reavaliacaoSolicitada).toBe(false);
    expect(original.equipeConfirmada.size).toBe(1);
  });
});
