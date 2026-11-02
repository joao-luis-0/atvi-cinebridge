import { Convite } from '../../src/domain/entities/convite';
import { StatusConvite } from '../../src/domain/entities/enums';

describe('Convite', () => {
  it('começa como PENDENTE e sem foiRespondido', () => {
    const convite = new Convite();
    convite.status = StatusConvite.PENDENTE;

    expect(convite.foiAceito()).toBe(false);
    expect(convite.foiRespondido()).toBe(false);
  });

  it('aceitar muda o status para ACEITO e registra a data de resposta', () => {
    const convite = new Convite();
    convite.status = StatusConvite.PENDENTE;

    convite.aceitar();

    expect(convite.status).toBe(StatusConvite.ACEITO);
    expect(convite.foiAceito()).toBe(true);
    expect(convite.foiRespondido()).toBe(true);
    expect(convite.dataResposta).toBeInstanceOf(Date);
  });

  it('recusar muda o status para RECUSADO e registra a data de resposta', () => {
    const convite = new Convite();
    convite.status = StatusConvite.PENDENTE;

    convite.recusar();

    expect(convite.status).toBe(StatusConvite.RECUSADO);
    expect(convite.foiAceito()).toBe(false);
    expect(convite.foiRespondido()).toBe(true);
  });
});
