import { Column } from 'typeorm';


export class Localizacao {
  @Column({ type: 'varchar', length: 120 })
  cidade!: string;

  @Column({ type: 'varchar', length: 2 })
  uf!: string;

  @Column({ type: 'varchar', length: 60 })
  pais!: string;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number;

  /** Padrão Prototype: cópia independente desta localização. */
  clonar(): Localizacao {
    const copia = new Localizacao();
    copia.cidade = this.cidade;
    copia.uf = this.uf;
    copia.pais = this.pais;
    copia.latitude = this.latitude;
    copia.longitude = this.longitude;
    return copia;
  }
}
