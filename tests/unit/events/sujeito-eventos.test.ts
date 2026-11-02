import { SujeitoEventos } from '../../../src/domain/events/sujeito-eventos';
import { ObservadorEvento } from '../../../src/domain/events/observador-evento.interface';
import { EventoDominio } from '../../../src/domain/events/evento-dominio';

function criarObservadorEspiao() {
  const eventosRecebidos: EventoDominio[] = [];
  const observador: ObservadorEvento = {
    notificar: jest.fn((evento: EventoDominio) => {
      eventosRecebidos.push(evento);
    })
  };
  return { observador, eventosRecebidos };
}

describe('SujeitoEventos', () => {
  it('notifica todos os observadores inscritos, na ordem em que foram inscritos', async () => {
    const sujeito = new SujeitoEventos();
    const chamadas: string[] = [];

    sujeito.inscrever({ notificar: () => { chamadas.push('primeiro'); } });
    sujeito.inscrever({ notificar: () => { chamadas.push('segundo'); } });

    await sujeito.notificarTodos({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: {} as never });

    expect(chamadas).toEqual(['primeiro', 'segundo']);
  });

  it('desinscrever remove o observador da lista de notificação', async () => {
    const sujeito = new SujeitoEventos();
    const { observador, eventosRecebidos } = criarObservadorEspiao();

    sujeito.inscrever(observador);
    sujeito.desinscrever(observador);
    await sujeito.notificarTodos({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: {} as never });

    expect(eventosRecebidos).toHaveLength(0);
  });

  it('observadores reagem de forma independente: um lançar erro não impede os demais', async () => {
    const sujeito = new SujeitoEventos();
    const { observador: observadorOk, eventosRecebidos } = criarObservadorEspiao();

    sujeito.inscrever({
      notificar: () => {
        throw new Error('falha simulada no observador');
      }
    });
    sujeito.inscrever(observadorOk);

    await sujeito.notificarTodos({ tipo: 'EQUIPE_CONSENSUAL', recomendacao: {} as never });

    expect(eventosRecebidos).toHaveLength(1);
  });
});
