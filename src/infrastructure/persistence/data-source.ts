import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Projeto,
  PapelObrigatorio,
  Competencia,
  ProfissionalCompetencia,
  Avaliacao,
  HistoricoProjetoAnterior,
  DisponibilidadePeriodo,
  Profissional,
  Convite,
  AlocacaoRecomendada,
  Recomendacao
} from '../../domain/entities';


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'cinebridge',
  password: process.env.DB_PASSWORD ?? 'cinebridge',
  database: process.env.DB_DATABASE ?? 'cinebridge_recomendacao',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false,
  entities: [
    Projeto,
    PapelObrigatorio,
    Competencia,
    ProfissionalCompetencia,
    Avaliacao,
    HistoricoProjetoAnterior,
    DisponibilidadePeriodo,
    Profissional,
    Convite,
    AlocacaoRecomendada,
    Recomendacao
  ],
  migrations: [],
  subscribers: []
});
