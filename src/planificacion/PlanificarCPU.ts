import type { Proceso } from "../modelo/Proceso.js";

// La consulta devuelve identificadores, no procesos modificables.
export type VistaPlanificador = Readonly<{
  quantum: number;
  quantumConsumido: number;
  procesoEnCPU: string | null;
  listos: readonly string[];
  cambiosContexto: number;
}>;

export interface PlanificarCPU {
  agregarListo(proceso: Proceso): void;
  ejecutarTick(): string | null;
  resolverTurno(): void;
  bloquearActual(duracion: number): void;
  consultar(): VistaPlanificador;
}