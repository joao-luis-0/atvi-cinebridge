import { SistemaRecomendacao } from '../../src/application/sistema-recomendacao';
import { GerenciadorNotificacoes } from '../../src/application/gerenciador-notificacoes';
import { ComporEquipeRequestDTO } from '../../src/application/dto/compor-equipe.dto';
import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPadrao,
  FabricaPublicitario
} from '../../src/domain/factories/fabricas-concretas';
import { FabricaProjeto } from '../../src/domain/factories/fabrica-projeto.interface';
import { criarRegistroPadraoDePrototipos } from '../../src/domain/prototypes/modelos-padrao';
import { OrquestradorPadrao } from '../../src/domain/orchestration/orquestrador-padrao';
import { Projeto } from '../../src/domain/entities/projeto';
import { ProjetoDocumentario } from '../../src/domain/entities/projeto-documentario';
import { ProjetoAnimacao } from '../../src/domain/entities/projeto-animacao';
import { ProjetoPublicitario } from '../../src/domain/entities/projeto-publicitario';
import {
  PapelTecnico,
  TipoCaptacao,
  TipoEstrategiaRecomendacao,
  TipoProjeto
} from '../../src/domain/entities/enums';
import { OrcamentoReduzidoStrategy } from '../../src/domain/strategies/orcamento-reduzido.strategy';
import { VisitanteGeradorRelatorio } from '../../src/domain/visitors/relatorio/gerador-relatorio.visitor';
import { VisitanteValidacaoConsistencia } from '../../src/domain/visitors/validacao/validacao-consistencia.visitor';
import { criarGatewaysEspioes } from '../helpers/fabricas';
import { mapearProfissional } from '../../src/application/mappers/compor-equipe.mapper';

const PAPEIS_BASICOS = [
  { papel: PapelTecnico.DIRETOR, peso: 0.5 },
  { papel: PapelTecnico.EDITOR, peso: 0.5 }
];

function montarSistema() {
  const espioes = criarGatewaysEspioes();
  const prototipos = criarRegistroPadraoDePrototipos();
  const fabricas: FabricaProjeto[] = [
    new FabricaDocumentario(prototipos, espioes.gateways),
    new FabricaAnimacao(prototipos, espioes.gateways),
    new FabricaPublicitario(prototipos, espioes.gateways),
    new FabricaPadrao(prototipos, espioes.gateways)
  ];
  const notificacoes = new GerenciadorNotificacoes();
  const sistema = new SistemaRecomendacao(new Map(fabricas.map((f) => [f.tipoProjeto, f])), notificacoes);
  return { sistema, espioes, notificacoes };
}

