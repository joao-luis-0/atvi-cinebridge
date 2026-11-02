import { PapelTecnico } from '../entities/enums';

/** Percorre o Composite e retorna todos os papéis técnicos exigidos. */
export function coletarPapeisServico(servico: ServicoProjeto): PapelTecnico[] {
  if (servico instanceof ServicoAtomico) return [servico.papel];
  return servico.listarSubservicos().flatMap(coletarPapeisServico);
}


/** Composite: contrato comum para serviços unitários e pacotes. */
export interface ServicoProjeto {
  calcularCusto(): number;
  listarSubservicos(): ServicoProjeto[];
  obterPrazo(): number;
  validar(): boolean;
  clonar(): ServicoProjeto;
}

export class ServicoAtomico implements ServicoProjeto {
  constructor(
    public readonly nome: string,
    public readonly custo: number,
    public readonly prazoDias: number,
    public readonly papel: PapelTecnico
  ) {}
  calcularCusto(): number { return this.custo; }
  listarSubservicos(): ServicoProjeto[] { return []; }
  obterPrazo(): number { return this.prazoDias; }
  validar(): boolean {
    return this.nome.trim().length > 0 && Number.isFinite(this.custo) && this.custo >= 0 &&
      Number.isFinite(this.prazoDias) && this.prazoDias >= 0 &&
      Object.values(PapelTecnico).includes(this.papel);
  }
  clonar(): ServicoProjeto { return new ServicoAtomico(this.nome, this.custo, this.prazoDias, this.papel); }
}

/** Filhos executados em paralelo: o prazo do pacote é o maior prazo dos filhos. */
export class PacoteServico implements ServicoProjeto {
  private readonly filhos: ServicoProjeto[] = [];
  constructor(public readonly nome: string, servicos: ServicoProjeto[] = []) {
    servicos.forEach((servico) => this.adicionar(servico));
  }
  adicionar(servico: ServicoProjeto): void {
    if (servico === this || this.contem(servico)) throw new Error('Referência circular no pacote de serviços.');
    this.filhos.push(servico);
  }
  remover(servico: ServicoProjeto): void {
    const indice = this.filhos.indexOf(servico);
    if (indice !== -1) this.filhos.splice(indice, 1);
  }
  private contem(alvo: ServicoProjeto): boolean {
    const visitar = (atual: ServicoProjeto, vistos: Set<ServicoProjeto>): boolean => {
      if (atual === this) return true;
      if (vistos.has(atual)) return false;
      vistos.add(atual);
      return atual.listarSubservicos().some((filho) => visitar(filho, vistos));
    };
    return visitar(alvo, new Set());
  }
  calcularCusto(): number { return this.filhos.reduce((soma, filho) => soma + filho.calcularCusto(), 0); }
  listarSubservicos(): ServicoProjeto[] { return [...this.filhos]; }
  obterPrazo(): number { return Math.max(0, ...this.filhos.map((filho) => filho.obterPrazo())); }
  validar(): boolean { return !!this.nome.trim() && this.filhos.length > 0 && this.filhos.every((filho) => filho.validar()); }
  clonar(): ServicoProjeto { return new PacoteServico(this.nome, this.filhos.map((filho) => filho.clonar())); }
}
