export type NivelContaminante = 'Bajo' | 'Medio' | 'Alto' | 'Critico';

export interface Contaminante {
  id?: number;
  nombre: string;
  carga: number;
  nivel: NivelContaminante;
  fuenteOrigen: string;
}
