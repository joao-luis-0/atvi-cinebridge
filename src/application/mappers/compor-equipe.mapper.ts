import { Localizacao } from '../../domain/entities/localizacao';
import { Profissional } from '../../domain/entities/profissional';
import { Competencia } from '../../domain/entities/competencia';
import { ProfissionalCompetencia } from '../../domain/entities/profissional-competencia';
import { Avaliacao } from '../../domain/entities/avaliacao';
import { HistoricoProjetoAnterior } from '../../domain/entities/historico-projeto-anterior';
import { DisponibilidadePeriodo } from '../../domain/entities/disponibilidade-periodo';
import { ProfissionalInputDTO, LocalizacaoDTO } from '../dto/compor-equipe.dto';

function mapearLocalizacao(dto: LocalizacaoDTO): Localizacao {
  const localizacao = new Localizacao();
  localizacao.cidade = dto.cidade;
  localizacao.uf = dto.uf;
  localizacao.pais = dto.pais;
  localizacao.latitude = dto.latitude;
  localizacao.longitude = dto.longitude;
  return localizacao;
}

export function mapearProfissional(dto: ProfissionalInputDTO): Profissional {
  const profissional = new Profissional();
  profissional.id = dto.id;
  profissional.nome = dto.nome;
  profissional.especialidades = dto.especialidades;
  profissional.valorMinimo = dto.valorMinimo;
  profissional.valorMaximo = dto.valorMaximo;
  profissional.localizacao = mapearLocalizacao(dto.localizacao);

  profissional.competencias = (dto.competencias ?? []).map((c) => {
    const competencia = new Competencia();
    competencia.nome = c.nome;

    const pc = new ProfissionalCompetencia();
    pc.competencia = competencia;
    pc.nivel = c.nivel;
    return pc;
  });

  profissional.avaliacoes = (dto.avaliacoes ?? []).map((a) => {
    const avaliacao = new Avaliacao();
    avaliacao.nota = a.nota;
    return avaliacao;
  });

  profissional.historicoProjetos = (dto.historicoProjetos ?? []).map((h) => {
    const historico = new HistoricoProjetoAnterior();
    historico.nomeProjeto = h.nomeProjeto;
    historico.papelDesempenhado = h.papelDesempenhado;
    historico.dataConclusao = new Date(h.dataConclusao);
    return historico;
  });

  profissional.disponibilidades = (dto.disponibilidades ?? []).map((d) => {
    const disponibilidade = new DisponibilidadePeriodo();
    disponibilidade.inicio = new Date(d.inicio);
    disponibilidade.fim = new Date(d.fim);
    return disponibilidade;
  });

  return profissional;
}
