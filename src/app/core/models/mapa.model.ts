export type EstadoRecurso = 'estable' | 'medio' | 'critico' | 'sin-datos';

export interface PuntoMapa {

  id: number;

  nombre: string;

  tipo: string;

  ubicacion?: string;

  latitud: number;

  longitud: number;

  /** Se calcula con la última medición del recurso (mismos umbrales que el backend). */
  estado: EstadoRecurso;

  ph?: number;

  temperatura?: number;

  contaminante?: string;

  /** Fecha de la última medición. */
  fecha?: string;

}
