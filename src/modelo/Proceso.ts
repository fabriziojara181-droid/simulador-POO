export class Proceso {
  private readonly pid: string;
  private readonly memoriaRequerida: number;
  private readonly cpuTotal: number;

  constructor(
    pid: string,
    memoriaRequerida: number,
    cpuTotal: number
  ) {
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