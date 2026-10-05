import { describe, expect, test } from "vitest";
import { Proceso } from "../src/modelo/Proceso.js";

describe("Proceso", () => {
  test("permite consultar sus datos iniciales", () => {
    const proceso = new Proceso("P1", 200, 4);

    const datos = proceso.consultar();

    expect(datos).toEqual({
      pid: "P1",
      memoriaRequerida: 200,
      cpuTotal: 4
    });
});
  test("protege los datos devueltos por la consulta", () => {
    const proceso = new Proceso("P1", 200, 4);
    const datos = proceso.consultar();

    const pudoModificar = Reflect.set(datos, "memoriaRequerida", 999);

    expect(pudoModificar).toBe(false);
    expect(datos.memoriaRequerida).toBe(200);
    expect(proceso.consultar().memoriaRequerida).toBe(200);
  });
    test("rechaza un PID vacío", () => {
    expect(() => new Proceso("", 200, 4))
      .toThrow("El PID no puede estar vacío");
  });
    test("rechaza un PID formado solo por espacios", () => {
    expect(() => new Proceso("   ", 200, 4))
      .toThrow("El PID no puede estar vacío");
  });
    test("rechaza memoria igual a cero", () => {
    expect(() => new Proceso("P1", 0, 4))
      .toThrow("La memoria requerida debe ser un entero positivo");
  });

  test("rechaza memoria negativa", () => {
    expect(() => new Proceso("P1", -100, 4))
      .toThrow("La memoria requerida debe ser un entero positivo");
  });

  test("rechaza memoria con decimales", () => {
    expect(() => new Proceso("P1", 10.5, 4))
      .toThrow("La memoria requerida debe ser un entero positivo");
  });
    test("rechaza tiempo de CPU igual a cero", () => {
    expect(() => new Proceso("P1", 200, 0))
      .toThrow("El tiempo de CPU debe ser un entero positivo");
  });

  test("rechaza tiempo de CPU negativo", () => {
    expect(() => new Proceso("P1", 200, -4))
      .toThrow("El tiempo de CPU debe ser un entero positivo");
  });

  test("rechaza tiempo de CPU con decimales", () => {
    expect(() => new Proceso("P1", 200, 2.5))
      .toThrow("El tiempo de CPU debe ser un entero positivo");
  });
  });