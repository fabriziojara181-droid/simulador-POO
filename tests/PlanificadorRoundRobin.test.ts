import { describe, expect, test } from "vitest";
import { Proceso } from "../src/modelo/Proceso.js";
import { PlanificadorRoundRobin } from "../src/planificacion/PlanificadorRoundRobin.js";

// Prepara un proceso listo para que las pruebas se concentren en la CPU.
function crearProcesoListo(pid: string, cpuTotal: number): Proceso {
  const proceso = new Proceso(pid, 100, cpuTotal);
  proceso.esperarMemoria();
  proceso.admitir();
  return proceso;
}

describe("PlanificadorRoundRobin", () => {
  test("comienza sin procesos y mantiene la CPU libre", () => {
    const planificador = new PlanificadorRoundRobin(2);

    expect(planificador.ejecutarTick()).toBeNull();
    planificador.resolverTurno();

    expect(planificador.consultar()).toEqual({
      quantum: 2,
      quantumConsumido: 0,
      procesoEnCPU: null,
      listos: [],
      cambiosContexto: 0
    });
  });

  test("rechaza un quantum inválido", () => {
    for (const quantum of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => new PlanificadorRoundRobin(quantum))
        .toThrow("El quantum debe ser un entero positivo");
    }
  });

  test("reparte la CPU respetando el quantum y el orden de llegada", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const primero = crearProcesoListo("P1", 3);
    const segundo = crearProcesoListo("P2", 2);

    planificador.agregarListo(primero);
    planificador.agregarListo(segundo);

    const ejecuciones: (string | null)[] = [];

    // Cada vuelta representa un tick y la resolución de su turno.
    for (let tick = 0; tick < 5; tick++) {
      ejecuciones.push(planificador.ejecutarTick());
      planificador.resolverTurno();
    }

    expect(ejecuciones).toEqual(["P1", "P1", "P2", "P2", "P1"]);
    expect(primero.consultar().estado).toBe("TERMINADO");
    expect(segundo.consultar().estado).toBe("TERMINADO");

    // P1 rotó una vez. La finalización de P2 no cuenta como cambio.
    expect(planificador.consultar().cambiosContexto).toBe(1);
    expect(planificador.consultar().procesoEnCPU).toBeNull();
    expect(planificador.consultar().listos).toEqual([]);
  });

  test("renueva el quantum sin cambio de contexto cuando está solo", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const proceso = crearProcesoListo("P1", 3);
    planificador.agregarListo(proceso);

    planificador.ejecutarTick();
    planificador.resolverTurno();
    planificador.ejecutarTick();
    planificador.resolverTurno();

    expect(planificador.consultar()).toEqual({
      quantum: 2,
      quantumConsumido: 0,
      procesoEnCPU: "P1",
      listos: [],
      cambiosContexto: 0
    });
    expect(proceso.consultar().cpuRestante).toBe(1);
    expect(proceso.consultar().estado).toBe("EJECUTANDO");
  });

  test("el bloqueo tiene prioridad sobre la rotación por quantum", () => {
    const planificador = new PlanificadorRoundRobin(1);
    const primero = crearProcesoListo("P1", 3);
    const segundo = crearProcesoListo("P2", 2);

    planificador.agregarListo(primero);
    planificador.agregarListo(segundo);
    planificador.ejecutarTick();

    // Simulamos una E/S justo cuando se cumple el quantum.
    planificador.bloquearActual(2);
    planificador.resolverTurno();

    expect(primero.consultar().estado).toBe("BLOQUEADO");
    expect(primero.consultar().cpuRestante).toBe(2);
    expect(planificador.consultar().procesoEnCPU).toBeNull();
    expect(planificador.consultar().listos).toEqual(["P2"]);
    expect(planificador.consultar().cambiosContexto).toBe(1);

    // Cuando termina la espera, vuelve al final de la cola.
    primero.avanzarBloqueo();
    primero.avanzarBloqueo();
    planificador.agregarListo(primero);

    expect(planificador.consultar().listos).toEqual(["P2", "P1"]);
    expect(planificador.ejecutarTick()).toBe("P2");
  });

  test("rechaza procesos que no están listos y PIDs duplicados", () => {
    const planificador = new PlanificadorRoundRobin(2);
    const nuevo = new Proceso("P0", 100, 3);

    expect(() => planificador.agregarListo(nuevo))
      .toThrow("Solo se pueden encolar procesos listos");

    planificador.agregarListo(crearProcesoListo("P1", 3));

    expect(() => planificador.agregarListo(crearProcesoListo("P1", 3)))
      .toThrow("El proceso ya está en el planificador");

    planificador.ejecutarTick();

    // También impide repetir el PID que actualmente ocupa la CPU.
    expect(() => planificador.agregarListo(crearProcesoListo("P1", 3)))
      .toThrow("El proceso ya está en el planificador");
  });

  test("rechaza bloqueos inválidos sin retirar al proceso de la CPU", () => {
    const planificador = new PlanificadorRoundRobin(2);

    expect(() => planificador.bloquearActual(2))
      .toThrow("No hay un proceso ejecutando para bloquear");

    const proceso = crearProcesoListo("P1", 3);
    planificador.agregarListo(proceso);
    planificador.ejecutarTick();
    const antes = planificador.consultar();

    expect(() => planificador.bloquearActual(0))
      .toThrow("La duración del bloqueo debe ser un entero positivo");

    expect(planificador.consultar()).toEqual(antes);
    expect(proceso.consultar().estado).toBe("EJECUTANDO");
  });

  test("protege la consulta y conserva las consultas anteriores", () => {
    const planificador = new PlanificadorRoundRobin(2);
    planificador.agregarListo(crearProcesoListo("P1", 3));
    const vista = planificador.consultar();

    expect(Reflect.set(vista.listos, "0", "OTRO")).toBe(false);
    expect(Reflect.set(vista, "quantum", 99)).toBe(false);

    planificador.ejecutarTick();

    // La consulta anterior sigue mostrando el momento en que fue tomada.
    expect(vista.listos).toEqual(["P1"]);
    expect(vista.procesoEnCPU).toBeNull();
    expect(planificador.consultar().listos).toEqual([]);
    expect(planificador.consultar().procesoEnCPU).toBe("P1");
  });
});