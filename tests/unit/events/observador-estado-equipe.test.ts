import { ObservadorEstadoEquipe } from '../../../src/domain/events/observers/observador-estado-equipe';
import { PapelTecnico, StatusConvite, StatusRecomendacao } from '../../../src/domain/entities/enums';
import { criarProfissional } from '../strategies/helpers';
import { criarAlocacao, criarRecomendacao } from './helpers';

describe('ObservadorEstadoEquipe', () => {
  it('marca a recomendação como CONSENSUAL quando o último convite ativo é aceito', async () => {
    const p1 = criarProfissional();
    const p2 = criarProfissional();
    const alocacao1 = criarAlocacao(PapelTecnico.DIRETOR, p1, StatusConvite.ACEITO);
    const alocacao2 = criarAlocacao(PapelTecnico.EDITOR, p2, StatusConvite.ACEITO);
    const recomendacao = criarRecomendacao([alocacao1, alocacao2]);

    const observador = new ObservadorEstadoEquipe();
    await observador.notificar({ tipo: 'CONVITE_ACEITO', recomendacao, alocacao: alocacao2 });

    expect(recomendacao.status).toBe(StatusRecomendacao.CONSENSUAL);
  });

  it('não marca como CONSENSUAL enquanto houver convite ativo pendente', async () => {
    const p1 = criarProfissional();
    const p2 = criarProfissional();
    const alocacao1 = criarAlocacao(PapelTecnico.DIRETOR, p1, StatusConvite.ACEITO);
    const alocacao2 = criarAlocacao(PapelTecnico.EDITOR, p2, StatusConvite.PENDENTE);
    const recomendacao = criarRecomendacao([alocacao1, alocacao2]);

    const observador = new ObservadorEstadoEquipe();
    await observador.notificar({ tipo: 'CONVITE_ACEITO', recomendacao, alocacao: alocacao1 });

    expect(recomendacao.status).toBe(StatusRecomendacao.EM_ANDAMENTO);
  });

  it('aciona o callback aoRecusar quando um convite é recusado', async () => {
    const profissional = criarProfissional();
    const alocacao = criarAlocacao(PapelTecnico.EDITOR, profissional, StatusConvite.RECUSADO);
    const recomendacao = criarRecomendacao([alocacao]);

    const aoRecusar = jest.fn();
    const observador = new ObservadorEstadoEquipe(aoRecusar);

    await observador.notificar({ tipo: 'CONVITE_RECUSADO', recomendacao, alocacao });

    expect(aoRecusar).toHaveBeenCalledWith({ tipo: 'CONVITE_RECUSADO', recomendacao, alocacao });
  });

  it('não quebra quando não há callback aoRecusar configurado', async () => {
    const profissional = criarProfissional();
    const alocacao = criarAlocacao(PapelTecnico.EDITOR, profissional, StatusConvite.RECUSADO);
    const recomendacao = criarRecomendacao([alocacao]);

    const observador = new ObservadorEstadoEquipe();

    await expect(
      observador.notificar({ tipo: 'CONVITE_RECUSADO', recomendacao, alocacao })
    ).resolves.not.toThrow();
  });
});
