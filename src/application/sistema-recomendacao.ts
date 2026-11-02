import { PacoteServico, ServicoAtomico, ServicoProjeto, coletarPapeisServico } from '../domain/services/servico-projeto';
import type { ServicoProjetoDTO } from './dto/compor-equipe.dto';
import type { AdaptadorArmazenamento, AdaptadorPagamento, AdaptadorProfissional } from '../infrastructure/adapters/adaptadores';
import { AdaptadorS3, AdaptadorStripe, AdaptadorInterno } from '../infrastructure/adapters/adaptadores';
import type { RecomendacaoStrategy } from './decorators/recomendacao-decorators';
import { FabricaProjeto } from '../domain/factories/fabrica-projeto.interface';
import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPadrao,
  FabricaPublicitario
} from '../domain/factories/fabricas-concretas';
import { criarRegistroPadraoDePrototipos } from '../domain/prototypes/modelos-padrao';
import { OrquestradorEquipe, ResultadoOrquestracao } from '../domain/orchestration/orquestrador-equipe';
import { OrquestradorPadrao } from '../domain/orchestration/orquestrador-padrao';
import { OrquestradorComMargemSeguranca } from '../domain/orchestration/orquestrador-margem-seguranca';
import { criarEstrategiaRecomendacao } from '../domain/strategies/estrategia-recomendacao.factory';
import { PapelTecnico, TipoProjeto } from '../domain/entities/enums';
import { PapelObrigatorio } from '../domain/entities/papel-obrigatorio';
import { PerfilProfissional } from '../infrastructure/adapters/adaptadores';
import { ProfissionalInputDTO } from './dto/compor-equipe.dto';
import { GerenciadorNotificacoes } from './gerenciador-notificacoes';
import { mapearProfissional } from './mappers/compor-equipe.mapper';
import { ComporEquipeRequestDTO, TipoOrquestrador } from './dto/compor-equipe.dto';

type ConstrutorOrquestrador = new (fabrica: FabricaProjeto) => OrquestradorEquipe;

const ORQUESTRADORES: Record<TipoOrquestrador, ConstrutorOrquestrador> = {
  PADRAO: OrquestradorPadrao,
  MARGEM_SEGURANCA: OrquestradorComMargemSeguranca
};

/**
 * Ponto de entrada do microsserviço (ATVII): ao receber uma solicitação,
 * identifica o tipo de projeto, seleciona a fábrica correspondente e usa
 * essa fábrica para criar todo o ecossistema de objetos da execução. Os
 * tipos disponíveis são os das fábricas registradas; adicionar um tipo novo
 * é registrar uma nova fábrica, sem mexer no orquestrador.
 */
export class SistemaRecomendacao implements RecomendacaoStrategy {
  constructor(
    private readonly fabricas: ReadonlyMap<TipoProjeto, FabricaProjeto>,
    private readonly notificacoes: GerenciadorNotificacoes,
    public readonly adaptadorArmazenamento: AdaptadorArmazenamento = new AdaptadorS3(),
    public readonly adaptadorPagamento: AdaptadorPagamento = new AdaptadorStripe(),
    public readonly adaptadorProfissional: AdaptadorProfissional = new AdaptadorInterno()
  ) {}

  salvarArquivo(conteudo: Buffer, metadados: Record<string, unknown>): Promise<string> {
    return this.adaptadorArmazenamento.salvarArquivo(conteudo, metadados);
  }
  efetuarPagamento(valor: number, origem: string, destino: string): Promise<string> {
    return this.adaptadorPagamento.efetuarPagamento(valor, origem, destino);
  }
  listarProfissionais(criterios: string) {
    return this.adaptadorProfissional.listarProfissionais(criterios);
  }
  recuperarArquivo(id: string): Promise<Buffer> {
    return this.adaptadorArmazenamento.recuperarArquivo(id);
  }
  listarArquivos(prefixo: string): Promise<string[]> {
    return this.adaptadorArmazenamento.listarArquivos(prefixo);
  }
  consultarPagamento(id: string): Promise<string> {
    return this.adaptadorPagamento.consultarPagamento(id);
  }
  verificarPagamento(id: string): Promise<boolean> {
    return this.adaptadorPagamento.verificarPagamento(id);
  }
  obterPerfilProfissional(id: string) {
    return this.adaptadorProfissional.obterPerfilProfissional(id);
  }
  registrarAvaliacao(id: string, avaliacao: number): Promise<void> {
    return this.adaptadorProfissional.registrarAvaliacao(id, avaliacao);
  }


  /* ATVII preserved */

