import { describe, expect, test } from "vitest";
import { AdministradorMemoria } from "../src/memoria/AdministradorMemoria.js";
import { PrimerAjuste } from "../src/memoria/PrimerAjuste.js";

describe("AdministradorMemoria", () => {
  test("comienza con toda la memoria libre", () => {
    const memoria = new AdministradorMemoria(1024, new PrimerAjuste());

    expect(memoria.consultar()).toEqual({
      tamanoTotal: 1024,
      bloques: [
        { inicio: 0, tamano: 1024, pid: null, libre: true }
      ]
    });
  });

  test("rechaza capacidades inválidas", () => {
    for (const capacidad of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => new AdministradorMemoria(capacidad, new PrimerAjuste()))
        .toThrow("La memoria total debe ser un entero positivo");
    }
  });

  test("asigna memoria y conserva el espacio sobrante", () => {
    const memoria = new AdministradorMemoria(1024, new PrimerAjuste());

    expect(memoria.asignar("P1", 200)).toBe(true);
    expect(memoria.asignar("P2", 300)).toBe(true);

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 200, pid: "P1", libre: false },
      { inicio: 200, tamano: 300, pid: "P2", libre: false },
      { inicio: 500, tamano: 524, pid: null, libre: true }
    ]);
  });

  test("el ajuste exacto no genera un bloque de tamaño cero", () => {
    const memoria = new AdministradorMemoria(200, new PrimerAjuste());

    expect(memoria.asignar("P1", 200)).toBe(true);

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 200, pid: "P1", libre: false }
    ]);
  });

  test("la falta de espacio no modifica la memoria", () => {
    const memoria = new AdministradorMemoria(200, new PrimerAjuste());
    memoria.asignar("P1", 150);
    const antes = memoria.consultar();

    expect(memoria.asignar("P2", 100)).toBe(false);
    expect(memoria.consultar()).toEqual(antes);
  });

  test("rechaza asignar memoria dos veces al mismo PID", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    memoria.asignar("P1", 100);
    const antes = memoria.consultar();

    expect(() => memoria.asignar("P1", 200))
      .toThrow("El proceso ya tiene memoria asignada");

    expect(memoria.consultar()).toEqual(antes);
  });

  test("rechaza un PID vacío sin modificar la memoria", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    const antes = memoria.consultar();

    for (const pid of ["", "   "]) {
      expect(() => memoria.asignar(pid, 100))
        .toThrow("El PID no puede estar vacío");
    }

    expect(memoria.consultar()).toEqual(antes);
  });

  test("rechaza tamaños inválidos sin modificar la memoria", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    const antes = memoria.consultar();

    for (const tamano of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => memoria.asignar("P1", tamano))
        .toThrow("El tamaño solicitado debe ser un entero positivo");
    }

    expect(memoria.consultar()).toEqual(antes);
  });

  test("protege la colección y los datos de sus bloques", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    const vista = memoria.consultar();

    // No se puede reemplazar un bloque ni alterar sus propiedades.
    expect(Reflect.set(vista.bloques, "0", null)).toBe(false);
    expect(Reflect.set(vista.bloques[0], "tamano", 999)).toBe(false);
    expect(Reflect.set(vista, "tamanoTotal", 999)).toBe(false);

    memoria.asignar("P1", 100);

    // Una consulta anterior conserva sus valores aunque avance el sistema.
    expect(vista.bloques).toEqual([
      { inicio: 0, tamano: 500, pid: null, libre: true }
    ]);
    expect(memoria.consultar().bloques).toHaveLength(2);
  });
});