function requisicao(tipo: TipoProjeto | undefined, extra: Partial<ComporEquipeRequestDTO> = {}): ComporEquipeRequestDTO {
  const local = { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' };
  return {
    tipoProjeto: tipo,
    projeto: {
      nome: 'Obra X',
      genero: 'Drama',
      duracaoEstimadaMinutos: 10,
      orcamentoTotal: 100000,
      dataEntrega: '2026-12-01',
      tipoCaptacao: TipoCaptacao.FICCAO,
      localizacaoFilmagem: local,
      papeisObrigatorios: PAPEIS_BASICOS
    },
    profissionaisDisponiveis: [
      {
        id: 'prof-dir',
        nome: 'Diana',
        especialidades: [PapelTecnico.DIRETOR],
        valorMinimo: 2000,
        valorMaximo: 9000,
        localizacao: local,
        avaliacoes: [{ nota: 5 }]
      },
      {
        id: 'prof-edit',
        nome: 'Edu',
        especialidades: [PapelTecnico.EDITOR],
        valorMinimo: 2000,
        valorMaximo: 9000,
        localizacao: local,
        avaliacoes: [{ nota: 4 }]
      }
    ],
    ...extra
  };
}

let logSilenciado: jest.SpyInstance;
beforeAll(() => {
  logSilenciado = jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterAll(() => logSilenciado.mockRestore());

describe('Alternar a fábrica altera projeto, recomendação, validação e notificação, sem mexer no orquestrador', () => {
  it('documentário', async () => {
    const { sistema, espioes } = montarSistema();

    const resultado = await sistema.recomendar(
      requisicao(TipoProjeto.DOCUMENTARIO, {
        projeto: { ...requisicao(undefined).projeto, atributosEspecificos: { tema: 'Rios' } }
      })
    );

    expect(resultado.recomendacao.projeto).toBeInstanceOf(ProjetoDocumentario);
    expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_DOCUMENTARIO);
    expect(resultado.validacao).toEqual({ valido: true, erros: [] });
    expect(resultado.relatorio.metricasEspecificas).toMatchObject({ tema: 'Rios', entrevistadosPrevistos: 0 });
    const textos = espioes.mensagens.enviar.mock.calls.map((c) => c[1] as string);
    expect(textos).toHaveLength(2);
    expect(textos.every((t) => t.includes('documentário') && t.includes('Tema: Rios'))).toBe(true);
  });

  it('animação', async () => {
    const { sistema, espioes } = montarSistema();

    const resultado = await sistema.recomendar(requisicao(TipoProjeto.ANIMACAO));

    expect(resultado.recomendacao.projeto).toBeInstanceOf(ProjetoAnimacao);
    expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_ANIMACAO);
    // os papéis informados não incluem o especialista em efeitos visuais, exigido para animação
    expect(resultado.validacao.valido).toBe(false);
    expect(resultado.validacao.erros.join(' ')).toContain(PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS);
    expect(resultado.relatorio.metricasEspecificas).toMatchObject({ tecnica: 'ANIMACAO_3D', softwaresExigidos: 2 });
    const textos = espioes.mensagens.enviar.mock.calls.map((c) => c[1] as string);
    expect(textos.every((t) => t.includes('projeto de animação') && t.includes('Blender'))).toBe(true);
  });

  it('publicitário', async () => {
    const { sistema, espioes } = montarSistema();

    const resultado = await sistema.recomendar(requisicao(TipoProjeto.PUBLICITARIO));

    expect(resultado.recomendacao.projeto).toBeInstanceOf(ProjetoPublicitario);
    expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.RECOMENDADOR_PUBLICITARIO);
    expect(resultado.validacao.valido).toBe(false);
    expect(resultado.validacao.erros).toContain('Projeto publicitário exige a marca do cliente.');
    expect(resultado.validacao.erros.join(' ')).toContain(PapelTecnico.DIRETOR_DE_FOTOGRAFIA);
    expect(resultado.relatorio.metricasEspecificas).toHaveProperty('custoPorSegundo');
    const textos = espioes.mensagens.enviar.mock.calls.map((c) => c[1] as string);
    expect(textos.every((t) => t.includes('filme publicitário'))).toBe(true);
  });

  it('sem tipo de projeto (ou PADRAO): comportamento original, com filtragem colaborativa e notificação genérica', async () => {
    const { sistema, espioes } = montarSistema();

    const semTipo = await sistema.recomendar(requisicao(undefined));
    const padrao = await sistema.recomendar(requisicao(TipoProjeto.PADRAO));

    for (const resultado of [semTipo, padrao]) {
      expect(resultado.recomendacao.projeto.constructor).toBe(Projeto);
      expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA);
      expect(resultado.validacao).toEqual({ valido: true, erros: [] });
      expect(resultado.relatorio.metricasEspecificas).toBeUndefined();
    }
    const textos = espioes.mensagens.enviar.mock.calls.map((c) => c[1] as string);
    expect(textos.every((t) => t.startsWith('Você recebeu um novo convite para o papel de'))).toBe(true);
  });

  it('o mesmo orquestrador, com a mesma entrada, produz validações diferentes conforme a fábrica', async () => {
    const { sistema } = montarSistema();

    const erros = async (tipo: TipoProjeto) => (await sistema.recomendar(requisicao(tipo))).validacao.erros;
    const doc = await erros(TipoProjeto.DOCUMENTARIO);
    const anim = await erros(TipoProjeto.ANIMACAO);
    const pub = await erros(TipoProjeto.PUBLICITARIO);
    const padrao = await erros(TipoProjeto.PADRAO);

    expect(doc).toEqual(['Documentário exige um tema definido.']);
    expect(anim).toHaveLength(1);
    expect(pub).toHaveLength(2);
    expect(padrao).toEqual([]);
  });
});

