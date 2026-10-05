// Datos que se pueden consultar de cada bloque.
export type VistaBloqueMemoria = Readonly<{
  inicio: number;
  tamano: number;
  pid: string | null;
  libre: boolean;
}>;

export type VistaMemoria = Readonly<{
  tamanoTotal: number;
  bloques: readonly VistaBloqueMemoria[];
}>;

export type MetricasMemoria = Readonly<{
  memoriaOcupada: number;
  memoriaLibre: number;
  mayorBloqueLibre: number;
  porcentajeOcupacion: number;
  fragmentacionExterna: number;
}>;

// Contrato de las operaciones que ofrece el administrador de memoria.
export interface GestionarMemoria {
  asignar(pid: string, tamano: number): boolean;
  liberar(pid: string): boolean;
  consultar(): VistaMemoria;
  obtenerMetricas(): MetricasMemoria;
}