
export interface AdaptadorArmazenamento {
  salvarArquivo(conteudo: Buffer, metadados: Record<string, unknown>): Promise<string>;
  recuperarArquivo(id: string): Promise<Buffer>;
  listarArquivos(prefixo: string): Promise<string[]>;
}
export interface AdaptadorPagamento {
  efetuarPagamento(valor: number, origem: string, destino: string): Promise<string>;
  consultarPagamento(id: string): Promise<string>;
  verificarPagamento(id: string): Promise<boolean>;
}
export interface PerfilProfissional {
  id: string;
  nome: string;
  competencias: string[];
  especialidades?: import('../../domain/entities/enums').PapelTecnico[];
  valorMinimo?: number;
  valorMaximo?: number;
  localizacao?: { cidade: string; uf: string; pais: string };
  competenciasDetalhadas?: { nome: string; nivel: number }[];
  avaliacoes?: number[];
}
export interface AdaptadorProfissional {
  listarProfissionais(criterios: string): Promise<PerfilProfissional[]>;
  obterPerfilProfissional(id: string): Promise<PerfilProfissional | undefined>;
  registrarAvaliacao(id: string, avaliacao: number): Promise<void>;
}


export class ArmazenamentoExterno {
  private readonly arquivos = new Map<string, Buffer>();
  async upload(arquivo: Buffer, metadata: Record<string, unknown>): Promise<string> {
    const id = `${String(metadata.nome ?? 'arquivo')}-${this.arquivos.size + 1}`;
    this.arquivos.set(id, Buffer.from(arquivo)); return id;
  }
  async download(id: string): Promise<Buffer> {
    const arquivo = this.arquivos.get(id);
    if (!arquivo) throw new Error(`Arquivo não encontrado: ${id}`);
    return Buffer.from(arquivo);
  }
  async list(prefixo: string): Promise<string[]> { return [...this.arquivos.keys()].filter((id) => id.startsWith(prefixo)); }
}
export class AdaptadorS3 implements AdaptadorArmazenamento {
  constructor(private readonly api = new ArmazenamentoExterno()) {}
  salvarArquivo(c: Buffer, m: Record<string, unknown>): Promise<string> { return this.api.upload(c, m); }
  recuperarArquivo(id: string): Promise<Buffer> { return this.api.download(id); }
  listarArquivos(prefixo: string): Promise<string[]> { return this.api.list(prefixo); }
}
export class ArmazenamentoGoogleCloudSimulado {
  private readonly objetos = new Map<string, Buffer>();
  async enviarBlob(nome: string, dados: Buffer): Promise<{ nomeObjeto: string }> {
    const id = `${nome}-${this.objetos.size + 1}`;
    this.objetos.set(id, Buffer.from(dados));
    return { nomeObjeto: id };
  }
  async baixarBlob(nomeObjeto: string): Promise<Buffer> {
    const bytes = this.objetos.get(nomeObjeto);
    if (!bytes) throw new Error(`Objeto não encontrado: ${nomeObjeto}`);
    return Buffer.from(bytes);
  }
  async listarObjetos(prefixo: string): Promise<Array<{ nomeObjeto: string }>> {
    return [...this.objetos.keys()].filter((id) => id.startsWith(prefixo)).map((nomeObjeto) => ({ nomeObjeto }));
  }
}
export class AdaptadorGoogleCloud implements AdaptadorArmazenamento {
  constructor(private readonly api = new ArmazenamentoGoogleCloudSimulado()) {}
  async salvarArquivo(c: Buffer, m: Record<string, unknown>): Promise<string> {
    return (await this.api.enviarBlob(String(m.nome ?? 'arquivo'), c)).nomeObjeto;
  }
  recuperarArquivo(id: string): Promise<Buffer> { return this.api.baixarBlob(id); }
  async listarArquivos(prefixo: string): Promise<string[]> {
    return (await this.api.listarObjetos(prefixo)).map((objeto) => objeto.nomeObjeto);
  }
}
export class GatewayPagamento {
  private readonly transacoes = new Map<string, string>();
  async processarPagamento(valor: number, dados: { origem: string; destino: string }): Promise<{ id: string }> {
    if (!Number.isFinite(valor) || valor <= 0 || !dados.origem || !dados.destino) throw new Error('Pagamento inválido.');
    const id = `pg-${this.transacoes.size + 1}`; this.transacoes.set(id, 'APROVADO'); return { id };
  }
  async consultarStatus(id: string): Promise<string> { return this.transacoes.get(id) ?? 'NAO_ENCONTRADO'; }
}
export class AdaptadorStripe implements AdaptadorPagamento {
  constructor(private readonly api = new GatewayPagamento()) {}
  async efetuarPagamento(valor: number, origem: string, destino: string): Promise<string> { return (await this.api.processarPagamento(valor, { origem, destino })).id; }
  consultarPagamento(id: string): Promise<string> { return this.api.consultarStatus(id); }
  async verificarPagamento(id: string): Promise<boolean> { return (await this.consultarPagamento(id)) === 'APROVADO'; }
}
export class GatewayPagSeguroSimulado {
  private readonly operacoes = new Map<string, 'PAGO'>();
  async cobrar(params: { quantia: number; pagador: string; recebedor: string }): Promise<string> {
    if (!Number.isFinite(params.quantia) || params.quantia <= 0 || !params.pagador || !params.recebedor) {
      throw new Error('Pagamento inválido.');
    }
    const codigo = `ps-${this.operacoes.size + 1}`;
    this.operacoes.set(codigo, 'PAGO');
    return codigo;
  }
  async situacao(codigo: string): Promise<'PAGO' | 'NAO_ENCONTRADO'> {
    return this.operacoes.get(codigo) ?? 'NAO_ENCONTRADO';
  }
}
export class AdaptadorPagSeguro implements AdaptadorPagamento {
  constructor(private readonly api = new GatewayPagSeguroSimulado()) {}
  efetuarPagamento(valor: number, origem: string, destino: string): Promise<string> {
    return this.api.cobrar({ quantia: valor, pagador: origem, recebedor: destino });
  }
  async consultarPagamento(id: string): Promise<string> {
    const status = await this.api.situacao(id);
    return status === 'PAGO' ? 'APROVADO' : status;
  }
  async verificarPagamento(id: string): Promise<boolean> {
    return (await this.consultarPagamento(id)) === 'APROVADO';
  }
}
export class ApiProfissionalExterna {
  private readonly registros = new Map<string, PerfilProfissional>();
  private readonly avaliacoes = new Map<string, number[]>();
  constructor(profissionais: PerfilProfissional[] = []) { profissionais.forEach((p) => this.registros.set(p.id, { ...p, competencias: [...p.competencias] })); }
  async buscarProfissionais(filtro: string): Promise<PerfilProfissional[]> { return [...this.registros.values()].filter((p) => p.nome.toLowerCase().includes(filtro.toLowerCase()) || p.competencias.some((c) => c.toLowerCase().includes(filtro.toLowerCase()))); }
  async obterPerfil(id: string): Promise<PerfilProfissional | undefined> { return this.registros.get(id); }
  async avaliar(id: string, nota: number): Promise<void> {
    if (!this.registros.has(id) || nota < 0 || nota > 5) throw new Error('Profissional ou avaliação inválidos.');
    this.avaliacoes.set(id, [...(this.avaliacoes.get(id) ?? []), nota]);
  }
}
export class AdaptadorLinkedIn implements AdaptadorProfissional {
  constructor(private readonly api = new ApiProfissionalExterna()) {}
  listarProfissionais(criterios: string): Promise<PerfilProfissional[]> { return this.api.buscarProfissionais(criterios); }
  obterPerfilProfissional(id: string): Promise<PerfilProfissional | undefined> { return this.api.obterPerfil(id); }
  registrarAvaliacao(id: string, avaliacao: number): Promise<void> { return this.api.avaliar(id, avaliacao); }
}
/** Serviço interno simulado com interface própria (não é apenas um alias da API externa). */
export class CadastroProfissionalInternoSimulado {
  private readonly pessoas = new Map<string, PerfilProfissional>();
  constructor(profissionais: PerfilProfissional[] = []) {
    profissionais.forEach((p) => this.pessoas.set(p.id, { ...p, competencias: [...p.competencias] }));
  }
  async pesquisar(termo: string): Promise<PerfilProfissional[]> {
    const busca = termo.toLowerCase();
    return [...this.pessoas.values()].filter((p) =>
      p.nome.toLowerCase().includes(busca) || p.competencias.some((c) => c.toLowerCase().includes(busca))
    ).map((p) => ({ ...p, competencias: [...p.competencias] }));
  }
  async perfil(codigo: string): Promise<PerfilProfissional | undefined> {
    const p = this.pessoas.get(codigo);
    return p && { ...p, competencias: [...p.competencias] };
  }
  async registrarNota(codigo: string, nota: number): Promise<void> {
    const p = this.pessoas.get(codigo);
    if (!p || !Number.isFinite(nota) || nota < 0 || nota > 5) throw new Error('Avaliação inválida.');
    p.avaliacoes = [...(p.avaliacoes ?? []), nota];
  }
}

export class AdaptadorInterno implements AdaptadorProfissional {
  constructor(private readonly api = new CadastroProfissionalInternoSimulado()) {}
  listarProfissionais(criterios: string): Promise<PerfilProfissional[]> { return this.api.pesquisar(criterios); }
  obterPerfilProfissional(id: string): Promise<PerfilProfissional | undefined> { return this.api.perfil(id); }
  registrarAvaliacao(id: string, avaliacao: number): Promise<void> { return this.api.registrarNota(id, avaliacao); }
}
