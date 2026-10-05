import { describe, expect, test } from "vitest";
import { BloqueMemoria } from "../src/modelo/BloqueMemoria.js";

describe("BloqueMemoria", () => {
  test("crea un bloque libre cuando no recibe un PID", () => {
    const bloque = new BloqueMemoria(0, 1024);

    expect(bloque.estaLibre()).toBe(true);
    expect(bloque.consultar()).toEqual({
      inicio: 0,
      tamano: 1024,
      pid: null,
      libre: true
    });
  });

  test("crea un bloque ocupado por un proceso", () => {
    const bloque = new BloqueMemoria(200, 300, "P1");

    expect(bloque.estaLibre()).toBe(false);
    expect(bloque.consultar()).toEqual({
      inicio: 200,
      tamano: 300,
      pid: "P1",
      libre: false
    });
  });

  test("rechaza direcciones iniciales inválidas", () => {
    // Cada valor representa una dirección que no podemos utilizar.
    for (const inicio of [-1, 0.5, NaN, Infinity]) {
      expect(() => new BloqueMemoria(inicio, 100))
        .toThrow("El inicio debe ser un entero mayor o igual a cero");
    }
  });

  test("rechaza tamaños inválidos", () => {
    for (const tamano of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => new BloqueMemoria(0, tamano))
        .toThrow("El tamaño debe ser un entero positivo");
    }
  });

  test("rechaza un PID vacío o formado solo por espacios", () => {
    for (const pid of ["", "   "]) {
      expect(() => new BloqueMemoria(0, 100, pid))
        .toThrow("El PID del bloque no puede estar vacío");
    }
  });

  test("protege los datos devueltos por la consulta", () => {
    const bloque = new BloqueMemoria(0, 100);
    const datos = bloque.consultar();

    expect(Reflect.set(datos, "tamano", 999)).toBe(false);
    expect(Reflect.set(datos, "pid", "P1")).toBe(false);

    expect(bloque.consultar().tamano).toBe(100);
    expect(bloque.estaLibre()).toBe(true);
  });
});