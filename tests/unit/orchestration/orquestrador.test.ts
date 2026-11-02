import { criarFabricaPadrao } from '../../helpers/fabricas';
import { OrquestradorPadrao } from '../../../src/domain/orchestration/orquestrador-padrao';
import { OrquestradorComMargemSeguranca } from '../../../src/domain/orchestration/orquestrador-margem-seguranca';
import { FiltragemColaborativaStrategy } from '../../../src/domain/strategies/filtragem-colaborativa.strategy';
import { PapelTecnico, StatusRecomendacao, TipoEstrategiaRecomendacao } from '../../../src/domain/entities/enums';
import { criarAvaliacao, criarProfissional, criarPapelObrigatorio, criarProjeto } from '../strategies/helpers';

describe('OrquestradorEquipe (Template Method) - fluxo invariante', () => {
  it('ambas as implementações produzem uma Recomendacao com a mesma forma (mesmo esqueleto)', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    const profissional = criarProfissional({
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 2000,
      avaliacoes: [criarAvaliacao(4)]
    });
    const estrategia = new FiltragemColaborativaStrategy();

    const contexto = { projeto, profissionaisDisponiveis: [profissional], estrategia };

    const recomendacaoPadrao = new OrquestradorPadrao(criarFabricaPadrao()).compor(contexto);
    const recomendacaoComMargem = new OrquestradorComMargemSeguranca(criarFabricaPadrao()).compor(contexto);

    for (const recomendacao of [recomendacaoPadrao, recomendacaoComMargem]) {
      expect(recomendacao.projeto).toBe(projeto);
      expect(recomendacao.estrategiaUtilizada).toBe(TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA);
      expect(recomendacao.status).toBe(StatusRecomendacao.EM_ANDAMENTO);
      expect(recomendacao.alocacoes).toHaveLength(1);
      expect(recomendacao.alocacoes[0].papel).toBe(PapelTecnico.EDITOR);
      expect(recomendacao.alocacoes[0].convite?.status).toBeDefined();
    }
  });

  it('um papel sem candidato válido fica sem alocação, gerando recomendação parcial', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    // profissional caro demais para o orçamento do papel
    const profissional = criarProfissional({
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 50000,
      avaliacoes: [criarAvaliacao(5)]
    });
    const estrategia = new FiltragemColaborativaStrategy();

    const recomendacao = new OrquestradorPadrao(criarFabricaPadrao()).compor({
      projeto,
      profissionaisDisponiveis: [profissional],
      estrategia
    });

    expect(recomendacao.alocacoes).toHaveLength(0);
  });
});

describe('OrquestradorEquipe - etapas divergem entre subclasses', () => {
  it('OrquestradorComMargemSeguranca rejeita um candidato que o OrquestradorPadrao aceita, no limite do orçamento', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]); // orçamento do papel = 10000

    // Custa 9500 -> cabe nos 10000 do Padrão, mas não cabe nos 9000 (90%) da margem de segurança
    const profissional = criarProfissional({
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 9500,
      avaliacoes: [criarAvaliacao(4)]
    });
    const estrategia = new FiltragemColaborativaStrategy();
    const contexto = { projeto, profissionaisDisponiveis: [profissional], estrategia };

    const recomendacaoPadrao = new OrquestradorPadrao(criarFabricaPadrao()).compor(contexto);
    const recomendacaoComMargem = new OrquestradorComMargemSeguranca(criarFabricaPadrao()).compor(contexto);

    expect(recomendacaoPadrao.alocacoes).toHaveLength(1);
    expect(recomendacaoComMargem.alocacoes).toHaveLength(0);
  });

  it('normalizarDadosEntrada descarta profissionais com dados inconsistentes (faixa de preço invertida)', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    const profissionalInconsistente = criarProfissional({
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 9000,
      valorMaximo: 1000, // inconsistente: mínimo maior que o máximo
      avaliacoes: [criarAvaliacao(4)]
    });
    const estrategia = new FiltragemColaborativaStrategy();

    const recomendacao = new OrquestradorPadrao(criarFabricaPadrao()).compor({
      projeto,
      profissionaisDisponiveis: [profissionalInconsistente],
      estrategia
    });

    expect(recomendacao.alocacoes).toHaveLength(0);
  });

  it('não sugere um profissional para um papel fora de suas especialidades', () => {
    const papelDiretor = criarPapelObrigatorio(PapelTecnico.DIRETOR, 0.5);
    const papelEditor = criarPapelObrigatorio(PapelTecnico.EDITOR, 0.5);
    const projeto = criarProjeto(10000, [papelDiretor, papelEditor]);

    // único profissional disponível, mas só especializado em DIRETOR
    const profissional = criarProfissional({
      especialidades: [PapelTecnico.DIRETOR],
      valorMinimo: 1000,
      avaliacoes: [criarAvaliacao(5)]
    });
    const estrategia = new FiltragemColaborativaStrategy();

    const recomendacao = new OrquestradorPadrao(criarFabricaPadrao()).compor({
      projeto,
      profissionaisDisponiveis: [profissional],
      estrategia
    });

    // só o papel de DIRETOR deve ter sido preenchido
    expect(recomendacao.alocacoes).toHaveLength(1);
    expect(recomendacao.alocacoes[0].papel).toBe(PapelTecnico.DIRETOR);
  });

  it('normalizarDadosEntrada remove profissionais duplicados (mesmo id) antes de ranquear', () => {
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 1);
    const projeto = criarProjeto(10000, [papel]);
    const profissional = criarProfissional({
      id: 'duplicado-1',
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 2000,
      avaliacoes: [criarAvaliacao(4)]
    });
    const estrategia = new FiltragemColaborativaStrategy();


    const orquestrador = new OrquestradorPadrao(criarFabricaPadrao()) as unknown as {
      normalizarDadosEntrada(profissionais: typeof profissional[]): typeof profissional[];
    };

    const normalizados = orquestrador.normalizarDadosEntrada([profissional, profissional]);
    expect(normalizados).toHaveLength(1);

    // e o fluxo completo continua funcionando normalmente
    const recomendacao = new OrquestradorPadrao(criarFabricaPadrao()).compor({
      projeto,
      profissionaisDisponiveis: [profissional, profissional],
      estrategia
    });
    expect(recomendacao.alocacoes).toHaveLength(1);
  });

  it('orcamentoDoPapel retorna 0 quando o projeto não tem peso total de papéis', () => {
    // papel com peso 0 -> pesoTotalPapeis() do projeto é 0 -> orçamento do papel é 0
    const papel = criarPapelObrigatorio(PapelTecnico.EDITOR, 0);
    const projeto = criarProjeto(10000, [papel]);
    const profissional = criarProfissional({
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 1000,
      avaliacoes: [criarAvaliacao(5)]
    });
    const estrategia = new FiltragemColaborativaStrategy();

    const recomendacao = new OrquestradorPadrao(criarFabricaPadrao()).compor({
      projeto,
      profissionaisDisponiveis: [profissional],
      estrategia
    });

    // orçamento 0 para o papel -> ninguém cabe -> papel fica sem alocação
    expect(recomendacao.alocacoes).toHaveLength(0);
  });
});
