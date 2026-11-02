import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { TipoEstrategiaRecomendacao } from '../entities/enums';
import { SimilaridadeCossenoStrategy } from './similaridade-cosseno.strategy';
import { FiltragemColaborativaStrategy } from './filtragem-colaborativa.strategy';
import { OrcamentoReduzidoStrategy } from './orcamento-reduzido.strategy';
import {
  RecomendadorAnimacao,
  RecomendadorDocumentario,
  RecomendadorPublicitario
} from './recomendadores-por-tipo';


export function criarEstrategiaRecomendacao(
  tipo: TipoEstrategiaRecomendacao
): EstrategiaRecomendacao {
  switch (tipo) {
    case TipoEstrategiaRecomendacao.SIMILARIDADE_COSSENO:
      return new SimilaridadeCossenoStrategy();
    case TipoEstrategiaRecomendacao.FILTRAGEM_COLABORATIVA:
      return new FiltragemColaborativaStrategy();
    case TipoEstrategiaRecomendacao.ORCAMENTO_REDUZIDO:
      return new OrcamentoReduzidoStrategy();
    case TipoEstrategiaRecomendacao.RECOMENDADOR_DOCUMENTARIO:
      return new RecomendadorDocumentario();
    case TipoEstrategiaRecomendacao.RECOMENDADOR_ANIMACAO:
      return new RecomendadorAnimacao();
    case TipoEstrategiaRecomendacao.RECOMENDADOR_PUBLICITARIO:
      return new RecomendadorPublicitario();
    default: {
      /* istanbul ignore next -- guarda defensiva de exaustividade: só é alcançável
         se um novo TipoEstrategiaRecomendacao for adicionado ao enum sem que uma
         estratégia correspondente seja criada aqui, algo que o TypeScript já
         impede em tempo de compilação (ver `tipoNaoTratado: never` abaixo). */
      const tipoNaoTratado: never = tipo;
      throw new Error(`Estratégia de recomendação não suportada: ${tipoNaoTratado}`);
    }
  }
}
