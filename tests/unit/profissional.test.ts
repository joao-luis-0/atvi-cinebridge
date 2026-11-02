import { Profissional } from '../../src/domain/entities/profissional';
import { Avaliacao } from '../../src/domain/entities/avaliacao';
import { DisponibilidadePeriodo } from '../../src/domain/entities/disponibilidade-periodo';
import { PapelTecnico } from '../../src/domain/entities/enums';

function criarProfissional(): Profissional {
  const p = new Profissional();
  p.especialidades = [PapelTecnico.DIRETOR_DE_FOTOGRAFIA];
  p.valorMinimo = 5000;
  p.valorMaximo = 15000;
  p.avaliacoes = [];
  p.disponibilidades = [];
  return p;
}

describe('Profissional', () => {
  it('mediaAvaliacoes retorna 0 quando não há avaliações', () => {
    const profissional = criarProfissional();
    expect(profissional.mediaAvaliacoes()).toBe(0);
  });

  it('mediaAvaliacoes calcula a média das notas recebidas', () => {
    const profissional = criarProfissional();
    const a1 = new Avaliacao();
    a1.nota = 4;
    const a2 = new Avaliacao();
    a2.nota = 5;
    profissional.avaliacoes = [a1, a2];

    expect(profissional.mediaAvaliacoes()).toBeCloseTo(4.5);
  });

  it('estaDisponivelEntre retorna true quando há janela cobrindo o período', () => {
    const profissional = criarProfissional();
    const janela = new DisponibilidadePeriodo();
    janela.inicio = new Date('2026-10-01');
    janela.fim = new Date('2026-12-31');
    profissional.disponibilidades = [janela];

    expect(
      profissional.estaDisponivelEntre(new Date('2026-10-15'), new Date('2026-11-15'))
    ).toBe(true);
  });

  it('estaDisponivelEntre retorna false quando nenhuma janela cobre o período', () => {
    const profissional = criarProfissional();
    const janela = new DisponibilidadePeriodo();
    janela.inicio = new Date('2026-01-01');
    janela.fim = new Date('2026-02-01');
    profissional.disponibilidades = [janela];

    expect(
      profissional.estaDisponivelEntre(new Date('2026-10-15'), new Date('2026-11-15'))
    ).toBe(false);
  });

  it('dentroDaFaixaDePreco valida limites inferior e superior', () => {
    const profissional = criarProfissional();

    expect(profissional.dentroDaFaixaDePreco(5000)).toBe(true);
    expect(profissional.dentroDaFaixaDePreco(15000)).toBe(true);
    expect(profissional.dentroDaFaixaDePreco(4999)).toBe(false);
    expect(profissional.dentroDaFaixaDePreco(15001)).toBe(false);
  });

  it('possuiEspecialidade verifica se o papel está entre as especialidades', () => {
    const profissional = criarProfissional();

    expect(profissional.possuiEspecialidade(PapelTecnico.DIRETOR_DE_FOTOGRAFIA)).toBe(true);
    expect(profissional.possuiEspecialidade(PapelTecnico.SONOPLASTA)).toBe(false);
  });
});