  async recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao> {
    const fabrica = this.selecionarFabrica(request.tipoProjeto ?? TipoProjeto.PADRAO);

    const projeto = fabrica.criarProjeto(request.projeto);
    if (request.projeto.servicoPrincipal) {
      projeto.servicoPrincipal = criarServico(request.projeto.servicoPrincipal);
      if (!projeto.validarServicos()) throw new Error('Estrutura de serviços inválida.');
      // Integra os papéis definidos em qualquer profundidade do Composite.
      const presentes = new Set(projeto.papeisObrigatorios.map((p) => p.papel));
      for (const papel of coletarPapeisServico(projeto.servicoPrincipal)) {
        if (!presentes.has(papel)) {
          const obrigatorio = new PapelObrigatorio();
          obrigatorio.papel = papel;
          obrigatorio.peso = 1;
          projeto.papeisObrigatorios.push(obrigatorio);
          presentes.add(papel);
        }
      }
      if (projeto.calcularCustoTotal() > projeto.orcamentoTotal) {
        throw new Error('Custo dos serviços excede o orçamento do projeto.');
      }
      const diasDisponiveis = Math.ceil((projeto.dataEntrega.getTime() - Date.now()) / 86_400_000);
      if (projeto.obterPrazoServicos() > Math.max(0, diasDisponiveis)) {
        throw new Error('Prazo dos serviços excede a data de entrega do projeto.');
      }
    }
    if (projeto.papeisObrigatorios.length === 0) {
      throw new Error('Nenhum papel obrigatório informado e o tipo de projeto não define papéis padrão.');
    }

    const orquestrador = new ORQUESTRADORES[request.orquestrador ?? 'PADRAO'](fabrica);
    const resultado = await orquestrador.orquestrar({
      projeto,
      profissionaisDisponiveis: (await this.resolverProfissionais(request, projeto.localizacaoFilmagem)).map(mapearProfissional),
      estrategia: request.estrategia ? criarEstrategiaRecomendacao(request.estrategia) : undefined
    });

    await this.notificacoes.notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao: resultado.recomendacao });

    return resultado;
  }


  private async resolverProfissionais(
    request: ComporEquipeRequestDTO,
    localizacao: { cidade: string; uf: string; pais: string }
  ): Promise<ProfissionalInputDTO[]> {
    const locais = request.profissionaisDisponiveis ?? [];
    if (!request.consultarProfissionaisExternos) return locais;
    try {
      const perfis = await this.adaptadorProfissional.listarProfissionais(request.filtroProfissionais ?? '');
      const externos = perfis.map((perfil: PerfilProfissional): ProfissionalInputDTO => {
        const papeis = perfil.especialidades ?? perfil.competencias
          .filter((nome): nome is PapelTecnico => Object.values(PapelTecnico).includes(nome as PapelTecnico));
        return {
          id: perfil.id, nome: perfil.nome,
          especialidades: papeis,
          valorMinimo: perfil.valorMinimo ?? 0,
          valorMaximo: perfil.valorMaximo ?? perfil.valorMinimo ?? 0,
          localizacao: perfil.localizacao ?? localizacao,
          competencias: perfil.competenciasDetalhadas ?? [],
          avaliacoes: perfil.avaliacoes?.map((nota) => ({ nota })) ?? []
        };
      });
      return [...new Map([...externos, ...locais].map((p) => [p.id, p])).values()];
    } catch (erro) {
      if (locais.length) return locais;
      throw new Error(`Cadastro externo indisponível e sem profissionais locais: ${String(erro)}`);
    }
  }

  private selecionarFabrica(tipo: TipoProjeto): FabricaProjeto {
    const fabrica = this.fabricas.get(tipo);
    if (!fabrica) {
      throw new Error(`Nenhuma fábrica registrada para o tipo de projeto: ${tipo}`);
    }
    return fabrica;
  }
}

export interface ConfiguracaoAdaptadores {
  armazenamento?: AdaptadorArmazenamento;
  pagamento?: AdaptadorPagamento;
  profissional?: AdaptadorProfissional;
}

export function criarSistemaRecomendacaoPadrao(
  notificacoes: GerenciadorNotificacoes,
  adaptadores: ConfiguracaoAdaptadores = {}
): SistemaRecomendacao {
  const prototipos = criarRegistroPadraoDePrototipos();
  const gateways = { email: notificacoes.emailGateway, mensagens: notificacoes.mensagensGateway };

  const fabricas: FabricaProjeto[] = [
    new FabricaDocumentario(prototipos, gateways),
    new FabricaAnimacao(prototipos, gateways),
    new FabricaPublicitario(prototipos, gateways),
    new FabricaPadrao(prototipos, gateways)
  ];

  return new SistemaRecomendacao(
    new Map(fabricas.map((f) => [f.tipoProjeto, f])), notificacoes,
    adaptadores.armazenamento ?? new AdaptadorS3(),
    adaptadores.pagamento ?? new AdaptadorStripe(),
    adaptadores.profissional ?? new AdaptadorInterno()
  );
}

export function criarServico(dto: ServicoProjetoDTO): ServicoProjeto {
  if (dto.tipo === 'ATOMICO') return new ServicoAtomico(dto.nome, dto.custo, dto.prazoDias, dto.papel);
  return new PacoteServico(dto.nome, dto.servicos.map(criarServico));
}