describe('SistemaRecomendacao', () => {
  it('a estratégia informada pelo produtor prevalece sobre o recomendador da fábrica', async () => {
    const { sistema } = montarSistema();

    const resultado = await sistema.recomendar(
      requisicao(TipoProjeto.ANIMACAO, { estrategia: TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO })
    );

    expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO);
    expect(resultado.recomendacao.projeto).toBeInstanceOf(ProjetoAnimacao);
  });

  it('sem papéis na requisição, o tipo usa os papéis do seu modelo (protótipo)', async () => {
    const { sistema } = montarSistema();
    const base = requisicao(TipoProjeto.ANIMACAO);

    const resultado = await sistema.recomendar({ ...base, projeto: { ...base.projeto, papeisObrigatorios: undefined } });

    expect(resultado.recomendacao.projeto.papeisObrigatorios).toHaveLength(5);
    expect(resultado.validacao.erros.join(' ')).toContain('Papel obrigatório não preenchido');
  });

  it('o tipo PADRAO sem papéis na requisição é rejeitado', async () => {
    const { sistema } = montarSistema();
    const base = requisicao(TipoProjeto.PADRAO);

    await expect(
      sistema.recomendar({ ...base, projeto: { ...base.projeto, papeisObrigatorios: undefined } })
    ).rejects.toThrow(/Nenhum papel obrigatório/);
  });

  it('tipo de projeto sem fábrica registrada é rejeitado com mensagem clara', async () => {
    const sistema = new SistemaRecomendacao(new Map(), new GerenciadorNotificacoes());

    await expect(sistema.recomendar(requisicao(TipoProjeto.ANIMACAO))).rejects.toThrow(
      /Nenhuma fábrica registrada para o tipo de projeto: ANIMACAO/
    );
  });

  it('aceita o orquestrador com margem de segurança', async () => {
    const { sistema } = montarSistema();

    const resultado = await sistema.recomendar(requisicao(TipoProjeto.PADRAO, { orquestrador: 'MARGEM_SEGURANCA' }));

    expect(resultado.recomendacao.alocacoes).toHaveLength(2);
  });

  it('notifica também os observadores compartilhados (auditoria), além do notificador da fábrica', async () => {
    const { sistema, notificacoes } = montarSistema();

    await sistema.recomendar(requisicao(TipoProjeto.PADRAO));

    expect(notificacoes.auditoriaGateway.registros.map((r) => r.acao)).toContain('RECOMENDACAO_GERADA');
  });

  it('uma falha no notificador da fábrica não derruba a recomendação já pronta', async () => {
    const { sistema, espioes } = montarSistema();
    espioes.mensagens.enviar.mockRejectedValue(new Error('mensageria fora do ar'));
    const erroSilenciado = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const resultado = await sistema.recomendar(requisicao(TipoProjeto.PADRAO));

    expect(resultado.recomendacao.alocacoes).toHaveLength(2);
    expect(erroSilenciado).toHaveBeenCalled();
    erroSilenciado.mockRestore();
  });
});

describe('Extensibilidade: um novo tipo de projeto entra com uma nova fábrica, sem alterar o orquestrador', () => {
  it('o mesmo OrquestradorPadrao usa validador, recomendador, relatório e notificador de uma fábrica nova', async () => {
    const notificar = jest.fn();
    const validadorCustomizado = new VisitanteValidacaoConsistencia();
    jest.spyOn(validadorCustomizado, 'obterResultado').mockReturnValue({
      valido: false,
      erros: ['Regra exclusiva de realidade virtual']
    });

    // um tipo novo (ex.: realidade virtual), definido fora do núcleo do sistema
    const fabricaRealidadeVirtual: FabricaProjeto = {
      tipoProjeto: TipoProjeto.PADRAO,
      criarProjeto: () => new Projeto(),
      criarValidador: () => validadorCustomizado,
      criarRecomendador: () => new OrcamentoReduzidoStrategy(),
      criarGeradorRelatorio: () => new VisitanteGeradorRelatorio(),
      criarNotificador: () => ({ notificar })
    };

    const base = requisicao(TipoProjeto.PADRAO);
    const projeto = fabricaRealidadeVirtual.criarProjeto(base.projeto);
    projeto.nome = 'Experiência em RV';
    projeto.orcamentoTotal = 100000;
    projeto.papeisObrigatorios = [];
    const orquestrador = new OrquestradorPadrao(fabricaRealidadeVirtual);

    const resultado = await orquestrador.orquestrar({
      projeto,
      profissionaisDisponiveis: base.profissionaisDisponiveis.map(mapearProfissional)
    });

    expect(resultado.recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO);
    expect(resultado.validacao.erros).toEqual(['Regra exclusiva de realidade virtual']);
    expect(notificar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'RECOMENDACAO_GERADA', recomendacao: resultado.recomendacao })
    );
  });
});
