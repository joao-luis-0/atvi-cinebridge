import { VisitanteCalculoCompatibilidade } from '../../../src/domain/visitors/compatibilidade/calculo-compatibilidade.visitor';
import { PapelTecnico } from '../../../src/domain/entities/enums';
import {
  criarPapel,
  criarProjetoCompleto,
  criarProfissionalComPreco,
  criarAlocacaoCompleta,
  criarRecomendacaoCompleta
} from './helpers';

describe('VisitanteCalculoCompatibilidade', () => {
  it('retorna 1 quando todos os papéis têm alocação com score máximo', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.5), criarPapel(PapelTecnico.EDITOR, 0.5)];
    const projeto = criarProjetoCompleto('Curta', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 1000), 1),
      criarAlocacaoCompleta(PapelTecnico.EDITOR, criarProfissionalComPreco('Bruno', 1000), 1)
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteCalculoCompatibilidade();
    recomendacao.aceitar(visitante);

    expect(visitante.obterResultado()).toBeCloseTo(1);
  });

  it('pondera o score pelo peso de cada papel', () => {
    // papel de peso 0.8 com score 1.0, papel de peso 0.2 com score 0.0
    // esperado: (1.0*0.8 + 0.0*0.2) / 1.0 = 0.8
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.8), criarPapel(PapelTecnico.EDITOR, 0.2)];
    const projeto = criarProjetoCompleto('Curta', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 1000), 1.0),
      criarAlocacaoCompleta(PapelTecnico.EDITOR, criarProfissionalComPreco('Bruno', 1000), 0.0)
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteCalculoCompatibilidade();
    recomendacao.aceitar(visitante);

    expect(visitante.obterResultado()).toBeCloseTo(0.8);
  });

  it('conta papel obrigatório sem alocação como score 0 (equipe incompleta nunca é 1.0)', () => {
    const papeis = [criarPapel(PapelTecnico.DIRETOR, 0.5), criarPapel(PapelTecnico.EDITOR, 0.5)];
    const projeto = criarProjetoCompleto('Curta', 10000, papeis);
    const alocacoes = [
      criarAlocacaoCompleta(PapelTecnico.DIRETOR, criarProfissionalComPreco('Ana', 1000), 1.0)
      // EDITOR sem alocação
    ];
    const recomendacao = criarRecomendacaoCompleta(projeto, alocacoes);

    const visitante = new VisitanteCalculoCompatibilidade();
    recomendacao.aceitar(visitante);

    expect(visitante.obterResultado()).toBeCloseTo(0.5);
  });
});
