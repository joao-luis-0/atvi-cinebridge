import { gzipSync } from 'zlib';
import type { ComporEquipeRequestDTO, DecoradorRecomendacao } from '../dto/compor-equipe.dto';
import type { ResultadoOrquestracao } from '../../domain/orchestration/orquestrador-equipe';
import { mapearRespostaRecomendacao } from '../mappers/resposta-recomendacao.mapper';


export interface RecomendacaoStrategy {
  recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao>;
}
export abstract class RecomendacaoDecorator implements RecomendacaoStrategy {
  constructor(protected readonly interno: RecomendacaoStrategy) {}
  recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao> {
    return this.interno.recomendar(request);
  }
}


function copiarGrafo<T>(valor: T, vistos = new WeakMap<object, unknown>()): T {
  if (typeof valor !== 'object' || valor === null) return valor;
  if (vistos.has(valor)) return vistos.get(valor) as T;
  if (valor instanceof Date) return new Date(valor.getTime()) as T;
  if (Buffer.isBuffer(valor)) return Buffer.from(valor) as T;
  if (valor instanceof Map) {
    const copia = new Map(); vistos.set(valor, copia);
    valor.forEach((v, k) => copia.set(copiarGrafo(k, vistos), copiarGrafo(v, vistos)));
    return copia as T;
  }
  if (valor instanceof Set) {
    const copia = new Set(); vistos.set(valor, copia);
    valor.forEach((v) => copia.add(copiarGrafo(v, vistos)));
    return copia as T;
  }
  const copia = Array.isArray(valor) ? [] : Object.create(Object.getPrototypeOf(valor));
  vistos.set(valor, copia);
  for (const chave of Object.keys(valor)) {
    (copia as Record<string, unknown>)[chave] = copiarGrafo((valor as Record<string, unknown>)[chave], vistos);
  }
  return copia as T;
}


export class CacheDecorator extends RecomendacaoDecorator {
  private readonly cache = new Map<string, { expira: number; resultado: ResultadoOrquestracao }>();
  private readonly pendentes = new Map<string, Promise<ResultadoOrquestracao>>();
  public acertos = 0;
  constructor(interno: RecomendacaoStrategy, private readonly ttlMs = 60_000, private readonly limite = 500) {
    super(interno);
  }
  async recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao> {
    const chave = JSON.stringify(request);
    const agora = Date.now();
    const existente = this.cache.get(chave);
    if (existente && existente.expira > agora) {
      this.acertos++;
      return copiarGrafo(existente.resultado);
    }
    if (existente) this.cache.delete(chave);
    let pendente = this.pendentes.get(chave);
    if (!pendente) {
      pendente = super.recomendar(request);
      this.pendentes.set(chave, pendente);
    } else {
      this.acertos++;
    }
    try {
      const resultado = await pendente;
      if (!this.cache.has(chave)) {
        if (this.cache.size >= this.limite) this.cache.delete(this.cache.keys().next().value as string);
        this.cache.set(chave, { expira: Date.now() + this.ttlMs, resultado: copiarGrafo(resultado) });
      }
      return copiarGrafo(resultado);
    } finally {
      if (this.pendentes.get(chave) === pendente) this.pendentes.delete(chave);
    }
  }
}

export interface RegistroAuditoria { duracaoMs: number; sucesso: boolean; instante: Date; }
export class AuditoriaDecorator extends RecomendacaoDecorator {
  public readonly registros: RegistroAuditoria[] = [];
  async recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao> {
    const inicio = process.hrtime.bigint();
    let sucesso = false;
    try {
      const resultado = await super.recomendar(request);
      sucesso = true;
      return resultado;
    } finally {
      this.registros.push({
        instante: new Date(), sucesso,
        duracaoMs: Number(process.hrtime.bigint() - inicio) / 1e6
      });
    }
  }
}


export class CompressaoDecorator extends RecomendacaoDecorator {
  public ultimoTamanhoOriginal = 0;
  public ultimoTamanhoComprimido = 0;
  async recomendar(request: ComporEquipeRequestDTO): Promise<ResultadoOrquestracao> {
    const resultado = await super.recomendar(request);
    const dados = Buffer.from(JSON.stringify(mapearRespostaRecomendacao(resultado)));
    this.ultimoTamanhoOriginal = dados.length;
    this.ultimoTamanhoComprimido = gzipSync(dados).length;
    return resultado;
  }
}

export type NomeDecorator = DecoradorRecomendacao;

export function montarDecoradores(base: RecomendacaoStrategy, ordem: NomeDecorator[]): RecomendacaoStrategy {
  return ordem.reduce<RecomendacaoStrategy>((interno, nome) => {
    switch (nome) {
      case 'cache': return new CacheDecorator(interno);
      case 'auditoria': return new AuditoriaDecorator(interno);
      case 'compressao': return new CompressaoDecorator(interno);
      default: throw new Error(`Decorator desconhecido: ${String(nome)}`);
    }
  }, base);
}
