//representa una porción contigua de RAM
export class BloqueMemoria {
  private readonly inicio: number;
  private readonly tamano: number;
  private readonly pid: string | null;

  constructor(inicio: number, tamano: number, pid: string | null = null) {
    // Las direcciones comienzan en cero y avanzan en unidades enteras.
    if (!Number.isInteger(inicio) || inicio < 0) {
      throw new Error("El inicio debe ser un entero mayor o igual a cero");
    }

    // No puede existir un bloque vacío ni de tamaño negativo.
    if (!Number.isInteger(tamano) || tamano <= 0) {
      throw new Error("El tamaño debe ser un entero positivo");
    }

    // Un bloque ocupado debe identificar al proceso que lo utiliza.
    if (pid !== null && pid.trim().length === 0) {
      throw new Error("El PID del bloque no puede estar vacío");
    }

    this.inicio = inicio;
    this.tamano = tamano;
    this.pid = pid;
  }

  estaLibre(): boolean {
    // La ausencia de un proceso indica que el bloque está disponible.
    return this.pid === null;
  }

  consultar() {
    // Devuelve valores protegidos, sin permitir modificar el bloque.
    return Object.freeze({
      inicio: this.inicio,
      tamano: this.tamano,
      pid: this.pid,
      libre: this.estaLibre()
    });
  }
}