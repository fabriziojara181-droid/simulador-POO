import { describe, expect, test } from "vitest";
import { BloqueMemoria } from "../src/modelo/BloqueMemoria.js";
import { AdministradorMemoria } from "../src/memoria/AdministradorMemoria.js";
import { PrimerAjuste } from "../src/memoria/PrimerAjuste.js";
import { MejorAjuste } from "../src/memoria/MejorAjuste.js";

describe("MejorAjuste", () => {
  test("elige el menor hueco suficiente y desempata por dirección", () => {
    const bloques = [
      new BloqueMemoria(0, 300),
      new BloqueMemoria(300, 100, "P1"),
      new BloqueMemoria(400, 150),
      new BloqueMemoria(550, 150),
      new BloqueMemoria(700, 50)
    ];

    const politica = new MejorAjuste();

    // Ignora el ocupado y el insuficiente; entre los de 150, elige el primero.
    expect(politica.seleccionar(bloques, 100)).toBe(2);
    expect(politica.seleccionar(bloques, 150)).toBe(2);
    expect(politica.seleccionar(bloques, 400)).toBe(-1);
    expect(politica.seleccionar([], 100)).toBe(-1);
  });

  test("rechaza tamaños solicitados inválidos", () => {
    const politica = new MejorAjuste();

    for (const tamano of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => politica.seleccionar([], tamano))
        .toThrow("El tamaño solicitado debe ser un entero positivo");
    }
  });

  test("permite cambiar la asignación sin modificar el administrador", () => {
    const primerAjuste = new AdministradorMemoria(500, new PrimerAjuste());
    const mejorAjuste = new AdministradorMemoria(500, new MejorAjuste());

    // Preparamos la misma distribución con ambas políticas.
    for (const memoria of [primerAjuste, mejorAjuste]) {
      memoria.asignar("P1", 200);
      memoria.asignar("P2", 100);
      memoria.asignar("P3", 100);
      memoria.liberar("P1");

      // Quedan dos huecos: 200 al principio y 100 al final.
      expect(memoria.asignar("P4", 80)).toBe(true);
    }

    const bloquePrimerAjuste = primerAjuste.consultar().bloques.find(
      (bloque) => bloque.pid === "P4"
    );
    const bloqueMejorAjuste = mejorAjuste.consultar().bloques.find(
      (bloque) => bloque.pid === "P4"
    );

    expect(bloquePrimerAjuste?.inicio).toBe(0);
    expect(bloqueMejorAjuste?.inicio).toBe(400);
  });
});