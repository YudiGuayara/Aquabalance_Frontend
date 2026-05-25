export interface PuntoMapa {

  id: number;

  nombre: string;

  tipo: string;

  latitud: number;

  longitud: number;

  estado: string;

  ph?: number;

  temperatura?: number;

  contaminante?: string;

}
