import { mapearProfissional } from '../../../src/application/mappers/compor-equipe.mapper';
import { PapelTecnico } from '../../../src/domain/entities/enums';

describe('mapearProfissional', () => {
  it('converte um DTO completo (competências, avaliações, histórico e disponibilidade)', () => {
    const profissional = mapearProfissional({
      id: 'prof-1',
      nome: 'Carla',
      especialidades: [PapelTecnico.EDITOR],
      valorMinimo: 2000,
      valorMaximo: 8000,
      localizacao: { cidade: 'Rio de Janeiro', uf: 'RJ', pais: 'Brasil' },
      competencias: [{ nome: 'Edição não-linear', nivel: 0.9 }],
      avaliacoes: [{ nota: 4.5 }],
      historicoProjetos: [
        { nomeProjeto: 'Curta anterior', papelDesempenhado: PapelTecnico.EDITOR, dataConclusao: '2025-05-10' }
      ],
      disponibilidades: [{ inicio: '2026-10-01', fim: '2026-12-31' }]
    });

    expect(profissional.competencias).toHaveLength(1);
    expect(profissional.competencias[0].competencia.nome).toBe('Edição não-linear');
    expect(profissional.avaliacoes).toHaveLength(1);
    expect(profissional.historicoProjetos).toHaveLength(1);
    expect(profissional.historicoProjetos[0].nomeProjeto).toBe('Curta anterior');
    expect(profissional.disponibilidades).toHaveLength(1);
    expect(profissional.disponibilidades[0].inicio).toEqual(new Date('2026-10-01'));
  });

  it('usa listas vazias quando os campos opcionais não são informados', () => {
    const profissional = mapearProfissional({
      id: 'prof-2',
      nome: 'Diego',
      especialidades: [PapelTecnico.SONOPLASTA],
      valorMinimo: 1000,
      valorMaximo: 5000,
      localizacao: { cidade: 'Belo Horizonte', uf: 'MG', pais: 'Brasil' }
    });

    expect(profissional.competencias).toEqual([]);
    expect(profissional.avaliacoes).toEqual([]);
    expect(profissional.historicoProjetos).toEqual([]);
    expect(profissional.disponibilidades).toEqual([]);
  });
});
