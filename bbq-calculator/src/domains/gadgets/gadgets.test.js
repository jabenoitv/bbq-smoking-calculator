/**
 * Tests for Gadgets Domain - RubCalculator, TempConverter, WeightConverter, AltitudeDetector
 * Run with: node src/domains/gadgets/gadgets.test.js
 */

import RubCalculator from './RubCalculator.js';
import TempConverter from './TempConverter.js';
import WeightConverter from './WeightConverter.js';
import AltitudeDetector from './AltitudeDetector.js';

// Mock localStorage para testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('📋 Ejecutando tests para Gadgets Domain\n');

    for (const { name, fn } of this.tests) {
      try {
        // Clear cache before each test
        AltitudeDetector.clearCache();
        global.localStorage.clear();

        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Resultados: ${this.passed} pasados, ${this.failed} fallidos`);
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

const runner = new TestRunner();

// ========== RUB CALCULATOR TESTS (12+) ==========

runner.test('RubCalculator: Obtener tipos de carne disponibles', () => {
  const types = RubCalculator.getAvailableMeatTypes();
  if (!Array.isArray(types)) throw new Error('Should return array');
  if (types.length === 0) throw new Error('Should have at least one meat type');
  if (!types.includes('brisket')) throw new Error('Should include brisket');
  if (!types.includes('pork_butt')) throw new Error('Should include pork_butt');
});

runner.test('RubCalculator: Calcular rub para brisket', () => {
  const result = RubCalculator.calculate('brisket', 5.0);
  if (!result.rubGrams) throw new Error('Should have rubGrams');
  if (result.rubGrams < 500 || result.rubGrams > 700) {
    throw new Error(`Expected ~600g for 5kg brisket, got ${result.rubGrams}g`);
  }
  if (!result.ingredients) throw new Error('Should have ingredients');
  if (!result.ingredients.salt) throw new Error('Should have salt in ingredients');
});

runner.test('RubCalculator: Calcular rub para pork_butt', () => {
  const result = RubCalculator.calculate('pork_butt', 3.0);
  if (result.rubGrams < 300 || result.rubGrams > 500) {
    throw new Error(`Expected ~420g for 3kg pork_butt, got ${result.rubGrams}g`);
  }
});

runner.test('RubCalculator: Calcular rub para ribs', () => {
  const result = RubCalculator.calculate('ribs', 2.0);
  if (result.rubGrams < 250 || result.rubGrams > 350) {
    throw new Error(`Expected ~300g for 2kg ribs, got ${result.rubGrams}g`);
  }
});

runner.test('RubCalculator: Calcular rub para chicken', () => {
  const result = RubCalculator.calculate('chicken', 1.5);
  if (result.rubGrams < 130 || result.rubGrams > 170) {
    throw new Error(`Expected ~150g for 1.5kg chicken, got ${result.rubGrams}g`);
  }
});

runner.test('RubCalculator: Calcular rub para turkey', () => {
  const result = RubCalculator.calculate('turkey', 8.0);
  if (result.rubGrams < 800 || result.rubGrams > 1000) {
    throw new Error(`Expected ~880g for 8kg turkey, got ${result.rubGrams}g`);
  }
});

runner.test('RubCalculator: Suma de ingredientes = rub total', () => {
  const result = RubCalculator.calculate('brisket', 2.0);
  const ingredientSum = Object.values(result.ingredients).reduce((a, b) => a + b, 0);
  if (Math.abs(ingredientSum - result.rubGrams) > 0.5) {
    throw new Error(`Ingredients sum (${ingredientSum}g) != total rub (${result.rubGrams}g)`);
  }
});

runner.test('RubCalculator: Rechazar tipo de carne desconocido', () => {
  try {
    RubCalculator.calculate('unknown_meat', 2.0);
    throw new Error('Should throw error for unknown meat');
  } catch (err) {
    if (!err.message.includes('Unknown meat type')) throw err;
  }
});

runner.test('RubCalculator: Rechazar peso negativo', () => {
  try {
    RubCalculator.calculate('brisket', -1.0);
    throw new Error('Should throw error for negative weight');
  } catch (err) {
    if (!err.message.includes('positive')) throw err;
  }
});

runner.test('RubCalculator: Validar tipo de carne', () => {
  if (!RubCalculator.isValidMeatType('brisket')) throw new Error('Brisket should be valid');
  if (RubCalculator.isValidMeatType('unknown')) throw new Error('Unknown should be invalid');
});

runner.test('RubCalculator: Generar instrucciones', () => {
  const result = RubCalculator.calculate('brisket', 2.0);
  if (!result.instructions) throw new Error('Should have instructions');
  if (!Array.isArray(result.instructions)) throw new Error('Instructions should be array');
  if (result.instructions.length === 0) throw new Error('Should have at least one instruction');
  const hasApply = result.instructions.some(i => i.includes('Apply'));
  if (!hasApply) throw new Error('Should have application instruction');
});

// ========== TEMPERATURE CONVERTER TESTS (14+) ==========

runner.test('TempConverter: Convertir 0°C a Fahrenheit', () => {
  const result = TempConverter.celsiusToFahrenheit(0);
  if (result.value !== 32) throw new Error(`Expected 32°F, got ${result.value}°F`);
  if (result.unit !== '°F') throw new Error('Unit should be °F');
});

runner.test('TempConverter: Convertir 100°C a Fahrenheit', () => {
  const result = TempConverter.celsiusToFahrenheit(100);
  if (result.value !== 212) throw new Error(`Expected 212°F, got ${result.value}°F`);
});

runner.test('TempConverter: Convertir 37°C a Fahrenheit (body temp)', () => {
  const result = TempConverter.celsiusToFahrenheit(37);
  if (result.value !== 98.6) throw new Error(`Expected 98.6°F, got ${result.value}°F`);
});

runner.test('TempConverter: Convertir -40°C a Fahrenheit (equal point)', () => {
  const result = TempConverter.celsiusToFahrenheit(-40);
  if (result.value !== -40) throw new Error(`Expected -40°F, got ${result.value}°F`);
});

runner.test('TempConverter: Convertir 32°F a Celsius', () => {
  const result = TempConverter.fahrenheitToCelsius(32);
  if (result.value !== 0) throw new Error(`Expected 0°C, got ${result.value}°C`);
  if (result.unit !== '°C') throw new Error('Unit should be °C');
});

runner.test('TempConverter: Convertir 212°F a Celsius', () => {
  const result = TempConverter.fahrenheitToCelsius(212);
  if (result.value !== 100) throw new Error(`Expected 100°C, got ${result.value}°C`);
});

runner.test('TempConverter: Convertir 98.6°F a Celsius', () => {
  const result = TempConverter.fahrenheitToCelsius(98.6);
  if (result.value !== 37) throw new Error(`Expected 37°C, got ${result.value}°C`);
});

runner.test('TempConverter: Convertir array de Celsius a Fahrenheit', () => {
  const results = TempConverter.celsiusToFahrenheitArray([0, 100, -40]);
  if (results.length !== 3) throw new Error('Should return 3 results');
  if (results[0].value !== 32) throw new Error('First should be 32°F');
  if (results[1].value !== 212) throw new Error('Second should be 212°F');
});

runner.test('TempConverter: Rechazar entrada no numérica', () => {
  try {
    TempConverter.celsiusToFahrenheit('no es un número');
    throw new Error('Should throw error for non-numeric input');
  } catch (err) {
    if (!err.message.includes('number')) throw err;
  }
});

runner.test('TempConverter: Convertir y comparar temperatura', () => {
  const result = TempConverter.convertAndCompare(25, 'C');
  if (!result.celsius) throw new Error('Should have celsius');
  if (!result.fahrenheit) throw new Error('Should have fahrenheit');
  if (result.celsius.value !== 25) throw new Error('Celsius should be 25');
  if (result.fahrenheit.value !== 77) throw new Error('Fahrenheit should be 77');
});

runner.test('TempConverter: Rango de temperaturas C a F', () => {
  const range = TempConverter.getTemperatureRange(0, 100, 'C', 10);
  if (!range.celsius) throw new Error('Should have celsius range');
  if (!range.fahrenheit) throw new Error('Should have fahrenheit range');
  if (range.celsius.length !== 11) throw new Error('Should have 11 points (0-100 by 10)');
});

runner.test('TempConverter: Formato de salida tiene valor y unidad', () => {
  const result = TempConverter.celsiusToFahrenheit(25);
  if (typeof result.value !== 'number') throw new Error('value should be number');
  if (typeof result.unit !== 'string') throw new Error('unit should be string');
  if (typeof result.formatted !== 'string') throw new Error('formatted should be string');
});

// ========== WEIGHT CONVERTER TESTS (14+) ==========

runner.test('WeightConverter: Convertir 1kg a libras', () => {
  const result = WeightConverter.kgToLbs(1);
  if (Math.abs(result.value - 2.20) > 0.05) throw new Error(`Expected ~2.20 lbs, got ${result.value} lbs`);
  if (result.unit !== 'lbs') throw new Error('Unit should be lbs');
});

runner.test('WeightConverter: Convertir 2kg a libras', () => {
  const result = WeightConverter.kgToLbs(2);
  if (Math.abs(result.value - 4.41) > 0.05) throw new Error(`Expected ~4.41 lbs, got ${result.value} lbs`);
});

runner.test('WeightConverter: Convertir 1 libra a kg', () => {
  const result = WeightConverter.lbsToKg(1);
  if (Math.abs(result.value - 0.45) > 0.05) throw new Error(`Expected ~0.45 kg, got ${result.value} kg`);
  if (result.unit !== 'kg') throw new Error('Unit should be kg');
});

runner.test('WeightConverter: Convertir 2.2 libras a kg', () => {
  const result = WeightConverter.lbsToKg(2.2);
  if (Math.abs(result.value - 1.0) > 0.05) throw new Error(`Expected ~1.0 kg, got ${result.value} kg`);
});

runner.test('WeightConverter: Convertir 1kg a gramos', () => {
  const result = WeightConverter.kgToGrams(1);
  if (result.value !== 1000) throw new Error(`Expected 1000g, got ${result.value}g`);
  if (result.unit !== 'g') throw new Error('Unit should be g');
});

runner.test('WeightConverter: Convertir 2.5kg a gramos', () => {
  const result = WeightConverter.kgToGrams(2.5);
  if (result.value !== 2500) throw new Error(`Expected 2500g, got ${result.value}g`);
});

runner.test('WeightConverter: Convertir 1000 gramos a kg', () => {
  const result = WeightConverter.gramsToKg(1000);
  if (result.value !== 1) throw new Error(`Expected 1kg, got ${result.value}kg`);
});

runner.test('WeightConverter: Convertir 500 gramos a kg', () => {
  const result = WeightConverter.gramsToKg(500);
  if (result.value !== 0.5) throw new Error(`Expected 0.5kg, got ${result.value}kg`);
});

runner.test('WeightConverter: Convertir 1 libra a gramos', () => {
  const result = WeightConverter.lbsToGrams(1);
  if (Math.abs(result.value - 454) > 5) throw new Error(`Expected ~454g, got ${result.value}g`);
});

runner.test('WeightConverter: Convertir 454 gramos a libras', () => {
  const result = WeightConverter.gramsToLbs(454);
  if (Math.abs(result.value - 1.0) > 0.05) throw new Error(`Expected ~1 lbs, got ${result.value} lbs`);
});

runner.test('WeightConverter: Rechazar peso negativo', () => {
  try {
    WeightConverter.kgToLbs(-1);
    throw new Error('Should throw error for negative weight');
  } catch (err) {
    if (!err.message.includes('negative')) throw err;
  }
});

runner.test('WeightConverter: Convertir y comparar múltiples unidades', () => {
  const result = WeightConverter.convertAndCompare(1, 'kg');
  if (!result.kg) throw new Error('Should have kg');
  if (!result.lbs) throw new Error('Should have lbs');
  if (!result.grams) throw new Error('Should have grams');
  if (result.kg.value !== 1) throw new Error('kg should be 1');
  if (Math.abs(result.lbs.value - 2.20) > 0.05) throw new Error('lbs should be ~2.20');
  if (result.grams.value !== 1000) throw new Error('grams should be 1000');
});

runner.test('WeightConverter: Conversión por lote kg a lbs', () => {
  const results = WeightConverter.batchConvert([1, 2, 5], 'kg', 'lbs');
  if (results.length !== 3) throw new Error('Should return 3 results');
  if (Math.abs(results[0].value - 2.20) > 0.05) throw new Error('First should be ~2.20 lbs');
});

runner.test('WeightConverter: Formato tiene valor, unidad y texto formateado', () => {
  const result = WeightConverter.kgToLbs(1);
  if (typeof result.value !== 'number') throw new Error('value should be number');
  if (typeof result.unit !== 'string') throw new Error('unit should be string');
  if (typeof result.formatted !== 'string') throw new Error('formatted should be string');
});

// ========== ALTITUDE DETECTOR TESTS (14+) ==========

runner.test('AltitudeDetector: Calcular ajuste de tiempo de cocción para 0m', () => {
  const adjustment = AltitudeDetector.calculateCookingTimeAdjustment(0);
  if (adjustment !== 0) throw new Error(`Expected 0% at sea level, got ${adjustment}%`);
});

runner.test('AltitudeDetector: Calcular ajuste de tiempo de cocción para 1000m', () => {
  const adjustment = AltitudeDetector.calculateCookingTimeAdjustment(1000);
  if (Math.abs(adjustment - 8) > 0.5) throw new Error(`Expected ~8% at 1000m, got ${adjustment}%`);
});

runner.test('AltitudeDetector: Calcular ajuste de tiempo de cocción para 2000m', () => {
  const adjustment = AltitudeDetector.calculateCookingTimeAdjustment(2000);
  if (adjustment < 15 || adjustment > 20) throw new Error(`Expected ~16% at 2000m, got ${adjustment}%`);
});

runner.test('AltitudeDetector: Estimar altitud desde coordenadas conocidas', () => {
  const altitude = AltitudeDetector.estimateAltitudeFromCoordinates(40.4168, -3.7038); // Madrid
  if (altitude < 500 || altitude > 800) throw new Error(`Expected ~646m for Madrid, got ${altitude}m`);
});

runner.test('AltitudeDetector: Estimar altitud desde coordenadas desconocidas', () => {
  const altitude = AltitudeDetector.estimateAltitudeFromCoordinates(45.5, 10.5); // Random location
  if (typeof altitude !== 'number') throw new Error('Should return number');
  if (altitude < 0) throw new Error('Should not be negative');
});

runner.test('AltitudeDetector: Cachear altitud en localStorage', () => {
  const testData = { altitude: 1500, unit: 'm', estimatedAltitudeAdjustmentPercent: 12 };
  AltitudeDetector.cacheAltitude(testData);
  const cached = global.localStorage.getItem(AltitudeDetector.CACHE_KEY);
  if (!cached) throw new Error('Should cache data');
  const parsed = JSON.parse(cached);
  if (parsed.altitude !== 1500) throw new Error('Cached altitude should match');
});

runner.test('AltitudeDetector: Recuperar altitud cacheada', () => {
  const testData = { altitude: 2000, unit: 'm', estimatedAltitudeAdjustmentPercent: 16.6, timestamp: new Date().toISOString() };
  AltitudeDetector.cacheAltitude(testData);
  const cached = AltitudeDetector.getCachedAltitude();
  if (!cached) throw new Error('Should retrieve cached altitude');
  if (cached.altitude !== 2000) throw new Error('Cached altitude should match');
});

runner.test('AltitudeDetector: Limpiar caché', () => {
  AltitudeDetector.cacheAltitude({ altitude: 1000, unit: 'm' });
  AltitudeDetector.clearCache();
  const cached = AltitudeDetector.getCachedAltitude();
  if (cached !== null) throw new Error('Cache should be cleared');
});

runner.test('AltitudeDetector: Obtener tiempo de cocción ajustado por altitud', () => {
  const adjustedTime = AltitudeDetector.getAdjustedCookingTime(3600, 1000); // 1 hour at 1000m
  const expected = 3600 * 1.08; // 8% adjustment
  if (Math.abs(adjustedTime - expected) > 30) throw new Error(`Expected ~${expected}s, got ${adjustedTime}s`);
});

runner.test('AltitudeDetector: Nivel de advertencia para baja altitud', () => {
  const level = AltitudeDetector.getAdjustmentWarningLevel(500);
  if (level !== 'low') throw new Error(`Expected 'low' for 500m, got '${level}'`);
});

runner.test('AltitudeDetector: Nivel de advertencia para altitud media', () => {
  const level = AltitudeDetector.getAdjustmentWarningLevel(1500);
  if (level !== 'medium') throw new Error(`Expected 'medium' for 1500m, got '${level}'`);
});

runner.test('AltitudeDetector: Nivel de advertencia para alta altitud', () => {
  const level = AltitudeDetector.getAdjustmentWarningLevel(2500);
  if (level !== 'high') throw new Error(`Expected 'high' for 2500m, got '${level}'`);
});

runner.test('AltitudeDetector: Rechazar entrada no numérica', () => {
  try {
    AltitudeDetector.calculateCookingTimeAdjustment('not a number');
    throw new Error('Should throw error for non-numeric input');
  } catch (err) {
    // Expected
  }
});

runner.test('AltitudeDetector: Batch convert altitudes con ajustes', () => {
  const altitudes = [0, 1000, 2000];
  const adjustments = altitudes.map(a => AltitudeDetector.calculateCookingTimeAdjustment(a));
  if (adjustments.length !== 3) throw new Error('Should return 3 adjustments');
  if (adjustments[0] !== 0) throw new Error('First should be 0%');
  if (Math.abs(adjustments[1] - 8) > 0.5) throw new Error('Second should be ~8%');
});

runner.run();
