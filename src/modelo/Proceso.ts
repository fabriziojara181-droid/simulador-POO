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