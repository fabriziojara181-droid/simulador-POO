import type { BloqueMemoria } from "../modelo/BloqueMemoria.js";
import type { SeleccionarBloque } from "./SeleccionarBloque.js";

export class MejorAjuste implements SeleccionarBloque {
  seleccionar(
    bloques: readonly BloqueMemoria[],
    tamanoSolicitado: number
  ): number {
    if (!Number.isInteger(tamanoSolicitado) || tamanoSolicitado <= 0) {
      throw new Error("El tamaño solicitado debe ser un entero positivo");
    }

    let mejorIndice = -1;
    let menorTamano = Infinity;

    // Los bloques llegan ordenados por su dirección inicial.
    for (let indice = 0; indice < bloques.length; indice++) {
      const bloque = bloques[indice];
      const datos = bloque.consultar();

      if (
        bloque.estaLibre() &&
        datos.tamano >= tamanoSolicitado &&
        datos.tamano < menorTamano
      ) {
        mejorIndice = indice;
        menorTamano = datos.tamano;
      }
    }

    // Si hay empate, conservamos el primero: el de menor dirección.
    return mejorIndice;
  }
}