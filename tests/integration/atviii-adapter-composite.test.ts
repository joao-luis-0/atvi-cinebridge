import { criarSistemaRecomendacaoPadrao } from '../../src/application/sistema-recomendacao';
import { GerenciadorNotificacoes } from '../../src/application/gerenciador-notificacoes';
import { AdaptadorInterno, CadastroProfissionalInternoSimulado } from '../../src/infrastructure/adapters/adaptadores';
import { ComporEquipeRequestDTO } from '../../src/application/dto/compor-equipe.dto';
import { PapelTecnico, TipoCaptacao, TipoProjeto } from '../../src/domain/entities/enums';

const localizacao = { cidade: 'São José dos Campos', uf: 'SP', pais: 'Brasil' };
function request(): ComporEquipeRequestDTO {
  return {
    tipoProjeto: TipoProjeto.PADRAO,
    projeto: {
      nome: 'Filme', genero: 'Drama', duracaoEstimadaMinutos: 50,
      orcamentoTotal: 12000, dataEntrega: '2030-01-01', tipoCaptacao: TipoCaptacao.FICCAO,
      localizacaoFilmagem: localizacao,
      papeisObrigatorios: [{ papel: PapelTecnico.EDITOR, peso: 1 }],
      servicoPrincipal: { tipo: 'PACOTE', nome: 'Pós', servicos: [
        { tipo: 'ATOMICO', nome: 'Editar', custo: 500, prazoDias: 4, papel: PapelTecnico.EDITOR },
        { tipo: 'ATOMICO', nome: 'Mixar', custo: 200, prazoDias: 2, papel: PapelTecnico.SONOPLASTA }
      ] }
    },
    profissionaisDisponiveis: [], consultarProfissionaisExternos: true
  };
}

describe('ATVIII - adapter com composite no fluxo de recomendação', () => {
  it('obtém profissionais pelo adaptador e recomenda papéis incluídos pelo Composite', async () => {
    const pessoas = [
      { id: 'e1', nome: 'Editora', competencias: [PapelTecnico.EDITOR], especialidades: [PapelTecnico.EDITOR], valorMinimo: 100, valorMaximo: 1000, localizacao },
      { id: 's1', nome: 'Sonoplasta', competencias: [PapelTecnico.SONOPLASTA], especialidades: [PapelTecnico.SONOPLASTA], valorMinimo: 100, valorMaximo: 1000, localizacao }
    ];
    const sistema = criarSistemaRecomendacaoPadrao(new GerenciadorNotificacoes(), {
      profissional: new AdaptadorInterno(new CadastroProfissionalInternoSimulado(pessoas))
    });
    const resposta = await sistema.recomendar(request());
    expect(resposta.recomendacao.alocacoes.map((a) => a.papel)).toEqual(expect.arrayContaining([PapelTecnico.EDITOR, PapelTecnico.SONOPLASTA]));
  });
  it('mantém dados enviados no pedido caso o adaptador externo falhe', async () => {
    const sistema = criarSistemaRecomendacaoPadrao(new GerenciadorNotificacoes(), {
      profissional: {
        listarProfissionais: async () => { throw new Error('offline'); },
        obterPerfilProfissional: async () => undefined,
        registrarAvaliacao: async () => undefined
      }
    });
    const pedido = request();
    pedido.profissionaisDisponiveis = [{ id: 'e1', nome: 'Editora', especialidades: [PapelTecnico.EDITOR], valorMinimo: 100, valorMaximo: 1000, localizacao }];
    const resposta = await sistema.recomendar(pedido);
    expect(resposta.recomendacao.alocacoes.some((a) => a.papel === PapelTecnico.EDITOR)).toBe(true);
  });
});
