import { Proceso } from "../modelo/Proceso.js";
import type {
  PlanificarCPU,
  VistaPlanificador
} from "./PlanificarCPU.js";

export class PlanificadorRoundRobin implements PlanificarCPU {
  private readonly quantum: number;
  private listos: Proceso[] = [];
  private procesoEnCPU: Proceso | null = null;
  private quantumConsumido: number = 0;
  private cambiosContexto: number = 0;

  constructor(quantum: number) {
    if (!Number.isInteger(quantum) || quantum <= 0) {
      throw new Error("El quantum debe ser un entero positivo");
    }

    this.quantum = quantum;
  }

  agregarListo(proceso: Proceso): void {
    const datos = proceso.consultar();

    // El proceso debe tener memoria y estar preparado para ejecutar.
    if (datos.estado !== "LISTO") {
      throw new Error("Solo se pueden encolar procesos listos");
    }

    const estaEnCola = this.listos.some(
      (actual) => actual.consultar().pid === datos.pid
    );

    const estaEnCPU =
      this.procesoEnCPU?.consultar().pid === datos.pid;

    if (estaEnCola || estaEnCPU) {
      throw new Error("El proceso ya está en el planificador");
    }

    this.listos.push(proceso);
  }

  ejecutarTick(): string | null {
    // Si la CPU está libre, toma el primero de la cola.
    if (this.procesoEnCPU === null) {
      const siguiente = this.listos.shift();

      if (siguiente === undefined) {
        return null;
      }

      siguiente.despachar();
      this.procesoEnCPU = siguiente;
      this.quantumConsumido = 0;
    }

    const proceso = this.procesoEnCPU;
    proceso.ejecutarTick();
    this.quantumConsumido++;

    const datos = proceso.consultar();

    // Terminar tiene prioridad sobre el vencimiento del quantum.
    if (datos.estado === "TERMINADO") {
      this.procesoEnCPU = null;
      this.quantumConsumido = 0;
    }

    // Permite al simulador saber quién trabajó, aunque haya terminado.
    return datos.pid;
  }

  resolverTurno(): void {
    // Se llama después de comprobar finalización y eventos de E/S.
    if (this.procesoEnCPU === null) {
      return;
    }

    if (this.quantumConsumido < this.quantum) {
      return;
    }

    if (this.listos.length > 0) {
      this.procesoEnCPU.devolverAListos();
      this.listos.push(this.procesoEnCPU);
      this.procesoEnCPU = null;
      this.cambiosContexto++;
    }

    // Sin otros listos, renueva el quantum sin abandonar la CPU.
    this.quantumConsumido = 0;
  }

  bloquearActual(duracion: number): void {
    if (this.procesoEnCPU === null) {
      throw new Error("No hay un proceso ejecutando para bloquear");
    }

    // Proceso valida la duración antes de modificar su estado.
    this.procesoEnCPU.bloquear(duracion);
    this.procesoEnCPU = null;
    this.quantumConsumido = 0;
    this.cambiosContexto++;
  }

  consultar(): VistaPlanificador {
    let pidEnCPU: string | null = null;

    if (this.procesoEnCPU !== null) {
      pidEnCPU = this.procesoEnCPU.consultar().pid;
    }

    return Object.freeze({
      quantum: this.quantum,
      quantumConsumido: this.quantumConsumido,
      procesoEnCPU: pidEnCPU,
      listos: Object.freeze(
        this.listos.map((proceso) => proceso.consultar().pid)
      ),
      cambiosContexto: this.cambiosContexto
    });
  }
}