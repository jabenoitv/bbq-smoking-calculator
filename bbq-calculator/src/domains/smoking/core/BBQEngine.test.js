/**
 * Tests for BBQEngine - Núcleo de cálculos
 * Run with: node src/core/BBQEngine.test.js (if using Node.js)
 * Or integrate with Jest/Vitest for CI/CD
 */

import BBQEngine from './BBQEngine.js';

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertApprox(actual, expected, tolerance = 1, message) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(message || `Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
    }
  }

  async run() {
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para BBQEngine\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (err) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${err.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Resultados: ${this.passed} pasados, ${this.failed} fallidos\n`);
    return this.failed === 0;
  }
}

// ================================================================
// SUITE DE TESTS
// ================================================================

const runner = new TestRunner();
const engine = new BBQEngine();

// ========================= CONVERSIONES =========================
runner.test('Conversión: Celsius a Fahrenheit', function() {
  runner.assertEqual(engine.celsiusToFahrenheit(0), 32, 'Cero grados');
  runner.assertEqual(engine.celsiusToFahrenheit(100), 212, '100°C = 212°F');
  runner.assertEqual(engine.celsiusToFahrenheit(107), 225, '107°C = 225°F (estándar BBQ)');
});

runner.test('Conversión: Fahrenheit a Celsius', function() {
  runner.assertEqual(engine.fahrenheitToCelsius(32), 0, 'Cero grados');
  runner.assertEqual(engine.fahrenheitToCelsius(212), 100, '212°F = 100°C');
  runner.assertApprox(engine.fahrenheitToCelsius(225), 107.2, 0.1, '225°F = 107.2°C');
});

runner.test('Conversión: kg a lbs', function() {
  runner.assertEqual(engine.kgToLbs(1), 2.2, '1 kg = 2.2 lbs');
  runner.assertEqual(engine.kgToLbs(5), 11, '5 kg = 11 lbs');
});

runner.test('Conversión: lbs a kg', function() {
  runner.assertEqual(engine.lbsToKg(2.2), 1, '2.2 lbs = 1 kg');
  runner.assertEqual(engine.lbsToKg(11), 5, '11 lbs = 5 kg');
});

runner.test('Conversiones estáticas', function() {
  runner.assertEqual(
    BBQEngine.convertTemp(100, 'C', 'F'),
    212,
    'Conversión estática C→F'
  );
  runner.assertEqual(
    BBQEngine.convertWeight(5, 'kg', 'lbs'),
    11,
    'Conversión estática kg→lbs'
  );
});

// ========================= ALTITUD =========================
runner.test('Ajuste de altitud: Factor de ajuste', function() {
  const factor1000m = engine.getAltitudeAdjustmentFactor(1000);
  runner.assertApprox(factor1000m, 1.08, 0.01, '1000m = 1.08x (+8%)');

  const factor2000m = engine.getAltitudeAdjustmentFactor(2000);
  runner.assertApprox(factor2000m, 1.16, 0.01, '2000m = 1.16x (+16%)');

  const factor0m = engine.getAltitudeAdjustmentFactor(0);
  runner.assertEqual(factor0m, 1.0, '0m = sin ajuste');
});

runner.test('Aplicación de ajuste de altitud', function() {
  const timeBase = 1000; // minutos
  const timeAdjusted = engine.applyAltitudeAdjustment(timeBase, 1850);
  runner.assertApprox(
    timeAdjusted,
    Math.round(1000 * 1.148),
    2,
    '1000 minutos a 1850m ≈ 1148 minutos'
  );
});

// ========================= NIVELES DE RENDERIZACIÓN =========================
runner.test('Selección de nivel de renderización', function() {
  // Brisket: tempRange { min: 55, max: 80 }
  const raro = engine.selectRenderingLevel('tapapecho', 'raro');
  const rosa = engine.selectRenderingLevel('tapapecho', 'rosa');
  const gris = engine.selectRenderingLevel('tapapecho', 'gris');

  runner.assert(raro < rosa, 'Raro < Rosa');
  runner.assert(rosa < gris, 'Rosa < Gris');
  runner.assert(raro >= 55 && raro <= 80, 'Raro está en rango');
  runner.assert(rosa >= 55 && rosa <= 80, 'Rosa está en rango');
  runner.assert(gris >= 55 && gris <= 80, 'Gris está en rango');
});

