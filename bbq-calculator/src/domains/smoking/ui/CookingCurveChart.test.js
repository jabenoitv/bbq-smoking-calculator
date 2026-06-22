/**
 * Tests for CookingCurveChart - Visualization wrapper
 * Run with: node src/viz/CookingCurveChart.test.js
 * Note: These tests mock Chart.js and DOM APIs
 */

import CookingCurveChart from './CookingCurveChart.js';
import BBQEngine from '../core/BBQEngine.js';

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

  async run() {
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para CookingCurveChart\n`);

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

// Fixture: resultado de cálculo de prueba
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
runner.test('Inicialización con canvas válido', function() {
  const chart = new CookingCurveChart('canvas-mock');
  runner.assert(chart.canvas !== null, 'Canvas se asigna correctamente');
  runner.assertEqual(chart.canvasId, 'canvas-mock', 'ID de canvas se guarda');
  runner.assertEqual(chart.options.theme, 'dark', 'Tema default es dark');
});

runner.test('Inicialización lanza error sin canvas', function() {
  // Cambiar getElementById para devolver null
  const oldGetElement = global.document.getElementById;
  global.document.getElementById = () => null;

  try {
    new CookingCurveChart('inexistent');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no encontrado'), 'Error correcto');
  } finally {
    global.document.getElementById = oldGetElement;
  }
});

runner.test('Inicialización con opciones personalizadas', function() {
  const chart = new CookingCurveChart('canvas-mock', {
    theme: 'light',
    animationDuration: 500
  });

  runner.assertEqual(chart.options.theme, 'light', 'Tema personalizado');
  runner.assertEqual(chart.options.animationDuration, 500, 'Animación personalizada');
});

// ========================= ACTUALIZACIÓN =========================
runner.test('Actualizar con resultado de cálculo', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');

  chart.update(result);

  runner.assert(chart.currentResult !== null, 'Resultado se almacena');
  runner.assert(chart.chart !== null, 'Gráfica se crea');
});

runner.test('Actualizar lanza error sin resultado', function() {
  const chart = new CookingCurveChart('canvas-mock');

  try {
    chart.update(null);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('Se requiere'), 'Error correcto');
  }
});

runner.test('Actualizar reemplaza gráfica anterior', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');

  chart.update(result);
  const firstChart = chart.chart;

  chart.update(result);
  const secondChart = chart.chart;

  runner.assert(firstChart !== secondChart, 'Gráfica se reemplaza');
});

// ========================= TEMAS =========================
runner.test('setTheme cambia el tema', function() {
  const chart = new CookingCurveChart('canvas-mock');
  const result = generateTestResult();
  chart.update(result);

  chart.setTheme('light');

  runner.assertEqual(chart.options.theme, 'light', 'Tema cambia a light');
  runner.assert(chart.canvas.style.backgroundColor !== undefined, 'Background actualizado');
});

runner.test('setTheme lanza error con tema inválido', function() {
  const chart = new CookingCurveChart('canvas-mock');

  try {
    chart.setTheme('invalid');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no válido'), 'Error correcto');
  }
});

runner.test('getTheme devuelve tema actual', function() {
  const chart = new CookingCurveChart('canvas-mock');
  chart.options.theme = 'light';

  runner.assertEqual(chart.getTheme(), 'light', 'Tema actual correcto');
});

// ========================= EXPORTACIÓN =========================
runner.test('exportImage devuelve data URL', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  const imageUrl = chart.exportImage();

  runner.assert(imageUrl.startsWith('data:image'), 'Data URL válida');
});

runner.test('exportImage lanza error sin gráfica', function() {
  const chart = new CookingCurveChart('canvas-mock');

  try {
    chart.exportImage();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('No hay gráfica'), 'Error correcto');
  }
});

runner.test('downloadImage crea descarga', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  let linkCreated = false;
  const oldCreate = global.document.createElement;
  global.document.createElement = (tag) => {
    const elem = oldCreate(tag);
    if (tag === 'a') linkCreated = true;
    return elem;
  };

  chart.downloadImage('test-curve');

  runner.assert(linkCreated, 'Enlace de descarga se crea');
  global.document.createElement = oldCreate;
});

// ========================= DATOS =========================
runner.test('getData devuelve datos de gráfica', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  const data = chart.getData();

  runner.assert(data.labels !== undefined, 'Tiene labels');
  runner.assert(data.datasets !== undefined, 'Tiene datasets');
  runner.assert(data.result === result, 'Tiene resultado');
});

runner.test('getData devuelve null sin gráfica', function() {
  const chart = new CookingCurveChart('canvas-mock');

  const data = chart.getData();

  runner.assertEqual(data, null, 'Devuelve null');
});

// ========================= INFORMACIÓN DE FASES =========================
runner.test('getPhaseInfo devuelve información de fases', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  const phases = chart.getPhaseInfo();

  runner.assertEqual(phases.length, 3, 'Tiene 3 fases');
  runner.assert(phases[0].name === 'Ramp-up', 'Primera fase es Ramp-up');
  runner.assert(phases[1].name === 'STALL', 'Segunda fase es STALL');
  runner.assert(phases[2].name === 'Renderización', 'Tercera fase es Renderización');
});

runner.test('getPhaseInfo incluye datos formateados', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  const phases = chart.getPhaseInfo();

  runner.assert(phases[0].durationFormatted !== undefined, 'Tiene duración formateada');
  runner.assert(phases[0].tempRange !== undefined, 'Tiene rango de temp');
  runner.assert(phases[0].percent !== undefined, 'Tiene porcentaje');
});

runner.test('getPhaseInfo devuelve array vacío sin resultado', function() {
  const chart = new CookingCurveChart('canvas-mock');

  const phases = chart.getPhaseInfo();

  runner.assertEqual(phases.length, 0, 'Array vacío');
});

// ========================= EVENTOS =========================
runner.test('getEvents devuelve eventos del resultado', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  const events = chart.getEvents();

  runner.assert(Array.isArray(events), 'Devuelve array');
  runner.assert(events.length > 0, 'Hay eventos');
  runner.assert(events[0].at !== undefined, 'Eventos tienen propiedades');
});

// ========================= RESALTADO DE FASES =========================
runner.test('highlightPhase reduce opacidad de otras fases', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  chart.highlightPhase(1); // Resaltar fase 1 (STALL)

  runner.assert(chart.chart.data.datasets[0].opacity === 0.3, 'Otra fase oscurecida');
  runner.assert(chart.chart.data.datasets[1].opacity === 1, 'Fase resaltada brillante');
});

runner.test('resetHighlight restaura opacidad', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  chart.highlightPhase(0);
  chart.resetHighlight();

  chart.chart.data.datasets.forEach(dataset => {
    runner.assertEqual(dataset.opacity, 1, 'Opacidad restaurada a 1');
  });
});

// ========================= DESTRUCCIÓN =========================
runner.test('destroy limpia la gráfica', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  chart.destroy();

  runner.assertEqual(chart.chart, null, 'Gráfica se destruye');
  runner.assertEqual(chart.currentResult, null, 'Resultado se limpia');
});

runner.test('destroy es idempotente', function() {
  const chart = new CookingCurveChart('canvas-mock');

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
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');
  chart.update(result);

  let resizeCalled = false;
  const original = chart.chart.resize;
  chart.chart.resize = () => { resizeCalled = true; };

  chart.resize();

  runner.assert(resizeCalled, 'resize se llama en chart');
  chart.chart.resize = original;
});

// ========================= TRANSFORMACIÓN DE DATOS =========================
runner.test('transformDataForChart convierte datos correctamente', function() {
  const result = generateTestResult();
  const chart = new CookingCurveChart('canvas-mock');

  const rawData = chart.calculator.generateFromResult(result);
  const transformed = chart.transformDataForChart(rawData);

  runner.assert(transformed.labels.length > 0, 'Tiene labels');
  runner.assert(transformed.datasets.length === 3, 'Tiene 3 datasets');
  runner.assert(transformed.datasets[0].borderColor !== undefined, 'Datasets tienen colores');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
