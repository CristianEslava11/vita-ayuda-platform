# Demostración del avance

1. Ejecuta npm run dev y abre http://localhost:3000/login.
2. Inicia sesión con paciente@vitaayuda.local y Paciente2026!.
3. Muestra el dashboard: resumen, indicador vital, gráfica y perfil vinculado.
4. Abre Mi Perfil para mostrar el vínculo entre la cuenta y el paciente.
5. Abre Monitoreo Diario y registra:
   - Glucosa: 120 mg/dL.
   - Presión sistólica: 125 mmHg.
   - Presión diastólica: 82 mmHg.
   - Frecuencia cardiaca: 76 bpm.
   - Peso: 72.5 kg.
   - Saturación: 96 %.
6. En modo demostración, pulsa Guardar nuevo registro. En modo diario, pulsa Guardar monitoreo o Actualizar monitoreo de hoy.
7. Recarga la página y comprueba que los datos persisten.
8. En modo diario, corrige una medición de hoy y verifica que no se duplica el registro. En modo demostración, guarda otro envío y verifica que aparece separado en el historial.
9. Abre Mis Signos Vitales: resumen, evolución e historial.
10. Cierra sesión y verifica que el dashboard redirige a Iniciar Sesion.

Todos los datos de este guion son ficticios y se utilizan para demostrar el sistema.

## Demostrar varios registros

Con MONITORING_DEMO_MODE=true en apps/backend/.env y el backend reiniciado, Monitoreo Diario muestra **Guardar nuevo registro**. Cada envío conserva las mediciones anteriores.

1. Guarda un primer registro con los valores del paso 5.
2. Cambia los valores y guarda un segundo registro.
3. Guarda un tercero y pulsa **Ver evolución e historial**.
4. En Evolución, selecciona Glucosa u otro signo y compara mínimo, promedio, máximo y los puntos de la gráfica.
5. En Historial, muestra los tres registros separados con su hora. Recarga para comprobar la persistencia.
6. Vuelve al dashboard para mostrar la última medición y la gráfica actualizada.

| Medición | Primero | Segundo | Tercero |
| --- | --- | --- | --- |
| Glucosa (mg/dL) | 120 | 145 | 110 |
| Presión sistólica (mmHg) | 125 | 132 | 122 |
| Presión diastólica (mmHg) | 82 | 85 | 79 |
| Frecuencia cardiaca (bpm) | 76 | 78 | 74 |
| Peso (kg) | 72.5 | 73.1 | 72.9 |
| Saturación (%) | 96 | 95 | 97 |

Estos valores son ficticios. No necesitas esperar al día siguiente: los puntos de evolución se distinguen por la fecha y la hora de cada envío. Si ya existen otros registros, el historial también los muestra.

Después de la demostración, cambia MONITORING_DEMO_MODE=false, reinicia npm run dev y recarga. El formulario vuelve a guardar o corregir el monitoreo del día; los registros anteriores permanecen disponibles.
