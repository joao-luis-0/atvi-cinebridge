import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { StatusConvite } from './enums';
import { AlocacaoRecomendada } from './alocacao-recomendada';


@Entity('convites')
export class Convite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => AlocacaoRecomendada, (alocacao) => alocacao.convite, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'alocacao_id' })
  alocacao!: AlocacaoRecomendada;

  @Column({ type: 'enum', enum: StatusConvite, default: StatusConvite.PENDENTE })
  status!: StatusConvite;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dataEnvio!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataResposta?: Date;

  foiAceito(): boolean {
    return this.status === StatusConvite.ACEITO;
  }

  foiRespondido(): boolean {
    return this.status !== StatusConvite.PENDENTE;
  }

  aceitar(): void {
    this.status = StatusConvite.ACEITO;
    this.dataResposta = new Date();
  }

  recusar(): void {
    this.status = StatusConvite.RECUSADO;
    this.dataResposta = new Date();
  }
}
