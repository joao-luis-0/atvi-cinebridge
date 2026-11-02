import {
  ValidadorAnimacao,
  ValidadorDocumentario,
  ValidadorPublicitario
} from '../../../src/domain/visitors/validacao/validadores-por-tipo';
import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPublicitario
} from '../../../src/domain/factories/fabricas-concretas';
import { criarRegistroPadraoDePrototipos } from '../../../src/domain/prototypes/modelos-padrao';
import { Projeto } from '../../../src/domain/entities/projeto';
import { PapelTecnico } from '../../../src/domain/entities/enums';
import { criarGatewaysEspioes } from '../../helpers/fabricas';
import { criarRecomendacaoCompleta } from '../visitors/helpers';
import { projetoDaFabrica, recomendacaoComTodosOsPapeis } from './por-tipo-helpers';

const fabricaDoc = () => new FabricaDocumentario(criarRegistroPadraoDePrototipos(), criarGatewaysEspioes().gateways);
const fabricaAnim = () => new FabricaAnimacao(criarRegistroPadraoDePrototipos(), criarGatewaysEspioes().gateways);
const fabricaPub = () => new FabricaPublicitario(criarRegistroPadraoDePrototipos(), criarGatewaysEspioes().gateways);

describe('ValidadorDocumentario', () => {
  it('aprova um documentário com tema, diretor e editor', () => {
    const projeto = projetoDaFabrica(fabricaDoc(), { atributosEspecificos: { tema: 'Rios' } });
    const validador = new ValidadorDocumentario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    expect(validador.obterResultado()).toEqual({ valido: true, erros: [] });
  });

  it('reprova um documentário sem tema', () => {
    const projeto = projetoDaFabrica(fabricaDoc());
    const validador = new ValidadorDocumentario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    const resultado = validador.obterResultado();
    expect(resultado.valido).toBe(false);
    expect(resultado.erros).toContain('Documentário exige um tema definido.');
  });

  it('reprova quando o projeto não declara os papéis de diretor e editor', () => {
    const projeto = projetoDaFabrica(fabricaDoc(), {
      papeisObrigatorios: [{ papel: PapelTecnico.SONOPLASTA, peso: 1 }],
      atributosEspecificos: { tema: 'Rios' }
    });
    const validador = new ValidadorDocumentario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    const erros = validador.obterResultado().erros.join(' | ');
    expect(erros).toContain(PapelTecnico.DIRETOR);
    expect(erros).toContain(PapelTecnico.EDITOR);
  });
});

describe('ValidadorAnimacao', () => {
  it('aprova uma animação com efeitos visuais e softwares declarados (padrões do modelo)', () => {
    const projeto = projetoDaFabrica(fabricaAnim());
    const validador = new ValidadorAnimacao();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    expect(validador.obterResultado().valido).toBe(true);
  });

  it('reprova uma animação sem o especialista em efeitos visuais', () => {
    const projeto = projetoDaFabrica(fabricaAnim(), {
      papeisObrigatorios: [{ papel: PapelTecnico.DIRETOR, peso: 1 }]
    });
    const validador = new ValidadorAnimacao();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    expect(validador.obterResultado().erros.join(' ')).toContain(PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS);
  });

  it('reprova uma animação sem nenhum software declarado', () => {
    const projeto = projetoDaFabrica(fabricaAnim(), { atributosEspecificos: { softwaresExigidos: [] } });
    const validador = new ValidadorAnimacao();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    expect(validador.obterResultado().erros).toContain('Animação exige ao menos um software declarado.');
  });
});

describe('ValidadorPublicitario', () => {
  it('aprova um filme publicitário com marca do cliente e diretor de fotografia', () => {
    const projeto = projetoDaFabrica(fabricaPub(), { atributosEspecificos: { marcaCliente: 'Marca X' } });
    const validador = new ValidadorPublicitario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    expect(validador.obterResultado().valido).toBe(true);
  });

  it('reprova sem a marca do cliente e sem diretor de fotografia', () => {
    const projeto = projetoDaFabrica(fabricaPub(), {
      papeisObrigatorios: [{ papel: PapelTecnico.DIRETOR, peso: 1 }]
    });
    const validador = new ValidadorPublicitario();

    recomendacaoComTodosOsPapeis(projeto).aceitar(validador);

    const erros = validador.obterResultado().erros.join(' | ');
    expect(erros).toContain('Projeto publicitário exige a marca do cliente.');
    expect(erros).toContain(PapelTecnico.DIRETOR_DE_FOTOGRAFIA);
  });
});

describe('Validadores por tipo mantêm as regras gerais de consistência', () => {
  it('apontam papel obrigatório sem alocação e orçamento estourado, além das regras do tipo', () => {
    const projeto = projetoDaFabrica(fabricaDoc(), { orcamentoTotal: 1500, atributosEspecificos: { tema: 'Rios' } });
    const validador = new ValidadorDocumentario();

    const recomendacao = recomendacaoComTodosOsPapeis(projeto, 2000);
    recomendacao.alocacoes = recomendacao.alocacoes.slice(0, 1);
    recomendacao.aceitar(validador);

    const erros = validador.obterResultado().erros.join(' | ');
    expect(erros).toContain('Papel obrigatório não preenchido');
    expect(erros).toContain('Orçamento insuficiente');
  });

  it('reprovam um projeto que não é do tipo esperado', () => {
    const projetoGenerico = new Projeto();
    projetoGenerico.orcamentoTotal = 1000;
    projetoGenerico.papeisObrigatorios = [];

    const casos: Array<[ValidadorDocumentario | ValidadorAnimacao | ValidadorPublicitario, string]> = [
      [new ValidadorDocumentario(), 'ProjetoDocumentario'],
      [new ValidadorAnimacao(), 'ProjetoAnimacao'],
      [new ValidadorPublicitario(), 'ProjetoPublicitario']
    ];

    for (const [validador, nomeEsperado] of casos) {
      criarRecomendacaoCompleta(projetoGenerico, []).aceitar(validador);
      expect(validador.obterResultado().erros[0]).toContain(nomeEsperado);
    }
  });

  it('reavalia as regras próprias do tipo a cada projeto visitado', () => {
    const invalido = projetoDaFabrica(fabricaDoc()); // sem tema
    const valido = projetoDaFabrica(fabricaDoc(), { atributosEspecificos: { tema: 'Rios' } });
    const validador = new ValidadorDocumentario();

    recomendacaoComTodosOsPapeis(invalido).aceitar(validador);
    expect(validador.obterResultado().valido).toBe(false);

    recomendacaoComTodosOsPapeis(valido).aceitar(validador);
    expect(validador.obterResultado().erros).not.toContain('Documentário exige um tema definido.');
  });
});
