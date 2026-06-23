# Gadgets Domain — Quick Tools for BBQ Calculations

Herramientas rápidas y convertidores para cálculos BBQ: calculadora de rub, convertidores de temperatura/peso, detector de altitud.

## Módulos

### 1. **RubCalculator.js** (12+ tests)

Calcula la cantidad de especias (rub) necesarias para una carne en base a su tipo y peso.

**Responsabilidad:** 
- Cálculo de cantidades de rub (~10-15% del peso de la carne)
- Desglose de ingredientes (sal, azúcar, paprika, etc.)
- Generación de instrucciones de aplicación

**Métodos públicos:**
- `calculate(meatType, weightKg)` → { rubGrams, ingredients, instructions }
- `getAvailableMeatTypes()` → string[]
- `isValidMeatType(meatType)` → boolean

**Tipos de carne soportados:**
- brisket (12% rub)
- pork_butt (14% rub)
- ribs (15% rub)
- chicken (10% rub)
- turkey (11% rub)

**Ejemplo:**
```javascript
const result = RubCalculator.calculate('brisket', 5.0);
// { rubGrams: 600, ingredients: {...}, instructions: [...] }
```

---

### 2. **TempConverter.js** (14+ tests)

Convierte temperaturas entre Celsius y Fahrenheit con precisión a 0.1°.

**Responsabilidad:**
- Conversión C ↔ F
- Conversión por lotes (arrays)
- Generación de rangos de temperatura

**Métodos públicos:**
- `celsiusToFahrenheit(celsius)` → { value, unit, formatted }
- `fahrenheitToCelsius(fahrenheit)` → { value, unit, formatted }
- `celsiusToFahrenheitArray(array)` → Object[]
- `fahrenheitToCelsiusArray(array)` → Object[]
- `convertAndCompare(value, unit)` → { celsius, fahrenheit }
- `getTemperatureRange(start, end, unit, step)` → { celsius[], fahrenheit[] }

**Puntos de referencia clave:**
- 0°C = 32°F (congelación)
- 100°C = 212°F (ebullición)
- 37°C = 98.6°F (temperatura corporal)

**Ejemplo:**
```javascript
const f = TempConverter.celsiusToFahrenheit(25);
// { value: 77, unit: '°F', formatted: '77°F' }
```

---

### 3. **WeightConverter.js** (14+ tests)

Convierte pesos entre kilogramos, libras y gramos con precisión a 0.01 unidades.

**Responsabilidad:**
- Conversión kg ↔ lbs
- Conversión kg ↔ g y g ↔ lbs
- Conversión por lotes
- Comparación multi-unidad

**Métodos públicos:**
- `kgToLbs(kg)` → { value, unit, formatted }
- `lbsToKg(lbs)` → { value, unit, formatted }
- `kgToGrams(kg)` → { value, unit, formatted }
- `gramsToKg(grams)` → { value, unit, formatted }
- `lbsToGrams(lbs)` → { value, unit, formatted }
- `gramsToLbs(grams)` → { value, unit, formatted }
- `convertAndCompare(value, unit)` → { kg, lbs, grams }
- `batchConvert(values, fromUnit, toUnit)` → Object[]

**Unidades soportadas:** kg, lbs, g

**Ejemplo:**
```javascript
const lbs = WeightConverter.kgToLbs(2);
// { value: 4.41, unit: 'lbs', formatted: '4.41 lbs' }
```

---

### 4. **AltitudeDetector.js** (14+ tests)

Detecta la altitud del usuario y calcula el ajuste de tiempo de cocción.

**Responsabilidad:**
- Detección de altitud vía Geolocation API
- Fallback a OpenElevation API + caché en localStorage
- Cálculo de ajuste de tiempo de cocción (+8% por 1000m)

**Métodos públicos:**
- `async detect()` → { altitude, estimatedAltitudeAdjustmentPercent, isCached }
- `estimateAltitudeFromCoordinates(lat, lon)` → number (metros)
- `calculateCookingTimeAdjustment(altitudeMeters)` → number (%)
- `getAdjustedCookingTime(totalSeconds, altitudeMeters)` → number
- `getAdjustmentWarningLevel(altitudeMeters)` → 'low' | 'medium' | 'high'
- `cacheAltitude(data)` → void
- `getCachedAltitude()` → Object | null
- `clearCache()` → void

**Fórmula:**
- Ajuste = +8% de tiempo por cada 1000m de altitud

**Niveles de advertencia:**
- **low:** 0-999m
- **medium:** 1000-1999m
- **high:** 2000m+

**Fuentes de datos:**
1. Geolocation API (navegador)
2. OpenElevation API fallback
3. Base de datos de ubicaciones conocidas
4. localStorage caché (24 horas)

**Ejemplo:**
```javascript
const altitude = await AltitudeDetector.detect();
// { altitude: 1500, estimatedAltitudeAdjustmentPercent: 12.4, ... }
```

---

## Test Coverage

Total: **50+ tests**

| Módulo | Tests | Estado |
|--------|-------|--------|
| RubCalculator | 12+ | ✅ |
| TempConverter | 14+ | ✅ |
| WeightConverter | 14+ | ✅ |
| AltitudeDetector | 14+ | ✅ |
| **Total** | **50+** | **✅** |

**Ejecutar tests:**
```bash
node src/domains/gadgets/gadgets.test.js
```

---

## Data Flow

```
Usuario abre Tab "Gadgets"
  ↓
Disponibles:
  1. Temp Converter (C ↔ F)
  2. Weight Converter (kg ↔ lbs)
  3. Rub Calculator (peso → cantidades)
  4. Altitude Detector (auto / manual)
  ↓
Usuario selecciona herramienta
  ↓
Calcula / convierte
  ↓
Muestra resultado
```

---

## Error Handling

- ✅ Validación de entrada (tipos, rangos)
- ✅ Errores descriptivos
- ✅ Fallbacks (AltitudeDetector: caché → estimación)
- ✅ No rompe en casos límite

---

_Gadgets Domain · FASE 6 · Completa con 50+ tests_
