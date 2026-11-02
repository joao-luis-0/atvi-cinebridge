import { VisitanteGeradorRelatorio } from '../../../src/domain/visitors/relatorio/gerador-relatorio.visitor';
import { PapelTecnico, StatusConvite } from '../../../src/domain/entities/enums';
import {
  criarPapel,
  criarProjetoCompleto,
  criarProfissionalComPreco,
  criarAlocacaoCompleta,
  criarRecomendacaoCompleta
} from './helpers';

describe('VisitanteGeradorRelatorio', () => {
  it('monta um relatório completo com dados do projeto, custo total e uma linha por alocação', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.5), criarPapel(PapelTecnico.EDITOR, 0.5)];
    const projeto = criarProjetoCompleto('Curta-metragem', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(
        PapelTecnico.DIRETOR,
        criarProfissionalComPreco('Ana', 4000),
        0.9,
        StatusConvite.ACEITO
      ),
      criarAlocacaoCompleta(
        PapelTecnico.EDITOR,
        criarProfissionalComPreco('Bruno', 3000),
        0.7,
        StatusConvite.PENDENTE
      )
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteGeradorRelatorio();
    recomendacao.aceitar(visitante);

    const relatorio = visitante.obterResultado();

    expect(relatorio.nomeProjeto).toBe('Curta-metragem');
    expect(relatorio.orcamentoTotal).toBe(10000);
    expect(relatorio.custoTotalAlocado).toBe(7000);
    expect(relatorio.linhas).toHaveLength(2);
    expect(relatorio.linhas).toContainEqual({
      papel: PapelTecnico.DIRETOR,
      profissional: 'Ana',
      statusConvite: StatusConvite.ACEITO,
      score: 0.9
    });
    // compatibilidadeGeral reaproveita a mesma lógica do VisitanteCalculoCompatibilidade
    expect(relatorio.compatibilidadeGeral).toBeCloseTo(0.8);
  });
});

describe('Os três visitantes operam sobre a mesma estrutura sem modificar as classes de domínio', () => {
  it('produzem resultados diferentes e independentes a partir da mesma Recomendacao', async () => {
    const { VisitanteValidacaoConsistencia } = await import(
      '../../../src/domain/visitors/validacao/validacao-consistencia.visitor'
    );
    const { VisitanteCalculoCompatibilidade } = await import(
      '../../../src/domain/visitors/compatibilidade/calculo-compatibilidade.visitor'
    );

    const papeis = [criarPapel(PapelTecnico.DIRETOR, 1)];
    const projeto = criarProjetoCompleto('Curta', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 4000), 0.9)
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const validador = new VisitanteValidacaoConsistencia();
    const calculadora = new VisitanteCalculoCompatibilidade();
    const gerador = new VisitanteGeradorRelatorio();


    recomendacao.aceitar(validador);
    recomendacao.aceitar(calculadora);
    recomendacao.aceitar(gerador);

    expect(validador.obterResultado().valido).toBe(true);
    expect(calculadora.obterResultado()).toBeCloseTo(0.9);
    expect(gerador.obterResultado().nomeProjeto).toBe('Curta');
  });
});