runner.test('Temperaturas por carne', function() {
  const temps = engine.getTempsForMeat('punta_ganso');
  runner.assert(temps.raro !== undefined, 'Tiene temperatura Raro');
  runner.assert(temps.rosa !== undefined, 'Tiene temperatura Rosa');
  runner.assert(temps.gris !== undefined, 'Tiene temperatura Gris');
  runner.assert(temps.raro < temps.rosa && temps.rosa < temps.gris, 'Orden correcto');
});

// ========================= CÁLCULOS PRINCIPALES =========================
runner.test('Cálculo básico: Brisket', function() {
  const result = engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    desiredRedTempC: 63,
    wrapped: false,
    altitudeM: 0
  });

  runner.assert(result.id !== undefined, 'Tiene ID');
  runner.assertEqual(result.meatType, 'tapapecho', 'Tipo de carne correcto');
  runner.assertEqual(result.weightKg, 4.5, 'Peso correcto');
  runner.assertEqual(result.smokingTempC, 107, 'Temperatura ahumado');
  runner.assertEqual(result.desiredRedTempC, 63, 'Temperatura deseada');
  runner.assert(result.estimatedCookingHours > 0, 'Horas estimadas > 0');
  runner.assert(result.totalMinutes > 0, 'Minutos totales > 0');
  runner.assert(result.phases.length === 3, 'Tiene 3 fases');
  runner.assert(result.events.length > 0, 'Tiene eventos');
});

runner.test('Cálculo con envuelto acelera stall', function() {
  const resultUnwrapped = engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    wrapped: false,
    altitudeM: 0
  });

  const resultWrapped = engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    wrapped: true,
    altitudeM: 0
  });

  runner.assert(
    resultWrapped.totalMinutes < resultUnwrapped.totalMinutes,
    'Envuelto es más rápido que sin envolver'
  );
});

runner.test('Cálculo con altitud ajusta tiempo', function() {
  const resultSea = engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    altitudeM: 0
  });

  const resultHigh = engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    altitudeM: 1850
  });

  runner.assert(
    resultHigh.totalMinutes > resultSea.totalMinutes,
    'Mayor altitud = más tiempo'
  );
  runner.assertApprox(
    resultHigh.altitudeAdjustmentFactor,
    1.148,
    0.01,
    'Factor de altitud es ~1.148 a 1850m'
  );
});

runner.test('Pollo tiene rango bloqueado (seguridad)', function() {
  const result = engine.calculate({
    meatType: 'pollo_entero',
    weightKg: 1.8,
    smokingTempC: 107,
    desiredRedTempC: 72 // Forzamos la mínima
  });

  runner.assertEqual(result.desiredRedTempC, 72, 'Respeta temperatura mínima (72°C)');
});

runner.test('Temperatura deseada sin envuelto', function() {
  const resultCustom = engine.calculate({
    meatType: 'punta_ganso',
    weightKg: 2.5,
    smokingTempC: 120,
    desiredRedTempC: 55 // Muy raro
  });

  runner.assertEqual(resultCustom.desiredRedTempC, 55, 'Usa temperatura personalizada');
  runner.assert(resultCustom.userSelected === true, 'Marca como seleccionado por usuario');
});

// ========================= STALL TIME =========================
runner.test('Cálculo de stall time escalado por peso', function() {
  const formula = engine.getMeatFormulas()['tapapecho'];

  const stall1kg = engine.calculateStallTime(formula, 1, 107);
  const stall4kg = engine.calculateStallTime(formula, 4, 107);

  runner.assert(stall4kg > stall1kg, '4kg toma más tiempo que 1kg');
  runner.assert(
    stall4kg < stall1kg * 4,
    'Escalado sublineal: 4kg < 4×(1kg) [power 0.8]'
  );
});

