import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PapelTecnico } from './enums';
import { Projeto } from './projeto';
import type { Visitante } from '../visitors/visitante.interface';

@Entity('papeis_obrigatorios')
export class PapelObrigatorio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: PapelTecnico })
  papel!: PapelTecnico;

  /** Peso de importância relativa para o sucesso do projeto, de 0 a 1. */
  @Column({ type: 'decimal', precision: 3, scale: 2 })
  peso!: number;

  @ManyToOne(() => Projeto, (projeto) => projeto.papeisObrigatorios, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  /**
   * Padrão Prototype: cópia independente deste papel. A referência ao
   * projeto de origem não é copiada — quem clona o Projeto é quem passa
   * a ser o dono dos papéis clonados.
   */
  clonar(): PapelObrigatorio {
    const copia = new PapelObrigatorio();
    copia.papel = this.papel;
    copia.peso = this.peso;
    return copia;
  }

  /** Padrão Visitor: elemento-folha, apenas notifica o visitante sobre si mesmo. */
  aceitar(visitante: Visitante): void {
    visitante.visitarPapelObrigatorio(this);
  }
}
