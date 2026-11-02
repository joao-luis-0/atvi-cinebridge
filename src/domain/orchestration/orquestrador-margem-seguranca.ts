import { OrquestradorEquipe } from './orquestrador-equipe';
import { Projeto } from '../entities/projeto';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { AlocacaoRecomendada } from '../entities/alocacao-recomendada';
import { CandidatoRanking } from '../strategies/ranking';

const MARGEM_DE_SEGURANCA = 0.1; // 10%


export class OrquestradorComMargemSeguranca extends OrquestradorEquipe {
  protected normalizarDadosEntrada(profissionais: Profissional[]): Profissional[] {
    const vistos = new Set<string>();
    return profissionais.filter((profissional) => {
      if (vistos.has(profissional.id)) {
        return false;
      }
      vistos.add(profissional.id);
      return Number(profissional.valorMinimo) <= Number(profissional.valorMaximo);
    });
  }

  protected validarRestricoesOrcamentarias(
    projeto: Projeto,
    papel: PapelObrigatorio,
    ranking: CandidatoRanking[]
  ): CandidatoRanking[] {
    const orcamentoComMargem = this.orcamentoDoPapel(projeto, papel) * (1 - MARGEM_DE_SEGURANCA);

    return ranking.filter(
      (candidato) =>
        candidato.score > 0 && Number(candidato.profissional.valorMinimo) <= orcamentoComMargem
    );
  }

  protected posProcessarRecomendacoes(alocacoes: AlocacaoRecomendada[]): AlocacaoRecomendada[] {
    return [...alocacoes].sort((a, b) => a.papel.localeCompare(b.papel));
  }
}
