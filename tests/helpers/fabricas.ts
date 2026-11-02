import { FabricaPadrao } from '../../src/domain/factories/fabricas-concretas';
import { GatewaysNotificacao } from '../../src/domain/factories/fabrica-projeto.interface';
import { criarRegistroPadraoDePrototipos } from '../../src/domain/prototypes/modelos-padrao';

export function criarGatewaysEspioes() {
  const email = { enviar: jest.fn() };
  const mensagens = { enviar: jest.fn() };
  const gateways: GatewaysNotificacao = { email, mensagens };
  return { email, mensagens, gateways };
}

export function criarFabricaPadrao(): FabricaPadrao {
  return new FabricaPadrao(criarRegistroPadraoDePrototipos(), criarGatewaysEspioes().gateways);
}
