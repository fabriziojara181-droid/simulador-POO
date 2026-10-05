import { describe, expect, test } from "vitest";
import { Proceso } from "../src/modelo/Proceso.js";

describe("Proceso", () => {
  test("permite consultar sus datos iniciales", () => {
    const proceso = new Proceso("P1", 200, 4);

    const datos = proceso.consultar();

    expect(datos).toEqual({
      pid: "P1",
      memoriaRequerida: 200,
      cpuTotal: 4,
      cpuRestante: 4,
      estado: "NUEVO"
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
    test("un proceso nuevo puede pasar a esperar memoria", () => {
    const proceso = new Proceso("P1", 200, 4);

    proceso.esperarMemoria();

    expect(proceso.consultar().estado).toBe("ESPERANDO_MEMORIA");
    expect(proceso.consultar().cpuRestante).toBe(4);
  });

  test("rechaza ingresar dos veces a la espera de memoria", () => {
    const proceso = new Proceso("P1", 200, 4);
    proceso.esperarMemoria();

    expect(() => proceso.esperarMemoria())
      .toThrow("Solo un proceso nuevo puede esperar memoria");

    expect(proceso.consultar().estado).toBe("ESPERANDO_MEMORIA");
  });
    test("admite un proceso que espera memoria", () => {
    const proceso = new Proceso("P1", 200, 4);
    proceso.esperarMemoria();

    proceso.admitir();

    expect(proceso.consultar().estado).toBe("LISTO");
    expect(proceso.consultar().cpuRestante).toBe(4);
  });

  test("rechaza admitir un proceso nuevo", () => {
    const proceso = new Proceso("P1", 200, 4);

    expect(() => proceso.admitir())
      .toThrow("Solo un proceso esperando memoria puede ser admitido");

    expect(proceso.consultar().estado).toBe("NUEVO");
  });

  test("despacha un proceso listo y consume un tick de CPU", () => {
    const proceso = new Proceso("P1", 200, 4);
    proceso.esperarMemoria();
    proceso.admitir();

    proceso.despachar();

    expect(proceso.consultar().estado).toBe("EJECUTANDO");
    expect(proceso.consultar().cpuRestante).toBe(4);

    proceso.ejecutarTick();

    expect(proceso.consultar().cpuRestante).toBe(3);
    expect(proceso.consultar().estado).toBe("EJECUTANDO");
  });

  test("rechaza despachar un proceso que espera memoria", () => {
    const proceso = new Proceso("P1", 200, 4);
    proceso.esperarMemoria();

    expect(() => proceso.despachar())
      .toThrow("Solo un proceso listo puede ser despachado");

    expect(proceso.consultar().estado).toBe("ESPERANDO_MEMORIA");
  });

  test("rechaza consumir CPU antes del despacho", () => {
    const proceso = new Proceso("P1", 200, 4);
    proceso.esperarMemoria();
    proceso.admitir();

    expect(() => proceso.ejecutarTick())
      .toThrow("Solo un proceso ejecutando puede consumir CPU");

    expect(proceso.consultar().estado).toBe("LISTO");
    expect(proceso.consultar().cpuRestante).toBe(4);
  });

  test("termina al agotar su CPU y rechaza seguir ejecutando", () => {
    const proceso = new Proceso("P1", 200, 1);
    proceso.esperarMemoria();
    proceso.admitir();
    proceso.despachar();

    proceso.ejecutarTick();

    expect(proceso.consultar().estado).toBe("TERMINADO");
    expect(proceso.consultar().cpuRestante).toBe(0);

    expect(() => proceso.ejecutarTick())
      .toThrow("Solo un proceso ejecutando puede consumir CPU");

    expect(proceso.consultar().cpuRestante).toBe(0);
  });
  });