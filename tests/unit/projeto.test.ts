import { Projeto } from '../../src/domain/entities/projeto';
import { PapelObrigatorio } from '../../src/domain/entities/papel-obrigatorio';
import { PapelTecnico } from '../../src/domain/entities/enums';

function criarPapel(papel: PapelTecnico, peso: number): PapelObrigatorio {
  const p = new PapelObrigatorio();
  p.papel = papel;
  p.peso = peso;
  return p;
}

describe('Projeto', () => {
  it('pesoTotalPapeis soma os pesos de todos os papéis obrigatórios', () => {
    const projeto = new Projeto();
    projeto.papeisObrigatorios = [
      criarPapel(PapelTecnico.DIRETOR, 0.4),
      criarPapel(PapelTecnico.EDITOR, 0.3),
      criarPapel(PapelTecnico.ROTEIRISTA, 0.3)
    ];

    expect(projeto.pesoTotalPapeis()).toBeCloseTo(1.0);
  });

  it('possuiPesosValidos retorna true quando há papéis e todos os pesos são > 0', () => {
    const projeto = new Projeto();
    projeto.papeisObrigatorios = [criarPapel(PapelTecnico.DIRETOR, 0.5)];

    expect(projeto.possuiPesosValidos()).toBe(true);
  });

  it('possuiPesosValidos retorna false quando não há papéis obrigatórios', () => {
    const projeto = new Projeto();
    projeto.papeisObrigatorios = [];

    expect(projeto.possuiPesosValidos()).toBe(false);
  });

  it('possuiPesosValidos retorna false quando algum papel tem peso zero', () => {
    const projeto = new Projeto();
    projeto.papeisObrigatorios = [
      criarPapel(PapelTecnico.DIRETOR, 0.5),
      criarPapel(PapelTecnico.EDITOR, 0)
    ];

    expect(projeto.possuiPesosValidos()).toBe(false);
  });
});
