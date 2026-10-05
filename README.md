# Simulador de procesos y memoria

Trabajo de Paradigmas y Lenguajes de Programación II y Sistemas Operativos.

Biblioteca desarrollada en TypeScript para simular procesos, planificación
de CPU y administración de memoria contigua. La ejecución avanza mediante
ticks: cada llamada representa una unidad de tiempo, sin esperas reales.

## Requisitos

- Node.js 24.
- npm.
- Git para clonar el repositorio.

## Instalación

Clonar el repositorio y entrar en su carpeta:

    git clone https://github.com/fabriziojara181-droid/simulador-POO.git
    cd simulador-POO

Instalar las dependencias registradas en package-lock.json:

    npm ci

## Verificación

Revisar los tipos de TypeScript:

    npm run typecheck

Ejecutar las pruebas:

    npm test

Ejecutar las pruebas y generar el reporte de cobertura:

    npm run coverage

El reporte HTML queda en coverage/index.html.
La configuración exige al menos un 91% de cobertura global de líneas.

GitHub Actions ejecuta la revisión de tipos y las pruebas con cobertura
cuando se suben cambios al repositorio.

## Funcionalidades

- Registro de procesos con PID único, memoria requerida y tiempo de CPU.
- Estados: nuevo, esperando memoria, listo, ejecutando, bloqueado y terminado.
- Asignación contigua mediante Primer Ajuste o Mejor Ajuste.
- División de bloques y unión de bloques libres adyacentes al liberar memoria.
- Planificación Round Robin con quantum configurable.
- Un evento opcional de entrada/salida por proceso.
- Consultas protegidas del estado del sistema y de los procesos.
- Métricas de memoria, utilización de CPU y cambios de contexto.

La configuración predeterminada utiliza 1024 unidades de memoria,
quantum de 2 ticks y Primer Ajuste.

## Orden de un tick

1. Intentar admitir procesos en orden de registro.
2. Actualizar la espera de los procesos bloqueados.
3. Ejecutar como máximo una unidad de CPU.
4. Resolver finalización, entrada/salida y vencimiento del quantum.
5. Avanzar el reloj.

Un proceso que no encuentra memoria no impide admitir a otro que sí cabe.
La memoria liberada durante un tick puede asignarse en la admisión del siguiente.

## Entrada/salida

Al registrar un proceso se puede indicar un evento con:

- despuesDeCPU: cantidad de ticks de CPU consumidos para activar el evento.
- duracion: cantidad de ticks de espera.

Ambos valores deben ser enteros positivos. El evento no puede ubicarse
después del tiempo total de CPU del proceso.

Si coincide con su finalización, el proceso termina sin bloquearse.
Durante el bloqueo conserva su memoria y no consume CPU.
Cada evento ocurre una sola vez.

## Métricas

- Ocupación de memoria: porcentaje de la memoria total que está asignada.
- Utilización de CPU: porcentaje de ticks transcurridos con CPU ocupada.
- Memoria libre: suma de los tamaños de los bloques libres.
- Mayor bloque libre: tamaño del mayor hueco contiguo disponible.
- Fragmentación externa: 100 × (1 − mayor bloque libre / memoria libre).
  Si no hay memoria libre, se informa 0%.
- Cambios de contexto: se cuentan por bloqueo de E/S o por vencimiento
  del quantum cuando hay otros procesos listos. No se cuentan por
  despacho inicial, finalización o renovación del quantum sin otros listos.

## Organización

- src/modelo: procesos y bloques de memoria.
- src/memoria: administración, políticas y contratos de memoria.
- src/planificacion: Round Robin y su contrato.
- src/simulacion: coordinación del sistema y eventos de entrada/salida.
- tests: pruebas unitarias y de integración.
- .github/workflows: comprobaciones automáticas de GitHub.

## Diseño

Las interfaces SeleccionarBloque, PlanificarCPU y GestionarMemoria
definen contratos utilizados por los componentes.

PrimerAjuste y MejorAjuste implementan el mismo contrato. El administrador
puede utilizar cualquiera de las dos políticas sin cambiar su algoritmo
de asignación y liberación.

Se utiliza composición para conectar las partes del simulador.
Las consultas públicas devuelven copias protegidas para evitar modificar
el estado interno desde afuera.

## Uso

El proyecto es una biblioteca: no incluye menú de consola ni programa principal.
Las pruebas muestran cómo crear un simulador, registrar procesos,
avanzar ticks y consultar los resultados.
