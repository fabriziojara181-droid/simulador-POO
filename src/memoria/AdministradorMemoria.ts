import { BloqueMemoria } from "../modelo/BloqueMemoria.js";
import type { SeleccionarBloque } from "./SeleccionarBloque.js";

export class AdministradorMemoria {
  private readonly tamanoTotal: number;
  private readonly politica: SeleccionarBloque;
  private bloques: BloqueMemoria[];

  constructor(tamanoTotal: number, politica: SeleccionarBloque) {
    // La RAM debe tener una capacidad entera y positiva.
    if (!Number.isInteger(tamanoTotal) || tamanoTotal <= 0) {
      throw new Error("La memoria total debe ser un entero positivo");
    }

    this.tamanoTotal = tamanoTotal;
    this.politica = politica;

    // Al inicio, toda la memoria forma un único bloque libre.
    this.bloques = [new BloqueMemoria(0, tamanoTotal)];
  }

  asignar(pid: string, tamano: number): boolean {
    // Validamos antes de modificar cualquier bloque.
    if (pid.trim().length === 0) {
      throw new Error("El PID no puede estar vacío");
    }

    if (!Number.isInteger(tamano) || tamano <= 0) {
      throw new Error("El tamaño solicitado debe ser un entero positivo");
    }

    const yaTieneMemoria = this.bloques.some(
      (bloque) => bloque.consultar().pid === pid
    );

    if (yaTieneMemoria) {
      throw new Error("El proceso ya tiene memoria asignada");
    }

    // La política elige el lugar sin recibir el arreglo interno modificable.
    const indice = this.politica.seleccionar(
      Object.freeze([...this.bloques]),
      tamano
    );

    // No encontrar un hueco es un resultado posible de la simulación.
    if (indice === -1) {
      return false;
    }

    const datos = this.bloques[indice].consultar();
    const reemplazos = [new BloqueMemoria(datos.inicio, tamano, pid)];

    // Si sobra espacio, conservamos el resto como un bloque libre.
    if (datos.tamano > tamano) {
      reemplazos.push(
        new BloqueMemoria(
          datos.inicio + tamano,
          datos.tamano - tamano
        )
      );
    }

    // Sustituimos el hueco por el bloque ocupado y su posible sobrante.
    this.bloques.splice(indice, 1, ...reemplazos);
    return true;
  }

  consultar() {
    // Protegemos tanto la colección como los datos de cada bloque.
    return Object.freeze({
      tamanoTotal: this.tamanoTotal,
      bloques: Object.freeze(
        this.bloques.map((bloque) => bloque.consultar())
      )
    });
  }
}