import { describe, expect, test } from "vitest";
import { Simulador } from "../src/simulacion/Simulador.js";

describe("Simulador", () => {
  test("comienza con memoria libre, CPU vacía y reloj en cero", () => {
    const simulador = new Simulador(500, 2);

    expect(simulador.consultar()).toEqual({
      reloj: 0,
      planificador: {
        quantum: 2,
        quantumConsumido: 0,
        procesoEnCPU: null,
        listos: [],
        cambiosContexto: 0
      },
      memoria: {
        tamanoTotal: 500,
        bloques: [
          { inicio: 0, tamano: 500, pid: null, libre: true }
        ]
      },
      procesos: []
    });

    expect(simulador.obtenerMetricas()).toEqual({
      memoriaOcupada: 0,
      memoriaLibre: 500,
      mayorBloqueLibre: 500,
      porcentajeOcupacion: 0,
      fragmentacionExterna: 0,
      utilizacionCPU: 0,
      cambiosContexto: 0
    });
  });

  test("rechaza registros duplicados o mayores que la RAM sin cambiar el sistema", () => {
    const simulador = new Simulador(300, 2);
    simulador.registrarProceso("P1", 100, 3);
    const antes = simulador.consultar();

    expect(() => simulador.registrarProceso("P1", 100, 2))
      .toThrow("Ya existe un proceso con ese PID");

    expect(() => simulador.registrarProceso("P2", 400, 2))
      .toThrow("El proceso solicita más memoria que la disponible en total");

    expect(simulador.consultar()).toEqual(antes);
    expect(simulador.consultarProceso("P1").estado).toBe("NUEVO");
  });

  test("ejecuta un proceso hasta terminar y libera su memoria", () => {
    const simulador = new Simulador(300, 2);
    simulador.registrarProceso("P1", 100, 2);

    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "EJECUTANDO",
      cpuRestante: 1
    });
    expect(simulador.obtenerMetricas().memoriaOcupada).toBe(100);

    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "TERMINADO",
      cpuRestante: 0
    });
    expect(simulador.consultar().reloj).toBe(2);
    expect(simulador.consultar().planificador.procesoEnCPU).toBeNull();
    expect(simulador.consultar().memoria.bloques).toEqual([
      { inicio: 0, tamano: 300, pid: null, libre: true }
    ]);
    expect(simulador.obtenerMetricas().utilizacionCPU).toBe(100);

    // Un tick sin trabajo avanza el reloj, pero no consume CPU.
    simulador.avanzarTick();

    expect(simulador.consultar().reloj).toBe(3);
    expect(simulador.obtenerMetricas().utilizacionCPU)
      .toBeCloseTo((2 / 3) * 100);
    expect(simulador.consultarProceso("P1").estado).toBe("TERMINADO");
  });

  test("admite al proceso que esperaba en el tick siguiente a la liberación", () => {
    const simulador = new Simulador(200, 2);
    simulador.registrarProceso("P1", 200, 1);
    simulador.registrarProceso("P2", 100, 2);

    // P1 ocupa toda la RAM y termina durante este primer tick.
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1").estado).toBe("TERMINADO");
    expect(simulador.consultarProceso("P2")).toMatchObject({
      estado: "ESPERANDO_MEMORIA",
      cpuRestante: 2
    });
    expect(simulador.obtenerMetricas().memoriaLibre).toBe(200);

    // La nueva admisión ocurre al comenzar el segundo tick.
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P2")).toMatchObject({
      estado: "EJECUTANDO",
      cpuRestante: 1
    });
    expect(simulador.consultar().planificador.procesoEnCPU).toBe("P2");
    expect(simulador.obtenerMetricas().memoriaOcupada).toBe(100);
    expect(simulador.consultar().reloj).toBe(2);
  });
    test("bloquea por E/S, conserva memoria y permite ejecutar otro proceso", () => {
    const simulador = new Simulador(300, 1);

    simulador.registrarProceso("P1", 100, 3, {
      despuesDeCPU: 1,
      duracion: 2
    });
    simulador.registrarProceso("P2", 100, 1);

    // P1 se bloquea al consumir su primer tick.
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "BLOQUEADO",
      cpuRestante: 2,
      bloqueoRestante: 2
    });
    expect(simulador.obtenerMetricas().memoriaOcupada).toBe(200);
    expect(simulador.consultar().planificador.listos).toEqual(["P2"]);
    expect(simulador.obtenerMetricas().cambiosContexto).toBe(1);

    // P2 ejecuta mientras P1 espera y conserva su memoria.
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P2").estado).toBe("TERMINADO");
    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "BLOQUEADO",
      cpuRestante: 2,
      bloqueoRestante: 1
    });
    expect(simulador.obtenerMetricas().memoriaOcupada).toBe(100);

    // P1 completa la espera y puede ejecutar en este mismo tick.
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "EJECUTANDO",
      cpuRestante: 1,
      bloqueoRestante: 0
    });

    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1").estado).toBe("TERMINADO");
    expect(simulador.obtenerMetricas().memoriaLibre).toBe(300);
    expect(simulador.obtenerMetricas().cambiosContexto).toBe(1);
  });

  test("la finalización tiene prioridad sobre un evento de E/S coincidente", () => {
    const simulador = new Simulador(200, 2);

    simulador.registrarProceso("P1", 100, 2, {
      despuesDeCPU: 2,
      duracion: 3
    });

    simulador.avanzarTick();
    simulador.avanzarTick();

    expect(simulador.consultarProceso("P1")).toMatchObject({
      estado: "TERMINADO",
      cpuRestante: 0,
      bloqueoRestante: 0
    });
    expect(simulador.consultar().planificador.procesoEnCPU).toBeNull();
    expect(simulador.obtenerMetricas().memoriaLibre).toBe(200);
    expect(simulador.obtenerMetricas().cambiosContexto).toBe(0);
  });

  test("rechaza eventos inválidos sin registrar el proceso", () => {
    const simulador = new Simulador(300, 2);
    const antes = simulador.consultar();

    // El evento debe ubicarse dentro del tiempo de CPU del proceso.
    for (const despuesDeCPU of [0, -1, 1.5, 4]) {
      expect(() =>
        simulador.registrarProceso("P1", 100, 3, {
          despuesDeCPU,
          duracion: 2
        })
      ).toThrow(
        "El evento debe ocurrir entre el primer y el último tick de CPU"
      );
    }

    // La espera debe durar una cantidad entera y positiva de ticks.
    for (const duracion of [0, -1, 1.5]) {
      expect(() =>
        simulador.registrarProceso("P1", 100, 3, {
          despuesDeCPU: 1,
          duracion
        })
      ).toThrow("La duración de E/S debe ser un entero positivo");
    }

    expect(simulador.consultar()).toEqual(antes);
  });
});