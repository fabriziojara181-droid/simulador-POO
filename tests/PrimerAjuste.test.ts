import { describe, expect, test } from "vitest";
import { BloqueMemoria } from "../src/modelo/BloqueMemoria.js";
import { PrimerAjuste } from "../src/memoria/PrimerAjuste.js";
import type { SeleccionarBloque } from "../src/memoria/SeleccionarBloque.js";

describe("PrimerAjuste", () => {
  test("selecciona el primer bloque libre suficiente", () => {
    // Los bloques están ordenados por su dirección inicial.
    const bloques = [
      new BloqueMemoria(0, 50),
      new BloqueMemoria(50, 300),
      new BloqueMemoria(350, 200)
    ];

    const politica: SeleccionarBloque = new PrimerAjuste();

    expect(politica.seleccionar(bloques, 150)).toBe(1);
  });

  test("ignora los bloques ocupados aunque tengan espacio", () => {
    const bloques = [
      new BloqueMemoria(0, 400, "P1"),
      new BloqueMemoria(400, 200)
    ];

    const politica: SeleccionarBloque = new PrimerAjuste();

    expect(politica.seleccionar(bloques, 100)).toBe(1);
  });

  test("acepta un bloque del tamaño exacto solicitado", () => {
    const bloques = [new BloqueMemoria(0, 200)];
    const politica: SeleccionarBloque = new PrimerAjuste();

    expect(politica.seleccionar(bloques, 200)).toBe(0);
  });

  test("devuelve -1 cuando ningún hueco individual alcanza", () => {
    // Hay 400 libres en total, pero separados por un bloque ocupado.
    const bloques = [
      new BloqueMemoria(0, 200),
      new BloqueMemoria(200, 100, "P1"),
      new BloqueMemoria(300, 200)
    ];

    const politica: SeleccionarBloque = new PrimerAjuste();

    expect(politica.seleccionar(bloques, 300)).toBe(-1);
  });

  test("devuelve -1 cuando no hay bloques", () => {
    const politica: SeleccionarBloque = new PrimerAjuste();

    expect(politica.seleccionar([], 100)).toBe(-1);
  });

  test("rechaza tamaños solicitados inválidos", () => {
    const bloques = [new BloqueMemoria(0, 1024)];
    const politica: SeleccionarBloque = new PrimerAjuste();

    for (const tamano of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => politica.seleccionar(bloques, tamano))
        .toThrow("El tamaño solicitado debe ser un entero positivo");
    }
  });

  test("seleccionar no modifica los bloques ni su orden", () => {
    const bloques = [
      new BloqueMemoria(0, 200),
      new BloqueMemoria(200, 300)
    ];
    const antes = bloques.map((bloque) => bloque.consultar());
    const politica: SeleccionarBloque = new PrimerAjuste();

    politica.seleccionar(bloques, 100);

    expect(bloques.map((bloque) => bloque.consultar())).toEqual(antes);
  });
});