// Estados que puede tener un proceso durante la simulación.
export type EstadoProceso =
  | "NUEVO"
  | "ESPERANDO_MEMORIA"
  | "LISTO"
  | "EJECUTANDO"
  | "BLOQUEADO"
  | "TERMINADO";

export class Proceso {
  private readonly pid: string;
  private readonly memoriaRequerida: number;
  private readonly cpuTotal: number;

  // Estos datos cambian a medida que avanza la simulación.
  private estado: EstadoProceso = "NUEVO";
  private cpuRestante: number;

  constructor(
    pid: string,
    memoriaRequerida: number,
    cpuTotal: number
  ) {
    // Rechaza identificadores vacíos o formados solo por espacios.
    if (pid.trim().length === 0) {
      throw new Error("El PID no puede estar vacío");
    }

    // La memoria debe solicitarse en unidades enteras positivas.
    if (!Number.isInteger(memoriaRequerida) || memoriaRequerida <= 0) {
      throw new Error("La memoria requerida debe ser un entero positivo");
    }

    // El proceso debe necesitar al menos un tick completo de CPU.
    if (!Number.isInteger(cpuTotal) || cpuTotal <= 0) {
      throw new Error("El tiempo de CPU debe ser un entero positivo");
    }

    this.pid = pid;
    this.memoriaRequerida = memoriaRequerida;
    this.cpuTotal = cpuTotal;

    // Al crearse, tiene pendiente todo su tiempo de CPU.
    this.cpuRestante = cpuTotal;
  }

  esperarMemoria(): void {
    // Solo un proceso nuevo puede ingresar a la espera de memoria.
    if (this.estado !== "NUEVO") {
      throw new Error("Solo un proceso nuevo puede esperar memoria");
    }

    this.estado = "ESPERANDO_MEMORIA";
  }

  admitir(): void {
    // El administrador llamará a esta operación tras asignar memoria.
    if (this.estado !== "ESPERANDO_MEMORIA") {
      throw new Error("Solo un proceso esperando memoria puede ser admitido");
    }

    this.estado = "LISTO";
  }

  despachar(): void {
    // Solo los procesos listos pueden recibir un turno de CPU.
    if (this.estado !== "LISTO") {
      throw new Error("Solo un proceso listo puede ser despachado");
    }

    this.estado = "EJECUTANDO";
  }

  ejecutarTick(): void {
    // Cada llamada consume una unidad de CPU del proceso en ejecución.
    if (this.estado !== "EJECUTANDO") {
      throw new Error("Solo un proceso ejecutando puede consumir CPU");
    }

    this.cpuRestante--;

    // El simulador liberará la memoria al detectar que terminó.
    if (this.cpuRestante === 0) {
      this.estado = "TERMINADO";
    }
  }

  consultar() {
    // Entrega una copia protegida sin exponer objetos internos modificables.
    return Object.freeze({
      pid: this.pid,
      memoriaRequerida: this.memoriaRequerida,
      cpuTotal: this.cpuTotal,
      cpuRestante: this.cpuRestante,
      estado: this.estado
    });
  }
}