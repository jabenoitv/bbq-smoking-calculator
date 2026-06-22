# ⏱️ Timer Domain

**Responsabilidad:** Sesión de cocción en vivo, cronómetro, mediciones de temperatura, gráfica real vs esperada

## Módulos

### Core
- **CookingSession.js** (M9) — Gestor de estado de sesión
  - Métodos: `start()`, `pause()`, `stop()`, `addMeasurement()`, `getExpectedTempAtTime()`
  - Máquina de estados: initialized → running → paused → stopped
  - Cálculo automático de temperatura esperada (interpolación lineal)
  - Manejo correcto de pausa/reanudación

### UI
- **TimerTabController.js** (M12) — Orquestador del tab cronómetro
  - Métodos: `start()`, `pause()`, `resume()`, `stop()`, `addMeasurement()`
  - Coordina: CookingSession + TimerDisplay + TimerChart
  - Actualización en tiempo real con feedback de color

- **TimerDisplay.js** (M7) — Cronómetro en vivo + tabla de mediciones
  - Métodos: `setTime()`, `addMeasurement()`, `getStats()`, `exportCSV()`
  - Formato HH:MM:SS
  - Tabla con timestamp, temperatura, desviación, nota
  - Codificación de color: verde (±1°C) / naranja (±3°C) / rojo (>3°C)

- **TimerChart.js** (M8) — Gráfica de comparación esperada vs real
  - Métodos: `setExpectedCurve()`, `addMeasurement()`, `getDeviationStats()`
  - Superposición: línea esperada + puntos scatter reales
  - Puntos coloreados por desviación

## Flujo de Datos

```
Usuario carga receta (resultado smoking)
  ↓
TimerTabController.start()
  ↓
CookingSession.start() → setInterval(1s)
  ↓
(cada segundo)
TimerDisplay.setTime(elapsed)
  ↓
(Usuario mide temperatura)
TimerTabController.addMeasurement(temp)
  ↓
CookingSession.addMeasurement() → calcula desviación
  ↓
TimerDisplay.addMeasurement() (fila con color)
TimerChart.addMeasurement() (punto scatter)
  ↓
Session guardada a localStorage
```

## Input

- Receta (CookingResult del dominio Smoking)
- Temperatura medida (°C o °F)
- Nota opcional

## Output

- Cronómetro en vivo (HH:MM:SS)
- Tabla de mediciones (timestamp, temp, desviación, nota)
- Gráfica real vs esperada
- Estado de sesión (guardado en localStorage)
- Exportación CSV/JSON

## Tests

- `CookingSession.test.js` — 27 tests
- `TimerDisplay.test.js` — 17 tests
- `TimerChart.test.js` — 20 tests
- `TimerTabController.test.js` — 30 tests
- `timer.test.js` — integración dominio

**Total: 94+ tests**

## Estados

- ✅ Core: Completo + testeado
- ✅ UI: Completo + testeado
- 🔄 Integration: Requiere conexión con Smoking domain
