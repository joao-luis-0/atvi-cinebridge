import { GerenciadorNotificacoes } from './gerenciador-notificacoes';
import { SistemaRecomendacao, criarSistemaRecomendacaoPadrao } from './sistema-recomendacao';
import { ComporEquipeRequestDTO, DecoradorRecomendacao } from './dto/compor-equipe.dto';
import { ResultadoOrquestracao } from '../domain/orchestration/orquestrador-equipe';
import { montarDecoradores, RecomendacaoStrategy } from './decorators/recomendacao-decorators';
import { PersistenciaExecucoes } from './persistencia-execucoes';

export type ComporEquipeResultado = ResultadoOrquestracao;

export class ComporEquipeService {
  private readonly pilhas = new Map<string, RecomendacaoStrategy>();
  private readonly persistencia = process.env.DB_PERSISTIR_EXECUCOES === '1' ? new PersistenciaExecucoes() : undefined;
  constructor(
    private readonly sistema: SistemaRecomendacao = criarSistemaRecomendacaoPadrao(new GerenciadorNotificacoes()),
    private readonly politicaPadrao: DecoradorRecomendacao[] = []
  ) {}

  async executar(request: ComporEquipeRequestDTO): Promise<ComporEquipeResultado> {
    const ordem = request.decoradores ?? this.politicaPadrao;
    const permitidos = new Set(['cache', 'auditoria', 'compressao']);
    if (new Set(ordem).size !== ordem.length || ordem.some((nome) => !permitidos.has(nome))) {
      throw new Error('Configuração de decoradores inválida.');
    }
    const chave = ordem.join('|');
    let pilha = this.pilhas.get(chave);
    if (!pilha) {
      pilha = montarDecoradores(this.sistema, ordem);
      this.pilhas.set(chave, pilha);
    }
    const resultado = await pilha.recomendar(request);
    if (this.persistencia) {
      try { await this.persistencia.salvar(request, resultado); }
      catch (erro) { console.error('Falha ao registrar recomendação no PostgreSQL', erro); }
    }
    return resultado;
  }
}
