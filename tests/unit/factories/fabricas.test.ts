import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPadrao,
  FabricaPublicitario
} from '../../../src/domain/factories/fabricas-concretas';
import { FabricaProjeto } from '../../../src/domain/factories/fabrica-projeto.interface';
import { DadosProjeto } from '../../../src/domain/factories/dados-projeto';
import { criarRegistroPadraoDePrototipos } from '../../../src/domain/prototypes/modelos-padrao';
import { Projeto } from '../../../src/domain/entities/projeto';
import { ProjetoDocumentario } from '../../../src/domain/entities/projeto-documentario';
import { ProjetoAnimacao } from '../../../src/domain/entities/projeto-animacao';
import { ProjetoPublicitario } from '../../../src/domain/entities/projeto-publicitario';
import { PapelTecnico, TecnicaAnimacao, TipoCaptacao, TipoProjeto } from '../../../src/domain/entities/enums';
import {
  ValidadorAnimacao,
  ValidadorDocumentario,
  ValidadorPublicitario
} from '../../../src/domain/visitors/validacao/validadores-por-tipo';
import { VisitanteValidacaoConsistencia } from '../../../src/domain/visitors/validacao/validacao-consistencia.visitor';
import {
  GeradorRelatorioAnimacao,
  GeradorRelatorioDocumentario,
  GeradorRelatorioPublicitario
} from '../../../src/domain/visitors/relatorio/geradores-por-tipo';
import { VisitanteGeradorRelatorio } from '../../../src/domain/visitors/relatorio/gerador-relatorio.visitor';
import {
  RecomendadorAnimacao,
  RecomendadorDocumentario,
  RecomendadorPublicitario
} from '../../../src/domain/strategies/recomendadores-por-tipo';
import { FiltragemColaborativaStrategy } from '../../../src/domain/strategies/filtragem-colaborativa.strategy';
import {
  NotificadorAnimacao,
  NotificadorDocumentario,
  NotificadorPadrao,
  NotificadorPublicitario
} from '../../../src/domain/events/observers/notificadores-por-tipo';
import { criarGatewaysEspioes } from '../../helpers/fabricas';

