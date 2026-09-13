# Planificador Semanal de Recursos

*[English version](README.md) · [Versione italiana](README-it.md) · [Deutsche Version](README-de.md)*

Herramienta de planificación en un solo archivo y sin conexión: abre `resource_planner.html` en cualquier navegador moderno (Edge, Chrome, Firefox). No requiere instalación ni conexión a internet.

## Qué hace
Crea un plan de turnos semanal de forma que la franja horaria de servicio esté siempre cubierta:
- desde **Hora de inicio del día** hay una persona presente (configurable como "personas requeridas antes del 2º inicio");
- desde **La 2ª persona empieza a las** (por defecto 10:00) hay dos personas presentes hasta la **Hora de fin del día**.

## Datos de entrada (panel izquierdo)
| Ajuste | Significado |
|---|---|
| Semana que comienza | Fecha opcional del lunes, usada en las cabeceras de columna y en los nombres de archivo |
| Hora de inicio / fin del día | Franja horaria diaria a cubrir (resolución de 1 hora) |
| La 2ª persona empieza a las | Hora a partir de la cual se aplica la mayor plantilla |
| Personas requeridas antes / después | Número de personas requeridas en las dos partes del día (por defecto 1 / 2) |
| Días laborables | Número de días por semana **y** qué días (marca/desmarca de lunes a domingo) |
| Parámetros de optimización adicionales | Reglas de personal adicionales para días/horas específicos (p. ej. "3 personas los sábados y domingos", "1 persona de 18:00 al cierre"); se combinan con los requisitos base anteriores tomando el valor más alto, y el optimizador las aplica como restricciones estrictas |
| Personas | Nombre, horas disponibles por semana, duración máxima/mínima de turno, día de descanso preferido |

El día de descanso es una preferencia: se respeta a menos que sea la única forma de cerrar un hueco de cobertura, en cuyo caso el plan se marca con una nota.

## Flujo de trabajo
1. Completa los ajustes y las personas (o haz clic en **Load sample**).
2. Haz clic en **⚡ Optimize**. La barra de estado muestra las horas requeridas frente a las disponibles, las horas sin cubrir / con exceso de personal y cualquier aviso — incluida cualquier regla personalizada que no se haya podido cumplir.
3. Revisa las vistas **Week** o **Day**; la tabla de planificación se muestra siempre debajo. Cada celda de la tabla es editable (inicio / fin / Off) y los cambios se reflejan de inmediato en el calendario. Al hacer clic en una barra de turno en el calendario se salta a su celda en la tabla.
4. **Save plan (.json)** guarda el plan completo (ajustes, personas, turnos); **Load plan** lo vuelve a importar más tarde.
5. **Export Excel (.csv)** genera un archivo que se abre directamente en Excel: la matriz del plan (persona × día, con totales de horas) seguida de la tabla de cobertura horaria.

El estado actual también se guarda en el almacenamiento local del navegador, de modo que cerrar la pestaña no hace perder el trabajo.

## Leyenda de colores
- verde – plantilla requerida cubierta · rojo – falta de personal · ámbar – exceso de personal
- celda azul – día de descanso preferido · borde rojo – el turno incumple la duración mínima/máxima de esa persona o la franja horaria del día

## Licencia
Este proyecto está licenciado bajo la Licencia MIT — consulta el archivo `LICENSE` para más detalles. Eres libre de usar, modificar y distribuir este código (incluso con fines comerciales), siempre que incluyas el aviso de copyright y el texto de la licencia en cualquier copia o parte sustancial de la obra.
