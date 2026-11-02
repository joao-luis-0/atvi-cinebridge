import { ObservadorEmail } from '../../../src/domain/events/observers/observador-email';
import { ObservadorMensagensInternas } from '../../../src/domain/events/observers/observador-mensagens-internas';
import { ObservadorAuditoria } from '../../../src/domain/events/observers/observador-auditoria';
import { SujeitoEventos } from '../../../src/domain/events/sujeito-eventos';
import { PapelTecnico, StatusConvite } from '../../../src/domain/entities/enums';
import { criarProfissional } from '../strategies/helpers';
import { criarAlocacao, criarRecomendacao } from './helpers';

describe('ObservadorEmail', () => {
  it('envia um e-mail para cada profissional sugerido quando uma recomendação é gerada', async () => {
    const profissional = criarProfissional();
    profissional.nome = 'Ana Souza';
    const recomendacao = criarRecomendacao([criarAlocacao(PapelTecnico.EDITOR, profissional)]);

    const emailGateway = { enviar: jest.fn() };
    const observador = new ObservadorEmail(emailGateway);

    await observador.notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(emailGateway.enviar).toHaveBeenCalledTimes(1);
    expect(emailGateway.enviar).toHaveBeenCalledWith(
      'Ana Souza',
      expect.any(String),
      expect.stringContaining(PapelTecnico.EDITOR)
    );
  });

  it('ignora eventos que não são RECOMENDACAO_GERADA', async () => {
    const emailGateway = { enviar: jest.fn() };
    const observador = new ObservadorEmail(emailGateway);

    await observador.notificar({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: criarRecomendacao([]) });

    expect(emailGateway.enviar).not.toHaveBeenCalled();
  });
});

describe('ObservadorMensagensInternas', () => {
  it('envia uma mensagem interna para cada profissional sugerido', async () => {
    const profissional = criarProfissional();
    const recomendacao = criarRecomendacao([criarAlocacao(PapelTecnico.SONOPLASTA, profissional)]);

    const mensagensGateway = { enviar: jest.fn() };
    const observador = new ObservadorMensagensInternas(mensagensGateway);

    await observador.notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(mensagensGateway.enviar).toHaveBeenCalledWith(
      profissional.id,
      expect.stringContaining(PapelTecnico.SONOPLASTA)
    );
  });

  it('ignora eventos que não são RECOMENDACAO_GERADA', async () => {
    const mensagensGateway = { enviar: jest.fn() };
    const observador = new ObservadorMensagensInternas(mensagensGateway);

    await observador.notificar({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: criarRecomendacao([]) });

    expect(mensagensGateway.enviar).not.toHaveBeenCalled();
  });
});

describe('ObservadorAuditoria', () => {
  it('registra um log estruturado para qualquer tipo de evento, incluindo convite aceito/recusado', async () => {
    const auditoriaGateway = { registrar: jest.fn() };
    const observador = new ObservadorAuditoria(auditoriaGateway);
    const recomendacao = criarRecomendacao([]);
    const profissional = criarProfissional();
    const alocacao = criarAlocacao(PapelTecnico.DIRETOR, profissional, StatusConvite.ACEITO);

    await observador.notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });
    await observador.notificar({ tipo: 'EQUIPE_CONSENSUAL', recomendacao });
    await observador.notificar({ tipo: 'CONVITE_ACEITO', recomendacao, alocacao });
    await observador.notificar({ tipo: 'CONVITE_RECUSADO', recomendacao, alocacao });

    expect(auditoriaGateway.registrar).toHaveBeenCalledTimes(4);
    expect(auditoriaGateway.registrar.mock.calls[0][0]).toMatchObject({ acao: 'RECOMENDACAO_GERADA' });
    expect(auditoriaGateway.registrar.mock.calls[1][0]).toMatchObject({ acao: 'EQUIPE_CONSENSUAL' });
    expect(auditoriaGateway.registrar.mock.calls[2][0]).toMatchObject({
      acao: 'CONVITE_ACEITO',
      detalhes: { papel: PapelTecnico.DIRETOR, profissionalId: profissional.id }
    });
    expect(auditoriaGateway.registrar.mock.calls[3][0]).toMatchObject({ acao: 'CONVITE_RECUSADO' });
  });
});

describe('Observadores reagem de forma independente ao mesmo evento (via SujeitoEventos)', () => {
  it('email, mensagens internas e auditoria são todos notificados por uma única recomendação gerada', async () => {
    const profissional = criarProfissional();
    const recomendacao = criarRecomendacao([
      criarAlocacao(PapelTecnico.DIRETOR, profissional, StatusConvite.PENDENTE)
    ]);

    const emailGateway = { enviar: jest.fn() };
    const mensagensGateway = { enviar: jest.fn() };
    const auditoriaGateway = { registrar: jest.fn() };

    const sujeito = new SujeitoEventos();
    sujeito.inscrever(new ObservadorEmail(emailGateway));
    sujeito.inscrever(new ObservadorMensagensInternas(mensagensGateway));
    sujeito.inscrever(new ObservadorAuditoria(auditoriaGateway));

    await sujeito.notificarTodos({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(emailGateway.enviar).toHaveBeenCalledTimes(1);
    expect(mensagensGateway.enviar).toHaveBeenCalledTimes(1);
    expect(auditoriaGateway.registrar).toHaveBeenCalledTimes(1);
  });
});
