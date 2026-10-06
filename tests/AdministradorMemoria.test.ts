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
  test("libera memoria, une vecinos y permite reutilizar el espacio", () => {
    const memoria = new AdministradorMemoria(400, new PrimerAjuste());
    memoria.asignar("P1", 100);
    memoria.asignar("P2", 100);
    memoria.asignar("P3", 100);
    memoria.asignar("P4", 100);

    // Primero queda un hueco entre procesos ocupados.
    expect(memoria.liberar("P2")).toBe(true);

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 100, pid: "P1", libre: false },
      { inicio: 100, tamano: 100, pid: null, libre: true },
      { inicio: 200, tamano: 100, pid: "P3", libre: false },
      { inicio: 300, tamano: 100, pid: "P4", libre: false }
    ]);

    // Al liberar P1, se une con el hueco de su derecha.
    memoria.liberar("P1");

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 200, pid: null, libre: true },
      { inicio: 200, tamano: 100, pid: "P3", libre: false },
      { inicio: 300, tamano: 100, pid: "P4", libre: false }
    ]);

    // Al liberar P3, se une con el hueco de su izquierda.
    memoria.liberar("P3");

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 300, pid: null, libre: true },
      { inicio: 300, tamano: 100, pid: "P4", libre: false }
    ]);

    // El espacio unido admite un proceso mayor que los bloques originales.
    expect(memoria.asignar("P5", 250)).toBe(true);

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 250, pid: "P5", libre: false },
      { inicio: 250, tamano: 50, pid: null, libre: true },
      { inicio: 300, tamano: 100, pid: "P4", libre: false }
    ]);
  });
  test("liberar un PID inexistente o ya liberado no cambia la memoria", () => {
    const memoria = new AdministradorMemoria(100, new PrimerAjuste());
    memoria.asignar("P1", 100);
    const antes = memoria.consultar();

    expect(memoria.liberar("P9")).toBe(false);
    expect(memoria.consultar()).toEqual(antes);

    expect(memoria.liberar("P1")).toBe(true);
    expect(memoria.liberar("P1")).toBe(false);

    expect(memoria.consultar().bloques).toEqual([
      { inicio: 0, tamano: 100, pid: null, libre: true }
    ]);
  });
    test("calcula las métricas con memoria vacía y completamente ocupada", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());

    expect(memoria.obtenerMetricas()).toEqual({
      memoriaOcupada: 0,
      memoriaLibre: 500,
      mayorBloqueLibre: 500,
      porcentajeOcupacion: 0,
      fragmentacionExterna: 0
    });

    memoria.asignar("P1", 500);

    expect(memoria.obtenerMetricas()).toEqual({
      memoriaOcupada: 500,
      memoriaLibre: 0,
      mayorBloqueLibre: 0,
      porcentajeOcupacion: 100,
      fragmentacionExterna: 0
    });
  });

  test("mide la fragmentación y la elimina al unir los huecos", () => {
    const memoria = new AdministradorMemoria(500, new PrimerAjuste());
    memoria.asignar("P1", 100);
    memoria.asignar("P2", 100);
    memoria.asignar("P3", 300);

    // P2 queda ocupando el espacio entre dos huecos libres.
    memoria.liberar("P1");
    memoria.liberar("P3");

    expect(memoria.obtenerMetricas()).toEqual({
      memoriaOcupada: 100,
      memoriaLibre: 400,
      mayorBloqueLibre: 300,
      porcentajeOcupacion: 20,
      fragmentacionExterna: 25
    });

    // La suma libre alcanza, pero ningún hueco individual admite 350.
    const antes = memoria.consultar();

    expect(memoria.asignar("P4", 350)).toBe(false);
    expect(memoria.consultar()).toEqual(antes);

    memoria.liberar("P2");

    expect(memoria.obtenerMetricas()).toEqual({
      memoriaOcupada: 0,
      memoriaLibre: 500,
      mayorBloqueLibre: 500,
      porcentajeOcupacion: 0,
      fragmentacionExterna: 0
    });
  });
});