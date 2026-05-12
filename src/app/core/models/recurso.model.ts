export type TipoRecurso = 'Rio' | 'Lago' | 'Planta' | 'Embalse' | 'Acuifero';

export interface Recurso {
  id?: number;
  nombre: string;
  tipo: TipoRecurso;
  ubicacion: string;
  latitud: number;
  longitud: number;
}
