# 🔧 Gadgets Domain

**Responsabilidad:** Herramientas rápidas y utilitarias (convertidores, rub calculator, detector de altitud)

## Módulos (TO BE CREATED)

### Calculators
- **RubCalculator.js** (NEW) — Calculador de cantidades de rub
  - Métodos: `calculate(weightKg, meatType)` → {salt, pepper, garlic, sugar, ...}
  - Ratios estándar por tipo de carne
  - Entrada: peso carne
  - Salida: cantidades en gramos

### Converters
- **TempConverter.js** (NEW) — Conversor de temperatura
  - Métodos: `celsiusToFahrenheit()`, `fahrenheitToCelsius()`, `formatTemp()`
  - Input: valor en una unidad
  - Output: valor en otra unidad + ambas mostradas

- **WeightConverter.js** (NEW) — Conversor de peso
  - Métodos: `kgToLbs()`, `lbsToKg()`, `formatWeight()`
  - Input: valor en una unidad
  - Output: valor en otra unidad + ambas mostradas

### Location
- **AltitudeDetector.js** (NEW) — Detector automático de altitud
  - Métodos: `async detect()`, `estimateFromCoordinates(lat, lon)`, `getAdjustmentFactor(altitudeM)`
  - Usa Geolocation API + OpenElevation API
  - Fallback manual para testing
  - Fórmula: +8% de tiempo per cada 1000m
  - Emite eventos: `altitude-detected`, `altitude-error`

### Integration
- **quickCureCalc()** — Atajo rápido que integra con Curing domain
  - Acceso directo a CureCalculator sin navegar a "Curados"

## Flujo de Datos

```
Usuario abre Tab "Gadgets"
  ↓
Disponibles:
  1. Temp Converter (C ↔ F)
  2. Weight Converter (kg ↔ lbs)
  3. Rub Calculator (peso → cantidades)
  4. Quick Cure Calc (atajo a Curing)
  5. Altitude Detector (auto / manual)
  ↓
Usuario selecciona herramienta
  ↓
Calcula / convierte
  ↓
Muestra resultado
```

## Input

### TempConverter
- Valor numérico
- Unidad origen (°C o °F)

### WeightConverter
- Valor numérico
- Unidad origen (kg o lbs)

### RubCalculator
- Peso de carne (kg o lbs)
- Tipo de carne (opcional)

### AltitudeDetector
- Auto: Permite geolocalización
- Manual: Ingresa valor en metros

### QuickCureCalc
- Redirige a tab "Curados" o abre modal

## Output

### TempConverter
- Valor convertido
- Ambas unidades visibles

### WeightConverter
- Valor convertido
- Ambas unidades visibles

### RubCalculator
- Tabla con cantidades (salt, pepper, garlic, sugar, etc.)
- Unidades en gramos

### AltitudeDetector
- Altitud detectada (m)
- Factor de ajuste (multiplicador para tiempo)
- Status: detected / error / manual

## Tests

- `RubCalculator.test.js` — 15 tests
- `TempConverter.test.js` — 12 tests
- `WeightConverter.test.js` — 12 tests
- `AltitudeDetector.test.js` — 20 tests
- `gadgets.test.js` — integración dominio

**Total: 59+ tests (nuevos)**

## Estados

- 🆕 RubCalculator: Requiere implementación
- 🆕 Converters: Requiere implementación
- 🆕 AltitudeDetector: Requiere refactor de AltitudeSystem (M2)
- 🔄 Integration: Requiere orquestación

## Notas

- Todas las herramientas son independientes (standalone)
- Los convertidores pueden usarse en cualquier otro lugar de la app
- RubCalculator puede ser reutilizado en recetas guardadas
- AltitudeDetector será usado por Smoking domain para auto-detectar altitud
