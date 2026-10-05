import { BloqueMemoria } from "../modelo/BloqueMemoria.js";
import type { SeleccionarBloque } from "./SeleccionarBloque.js";

export class PrimerAjuste implements SeleccionarBloque {
  seleccionar(
    bloques: readonly BloqueMemoria[],
    tamanoSolicitado: number
  ): number {
    // Solo se pueden buscar espacios de tamaño entero positivo.
    if (!Number.isInteger(tamanoSolicitado) || tamanoSolicitado <= 0) {
      throw new Error("El tamaño solicitado debe ser un entero positivo");
    }

    // El administrador mantendrá los bloques ordenados por dirección.
    return bloques.findIndex((bloque) =>
      bloque.estaLibre() &&
      bloque.consultar().tamano >= tamanoSolicitado
    );
  }
}