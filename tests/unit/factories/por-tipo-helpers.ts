import { Projeto } from '../../../src/domain/entities/projeto';
import { FabricaProjeto } from '../../../src/domain/factories/fabrica-projeto.interface';
import { DadosProjeto } from '../../../src/domain/factories/dados-projeto';
import { TipoCaptacao } from '../../../src/domain/entities/enums';
import { criarAlocacaoCompleta, criarProfissionalComPreco, criarRecomendacaoCompleta } from '../visitors/helpers';

export function dadosBase(sobrescrever: Partial<DadosProjeto> = {}): DadosProjeto {
  return {
    nome: 'Obra de teste',
    genero: 'Drama',
    duracaoEstimadaMinutos: 20,
    orcamentoTotal: 50000,
    dataEntrega: '2026-12-01',
    tipoCaptacao: TipoCaptacao.FICCAO,
    localizacaoFilmagem: { cidade: 'São Paulo', uf: 'SP', pais: 'Brasil' },
    ...sobrescrever
  };
}

export function recomendacaoComTodosOsPapeis(projeto: Projeto, valorMinimo = 1000) {
  const alocacoes = projeto.papeisObrigatorios.map((papel) =>
    criarAlocacaoCompleta(papel.papel, criarProfissionalComPreco(`Profissional ${papel.papel}`, valorMinimo), 0.9)
  );
  return criarRecomendacaoCompleta(projeto, alocacoes);
}

export function projetoDaFabrica(fabrica: FabricaProjeto, sobrescrever: Partial<DadosProjeto> = {}): Projeto {
  return fabrica.criarProjeto(dadosBase(sobrescrever));
}
