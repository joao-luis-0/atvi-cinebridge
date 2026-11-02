import { AppDataSource } from '../infrastructure/persistence/data-source';
import type { ComporEquipeRequestDTO } from './dto/compor-equipe.dto';
import type { ResultadoOrquestracao } from '../domain/orchestration/orquestrador-equipe';
import { mapearRespostaRecomendacao } from './mappers/resposta-recomendacao.mapper';


export class PersistenciaExecucoes {
  private inicializacao?: Promise<void>;

  private preparar(): Promise<void> {
    if (!this.inicializacao) {
      this.inicializacao = (async () => {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        await AppDataSource.query(`
          CREATE TABLE IF NOT EXISTS cinebridge_execucoes (
            id BIGSERIAL PRIMARY KEY,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            projeto_nome TEXT NOT NULL,
            solicitacao JSONB NOT NULL,
            resultado JSONB NOT NULL
          )
        `);
      })().catch((erro: unknown) => {
        this.inicializacao = undefined;
        throw erro;
      });
    }
    return this.inicializacao;
  }

  async salvar(request: ComporEquipeRequestDTO, resultado: ResultadoOrquestracao): Promise<void> {
    await this.preparar();
    await AppDataSource.query(
      'INSERT INTO cinebridge_execucoes (projeto_nome, solicitacao, resultado) VALUES ($1, $2::jsonb, $3::jsonb)',
      [request.projeto.nome, JSON.stringify(request), JSON.stringify(mapearRespostaRecomendacao(resultado))]
    );
  }
}
