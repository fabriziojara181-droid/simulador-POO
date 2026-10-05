import { BloqueMemoria } from "../modelo/BloqueMemoria.js";
import type { SeleccionarBloque } from "./SeleccionarBloque.js";
import type { GestionarMemoria } from "./GestionarMemoria.js";

export class AdministradorMemoria implements GestionarMemoria {
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


  liberar(pid: string): boolean {
    const indice = this.bloques.findIndex(
      (bloque) => bloque.consultar().pid === pid
    );

    // Si el proceso no tiene memoria asignada, no modificamos nada.
    if (indice === -1) {
      return false;
    }

    const datos = this.bloques[indice].consultar();

    // Reemplazamos el bloque ocupado por uno libre del mismo tamaño.
    this.bloques[indice] = new BloqueMemoria(
      datos.inicio,
      datos.tamano
    );

    this.unirBloquesLibres();
    return true;
  }

  private unirBloquesLibres(): void {
    let indice = 0;

    // Comparamos cada bloque con el siguiente.
    while (indice < this.bloques.length - 1) {
      const actual = this.bloques[indice];
      const siguiente = this.bloques[indice + 1];

      if (actual.estaLibre() && siguiente.estaLibre()) {
        const datosActual = actual.consultar();
        const datosSiguiente = siguiente.consultar();

        const unido = new BloqueMemoria(
          datosActual.inicio,
          datosActual.tamano + datosSiguiente.tamano
        );

        // Reemplazamos los dos bloques vecinos por uno solo.
        this.bloques.splice(indice, 2, unido);

        // Conservamos el índice para comprobar si puede unirse con otro.
      } else {
        indice++;
      }
    }
  }


  obtenerMetricas() {
    let memoriaLibre = 0;
    let mayorBloqueLibre = 0;

    // Sumamos los espacios libres y buscamos el mayor hueco contiguo.
    for (const bloque of this.bloques) {
      if (bloque.estaLibre()) {
        const tamano = bloque.consultar().tamano;
        memoriaLibre += tamano;
        mayorBloqueLibre = Math.max(mayorBloqueLibre, tamano);
      }
    }

    const memoriaOcupada = this.tamanoTotal - memoriaLibre;
    const porcentajeOcupacion =
      (memoriaOcupada / this.tamanoTotal) * 100;

    // Sin memoria libre, evitamos dividir por cero.
    let fragmentacionExterna = 0;

    if (memoriaLibre > 0) {
      fragmentacionExterna =
        (1 - mayorBloqueLibre / memoriaLibre) * 100;
    }

    return Object.freeze({
      memoriaOcupada,
      memoriaLibre,
      mayorBloqueLibre,
      porcentajeOcupacion,
      fragmentacionExterna
    });
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