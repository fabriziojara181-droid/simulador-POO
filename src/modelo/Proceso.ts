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

  // Estos datos cambiarán a medida que avance la simulación.
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

    // Al crearse, todavía tiene pendiente todo su tiempo de CPU.
    this.cpuRestante = cpuTotal;
  }

  consultar() {
    // Entrega una copia protegida de los datos del proceso.
    return Object.freeze({
      pid: this.pid,
      memoriaRequerida: this.memoriaRequerida,
      cpuTotal: this.cpuTotal,
      cpuRestante: this.cpuRestante,
      estado: this.estado
    });
  }
}