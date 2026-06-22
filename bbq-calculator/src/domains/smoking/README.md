# 🔥 Smoking Domain

**Responsabilidad:** Cálculos de cocción BBQ (3 fases) + UI del wizard + visualización de resultados

## Módulos

### Core
- **BBQEngine.js** (M1) — Motor de cálculos BBQ puro
  - Métodos: `calculate()`, `getMeatFormulas()`, `calculateStallTime()`, `getColorForTemp()`
  - Conversiones estáticas: `celsiusToFahrenheit()`, `kgToLbs()`
  - Modelo 3 fases: Ramp-up (25→62°C) → STALL (62-68°C) → Push (68→objetivo)
  - 8 tipos de carne con fórmulas y rangos de temperatura

- **RenderingLevelSelector.js** (M3) — Mapeo de nivel terneza → temperatura
  - Métodos: `selectLevel()`, `getTempsForMeat()`, `getLevelDescription()`
  - Niveles: Raro (15%) / Rosa (50%, default) / Gris (85%)

- **RecipeFactory.js** (NEW) — Factory helper para crear recetas
  - Convierte inputs a formato estándar

### Calculation
- **CookingCurveCalculator.js** (M5) — Generador de datos Chart.js
  - Métodos: `generateFromResult()`, `interpolateTemp()`, `calculateDeviationStats()`
  - Convierte fases → datasets coloreados

### UI
- **WizardController.js** (M10) — Navegación multi-step (4 pasos)
  - Métodos: `nextStep()`, `prevStep()`, `goToStep()`, `updateFormField()`
  - Validación por paso, gestión de estado del formulario

- **ResultsDisplay.js** (M11) — Visualización de resultados
  - Métodos: `display()`, `exportJSON()`, `exportHTML()`, `clearDisplay()`
  - Renderiza: tiempo total, fases, timeline de eventos, tips

- **CookingCurveChart.js** (M6) — Gráfica de curva de cocción
  - Métodos: `update()`, `setTheme()`, `highlightPhase()`, `downloadImage()`
  - Chart.js wrapper para 3 fases coloreadas

## Flujo de Datos

```
Usuario
  ↓
WizardController (4 pasos)
  ↓
BBQEngine.calculate(inputs) → CookingResult
  ↓
RenderingLevelSelector.selectLevel() → temperature
  ↓
ResultsDisplay.display(result)
CookingCurveCalculator → Chart.js data
CookingCurveChart.update()
  ↓
Resultado visible (cards + gráfica)
```

## Input

- Tipo de carne (8 opciones)
- Peso (kg o lbs)
- Temperatura ahumador (°C o °F)
- Nivel renderización (raro/rosa/gris)
- Envuelto (sí/no)
- Altitud (m)

## Output

- Tiempo total estimado (horas:minutos)
- Temperatura interna objetivo (°C)
- Desglose de fases (tiempo + rango de temp cada una)
- Timeline de eventos importantes
- Tips de éxito
- Gráfica de 3 fases con datos de interpolación

## Tests

- `BBQEngine.test.js` — 21 tests
- `RenderingLevelSelector.test.js` — 18 tests
- `CookingCurveCalculator.test.js` — 18 tests
- `CookingCurveChart.test.js` — 24 tests
- `WizardController.test.js` — 31 tests
- `ResultsDisplay.test.js` — 18 tests
- `smoking.test.js` — integración dominio

**Total: 130+ tests**

## Estados

- ✅ Core modules: Completo + testeado
- ✅ Visualization: Completo + testeado
- ✅ UI Controllers: Completo + testeado
- 🔄 Integration: Requiere orquestación con otros dominios
