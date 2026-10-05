import { BloqueMemoria } from "../modelo/BloqueMemoria.js";

export interface SeleccionarBloque {
  // Devuelve la posición de un bloque suficiente, o -1 si no existe.
  seleccionar(
    bloques: readonly BloqueMemoria[],
    tamanoSolicitado: number
  ): number;
}