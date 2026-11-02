import { FabricaProjeto, GatewaysNotificacao } from './fabrica-projeto.interface';
import { DadosProjeto } from './dados-projeto';
import { Projeto } from '../entities/projeto';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Localizacao } from '../entities/localizacao';
import { TipoProjeto } from '../entities/enums';
import { RegistroPrototiposProjeto } from '../prototypes/registro-prototipos-projeto';
import { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import { ObservadorEvento } from '../events/observador-evento.interface';


export abstract class FabricaProjetoBase implements FabricaProjeto {
  abstract readonly tipoProjeto: TipoProjeto;
  private modeloCache?: Projeto;

  protected constructor(
    protected readonly prototipos: RegistroPrototiposProjeto,
    protected readonly gateways: GatewaysNotificacao
  ) {}

  criarProjeto(dados: DadosProjeto): Projeto {
    const projeto = this.prototipos.criar(this.tipoProjeto);

    projeto.nome = dados.nome;
    projeto.genero = dados.genero;
    projeto.duracaoEstimadaMinutos = dados.duracaoEstimadaMinutos;
    projeto.orcamentoTotal = dados.orcamentoTotal;
    projeto.dataEntrega = new Date(dados.dataEntrega);
    projeto.tipoCaptacao = dados.tipoCaptacao;
    projeto.localizacaoFilmagem = Object.assign(new Localizacao(), dados.localizacaoFilmagem);

    if (dados.papeisObrigatorios && dados.papeisObrigatorios.length > 0) {
      projeto.papeisObrigatorios = dados.papeisObrigatorios.map((p) =>
        Object.assign(new PapelObrigatorio(), { papel: p.papel, peso: p.peso })
      );
    }

    if (dados.atributosEspecificos) {
      this.aplicarAtributosEspecificos(projeto, dados.atributosEspecificos);
    }
    return projeto;
  }

  criarValidador(): VisitanteValidador {
    return this.modelo().criarValidador();
  }

  criarRecomendador(): EstrategiaRecomendacao {
    return this.modelo().criarRecomendador();
  }

  criarGeradorRelatorio(): VisitanteRelatorio {
    return this.modelo().criarGeradorRelatorio();
  }

  abstract criarNotificador(): ObservadorEvento;

  protected aplicarAtributosEspecificos(_projeto: Projeto, _atributos: Record<string, unknown>): void {
  }

  private modelo(): Projeto {
    this.modeloCache ??= this.prototipos.criar(this.tipoProjeto);
    return this.modeloCache;
  }

  protected lerTexto(atributos: Record<string, unknown>, chave: string): string | undefined {
    const valor = atributos[chave];
    if (valor === undefined) {
      return undefined;
    }
    if (typeof valor !== 'string') {
      throw new Error(`Atributo específico inválido: "${chave}" deve ser um texto.`);
    }
    return valor;
  }

  protected lerListaDeTextos(atributos: Record<string, unknown>, chave: string): string[] | undefined {
    const valor = atributos[chave];
    if (valor === undefined) {
      return undefined;
    }
    if (!Array.isArray(valor) || valor.some((item) => typeof item !== 'string')) {
      throw new Error(`Atributo específico inválido: "${chave}" deve ser uma lista de textos.`);
    }
    return valor as string[];
  }
}