runner.test('Cálculo de stall time por temperatura', function() {
  const formula = engine.getMeatFormulas()['tapapecho'];

  const stallCool = engine.calculateStallTime(formula, 4, 90);
  const stallHot = engine.calculateStallTime(formula, 4, 120);

  runner.assert(stallCool > stallHot, 'Temperatura más baja = stall más largo');
});

// ========================= STAGE FOR PROGRESS =========================
runner.test('Etapas de cocción según progreso', function() {
  runner.assertEqual(
    engine.getStageForProgress(0.1),
    'Cocción inicial',
    'Progreso 10%'
  );
  runner.assertEqual(
    engine.getStageForProgress(0.4),
    'Stall (meseta)',
    'Progreso 40%'
  );
  runner.assertEqual(
    engine.getStageForProgress(0.7),
    'Cocción avanzada',
    'Progreso 70%'
  );
  runner.assertEqual(
    engine.getStageForProgress(0.9),
    'Casi listo',
    'Progreso 90%'
  );
  runner.assertEqual(
    engine.getStageForProgress(1.0),
    'Listo - retirar',
    'Progreso 100%'
  );
});

// ========================= COLOR FOR TEMP =========================
runner.test('Color para temperatura', function() {
  const minC = 25;
  const optimalC = 63;

  const colorRed = engine.getColorForTemp(30, optimalC, minC);
  const colorYellow = engine.getColorForTemp(45, optimalC, minC);
  const colorGreen = engine.getColorForTemp(55, optimalC, minC);
  const colorBlue = engine.getColorForTemp(63, optimalC, minC);

  runner.assertEqual(colorRed, '#FF6B6B', 'Rojo para temp baja');
  runner.assertEqual(colorYellow, '#FFD93D', 'Amarillo para temp media-baja');
  runner.assertEqual(colorGreen, '#6BCB77', 'Verde para temp media');
  runner.assertEqual(colorBlue, '#4D96FF', 'Azul para temp óptima');
});

// ========================= MEAT FORMULAS =========================
runner.test('Fórmulas de carne están completas', function() {
  const formulas = engine.getMeatFormulas();

  runner.assert(Object.keys(formulas).length >= 8, 'Al menos 8 carnes');

  for (const [key, formula] of Object.entries(formulas)) {
    runner.assert(formula.name !== undefined, `${key} tiene nombre`);
    runner.assert(formula.rampUpRate !== undefined, `${key} tiene rampUpRate`);
    runner.assert(formula.stallBaseHours !== undefined, `${key} tiene stallBaseHours`);
    runner.assert(formula.tempRange !== undefined, `${key} tiene tempRange`);
    runner.assert(formula.standardWeightKg !== undefined, `${key} tiene standardWeightKg`);
  }
});

// ========================= EVENT EMITTER =========================
runner.test('EventEmitter funciona correctamente', function() {
  const engine2 = new BBQEngine();
  let eventFired = false;
  let eventData = null;

  engine2.on('test-event', (data) => {
    eventFired = true;
    eventData = data;
  });

  engine2.emit('test-event', { value: 42 });

  runner.assert(eventFired === true, 'Evento se disparó');
  runner.assertEqual(eventData.value, 42, 'Datos del evento correctos');
});

runner.test('Eventos de cálculo se emiten correctamente', function() {
  const engine3 = new BBQEngine();
  let calculationStarted = false;
  let calculationCompleted = false;

  engine3.on('calculation-started', () => {
    calculationStarted = true;
  });

  engine3.on('calculation-complete', () => {
    calculationCompleted = true;
  });

  engine3.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107
  });

  runner.assert(calculationStarted === true, 'Evento calculation-started se disparó');
  runner.assert(calculationCompleted === true, 'Evento calculation-complete se disparó');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
