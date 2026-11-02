import { EventEmitterSujeitoEventos } from '../../../src/infrastructure/events/event-emitter-sujeito-eventos';
import { criarRecomendacao } from './helpers';

describe('EventEmitterSujeitoEventos', () => {
  it('notifica os observadores inscritos usando o EventEmitter do Node por baixo dos panos', async () => {
    const sujeito = new EventEmitterSujeitoEventos();
    const recebido = jest.fn();

    sujeito.inscrever({ notificar: recebido });

    await sujeito.notificarTodos({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: criarRecomendacao([]) });

    expect(recebido).toHaveBeenCalledTimes(1);
    expect(recebido).toHaveBeenCalledWith({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: expect.anything() });
  });

  it('desinscrever para de notificar o observador removido', async () => {
    const sujeito = new EventEmitterSujeitoEventos();
    const recebido = jest.fn();
    const observador = { notificar: recebido };

    sujeito.inscrever(observador);
    sujeito.desinscrever(observador);
    await sujeito.notificarTodos({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: criarRecomendacao([]) });

    expect(recebido).not.toHaveBeenCalled();
  });
});
