import { Proceso } from "../modelo/Proceso.js";
import { AdministradorMemoria } from "../memoria/AdministradorMemoria.js";
import { PrimerAjuste } from "../memoria/PrimerAjuste.js";
import type { SeleccionarBloque } from "../memoria/SeleccionarBloque.js";
import { PlanificadorRoundRobin } from "../planificacion/PlanificadorRoundRobin.js";
import type { PlanificarCPU } from "../planificacion/PlanificarCPU.js";
import type { GestionarMemoria } from "../memoria/GestionarMemoria.js";
// Indica cuando el proceso pide una E/S y cuanto tiempo debe esperar.
export type EventoES = Readonly<{
  despuesDeCPU: number;
  duracion: number;
}>;

export class Simulador {
  private readonly memoria: GestionarMemoria;
  private readonly planificador: PlanificarCPU;
  private readonly procesos: Map<string, Proceso> = new Map();
  // Guarda el evento de entrada/salida pendiente de cada proceso.
  private readonly eventosES: Map<string, EventoES> = new Map();

  private reloj: number = 0;
  private ticksCPUOcupada: number = 0;

  constructor(
    memoriaTotal: number = 1024,
    quantum: number = 2,
    politica: SeleccionarBloque = new PrimerAjuste()
  ) {
    // Cada componente valida su configuración al construirse.
    this.memoria = new AdministradorMemoria(memoriaTotal, politica);
    this.planificador = new PlanificadorRoundRobin(quantum);
  }

  registrarProceso(
  pid: string,
  memoriaRequerida: number,
  cpuTotal: number,
  eventoES?: EventoES
): void {
  if (this.procesos.has(pid)) {
    throw new Error("Ya existe un proceso con ese PID");
  }

  if (memoriaRequerida > this.memoria.consultar().tamanoTotal) {
    throw new Error("El proceso solicita más memoria que la disponible en total");
  }

  const proceso = new Proceso(pid, memoriaRequerida, cpuTotal);

  // Validamos el evento antes de registrar el proceso.
  if (eventoES !== undefined) {
    if (
      !Number.isInteger(eventoES.despuesDeCPU) ||
      eventoES.despuesDeCPU <= 0 ||
      eventoES.despuesDeCPU > cpuTotal
    ) {
      throw new Error(
        "El evento debe ocurrir entre el primer y el último tick de CPU"
      );
    }

    if (!Number.isInteger(eventoES.duracion) || eventoES.duracion <= 0) {
      throw new Error("La duración de E/S debe ser un entero positivo");
    }

    // La copia evita que alguien modifique el evento desde afuera.
    this.eventosES.set(pid, Object.freeze({
      despuesDeCPU: eventoES.despuesDeCPU,
      duracion: eventoES.duracion
    }));
  }

  this.procesos.set(pid, proceso);
}

   avanzarTick(): void {
    // Primero intentamos admitir procesos, respetando su orden de registro.
    this.admitirProcesos();

    // Descontamos la espera de los procesos que ya estaban bloqueados.
    this.avanzarBloqueados();

    // Como máximo un proceso consume una unidad de CPU por tick.
    const pidEjecutado = this.planificador.ejecutarTick();

    if (pidEjecutado !== null) {
      this.ticksCPUOcupada++;
      const datos = this.consultarProceso(pidEjecutado);

      // La finalización tiene prioridad sobre la entrada/salida.
      if (datos.estado === "TERMINADO") {
        // La memoria se libera en el mismo tick de la finalización.
        this.memoria.liberar(pidEjecutado);
        this.eventosES.delete(pidEjecutado);
      } else {
        this.aplicarEventoES(pidEjecutado);
      }
    }

    // Después de resolver la E/S, comprobamos el vencimiento del quantum.
    this.planificador.resolverTurno();
    this.reloj++;
  }

  private avanzarBloqueados(): void {
    for (const proceso of this.procesos.values()) {
      if (proceso.consultar().estado === "BLOQUEADO") {
        proceso.avanzarBloqueo();

        // Al completar la espera vuelve al final de la cola de listos.
        if (proceso.consultar().estado === "LISTO") {
          this.planificador.agregarListo(proceso);
        }
      }
    }
  }

  private aplicarEventoES(pid: string): void {
    const evento = this.eventosES.get(pid);

    // Los procesos sin un evento pendiente continúan normalmente.
    if (evento === undefined) {
      return;
    }

    const datos = this.consultarProceso(pid);
    const cpuConsumida = datos.cpuTotal - datos.cpuRestante;

    if (cpuConsumida === evento.despuesDeCPU) {
      // Deja libre la CPU, pero conserva su memoria asignada.
      this.planificador.bloquearActual(evento.duracion);

      // Quitamos el evento para que ocurra una sola vez.
      this.eventosES.delete(pid);
    }
  }

  private admitirProcesos(): void {
    // Map conserva el orden en que registramos los procesos.
    for (const proceso of this.procesos.values()) {
      if (proceso.consultar().estado === "NUEVO") {
        proceso.esperarMemoria();
      }

      if (proceso.consultar().estado === "ESPERANDO_MEMORIA") {
        const datos = proceso.consultar();
        const pudoAsignar = this.memoria.asignar(
          datos.pid,
          datos.memoriaRequerida
        );

        if (pudoAsignar) {
          proceso.admitir();
          this.planificador.agregarListo(proceso);
        }

        // Si no entra, seguimos intentando con los demás procesos.
      }
    }
  }

    consultarProceso(pid: string) {
    const proceso = this.procesos.get(pid);

    if (proceso === undefined) {
      throw new Error("No existe un proceso con ese PID");
    }

    const vistaCPU = this.planificador.consultar();
    let quantumConsumido = 0;

    // Solo el proceso que ocupa la CPU tiene un turno en curso.
    if (vistaCPU.procesoEnCPU === pid) {
      quantumConsumido = vistaCPU.quantumConsumido;
    }

    // Sumamos el quantum a la copia protegida de los datos.
    return Object.freeze({
      ...proceso.consultar(),
      quantumConsumido
    });
  }

  obtenerMetricas() {
    let utilizacionCPU = 0;

    // Antes del primer tick no hay tiempo transcurrido para calcular el uso.
    if (this.reloj > 0) {
      utilizacionCPU = (this.ticksCPUOcupada / this.reloj) * 100;
    }

    return Object.freeze({
      ...this.memoria.obtenerMetricas(),
      utilizacionCPU,
      cambiosContexto: this.planificador.consultar().cambiosContexto
    });
  }

  consultar() {
    // Exponemos consultas protegidas, sin entregar los procesos internos.
    return Object.freeze({
      reloj: this.reloj,
      planificador: this.planificador.consultar(),
      memoria: this.memoria.consultar(),
      procesos: Object.freeze(
        [...this.procesos.keys()].map((pid) => this.consultarProceso(pid))
      )
    });
  }
}