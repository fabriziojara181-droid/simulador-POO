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
  });