import { Recomendacao } from '../../src/domain/entities/recomendacao';
import { AlocacaoRecomendada } from '../../src/domain/entities/alocacao-recomendada';
import { Convite } from '../../src/domain/entities/convite';
import { PapelTecnico, StatusConvite } from '../../src/domain/entities/enums';

function criarAlocacao(status: StatusConvite, substituida = false): AlocacaoRecomendada {
  const alocacao = new AlocacaoRecomendada();
  alocacao.papel = PapelTecnico.EDITOR;
  alocacao.substituida = substituida;

  const convite = new Convite();
  convite.status = status;
  alocacao.convite = convite;

  return alocacao;
}

describe('Recomendacao', () => {
  it('estaConsensual retorna false quando não há alocações', () => {
    const recomendacao = new Recomendacao();
    recomendacao.alocacoes = [];

    expect(recomendacao.estaConsensual()).toBe(false);
  });

  it('estaConsensual retorna true quando todas as alocações ativas foram aceitas', () => {
    const recomendacao = new Recomendacao();
    recomendacao.alocacoes = [
      criarAlocacao(StatusConvite.ACEITO),
      criarAlocacao(StatusConvite.ACEITO)
    ];

    expect(recomendacao.estaConsensual()).toBe(true);
  });

  it('estaConsensual ignora alocações substituídas', () => {
    const recomendacao = new Recomendacao();
    recomendacao.alocacoes = [
      criarAlocacao(StatusConvite.RECUSADO, true), // substituída, não conta
      criarAlocacao(StatusConvite.ACEITO)
    ];

    expect(recomendacao.estaConsensual()).toBe(true);
  });

  it('estaConsensual retorna false quando alguma alocação ativa ainda está pendente', () => {
    const recomendacao = new Recomendacao();
    recomendacao.alocacoes = [
      criarAlocacao(StatusConvite.ACEITO),
      criarAlocacao(StatusConvite.PENDENTE)
    ];

    expect(recomendacao.estaConsensual()).toBe(false);
  });

  it('alocacoesPendentes retorna apenas alocações ativas sem resposta', () => {
    const recomendacao = new Recomendacao();
    const pendente = criarAlocacao(StatusConvite.PENDENTE);
    recomendacao.alocacoes = [
      criarAlocacao(StatusConvite.ACEITO),
      pendente,
      criarAlocacao(StatusConvite.PENDENTE, true) // substituída, não conta
    ];

    expect(recomendacao.alocacoesPendentes()).toEqual([pendente]);
  });
});
