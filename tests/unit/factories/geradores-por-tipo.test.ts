import {
  GeradorRelatorioAnimacao,
  GeradorRelatorioDocumentario,
  GeradorRelatorioPublicitario
} from '../../../src/domain/visitors/relatorio/geradores-por-tipo';
import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPublicitario
} from '../../../src/domain/factories/fabricas-concretas';
import { criarRegistroPadraoDePrototipos } from '../../../src/domain/prototypes/modelos-padrao';
import { Projeto } from '../../../src/domain/entities/projeto';
import { PapelTecnico } from '../../../src/domain/entities/enums';
import { criarGatewaysEspioes } from '../../helpers/fabricas';
import { criarPapel, criarRecomendacaoCompleta } from '../visitors/helpers';
import { projetoDaFabrica, recomendacaoComTodosOsPapeis } from './por-tipo-helpers';

const gw = () => criarGatewaysEspioes().gateways;

describe('Relatórios por tipo de projeto', () => {
  it('documentário: tema, entrevistados previstos e custo por minuto', () => {
    const projeto = projetoDaFabrica(new FabricaDocumentario(criarRegistroPadraoDePrototipos(), gw()), {
      duracaoEstimadaMinutos: 20,
      atributosEspecificos: { tema: 'Rios', entrevistados: ['A', 'B', 'C'] }
    });
    const gerador = new GeradorRelatorioDocumentario();
    recomendacaoComTodosOsPapeis(projeto, 1000).aceitar(gerador);

    const relatorio = gerador.obterResultado();
    expect(relatorio.metricasEspecificas).toEqual({ tema: 'Rios', entrevistadosPrevistos: 3, custoPorMinuto: 200 });
    expect(relatorio.custoTotalAlocado).toBe(4000);
  });

  it('animação: técnica, quantidade de softwares e custo por minuto', () => {
    const projeto = projetoDaFabrica(new FabricaAnimacao(criarRegistroPadraoDePrototipos(), gw()), {
      duracaoEstimadaMinutos: 10
    });
    const gerador = new GeradorRelatorioAnimacao();

    recomendacaoComTodosOsPapeis(projeto, 1000).aceitar(gerador);

    expect(gerador.obterResultado().metricasEspecificas).toEqual({
      tecnica: 'ANIMACAO_3D',
      softwaresExigidos: 2,
      custoPorMinuto: 500
    });
  });

  it('publicitário: marca, quantidade de veículos e custo por segundo', () => {
    const projeto = projetoDaFabrica(new FabricaPublicitario(criarRegistroPadraoDePrototipos(), gw()), {
      duracaoEstimadaMinutos: 2,
      atributosEspecificos: { marcaCliente: 'Marca X' }
    });
    const gerador = new GeradorRelatorioPublicitario();

    recomendacaoComTodosOsPapeis(projeto, 1500).aceitar(gerador);

    expect(gerador.obterResultado().metricasEspecificas).toEqual({
      marcaCliente: 'Marca X',
      veiculosDeExibicao: 2,
      custoPorSegundo: 50
    });
  });

  it('o relatório geral (herdado) continua presente junto com as métricas do tipo', () => {
    const projeto = projetoDaFabrica(new FabricaDocumentario(criarRegistroPadraoDePrototipos(), gw()), {
      atributosEspecificos: { tema: 'Rios' }
    });
    const gerador = new GeradorRelatorioDocumentario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(gerador);

    const relatorio = gerador.obterResultado();
    expect(relatorio.nomeProjeto).toBe('Obra de teste');
    expect(relatorio.linhas).toHaveLength(4);
    expect(relatorio.compatibilidadeGeral).toBeGreaterThan(0);
  });

  it('duração zero não causa divisão por zero', () => {
    const projeto = projetoDaFabrica(new FabricaDocumentario(criarRegistroPadraoDePrototipos(), gw()), {
      duracaoEstimadaMinutos: 0
    });
    const gerador = new GeradorRelatorioDocumentario();

    recomendacaoComTodosOsPapeis(projeto, 1000).aceitar(gerador);

    expect(gerador.obterResultado().metricasEspecificas?.custoPorMinuto).toBe(4000);
  });

  it('projeto de outro tipo, ou nenhum projeto visitado, gera métricas vazias', () => {
    const projetoGenerico = new Projeto();
    projetoGenerico.nome = 'Genérico';
    projetoGenerico.orcamentoTotal = 1000;
    projetoGenerico.papeisObrigatorios = [criarPapel(PapelTecnico.DIRETOR, 1)];

    for (const gerador of [
      new GeradorRelatorioDocumentario(),
      new GeradorRelatorioAnimacao(),
      new GeradorRelatorioPublicitario()
    ]) {
      criarRecomendacaoCompleta(projetoGenerico, []).aceitar(gerador);
      expect(gerador.obterResultado().metricasEspecificas).toEqual({});
    }

    expect(new GeradorRelatorioAnimacao().obterResultado().metricasEspecificas).toEqual({});
  });
});
