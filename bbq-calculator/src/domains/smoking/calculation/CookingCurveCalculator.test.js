/**
 * Tests for CookingCurveCalculator - Generador de curvas
 * Run with: node src/core/CookingCurveCalculator.test.js
 */

import CookingCurveCalculator from './CookingCurveCalculator.js';
import BBQEngine from '../core/BBQEngine.js';

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
      throw new Error(message || `Expected ~${expected}, got ${actual}`);
    }
  }

  async run() {
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para CookingCurveCalculator\n`);

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

const runner = new TestRunner();

// Genera un resultado de prueba usando BBQEngine
function generateTestResult() {
  const engine = new BBQEngine();
  return engine.calculate({
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    desiredRedTempC: 63,
    wrapped: false,
    altitudeM: 0
  });
}

// ========================= INICIALIZACIÓN =========================
runner.test('Inicialización correcta', function() {
  const calc = new CookingCurveCalculator();
  runner.assert(calc.phases === null, 'Fases inicialmente null');
  runner.assertEqual(calc.totalMinutes, 0, 'Total minutos es 0');
});

// ========================= GENERAR DESDE RESULTADO =========================
runner.test('generateFromResult produce datos Chart.js', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  const chartData = calc.generateFromResult(result);

  runner.assert(chartData.labels !== undefined, 'Tiene labels');
  runner.assert(chartData.datasets !== undefined, 'Tiene datasets');
  runner.assert(chartData.labels.length > 0, 'Labels no vacío');
  runner.assert(chartData.datasets.length === 3, 'Tiene 3 datasets (3 fases)');
});

runner.test('generateFromResult formatea correctamente', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  const chartData = calc.generateFromResult(result);

  // Verifica que primero está Ramp-up
  runner.assertEqual(chartData.datasets[0].label, 'Ramp-up', 'Primera fase es Ramp-up');
  runner.assertEqual(chartData.datasets[1].label, 'STALL', 'Segunda fase es STALL');
  runner.assertEqual(chartData.datasets[2].label, 'Renderización', 'Tercera fase es Renderización');
});

runner.test('generateFromResult lanza error sin fases', function() {
  const calc = new CookingCurveCalculator();

  try {
    calc.generateFromPhases([], 100, 63);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('Se requieren fases'), 'Error correcto');
  }
});

// ========================= INTERPOLACIÓN DE TEMPERATURA =========================
runner.test('interpolateTemp en inicio', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  const temp = calc.interpolateTemp(0);
  runner.assertApprox(temp, 25, 1, 'Temperatura inicial es ~25°C');
});

runner.test('interpolateTemp en final', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  // Test at the actual end of the last phase (not totalMinutes which may differ due to rounding)
  let phaseEndTime = 0;
  for (const phase of result.phases) {
    phaseEndTime += phase.duration;
  }

  const temp = calc.interpolateTemp(phaseEndTime);
  // At end of last phase, should be at max of that phase's tempRange (which is desiredRedTempC)
  const lastPhase = result.phases[result.phases.length - 1];
  const expectedFinalTemp = lastPhase.tempRange[1];
  // Higher tolerance because phases round independently
  runner.assertApprox(temp, expectedFinalTemp, 5, 'Temperatura al final de última fase (±5°C)');
});

runner.test('interpolateTemp en medio de fase', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  const phase1 = result.phases[0];
  const midPoint = phase1.duration / 2;
  const temp = calc.interpolateTemp(midPoint);

  const [minT, maxT] = phase1.tempRange;
  runner.assert(temp >= minT && temp <= maxT, 'Temp en rango de fase');
});

runner.test('interpolateTemp es monótona ascendente', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  const temps = [];
  const interval = 60;
  for (let i = 0; i * interval <= result.totalMinutes; i++) {
    temps.push(calc.interpolateTemp(i * interval));
  }

  for (let i = 1; i < temps.length; i++) {
    runner.assert(temps[i] >= temps[i - 1], `Temperatura no disminuye (${temps[i]} >= ${temps[i - 1]})`);
  }
});

// ========================= FORMATEO DE TIEMPO =========================
runner.test('formatTime formatea correctamente', function() {
  const calc = new CookingCurveCalculator();

  runner.assertEqual(calc.formatTime(0), '0m', 'Cero minutos');
  runner.assertEqual(calc.formatTime(30), '30m', 'Solo minutos');
  runner.assertEqual(calc.formatTime(60), '1h', 'Solo horas');
  runner.assertEqual(calc.formatTime(90), '1h 30m', 'Horas y minutos');
  runner.assertEqual(calc.formatTime(120), '2h', 'Dos horas');
});

// ========================= OBTENER INICIO DE FASE =========================
runner.test('getPhaseStartTime devuelve tiempo correcto', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  const phase1Start = calc.getPhaseStartTime(result.phases[0]);
  const phase2Start = calc.getPhaseStartTime(result.phases[1]);
  const phase3Start = calc.getPhaseStartTime(result.phases[2]);

  runner.assertEqual(phase1Start, 0, 'Fase 1 comienza en 0');
  runner.assertEqual(phase2Start, result.phases[0].duration, 'Fase 2 comienza tras fase 1');
  runner.assertApprox(
    phase3Start,
    result.phases[0].duration + result.phases[1].duration,
    1,
    'Fase 3 comienza tras fases 1 y 2'
  );
});

// ========================= GRÁFICA DE DESVIACIÓN =========================
runner.test('generateDeviationChart con mediciones', function() {
  const result = generateTestResult();
  const measurements = [
    { elapsedSeconds: 300, tempC: 50 },
    { elapsedSeconds: 600, tempC: 55 },
    { elapsedSeconds: 900, tempC: 60 }
  ];

  const calc = new CookingCurveCalculator();
  const deviationChart = calc.generateDeviationChart(result, measurements);

  runner.assert(deviationChart.labels.length > 0, 'Tiene labels');
  runner.assert(deviationChart.datasets.length === 2, 'Tiene 2 datasets');
  runner.assertEqual(deviationChart.datasets[0].label, 'Temperatura Esperada', 'Dataset 0 es esperada');
  runner.assertEqual(deviationChart.datasets[1].label, 'Mediciones Reales', 'Dataset 1 es real');
});

runner.test('generateDeviationChart vacío sin mediciones', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();

  const deviationChart = calc.generateDeviationChart(result, []);

  runner.assertEqual(deviationChart.labels.length, 0, 'Labels vacío');
  runner.assertEqual(deviationChart.datasets.length, 0, 'Datasets vacío');
});

// ========================= ESTADÍSTICAS DE DESVIACIÓN =========================
runner.test('calculateDeviationStats calcula correctamente', function() {
  const result = generateTestResult();
  const measurements = [
    { elapsedSeconds: 300, tempC: 48 },
    { elapsedSeconds: 600, tempC: 55 },
    { elapsedSeconds: 900, tempC: 62 }
  ];

  const calc = new CookingCurveCalculator();
  const stats = calc.calculateDeviationStats(result, measurements);

  runner.assert(stats.avgDeviation !== undefined, 'Tiene avgDeviation');
  runner.assert(stats.maxDeviation !== undefined, 'Tiene maxDeviation');
  runner.assert(stats.minDeviation !== undefined, 'Tiene minDeviation');
  runner.assertEqual(stats.measurements, 3, 'Cuenta correcta');
});

runner.test('calculateDeviationStats vacío sin mediciones', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();

  const stats = calc.calculateDeviationStats(result, []);

  runner.assertEqual(stats.avgDeviation, 0, 'avgDeviation es 0');
  runner.assertEqual(stats.maxDeviation, 0, 'maxDeviation es 0');
  runner.assertEqual(stats.minDeviation, 0, 'minDeviation es 0');
});

// ========================= TABLA DE REFERENCIAS =========================
runner.test('generateReferenceTable genera puntos correctos', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  calc.generateFromResult(result);

  const table = calc.generateReferenceTable();

  runner.assert(table.length > 0, 'Tabla no vacía');
  runner.assertEqual(table[0].minutes, 0, 'Primer punto en 0 minutos');
  runner.assert(table[0].temperature >= 20, 'Primera temp razonable');

  // Verifica que hay una entrada para fase
  const stall = table.find(row => row.phase === 'STALL');
  runner.assert(stall !== undefined, 'Hay puntos en fase STALL');
});

runner.test('generateReferenceTable con fases personalizadas', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();

  const table = calc.generateReferenceTable(result.phases, result.totalMinutes);

  runner.assert(table.length > 0, 'Tabla no vacía');
  runner.assertEqual(table[table.length - 1].minutes,
    Math.floor(result.totalMinutes / 60) * 60,
    'Último punto es múltiplo de 60'
  );
});

// ========================= METADATOS DE CHARTS =========================
runner.test('generateFromResult incluye metadata', function() {
  const result = generateTestResult();
  const calc = new CookingCurveCalculator();
  const chartData = calc.generateFromResult(result);

  runner.assert(chartData.metadata !== undefined, 'Tiene metadata');
  runner.assertEqual(chartData.metadata.totalMinutes, result.totalMinutes, 'totalMinutes correcto');
  runner.assertEqual(chartData.metadata.desiredTemp, result.desiredRedTempC, 'desiredTemp correcto');
  runner.assertEqual(chartData.metadata.phases.length, 3, 'Metadata contiene 3 fases');
});

// ========================= FUNCIONALIDAD COMPLETA =========================
runner.test('Flujo completo: calcular → curva → desviación', function() {
  const result = generateTestResult();
  const measurements = [
    { elapsedSeconds: 600, tempC: 45 },
    { elapsedSeconds: 1200, tempC: 55 }
  ];

  const calc = new CookingCurveCalculator();

  // Generar curva esperada
  const curve = calc.generateFromResult(result);
  runner.assert(curve.datasets.length === 3, 'Curva generada');

  // Generar gráfica de desviación
  const deviation = calc.generateDeviationChart(result, measurements);
  runner.assert(deviation.datasets.length === 2, 'Desviación generada');

  // Calcular estadísticas
  const stats = calc.calculateDeviationStats(result, measurements);
  runner.assert(stats.measurements === 2, 'Estadísticas correctas');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
