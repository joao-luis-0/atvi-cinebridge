import { Projeto } from '../entities/projeto';
import { ProjetoDocumentario } from '../entities/projeto-documentario';
import { ProjetoAnimacao } from '../entities/projeto-animacao';
import { ProjetoPublicitario } from '../entities/projeto-publicitario';
import { PapelObrigatorio } from '../entities/papel-obrigatorio';
import { Localizacao } from '../entities/localizacao';
import { PapelTecnico, TecnicaAnimacao, TipoCaptacao, TipoProjeto } from '../entities/enums';
import { RegistroPrototiposProjeto } from './registro-prototipos-projeto';

function montarPapeis(pesos: Array<[PapelTecnico, number]>): PapelObrigatorio[] {
  return pesos.map(([papel, peso]) => {
    const papelObrigatorio = new PapelObrigatorio();
    papelObrigatorio.papel = papel;
    papelObrigatorio.peso = peso;
    return papelObrigatorio;
  });
}

function preencherBase(
  projeto: Projeto,
  base: { nome: string; genero: string; duracao: number; orcamento: number; captacao: TipoCaptacao },
  pesos: Array<[PapelTecnico, number]>
): void {
  const localizacao = new Localizacao();
  localizacao.cidade = 'São Paulo';
  localizacao.uf = 'SP';
  localizacao.pais = 'Brasil';

  projeto.nome = base.nome;
  projeto.genero = base.genero;
  projeto.duracaoEstimadaMinutos = base.duracao;
  projeto.orcamentoTotal = base.orcamento;
  projeto.dataEntrega = new Date(); // valor-base: o produtor ajusta ao criar o projeto
  projeto.tipoCaptacao = base.captacao;
  projeto.localizacaoFilmagem = localizacao;
  projeto.papeisObrigatorios = montarPapeis(pesos);
  projeto.criadoEm = new Date();
}

export function criarModeloDocumentario(): ProjetoDocumentario {
  const projeto = new ProjetoDocumentario();
  preencherBase(
    projeto,
    { nome: 'Modelo de documentário', genero: 'Documentário', duracao: 60, orcamento: 30000, captacao: TipoCaptacao.DOCUMENTARIO },
    [
      [PapelTecnico.DIRETOR, 0.35],
      [PapelTecnico.ROTEIRISTA, 0.15],
      [PapelTecnico.EDITOR, 0.3],
      [PapelTecnico.SONOPLASTA, 0.2]
    ]
  );
  projeto.tema = ''; // o produtor define o tema ao criar o projeto
  projeto.entrevistados = [];
  return projeto;
}

export function criarModeloAnimacao(): ProjetoAnimacao {
  const projeto = new ProjetoAnimacao();
  preencherBase(
    projeto,
    { nome: 'Modelo de animação', genero: 'Animação', duracao: 10, orcamento: 60000, captacao: TipoCaptacao.ANIMACAO },
    [
      [PapelTecnico.DIRETOR, 0.25],
      [PapelTecnico.ROTEIRISTA, 0.15],
      [PapelTecnico.EDITOR, 0.15],
      [PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS, 0.35],
      [PapelTecnico.SONOPLASTA, 0.1]
    ]
  );
  projeto.tecnica = TecnicaAnimacao.ANIMACAO_3D;
  projeto.softwaresExigidos = ['Blender', 'After Effects'];
  return projeto;
}

export function criarModeloPublicitario(): ProjetoPublicitario {
  const projeto = new ProjetoPublicitario();
  preencherBase(
    projeto,
    { nome: 'Modelo de filme publicitário', genero: 'Publicidade', duracao: 1, orcamento: 80000, captacao: TipoCaptacao.FICCAO },
    [
      [PapelTecnico.DIRETOR, 0.3],
      [PapelTecnico.DIRETOR_DE_FOTOGRAFIA, 0.3],
      [PapelTecnico.EDITOR, 0.25],
      [PapelTecnico.SONOPLASTA, 0.15]
    ]
  );
  projeto.marcaCliente = '';
  projeto.veiculosDeExibicao = ['TV', 'Internet'];
  return projeto;
}

export function criarModeloPadrao(): Projeto {
  const projeto = new Projeto();
  preencherBase(
    projeto,
    { nome: 'Modelo padrão', genero: 'Geral', duracao: 30, orcamento: 10000, captacao: TipoCaptacao.FICCAO },
    []
  );
  return projeto;
}

export function criarRegistroPadraoDePrototipos(): RegistroPrototiposProjeto {
  const registro = new RegistroPrototiposProjeto();
  registro.registrar(TipoProjeto.DOCUMENTARIO, criarModeloDocumentario());
  registro.registrar(TipoProjeto.ANIMACAO, criarModeloAnimacao());
  registro.registrar(TipoProjeto.PUBLICITARIO, criarModeloPublicitario());
  registro.registrar(TipoProjeto.PADRAO, criarModeloPadrao());
  return registro;
}
