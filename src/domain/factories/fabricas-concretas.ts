import { FabricaProjetoBase } from './fabrica-projeto-base';
import { GatewaysNotificacao } from './fabrica-projeto.interface';
import { RegistroPrototiposProjeto } from '../prototypes/registro-prototipos-projeto';
import { Projeto } from '../entities/projeto';
import { ProjetoDocumentario } from '../entities/projeto-documentario';
import { ProjetoAnimacao } from '../entities/projeto-animacao';
import { ProjetoPublicitario } from '../entities/projeto-publicitario';
import { TecnicaAnimacao, TipoProjeto } from '../entities/enums';
import { ObservadorEvento } from '../events/observador-evento.interface';
import {
  NotificadorAnimacao,
  NotificadorDocumentario,
  NotificadorPadrao,
  NotificadorPublicitario
} from '../events/observers/notificadores-por-tipo';

export class FabricaDocumentario extends FabricaProjetoBase {
  readonly tipoProjeto = TipoProjeto.DOCUMENTARIO;

  constructor(prototipos: RegistroPrototiposProjeto, gateways: GatewaysNotificacao) {
    super(prototipos, gateways);
  }

  criarNotificador(): ObservadorEvento {
    return new NotificadorDocumentario(this.gateways.email, this.gateways.mensagens);
  }

  protected aplicarAtributosEspecificos(projeto: Projeto, atributos: Record<string, unknown>): void {
    const documentario = projeto as ProjetoDocumentario;
    documentario.tema = this.lerTexto(atributos, 'tema') ?? documentario.tema;
    documentario.entrevistados = this.lerListaDeTextos(atributos, 'entrevistados') ?? documentario.entrevistados;
  }
}

export class FabricaAnimacao extends FabricaProjetoBase {
  readonly tipoProjeto = TipoProjeto.ANIMACAO;

  constructor(prototipos: RegistroPrototiposProjeto, gateways: GatewaysNotificacao) {
    super(prototipos, gateways);
  }

  criarNotificador(): ObservadorEvento {
    return new NotificadorAnimacao(this.gateways.email, this.gateways.mensagens);
  }

  protected aplicarAtributosEspecificos(projeto: Projeto, atributos: Record<string, unknown>): void {
    const animacao = projeto as ProjetoAnimacao;
    const tecnica = this.lerTexto(atributos, 'tecnica');
    if (tecnica !== undefined) {
      if (!Object.values(TecnicaAnimacao).includes(tecnica as TecnicaAnimacao)) {
        throw new Error(`Atributo específico inválido: "tecnica" deve ser uma de ${Object.values(TecnicaAnimacao).join(', ')}.`);
      }
      animacao.tecnica = tecnica as TecnicaAnimacao;
    }
    animacao.softwaresExigidos = this.lerListaDeTextos(atributos, 'softwaresExigidos') ?? animacao.softwaresExigidos;
  }
}

export class FabricaPublicitario extends FabricaProjetoBase {
  readonly tipoProjeto = TipoProjeto.PUBLICITARIO;

  constructor(prototipos: RegistroPrototiposProjeto, gateways: GatewaysNotificacao) {
    super(prototipos, gateways);
  }

  criarNotificador(): ObservadorEvento {
    return new NotificadorPublicitario(this.gateways.email, this.gateways.mensagens);
  }

  protected aplicarAtributosEspecificos(projeto: Projeto, atributos: Record<string, unknown>): void {
    const publicitario = projeto as ProjetoPublicitario;
    publicitario.marcaCliente = this.lerTexto(atributos, 'marcaCliente') ?? publicitario.marcaCliente;
    publicitario.veiculosDeExibicao =
      this.lerListaDeTextos(atributos, 'veiculosDeExibicao') ?? publicitario.veiculosDeExibicao;
  }
}


export class FabricaPadrao extends FabricaProjetoBase {
  readonly tipoProjeto = TipoProjeto.PADRAO;

  constructor(prototipos: RegistroPrototiposProjeto, gateways: GatewaysNotificacao) {
    super(prototipos, gateways);
  }

  criarNotificador(): ObservadorEvento {
    return new NotificadorPadrao(this.gateways.email, this.gateways.mensagens);
  }
}
