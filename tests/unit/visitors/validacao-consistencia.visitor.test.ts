import { VisitanteValidacaoConsistencia } from '../../../src/domain/visitors/validacao/validacao-consistencia.visitor';
import { PapelTecnico, StatusConvite } from '../../../src/domain/entities/enums';
import {
  criarPapel,
  criarProjetoCompleto,
  criarProfissionalComPreco,
  criarAlocacaoCompleta,
  criarRecomendacaoCompleta
} from './helpers';

describe('VisitanteValidacaoConsistencia', () => {
  it('é válido quando todos os papéis obrigatórios estão preenchidos e o orçamento é suficiente', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.6), criarPapel(PapelTecnico.EDITOR, 0.4)];
    const projeto = criarProjetoCompleto('Curta-metragem', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 4000), 0.9),
      criarAlocacaoCompleta(PapelTecnico.EDITOR, criarProfissionalComPreco('Bruno', 3000), 0.8)
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteValidacaoConsistencia();
    recomendacao.aceitar(visitante);

    expect(visitante.obterResultado()).toEqual({ valido: true, erros: [] });
  });

  it('aponta erro quando um papel obrigatório não tem alocação', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.6), criarPapel(PapelTecnico.EDITOR, 0.4)];
    const projeto = criarProjetoCompleto('Curta-metragem', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 4000), 0.9)
      // EDITOR ficou sem alocação
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteValidacaoConsistencia();
    recomendacao.aceitar(visitante);

    const resultado = visitante.obterResultado();
    expect(resultado.valido).toBe(false);
    expect(resultado.erros[0]).toContain(PapelTecnico.EDITOR);
  });

  it('aponta erro quando o custo total alocado excede o orçamento do projeto', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 1)];
    const projeto = criarProjetoCompleto('Curta-metragem', 3000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(
        PapelTecnico.DIRETOR,
        criarProfissionalComPreco('Ana', 5000),
        0.9,
        StatusConvite.ACEITO
      )
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteValidacaoConsistencia();
    recomendacao.aceitar(visitante);

    const resultado = visitante.obterResultado();
    expect(resultado.valido).toBe(false);
    expect(resultado.erros.some((e) => e.includes('Orçamento insuficiente'))).toBe(true);
  });
});
