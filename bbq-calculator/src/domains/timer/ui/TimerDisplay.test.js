/**
 * Tests for TimerDisplay - Live timer and measurement log
 * Run with: node src/viz/TimerDisplay.test.js
 * Note: These tests mock DOM APIs
 */

import TimerDisplay from './TimerDisplay.js';

// Mock DOM APIs for Node.js testing
if (typeof document === 'undefined') {
  global.document = {
    getElementById: (id) => ({
      id,
      textContent: '',
      innerHTML: '',
      children: [],
      appendChild: function(el) {
        if (!this.rows) this.rows = [];
        this.rows.push(el);
        this.children.push(el);
      },
      querySelector: (sel) => null,
      querySelectorAll: (sel) => [],
      createElement: (tag) => ({
        tagName: tag,
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        href: '',
        download: '',
        click: () => {},
        appendChild: function(el) {
          if (!this.children) this.children = [];
          this.children.push(el);
        }
      })
    }),
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      href: '',
      download: '',
      click: () => {},
      appendChild: function(el) {
        if (!this.children) this.children = [];
        this.children.push(el);
      }
    })
  };
}

// Mock URL.createObjectURL
if (typeof URL === 'undefined' || !URL.createObjectURL) {
  global.URL = {
    createObjectURL: (blob) => 'blob:mock-url'
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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para TimerDisplay\n`);

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

// ========================= INICIALIZACIÓN =========================
runner.test('Inicialización con elementos válidos', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');
  runner.assert(display.displayElement !== null, 'Display se asigna correctamente');
  runner.assert(display.logElement !== null, 'Log table se asigna correctamente');
  runner.assertEqual(display.currentTime, 0, 'Tiempo inicial es 0');
});

runner.test('Inicialización lanza error sin display', function() {
  const oldGetElement = global.document.getElementById;
  global.document.getElementById = (id) => id === 'timer-display' ? null : oldGetElement(id);

  try {
    new TimerDisplay('timer-display', 'timer-log');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no encontrado'), 'Error correcto');
  } finally {
    global.document.getElementById = oldGetElement;
  }
});

runner.test('Inicialización lanza error sin log table', function() {
  const oldGetElement = global.document.getElementById;
  global.document.getElementById = (id) => id === 'timer-log' ? null : oldGetElement(id);

  try {
    new TimerDisplay('timer-display', 'timer-log');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no encontrado'), 'Error correcto');
  } finally {
    global.document.getElementById = oldGetElement;
  }
});

// ========================= TIEMPO =========================
runner.test('formatTime convierte segundos a HH:MM:SS', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  runner.assertEqual(display.formatTime(0), '00:00:00', 'Cero segundos');
  runner.assertEqual(display.formatTime(3661), '01:01:01', '1 hora, 1 minuto, 1 segundo');
  runner.assertEqual(display.formatTime(7322), '02:02:02', '2 horas, 2 minutos, 2 segundos');
  runner.assertEqual(display.formatTime(90), '00:01:30', '90 segundos = 1 minuto 30 segundos');
});

runner.test('setTime actualiza el display', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.setTime(3661);

  runner.assertEqual(display.currentTime, 3661, 'Tiempo se almacena');
  runner.assertEqual(display.displayElement.textContent, '01:01:01', 'Display se actualiza');
});

// ========================= MEDICIONES =========================
runner.test('addMeasurement añade fila a tabla', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.setTime(300);
  display.addMeasurement(52.5, 50, 'Nota 1');

  runner.assertEqual(display.measurements.length, 1, 'Medición se almacena');
  runner.assertEqual(display.measurements[0].temp, 52.5, 'Temperatura correcta');
  runner.assertEqual(display.measurements[0].expectedTemp, 50, 'Temperatura esperada correcta');
  runner.assertEqual(display.measurements[0].note, 'Nota 1', 'Nota se almacena');
});

runner.test('addMeasurement calcula desviación', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.addMeasurement(55, 50, '');

  runner.assertEqual(display.measurements[0].deviation, 5, 'Desviación positiva');

  display.addMeasurement(45, 50, '');

  runner.assertEqual(display.measurements[1].deviation, -5, 'Desviación negativa');
});

runner.test('getMeasurements devuelve copia', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.addMeasurement(52, 50, '');
  const measurements = display.getMeasurements();

  runner.assert(Array.isArray(measurements), 'Devuelve array');
  runner.assertEqual(measurements.length, 1, 'Tiene 1 medición');
  runner.assertEqual(measurements[0].temp, 52, 'Datos correctos');
});

runner.test('getLastMeasurement devuelve la última', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.addMeasurement(52, 50, 'Primera');
  display.addMeasurement(55, 50, 'Segunda');

  const last = display.getLastMeasurement();

  runner.assertEqual(last.temp, 55, 'Última medición correcta');
  runner.assertEqual(last.note, 'Segunda', 'Nota de última medición');
});

runner.test('getLastMeasurement devuelve null sin mediciones', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  runner.assertEqual(display.getLastMeasurement(), null, 'Devuelve null');
});

// ========================= ESTADÍSTICAS =========================
runner.test('getStats devuelve estadísticas correctas', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.addMeasurement(52, 50, '');
  display.addMeasurement(51, 50, '');
  display.addMeasurement(50, 50, '');

  const stats = display.getStats();

  runner.assertEqual(stats.count, 3, 'Count correcto');
  runner.assertEqual(stats.averageDeviation, 1, 'Desviación promedio correcta');
  runner.assertEqual(stats.maxDeviation, 2, 'Max desviación correcta');
  runner.assertEqual(stats.minDeviation, 0, 'Min desviación correcta');
});

runner.test('getStats devuelve ceros sin mediciones', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  const stats = display.getStats();

  runner.assertEqual(stats.count, 0, 'Count es 0');
  runner.assertEqual(stats.averageDeviation, 0, 'Avg desviación es 0');
});

// ========================= LIMPIEZA =========================
runner.test('clear reinicia todo', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.setTime(300);
  display.addMeasurement(52, 50, '');
  display.addMeasurement(51, 50, '');

  display.clear();

  runner.assertEqual(display.currentTime, 0, 'Tiempo reiniciado');
  runner.assertEqual(display.measurements.length, 0, 'Mediciones limpias');
  runner.assertEqual(display.displayElement.textContent, '00:00:00', 'Display reiniciado');
});

// ========================= EXPORTACIÓN =========================
runner.test('exportCSV devuelve válido', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.setTime(300);
  display.addMeasurement(52.5, 50, 'Nota 1');
  display.setTime(600);
  display.addMeasurement(55, 50, 'Nota 2');

  const csv = display.exportCSV();

  runner.assert(csv.includes('Tiempo'), 'CSV contiene headers');
  runner.assert(csv.includes('52.5'), 'CSV contiene temperatura');
  runner.assert(csv.includes('Nota 1'), 'CSV contiene notas');
  runner.assert(csv.includes('00:05:00'), 'CSV contiene tiempo formateado');
});

runner.test('downloadCSV crea descarga', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  display.setTime(300);
  display.addMeasurement(52, 50, '');

  let linkCreated = false;
  const oldCreate = global.document.createElement;
  global.document.createElement = (tag) => {
    const elem = oldCreate(tag);
    if (tag === 'a') linkCreated = true;
    return elem;
  };

  display.downloadCSV('test');

  runner.assert(linkCreated, 'Enlace de descarga se crea');
  global.document.createElement = oldCreate;
});

// ========================= DESVIACIÓN Y COLORES =========================
runner.test('getDeviationColor codifica desviaciones', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  runner.assertEqual(display.getDeviationColor(50, 50), 'green', 'Sin desviación = verde');
  runner.assertEqual(display.getDeviationColor(51, 50), 'green', '±1°C = verde');
  runner.assertEqual(display.getDeviationColor(52, 50), 'orange', '±2°C = naranja');
  runner.assertEqual(display.getDeviationColor(54, 50), 'red', '±4°C = rojo');
});

runner.test('formatDeviation formatea correctamente', function() {
  const display = new TimerDisplay('timer-display', 'timer-log');

  runner.assertEqual(display.formatDeviation(52, 50), '+2.0°C', 'Positiva formateada');
  runner.assertEqual(display.formatDeviation(48, 50), '-2.0°C', 'Negativa formateada');
  runner.assertEqual(display.formatDeviation(50, 50), '+0.0°C', 'Cero formateado');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
