export class Proceso {
  private readonly pid: string;
  private readonly memoriaRequerida: number;
  private readonly cpuTotal: number;

  constructor(
    pid: string,
    memoriaRequerida: number,
    cpuTotal: number
  ) {
    // Rechaza identificadores vacíos o formados solo por espacios.
    if (pid.trim().length === 0) {
      throw new Error("El PID no puede estar vacío");
    }
    // La memoria se solicita en unidades enteras y debe ser mayor que cero.
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
  }

  consultar() {
    // Entrega una copia protegida de los datos del proceso.
    return Object.freeze({
      pid: this.pid,
      memoriaRequerida: this.memoriaRequerida,
      cpuTotal: this.cpuTotal
    });
  }
}