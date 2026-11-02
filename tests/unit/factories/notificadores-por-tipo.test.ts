import {
  NotificadorAnimacao,
  NotificadorDocumentario,
  NotificadorPadrao,
  NotificadorPublicitario
} from '../../../src/domain/events/observers/notificadores-por-tipo';
import {
  FabricaAnimacao,
  FabricaDocumentario,
  FabricaPublicitario
} from '../../../src/domain/factories/fabricas-concretas';
import { criarRegistroPadraoDePrototipos } from '../../../src/domain/prototypes/modelos-padrao';
import { Projeto } from '../../../src/domain/entities/projeto';
import { PapelTecnico } from '../../../src/domain/entities/enums';
import { criarGatewaysEspioes } from '../../helpers/fabricas';
import { criarAlocacaoCompleta, criarProfissionalComPreco, criarRecomendacaoCompleta } from '../visitors/helpers';
import { projetoDaFabrica, recomendacaoComTodosOsPapeis } from './por-tipo-helpers';

describe('Notificadores por tipo de projeto (Observer)', () => {
  it('documentário: avisa por e-mail e mensagem interna citando o tipo, o projeto e o tema', async () => {
    const { email, mensagens, gateways } = criarGatewaysEspioes();
    const projeto = projetoDaFabrica(new FabricaDocumentario(criarRegistroPadraoDePrototipos(), gateways), {
      atributosEspecificos: { tema: 'Rios', entrevistados: ['A'] }
    });
    const recomendacao = recomendacaoComTodosOsPapeis(projeto);

    await new NotificadorDocumentario(email, mensagens).notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(mensagens.enviar).toHaveBeenCalledTimes(4);
    const [destinatarioId, texto] = mensagens.enviar.mock.calls[0];
    expect(destinatarioId).toBe(recomendacao.alocacoes[0].profissionalSugerido.id);
    expect(texto).toContain('documentário');
    expect(texto).toContain('"Obra de teste"');
    expect(texto).toContain('Tema: Rios');
    expect(email.enviar).toHaveBeenCalledTimes(4);
    expect(email.enviar.mock.calls[0][1]).toBe('Convite para documentário: Obra de teste');
  });

  it('animação e publicitário: cada notificador usa o seu rótulo e os detalhes do seu tipo', async () => {
    const espioesAnim = criarGatewaysEspioes();
    const animacao = projetoDaFabrica(new FabricaAnimacao(criarRegistroPadraoDePrototipos(), espioesAnim.gateways));
    await new NotificadorAnimacao(espioesAnim.email, espioesAnim.mensagens).notificar({
      tipo: 'RECOMENDACAO_GERADA',
      recomendacao: recomendacaoComTodosOsPapeis(animacao)
    });
    const textoAnimacao: string = espioesAnim.mensagens.enviar.mock.calls[0][1];
    expect(textoAnimacao).toContain('projeto de animação');
    expect(textoAnimacao).toContain('Blender');

    const espioesPub = criarGatewaysEspioes();
    const publicitario = projetoDaFabrica(new FabricaPublicitario(criarRegistroPadraoDePrototipos(), espioesPub.gateways), {
      atributosEspecificos: { marcaCliente: 'Marca X' }
    });
    await new NotificadorPublicitario(espioesPub.email, espioesPub.mensagens).notificar({
      tipo: 'RECOMENDACAO_GERADA',
      recomendacao: recomendacaoComTodosOsPapeis(publicitario)
    });
    const textoPublicitario: string = espioesPub.mensagens.enviar.mock.calls[0][1];
    expect(textoPublicitario).toContain('filme publicitário');
    expect(textoPublicitario).toContain('Marca: Marca X');
  });

  it('ignora eventos que não são RECOMENDACAO_GERADA', async () => {
    const { email, mensagens } = criarGatewaysEspioes();
    const projeto = new Projeto();
    projeto.papeisObrigatorios = [];
    const recomendacao = recomendacaoComTodosOsPapeis(projeto);

    await new NotificadorDocumentario(email, mensagens).notificar({ tipo: 'EQUIPE_CONSENSUAL', recomendacao });

    expect(email.enviar).not.toHaveBeenCalled();
    expect(mensagens.enviar).not.toHaveBeenCalled();
  });

  it('não avisa profissionais cujas alocações foram substituídas', async () => {
    const { email, mensagens } = criarGatewaysEspioes();
    const projeto = new Projeto();
    projeto.nome = 'Obra';
    const ativa = criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 1000), 0.9);
    const substituida = criarAlocacaoCompleta(PapelTecnico.EDITOR, criarProfissionalComPreco('Bia', 1000), 0.9);
    substituida.substituida = true;
    const recomendacao = criarRecomendacaoCompleta(projeto, [ativa, substituida]);

    await new NotificadorDocumentario(email, mensagens).notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(mensagens.enviar).toHaveBeenCalledTimes(1);
    expect(mensagens.enviar.mock.calls[0][0]).toBe(ativa.profissionalSugerido.id);
  });

  it('projeto sem detalhes específicos gera texto sem trecho extra', async () => {
    const { email, mensagens } = criarGatewaysEspioes();
    const projeto = new Projeto();
    projeto.nome = 'Obra genérica';
    const recomendacao = criarRecomendacaoCompleta(projeto, [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 1000), 0.9)
    ]);

    await new NotificadorDocumentario(email, mensagens).notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(mensagens.enviar.mock.calls[0][1]).toBe(
      'Você foi recomendado para o papel de DIRETOR no documentário "Obra genérica". Acesse a plataforma para responder ao convite.'
    );
  });

  it('NotificadorPadrao mantém o comportamento original: e-mail e mensagem interna genéricos', async () => {
    const { email, mensagens } = criarGatewaysEspioes();
    const projeto = new Projeto();
    projeto.nome = 'Obra';
    const recomendacao = criarRecomendacaoCompleta(projeto, [
      criarAlocacaoCompleta(PapelTecnico.EDITOR, criarProfissionalComPreco('Ana', 1000), 0.9)
    ]);

    await new NotificadorPadrao(email, mensagens).notificar({ tipo: 'RECOMENDACAO_GERADA', recomendacao });

    expect(email.enviar).toHaveBeenCalledTimes(1);
    expect(mensagens.enviar).toHaveBeenCalledWith(
      recomendacao.alocacoes[0].profissionalSugerido.id,
      'Você recebeu um novo convite para o papel de EDITOR.'
    );
  });
});
