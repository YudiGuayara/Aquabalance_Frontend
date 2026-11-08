export interface Informe {
  id?: number;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  recursoId: number;
  contaminanteId: number;
  nombreRecurso?: string;
  nombreContaminante?: string;
  fechaGeneracion?: string;
  estadisticas?: Estadisticas;
}

export interface Estadisticas {
  totalMediciones: number;
  totalAlertas: number;
  totalEventos: number;
  promedioPh: number;
  promedioTemperatura: number;
  phMinimo: number;
  phMaximo: number;
  temperaturaMinima: number;
  temperaturaMaxima: number;
  medicionesPorContaminante: { [key: string]: number };
  alertasPorNivel: { [key: string]: number };
  eventosPorMagnitud: { [key: string]: number };
  alertas: AlertaResumen[];
  eventos: EventoResumen[];
  evolucionPh: PuntoTemporal[];
  evolucionTemperatura: PuntoTemporal[];
  fechaInicio: string;
  fechaFin: string;
  oxigenoDisuelto?: number;
  conductividad?: number;
  turbidez?: number;
  nitratos?: number;
  coliformesFecales?: number;
  dbo5?: number;
  metalesPesados?: number;
}

export interface PuntoTemporal {
  fecha: string;
  valor: number;
}

export interface AlertaResumen {
  id: number;
  nivel: string;
  mensaje: string;
  fecha: string;
}

export interface EventoResumen {
  id: number;
  descripcion: string;
  magnitud: string;
  fecha: string;
}

export interface ParametroCalidad {
  nombre: string;
  unidad: string;
  valor: number | undefined;
  minOk?: number;
  maxOk: number;
  descripcionLimite: string;
}

export type NivelCalidad = 'ok' | 'warn' | 'danger';

export interface ScoreCalidad {
  score: number;
  clasificacion: 'Excelente' | 'Buena' | 'Regular' | 'Mala' | 'Crítica';
  descripcion: string;
  parametrosOk: number;
  parametrosWarn: number;
  parametrosDanger: number;
}
