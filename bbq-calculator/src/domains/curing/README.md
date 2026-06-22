# 🍖 Curing Domain

**Responsabilidad:** Cálculo de curaciones (bacon, pastrami, corned beef, jerky) + tracking de curados activos

## Módulos (TO BE CREATED)

### Core
- **CureCalculator.js** (NEW) — Motor de cálculo de curaciones
  - Métodos: `getCureProfiles()`, `calculate()`, `renderRecipe()`
  - Soporta: Bacon, Pastrami, Corned Beef, Beef Jerky
  - Estándares: USDA Cure #1 (156 ppm nitrite at 0.25%)
  - Entrada: tipo cura, peso carne, espesor
  - Salida: sal/azúcar/tiempo + instrucciones post-cura

- **curings-data.js** — Constantes CureProfiles
  - Definición de cada tipo de cura (método, porcentajes, días mín, wood suggestions)

### State
- **CureStore.js** (NEW) — Persistencia de curados activos
  - Métodos: `addActiveCure()`, `getActiveCures()`, `markComplete()`, `deleteActiveCure()`
  - Persistencia en localStorage (estadoManager.state.activeCures)
  - Cálculo automático de progreso (% tiempo restante)

### UI
- **CureCalculatorUI.js** (NEW) — Formulario de cálculo
  - Métodos: `selectCureType()`, `updateWeightInput()`, `updateThicknessInput()`, `calculate()`
  - Actualización en vivo de sal/azúcar/tiempo
  - Botón "Iniciar seguimiento" → agregar a Mis Curados

- **ActiveCuresTracker.js** (NEW) — Lista de curados activos
  - Métodos: `renderCuresList()`, `updateProgressBars()`, `renderNoActiveCures()`
  - Muestra: tipo, peso, progreso (%), botones completar/eliminar

- **CureCard.js** (NEW) — Tarjeta individual de cura activa
  - Métodos: `render()`, `updateProgress()`, `markComplete()`, `delete()`
  - Muestra: tipo, peso, tiempo restante, fecha inicio, progreso visual

## Flujo de Datos

```
Tab "Curados"
  ↓
CureCalculatorUI (selector tipo, peso, espesor)
  ↓
CureCalculator.calculate() → sal/azúcar/tiempo
  ↓
Mostrar receta post-cura
  ↓
Usuario clica "Iniciar seguimiento"
  ↓
CureStore.addActiveCure() → localStorage
  ↓
Tab "Mis Curados"
  ↓
ActiveCuresTracker.renderCuresList()
  ↓
Para cada cura: CureCard (progreso, botones)
  ↓
Usuario marca completada / elimina
  ↓
CureStore.markComplete() / delete()
  ↓
Historial guardado
```

## Input (Tab "Curados")

- Tipo de cura (Bacon, Pastrami, Corned Beef, Jerky)
- Peso de la carne (kg o lbs)
- Espesor (para cálculo de penetración)

## Output

- Cantidad de sal (gramos)
- Cantidad de azúcar (gramos, si aplica)
- Tiempo de curación (días)
- Instrucciones post-cura (temperatura, tiempo de reposo, wood suggestions)

## Input (Tab "Mis Curados")

- Curados activos cargados del localStorage

## Output (Tab "Mis Curados")

- Lista de curados activos
- Progreso (% tiempo restante)
- Fecha de inicio / fecha estimada finalización
- Botones: Marcar completada, Eliminar

## Tests

- `CureCalculator.test.js` — 25 tests
- `CureStore.test.js` — 20 tests
- `CureCalculatorUI.test.js` — 20 tests
- `ActiveCuresTracker.test.js` — 15 tests
- `CureCard.test.js` — 10 tests
- `curing.test.js` — integración dominio

**Total: 90+ tests (nuevos)**

## Estados

- 🆕 Core: Requiere implementación
- 🆕 State: Requiere implementación
- 🆕 UI: Requiere implementación
- 🔄 Integration: Requiere orquestación

## Notas

- Este dominio es completamente nuevo (faltaba en el refactor anterior)
- Requiere extracción cuidadosa del CureCalculator del monolito (líneas ~337+)
- La persistencia usa StateManager del dominio Shared
- Las instrucciones post-cura pueden ser HTML-rendered
