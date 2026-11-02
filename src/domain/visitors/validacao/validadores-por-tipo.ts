import { VisitanteValidacaoConsistencia, ResultadoValidacao } from './validacao-consistencia.visitor';
import { Projeto } from '../../entities/projeto';
import { ProjetoDocumentario } from '../../entities/projeto-documentario';
import { ProjetoAnimacao } from '../../entities/projeto-animacao';
import { ProjetoPublicitario } from '../../entities/projeto-publicitario';
import { PapelTecnico } from '../../entities/enums';


export abstract class ValidadorPorTipo extends VisitanteValidacaoConsistencia {
  private errosEspecificos: string[] = [];

  visitarProjeto(projeto: Projeto): void {
    super.visitarProjeto(projeto);
    this.errosEspecificos = this.validarProjeto(projeto);
  }

  obterResultado(): ResultadoValidacao {
    const base = super.obterResultado();
    const erros = [...this.errosEspecificos, ...base.erros];
    return { valido: erros.length === 0, erros };
  }

  /** Regras próprias do tipo; devolve a lista de erros encontrados. */
  protected abstract validarProjeto(projeto: Projeto): string[];

  /** Mensagens para cada papel exigido por este tipo que o projeto não declara como obrigatório. */
  protected papeisAusentes(projeto: Projeto, exigidos: PapelTecnico[]): string[] {
    const presentes = new Set(projeto.papeisObrigatorios.map((p) => p.papel));
    return exigidos
      .filter((papel) => !presentes.has(papel))
      .map((papel) => `Papel exigido para este tipo de projeto não configurado: ${papel}`);
  }
}

export class ValidadorDocumentario extends ValidadorPorTipo {
  protected validarProjeto(projeto: Projeto): string[] {
    if (!(projeto instanceof ProjetoDocumentario)) {
      return ['O projeto informado não é um ProjetoDocumentario.'];
    }
    const erros = this.papeisAusentes(projeto, [PapelTecnico.DIRETOR, PapelTecnico.EDITOR]);
    if (projeto.tema.trim() === '') {
      erros.push('Documentário exige um tema definido.');
    }
    return erros;
  }
}

export class ValidadorAnimacao extends ValidadorPorTipo {
  protected validarProjeto(projeto: Projeto): string[] {
    if (!(projeto instanceof ProjetoAnimacao)) {
      return ['O projeto informado não é um ProjetoAnimacao.'];
    }
    const erros = this.papeisAusentes(projeto, [PapelTecnico.ESPECIALISTA_EFEITOS_VISUAIS]);
    if (projeto.softwaresExigidos.length === 0) {
      erros.push('Animação exige ao menos um software declarado.');
    }
    return erros;
  }
}

export class ValidadorPublicitario extends ValidadorPorTipo {
  protected validarProjeto(projeto: Projeto): string[] {
    if (!(projeto instanceof ProjetoPublicitario)) {
      return ['O projeto informado não é um ProjetoPublicitario.'];
    }
    const erros = this.papeisAusentes(projeto, [PapelTecnico.DIRETOR_DE_FOTOGRAFIA]);
    if (projeto.marcaCliente.trim() === '') {
      erros.push('Projeto publicitário exige a marca do cliente.');
    }
    return erros;
  }
}
