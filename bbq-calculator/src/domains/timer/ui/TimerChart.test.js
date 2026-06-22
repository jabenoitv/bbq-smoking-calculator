/**
 * Tests for TimerChart - Real vs Expected temperature comparison
 * Run with: node src/viz/TimerChart.test.js
 * Note: These tests mock Chart.js and DOM APIs
 */

import TimerChart from './TimerChart.js';

// Mock DOM APIs for Node.js testing
if (typeof document === 'undefined') {
  global.document = {
    getElementById: (id) => ({
      id,
      style: {},
      toDataURL: () => 'data:image/png;base64,iVBORw0K...'
    }),
    createElement: (tag) => ({
      tagName: tag,
      href: '',
      download: '',
      click: () => {}
    })
  };
}

// Mock Chart.js
if (typeof window === 'undefined') {
  global.window = {
    Chart: class MockChart {
      constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.data = config.data;
      }

      destroy() {}
      update(mode) {}
      resize() {}
      getDatasetMeta(index) {
        return { data: [] };
      }
    }
  };
} else if (!window.Chart) {
  window.Chart = class MockChart {
    constructor(ctx, config) {
      this.ctx = ctx;
      this.config = config;
      this.data = config.data;
    }

    destroy() {}
    update(mode) {}
    resize() {}
    getDatasetMeta(index) {
      return { data: [] };
    }
  };
}

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

  assertApprox(actual, expected, tolerance, message) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(message || `Expected ${expected} ±${tolerance}, got ${actual}`);
    }
  }

  async run() {
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para TimerChart\n`);

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

// Fixture: datos esperados de prueba
function generateExpectedData() {
  return [
    { time: 0, temp: 25 },
    { time: 600, temp: 35 },
    { time: 1200, temp: 45 },
    { time: 1800, temp: 55 },
    { time: 2400, temp: 62 }
  ];
}

// ========================= INICIALIZACIÓN =========================
runner.test('Inicialización con canvas válido', function() {
  const chart = new TimerChart('timer-chart');
  runner.assert(chart.canvas !== null, 'Canvas se asigna correctamente');
  runner.assertEqual(chart.canvasId, 'timer-chart', 'ID de canvas se guarda');
  runner.assertEqual(chart.theme, 'dark', 'Tema default es dark');
});

runner.test('Inicialización lanza error sin canvas', function() {
  const oldGetElement = global.document.getElementById;
  global.document.getElementById = () => null;

  try {
    new TimerChart('inexistent');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no encontrado'), 'Error correcto');
  } finally {
    global.document.getElementById = oldGetElement;
  }
});

// ========================= CURVA ESPERADA =========================
runner.test('setExpectedCurve establece datos esperados', function() {
  const chart = new TimerChart('timer-chart');
  const data = generateExpectedData();

  chart.setExpectedCurve(data);

  runner.assert(chart.expectedData !== null, 'Datos se almacenan');
  runner.assertEqual(chart.expectedData.length, 5, 'Cantidad correcta');
  runner.assertEqual(chart.expectedData[0].temp, 25, 'Primer punto correcto');
});

runner.test('setExpectedCurve lanza error sin datos', function() {
  const chart = new TimerChart('timer-chart');

  try {
    chart.setExpectedCurve([]);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('válido'), 'Error correcto');
  }
});

runner.test('setExpectedCurve lanza error con datos inválidos', function() {
  const chart = new TimerChart('timer-chart');

  try {
    chart.setExpectedCurve(null);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('válido'), 'Error correcto');
  }
});

// ========================= MEDICIONES =========================
runner.test('addMeasurement añade punto real', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34);

  runner.assertEqual(chart.measurements.length, 1, 'Medición se añade');
  runner.assertEqual(chart.measurements[0].temp, 34, 'Temperatura correcta');
  runner.assertEqual(chart.measurements[0].time, 600, 'Tiempo correcto');
});

runner.test('addMeasurement con color específico', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34, 'orange');

  runner.assertEqual(chart.measurements[0].deviationColor, 'orange', 'Color se asigna');
});

runner.test('addMeasurement sin especificar color usa verde', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34);

  runner.assertEqual(chart.measurements[0].deviationColor, 'green', 'Color default verde');
});

runner.test('getMeasurements devuelve copia', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34);
  const measurements = chart.getMeasurements();

  runner.assert(Array.isArray(measurements), 'Devuelve array');
  runner.assertEqual(measurements.length, 1, 'Cantidad correcta');
});

// ========================= TEMAS =========================
runner.test('setTheme cambia el tema', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.setTheme('light');

  runner.assertEqual(chart.theme, 'light', 'Tema cambia');
});

runner.test('setTheme lanza error con tema inválido', function() {
  const chart = new TimerChart('timer-chart');

  try {
    chart.setTheme('invalid');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no válido'), 'Error correcto');
  }
});

runner.test('getTheme devuelve tema actual', function() {
  const chart = new TimerChart('timer-chart');
  chart.setTheme('light');

  runner.assertEqual(chart.getTheme(), 'light', 'Tema correcto');
});

// ========================= ESTADÍSTICAS =========================
runner.test('getDeviationStats devuelve estadísticas', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34, 'green'); // Cercano a 35
  chart.addMeasurement(1200, 45, 'green');

  const stats = chart.getDeviationStats();

  runner.assertEqual(stats.count, 2, 'Count correcto');
  runner.assert(stats.averageDeviation >= 0, 'Promedio positivo');
  runner.assertEqual(stats.deviationsByColor.green, 2, 'Conteo de colores');
});

runner.test('getDeviationStats devuelve ceros sin mediciones', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  const stats = chart.getDeviationStats();

  runner.assertEqual(stats.count, 0, 'Count es 0');
  runner.assertEqual(stats.averageDeviation, 0, 'Promedio es 0');
});

runner.test('getDeviationStats devuelve ceros sin curva esperada', function() {
  const chart = new TimerChart('timer-chart');

  const stats = chart.getDeviationStats();

  runner.assertEqual(stats.count, 0, 'Count es 0');
});

// ========================= LIMPIEZA =========================
runner.test('clear elimina mediciones', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  chart.addMeasurement(600, 34);
  chart.addMeasurement(1200, 45);

  chart.clear();

  runner.assertEqual(chart.measurements.length, 0, 'Mediciones limpias');
  runner.assert(chart.expectedData !== null, 'Curva esperada se mantiene');
});

runner.test('destroy limpia todo', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());
  chart.addMeasurement(600, 34);

  chart.destroy();

  runner.assertEqual(chart.chart, null, 'Gráfica destruida');
  runner.assertEqual(chart.expectedData, null, 'Datos limpios');
  runner.assertEqual(chart.measurements.length, 0, 'Mediciones limpias');
});

runner.test('destroy es idempotente', function() {
  const chart = new TimerChart('timer-chart');

  try {
    chart.destroy();
    chart.destroy();
    runner.assert(true, 'No lanza error');
  } catch (err) {
    throw err;
  }
});

// ========================= REDIMENSIONAMIENTO =========================
runner.test('resize llama a chart.resize', function() {
  const chart = new TimerChart('timer-chart');
  chart.setExpectedCurve(generateExpectedData());

  let resizeCalled = false;
  const original = chart.chart.resize;
  chart.chart.resize = () => { resizeCalled = true; };

  chart.resize();

  runner.assert(resizeCalled, 'resize se llama en chart');
  chart.chart.resize = original;
});

// ========================= DESVIACIÓN =========================
runner.test('calculateDeviationColor codifica desviaciones', function() {
  const chart = new TimerChart('timer-chart');

  runner.assertEqual(chart.calculateDeviationColor(50, 50), 'green', 'Sin desviación = verde');
  runner.assertEqual(chart.calculateDeviationColor(51, 50), 'green', '±1°C = verde');
  runner.assertEqual(chart.calculateDeviationColor(52, 50), 'orange', '±2°C = naranja');
  runner.assertEqual(chart.calculateDeviationColor(54, 50), 'red', '±4°C = rojo');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