function dados(sobrescrever: Partial<DadosProjeto> = {}): DadosProjeto {
  return {
    nome: 'Meu projeto',
    genero: 'Drama',
    duracaoEstimadaMinutos: 20,
    orcamentoTotal: 50000,
    dataEntrega: '2026-12-01',
    tipoCaptacao: TipoCaptacao.FICCAO,
    localizacaoFilmagem: { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
    ...sobrescrever
  };
}

function registro() {
  return criarRegistroPadraoDePrototipos();
}

function gateways() {
  return criarGatewaysEspioes().gateways;
}

describe('Abstract Factory: cada fábrica entrega uma família coerente de objetos', () => {
  const casos: Array<{
    nome: string;
    criar: () => FabricaProjeto;
    tipo: TipoProjeto;
    projeto: unknown;
    validador: unknown;
    recomendador: unknown;
    gerador: unknown;
    notificador: unknown;
  }> = [
    {
      nome: 'FabricaDocumentario',
      criar: () => new FabricaDocumentario(registro(), gateways()),
      tipo: TipoProjeto.DOCUMENTARIO,
      projeto: ProjetoDocumentario,
      validador: ValidadorDocumentario,
      recomendador: RecomendadorDocumentario,
      gerador: GeradorRelatorioDocumentario,
      notificador: NotificadorDocumentario
    },
    {
      nome: 'FabricaAnimacao',
      criar: () => new FabricaAnimacao(registro(), gateways()),
      tipo: TipoProjeto.ANIMACAO,
      projeto: ProjetoAnimacao,
      validador: ValidadorAnimacao,
      recomendador: RecomendadorAnimacao,
      gerador: GeradorRelatorioAnimacao,
      notificador: NotificadorAnimacao
    },
    {
      nome: 'FabricaPublicitario',
      criar: () => new FabricaPublicitario(registro(), gateways()),
      tipo: TipoProjeto.PUBLICITARIO,
      projeto: ProjetoPublicitario,
      validador: ValidadorPublicitario,
      recomendador: RecomendadorPublicitario,
      gerador: GeradorRelatorioPublicitario,
      notificador: NotificadorPublicitario
    },
    {
      nome: 'FabricaPadrao',
      criar: () => new FabricaPadrao(registro(), gateways()),
      tipo: TipoProjeto.PADRAO,
      projeto: Projeto,
      validador: VisitanteValidacaoConsistencia,
      recomendador: FiltragemColaborativaStrategy,
      gerador: VisitanteGeradorRelatorio,
      notificador: NotificadorPadrao
    }
  ];

  it.each(casos)('$nome cria projeto, validador, recomendador, relatório e notificador do seu tipo', (caso) => {
    const fabrica = caso.criar();
    const papeis = [{ papel: PapelTecnico.DIRETOR, peso: 1 }];

    expect(fabrica.tipoProjeto).toBe(caso.tipo);
    // `constructor` exato: garante a classe do tipo, e não uma subclasse ou a base por engano
    expect(fabrica.criarProjeto(dados({ papeisObrigatorios: papeis })).constructor).toBe(caso.projeto);
    expect(fabrica.criarValidador().constructor).toBe(caso.validador);
    expect(fabrica.criarRecomendador().constructor).toBe(caso.recomendador);
    expect(fabrica.criarGeradorRelatorio().constructor).toBe(caso.gerador);
    expect(fabrica.criarNotificador().constructor).toBe(caso.notificador);
  });
});

describe('FabricaProjetoBase.criarProjeto (Prototype + dados da requisição)', () => {
  it('clona o modelo do tipo e aplica os dados informados', () => {
    const fabrica = new FabricaDocumentario(registro(), gateways());

    const projeto = fabrica.criarProjeto(
      dados({ atributosEspecificos: { tema: 'Pesca artesanal', entrevistados: ['Dona Maria', 'Seu João'] } })
    ) as ProjetoDocumentario;

    expect(projeto.nome).toBe('Meu projeto');
    expect(projeto.orcamentoTotal).toBe(50000);
    expect(projeto.dataEntrega).toEqual(new Date('2026-12-01'));
    expect(projeto.localizacaoFilmagem.cidade).toBe('São Paulo');
    expect(projeto.tema).toBe('Pesca artesanal');
    expect(projeto.entrevistados).toEqual(['Dona Maria', 'Seu João']);
  });

  it('sem papéis informados (ou lista vazia), vale o conjunto de papéis do modelo do tipo', () => {
    const fabrica = new FabricaDocumentario(registro(), gateways());

    const semPapeis = fabrica.criarProjeto(dados());
    const listaVazia = fabrica.criarProjeto(dados({ papeisObrigatorios: [] }));

    for (const projeto of [semPapeis, listaVazia]) {
      expect(projeto.papeisObrigatorios.map((p) => p.papel)).toEqual([
        PapelTecnico.DIRETOR,
        PapelTecnico.ROTEIRISTA,
        PapelTecnico.EDITOR,
        PapelTecnico.SONOPLASTA
      ]);
    }
  });

  it('papéis informados substituem os do modelo', () => {
    const fabrica = new FabricaDocumentario(registro(), gateways());

    const projeto = fabrica.criarProjeto(dados({ papeisObrigatorios: [{ papel: PapelTecnico.DIRETOR, peso: 1 }] }));

    expect(projeto.papeisObrigatorios).toHaveLength(1);
    expect(projeto.papeisObrigatorios[0].papel).toBe(PapelTecnico.DIRETOR);
  });

  it('cada chamada devolve um projeto novo e independente: o modelo nunca é alterado', () => {
    const fabrica = new FabricaAnimacao(registro(), gateways());

    const a = fabrica.criarProjeto(dados()) as ProjetoAnimacao;
    const b = fabrica.criarProjeto(dados()) as ProjetoAnimacao;
    a.softwaresExigidos.push('Maya');
    a.papeisObrigatorios[0].peso = 0.01;

    expect(a).not.toBe(b);
    expect(b.softwaresExigidos).toEqual(['Blender', 'After Effects']);
    expect(b.papeisObrigatorios[0].peso).toBe(0.25);
  });

  it('animação: atributos específicos informados substituem os do modelo; os omitidos mantêm o padrão do modelo', () => {
    const fabrica = new FabricaAnimacao(registro(), gateways());

    const padrao = fabrica.criarProjeto(dados()) as ProjetoAnimacao;
    const customizado = fabrica.criarProjeto(
      dados({ atributosEspecificos: { tecnica: 'STOP_MOTION', softwaresExigidos: ['Dragonframe'] } })
    ) as ProjetoAnimacao;

    expect(padrao.tecnica).toBe(TecnicaAnimacao.ANIMACAO_3D);
    expect(padrao.softwaresExigidos).toEqual(['Blender', 'After Effects']);
    expect(customizado.tecnica).toBe(TecnicaAnimacao.STOP_MOTION);
    expect(customizado.softwaresExigidos).toEqual(['Dragonframe']);
  });

  it('publicitário: marca e veículos; sem informar, mantém os veículos do modelo', () => {
    const fabrica = new FabricaPublicitario(registro(), gateways());

    const padrao = fabrica.criarProjeto(dados()) as ProjetoPublicitario;
    const customizado = fabrica.criarProjeto(
      dados({ atributosEspecificos: { marcaCliente: 'Marca X', veiculosDeExibicao: ['Cinema'] } })
    ) as ProjetoPublicitario;

    expect(padrao.marcaCliente).toBe('');
    expect(padrao.veiculosDeExibicao).toEqual(['TV', 'Internet']);
    expect(customizado.marcaCliente).toBe('Marca X');
    expect(customizado.veiculosDeExibicao).toEqual(['Cinema']);
  });

  it('rejeita atributos específicos com tipo ou valor inválido', () => {
    const doc = new FabricaDocumentario(registro(), gateways());
    const anim = new FabricaAnimacao(registro(), gateways());

    expect(() => doc.criarProjeto(dados({ atributosEspecificos: { tema: 123 } }))).toThrow(
      /"tema" deve ser um texto/
    );
    expect(() => doc.criarProjeto(dados({ atributosEspecificos: { entrevistados: ['ok', 5] } }))).toThrow(
      /"entrevistados" deve ser uma lista de textos/
    );
    expect(() => doc.criarProjeto(dados({ atributosEspecificos: { entrevistados: 'não é lista' } }))).toThrow(
      /lista de textos/
    );
    expect(() => anim.criarProjeto(dados({ atributosEspecificos: { tecnica: 'HOLOGRAMA' } }))).toThrow(/"tecnica"/);
  });

  it('FabricaPadrao cria o projeto genérico, sem atributos específicos, e ignora atributosEspecificos', () => {
    const fabrica = new FabricaPadrao(registro(), gateways());

    const projeto = fabrica.criarProjeto(
      dados({
        papeisObrigatorios: [{ papel: PapelTecnico.EDITOR, peso: 1 }],
        atributosEspecificos: { qualquerCoisa: 'ignorado' }
      })
    );

    expect(projeto.constructor).toBe(Projeto);
    expect(projeto.papeisObrigatorios).toHaveLength(1);
  });

  it('o tipo PADRAO não define papéis: sem papéis na requisição, o projeto fica sem papéis', () => {
    const projeto = new FabricaPadrao(registro(), gateways()).criarProjeto(dados());

    expect(projeto.papeisObrigatorios).toEqual([]);
  });
});

describe('Factory Method: cada tipo de projeto fabrica os seus próprios componentes', () => {
  it('as subclasses de Projeto devolvem o validador, recomendador e relatório do seu tipo', () => {
    expect(new ProjetoDocumentario().criarValidador()).toBeInstanceOf(ValidadorDocumentario);
    expect(new ProjetoDocumentario().criarRecomendador()).toBeInstanceOf(RecomendadorDocumentario);
    expect(new ProjetoDocumentario().criarGeradorRelatorio()).toBeInstanceOf(GeradorRelatorioDocumentario);

    expect(new ProjetoAnimacao().criarValidador()).toBeInstanceOf(ValidadorAnimacao);
    expect(new ProjetoAnimacao().criarRecomendador()).toBeInstanceOf(RecomendadorAnimacao);
    expect(new ProjetoAnimacao().criarGeradorRelatorio()).toBeInstanceOf(GeradorRelatorioAnimacao);

    expect(new ProjetoPublicitario().criarValidador()).toBeInstanceOf(ValidadorPublicitario);
    expect(new ProjetoPublicitario().criarRecomendador()).toBeInstanceOf(RecomendadorPublicitario);
    expect(new ProjetoPublicitario().criarGeradorRelatorio()).toBeInstanceOf(GeradorRelatorioPublicitario);
  });

  it('o projeto base devolve os componentes genéricos', () => {
    const projeto = new Projeto();

    expect(projeto.criarValidador().constructor).toBe(VisitanteValidacaoConsistencia);
    expect(projeto.criarRecomendador().constructor).toBe(FiltragemColaborativaStrategy);
    expect(projeto.criarGeradorRelatorio().constructor).toBe(VisitanteGeradorRelatorio);
    expect(projeto.descricaoEspecifica()).toBe('');
  });

  it('descricaoEspecifica resume os atributos próprios de cada tipo (inclusive quando as listas estão vazias)', () => {
    const doc = new ProjetoDocumentario();
    doc.tema = 'Rios';
    doc.entrevistados = ['A', 'B'];
    const anim = new ProjetoAnimacao();
    const pub = new ProjetoPublicitario();
    pub.marcaCliente = 'Marca X';

    expect(doc.descricaoEspecifica()).toBe('Tema: Rios; 2 entrevistado(s) previsto(s).');
    expect(anim.descricaoEspecifica()).toContain('softwares exigidos: nenhum');
    anim.softwaresExigidos = ['Blender'];
    expect(anim.descricaoEspecifica()).toContain('softwares exigidos: Blender');
    expect(pub.descricaoEspecifica()).toContain('veículos: nenhum');
    pub.veiculosDeExibicao = ['TV', 'Cinema'];
    expect(pub.descricaoEspecifica()).toBe('Marca: Marca X; veículos: TV, Cinema.');
  });
});
