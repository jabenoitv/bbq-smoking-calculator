/**
 * Tests for ResultsDisplay - Results visualization
 * Run with: node src/ui/ResultsDisplay.test.js
 */

// Mock DOM APIs for Node.js testing
if (typeof document === 'undefined') {
  global.document = {
    getElementById: (id) => {
      return {
        id,
        innerHTML: '',
        textContent: '',
        children: [],
        appendChild: function(el) {
          this.children.push(el);
          // Track content in innerHTML
          if (el.innerHTML) {
            this.innerHTML += el.innerHTML;
          }
          if (el.textContent) {
            this.innerHTML += el.textContent;
          }
        }
      };
    },
    createElement: (tag) => {
      const element = {
        tagName: tag,
        className: '',
        innerHTML: '',
        textContent: '',
        children: [],
        appendChild: function(el) {
          this.children.push(el);
          if (el.innerHTML) {
            this.innerHTML += el.innerHTML;
          }
          if (el.textContent) {
            this.innerHTML += el.textContent;
          }
        }
      };
      return element;
    }
  };
}

import ResultsDisplay from './ResultsDisplay.js';

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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para ResultsDisplay\n`);

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
function generateMockResult() {
  return {
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 107,
    desiredRedTempC: 63,
    estimatedCookingHours: 4,
    estimatedCookingMinutes: 270,
    holdingMin: 60,
    wrapped: false,
    altitudeM: 0,
    temperatureRange: [25, 100],
    phases: [
      { name: 'Ramp-up', duration: 120, tempRange: [25, 62], percent: 25 },
      { name: 'STALL', duration: 120, tempRange: [62, 68], percent: 50 },
      { name: 'Renderización', duration: 30, tempRange: [68, 63], percent: 25 }
    ],
    events: [
      { at: 120, name: 'Envuelve la carne', reason: 'Acelera cocción' },
      { at: 240, name: 'Saca para prueba', reason: 'Verifica tenderness' }
    ],
    formula: {
      meatType: 'tapapecho',
      weightKg: 4.5,
      smokingTempC: 107,
      cookingRatio: 1.5,
      altitudeM: 0,
      altitudeFactor: 1.0
    }
  };
}

// ========================= INICIALIZACIÓN =========================
runner.test('Inicialización con contenedor válido', function() {
  const display = new ResultsDisplay('results');
  runner.assert(display.container !== null, 'Contenedor se asigna');
  runner.assertEqual(display.containerId, 'results', 'ID se guarda');
});

runner.test('Inicialización lanza error sin contenedor', function() {
  const oldGetElement = global.document.getElementById;
  global.document.getElementById = () => null;

  try {
    new ResultsDisplay('inexistent');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no encontrado'), 'Error correcto');
  } finally {
    global.document.getElementById = oldGetElement;
  }
});

// ========================= FORMATO =========================
runner.test('formatDuration convierte minutos correctamente', function() {
  const display = new ResultsDisplay('results');

  runner.assertEqual(display.formatDuration(0), '0m', 'Cero minutos');
  runner.assertEqual(display.formatDuration(30), '30m', 'Minutos solamente');
  runner.assertEqual(display.formatDuration(60), '1h', 'Una hora');
  runner.assertEqual(display.formatDuration(90), '1h 30m', 'Hora y minutos');
  runner.assertEqual(display.formatDuration(270), '4h 30m', 'Múltiples horas');
});

// ========================= VISUALIZACIÓN =========================
runner.test('display muestra resultado completo', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);

  runner.assert(display.currentResult === result, 'Resultado se almacena');
  runner.assert(display.container.innerHTML !== '', 'Contenedor tiene contenido');
});

runner.test('display lanza error sin resultado', function() {
  const display = new ResultsDisplay('results');

  try {
    display.display(null);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('requiere'), 'Error correcto');
  }
});

runner.test('display crea cards y secciones', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);

  runner.assert(display.container.innerHTML.includes('Tiempo Total'), 'Card de tiempo presente');
  runner.assert(display.container.innerHTML.includes('Temperaturas'), 'Card de temperatura presente');
  runner.assert(display.container.innerHTML.includes('Desglose de Fases'), 'Sección de fases presente');
});

runner.test('display muestra eventos si existen', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);

  runner.assert(display.container.innerHTML.includes('Eventos'), 'Sección de eventos presente');
  runner.assert(display.container.innerHTML.includes('Envuelve la carne'), 'Evento específico presente');
});

runner.test('display muestra fórmula si existe', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);

  runner.assert(display.container.innerHTML.includes('Fórmula'), 'Sección de fórmula presente');
  runner.assert(display.container.innerHTML.includes('1.5'), 'Ratio de cocción presente');
});

// ========================= ESTADO =========================
runner.test('getCurrentResult devuelve resultado actual', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);
  const retrieved = display.getCurrentResult();

  runner.assertEqual(retrieved.meatType, 'tapapecho', 'Resultado correcto');
});

runner.test('getCurrentResult devuelve null sin resultado', function() {
  const display = new ResultsDisplay('results');

  runner.assertEqual(display.getCurrentResult(), null, 'Devuelve null');
});

// ========================= LIMPIEZA =========================
runner.test('clearDisplay limpia visualización', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);
  display.clearDisplay();

  runner.assertEqual(display.container.innerHTML, '', 'Contenedor limpio');
  runner.assertEqual(display.currentResult, null, 'Resultado limpio');
});

// ========================= EXPORTACIÓN =========================
runner.test('exportJSON devuelve JSON válido', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);
  const json = display.exportJSON();
  const data = JSON.parse(json);

  runner.assertEqual(data.meatType, 'tapapecho', 'JSON válido');
  runner.assertEqual(data.estimatedCookingMinutes, 270, 'Datos correctos');
});

runner.test('exportJSON lanza error sin resultado', function() {
  const display = new ResultsDisplay('results');

  try {
    display.exportJSON();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('No hay resultado'), 'Error correcto');
  }
});

runner.test('exportHTML devuelve HTML válido', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();

  display.display(result);
  const html = display.exportHTML();

  runner.assert(html.includes('<!DOCTYPE html>'), 'HTML válido');
  runner.assert(html.includes('Resultado de Cálculo BBQ'), 'Título presente');
  runner.assert(html.includes('4h 30m') || html.includes('270'), 'Datos presentes');
});

runner.test('exportHTML lanza error sin resultado', function() {
  const display = new ResultsDisplay('results');

  try {
    display.exportHTML();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('No hay resultado'), 'Error correcto');
  }
});

// ========================= CASOS ESPECIALES =========================
runner.test('display sin eventos no muestra sección', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();
  result.events = [];

  display.display(result);

  runner.assert(!display.container.innerHTML.includes('Eventos Importantes'), 'Sección omitida');
});

runner.test('display sin fórmula no muestra sección', function() {
  const display = new ResultsDisplay('results');
  const result = generateMockResult();
  result.formula = null;

  display.display(result);

  runner.assert(!display.container.innerHTML.includes('Fórmula'), 'Sección omitida');
});

runner.test('display múltiples veces limpia contenedor anterior', function() {
  const display = new ResultsDisplay('results');
  const result1 = generateMockResult();
  const result2 = { ...generateMockResult(), meatType: 'pollo_entero' };

  display.display(result1);
  const firstCount = display.container.innerHTML.length;

  display.display(result2);
  const secondCount = display.container.innerHTML.length;

  runner.assertEqual(display.currentResult.meatType, 'pollo_entero', 'Segundo resultado activo');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
