import { EstrategiaRecomendacao } from './estrategia-recomendacao.interface';
import { Profissional } from '../entities/profissional';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Projeto } from '../entities/projeto';
import { PapelTecnico, TipoEstrategiaRecomendacao } from '../entities/enums';
import { similaridadeCosseno, vetorizarCompetencias } from './vetor-competencias.util';


const COMPETENCIAS_CHAVE_POR_PAPEL: Record<PapelTecnico, string[]> = {
  [PapelTecnico.DIRETOR]: ['Direção de atores', 'Visão criativa', 'Liderança de equipe'],
  [PapelTecnico.DIRETOR_DE_FOTOGRAFIA]: ['Direção de fotografia', 'Iluminação', 'Composição de imagem'],
  [PapelTecnico.SONOPLASTA]: ['Design de som', 'Captação de áudio', 'Mixagem'],
  [PapelTecnico.EDITOR]: ['Edição não-linear', 'Storytelling', 'Ritmo narrativo'],
  [PapelTecnico.ROTEIRISTA]: ['Roteirização', 'Estrutura narrativa', 'Diálogos'],
  [PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS]: ['Efeitos visuais', 'Composição digital', 'Animação 3D']
};


export class SimilaridadeCossenoStrategy implements EstrategiaRecomendacao {
  readonly tipo = TipoEstrategiaRecomendacao.SIMILARIDADE_COSSENO;

  calcularScore(profissional: Profissional, papel: PapelObrigatorio, _projeto: Projeto): number {
    const dimensoes = COMPETENCIAS_CHAVE_POR_PAPEL[papel.papel];

    const nivelPorCompetencia = new Map<string, number>(
      (profissional.competencias ?? []).map((pc) => [pc.competencia.nome, Number(pc.nivel)])
    );

    const vetorProfissional = vetorizarCompetencias(nivelPorCompetencia, dimensoes);
    const vetorIdeal = dimensoes.map(() => 1);

    return similaridadeCosseno(vetorProfissional, vetorIdeal);
  }
}
