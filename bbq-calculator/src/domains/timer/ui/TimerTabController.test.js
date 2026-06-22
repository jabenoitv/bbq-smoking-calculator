/**
 * Tests for TimerTabController - Live timer tab coordination
 * Run with: node src/ui/TimerTabController.test.js
 */

import TimerTabController from './TimerTabController.js';

class MockSession {
  constructor() {
    this.status = 'initialized';
    this.elapsedSeconds = 0;
    this.measurements = [];
  }

  start() { this.status = 'running'; }
  pause() { this.status = 'paused'; }
  stop() { this.status = 'stopped'; }
  reset() { this.status = 'initialized'; this.measurements = []; }
  getElapsedSeconds() { return this.elapsedSeconds; }
  getProgress() { return Math.min(100, (this.elapsedSeconds / 1000) * 100); }
  addMeasurement(tempC, note) {
    const m = { tempC, expectedTemp: 50, deviation: tempC - 50, note, time: this.elapsedSeconds };
    this.measurements.push(m);
    return m;
  }
  getMeasurements() { return [...this.measurements]; }
  getLastMeasurement() { return this.measurements[this.measurements.length - 1] || null; }
  getStats() { return { count: this.measurements.length, averageDeviation: 0 }; }
  getSummary() { return { elapsedSeconds: this.elapsedSeconds, status: this.status }; }
  exportCSV() { return 'time,temp\n0,50'; }
  exportJSON() { return '{}'; }
}

class MockTimerDisplay {
  constructor() {
    this.currentTime = 0;
    this.measurements = [];
  }

  setTime(seconds) { this.currentTime = seconds; }
  addMeasurement(temp, expected, note) { this.measurements.push({ temp, expected, note }); }
  clear() { this.measurements = []; }
  setTheme(theme) { this.theme = theme; }
}

class MockTimerChart {
  constructor() {
    this.expectedData = null;
    this.measurements = [];
    this.theme = 'dark';
  }

  setExpectedCurve(data) { this.expectedData = data; }
  addMeasurement(time, temp, color) { this.measurements.push({ time, temp, color }); }
  clear() { this.measurements = []; }
  getDeviationStats() { return { count: this.measurements.length }; }
  getTheme() { return this.theme; }
  setTheme(theme) { this.theme = theme; }
  destroy() {}
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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para TimerTabController\n`);

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
runner.test('Inicialización sin componentes', function() {
  const controller = new TimerTabController();

  runner.assertEqual(controller.status, 'idle', 'Estado inicial es idle');
  runner.assertEqual(controller.session, null, 'Sin sesión inicial');
  runner.assertEqual(controller.timerDisplay, null, 'Sin display inicial');
});

runner.test('Inicialización con componentes inyectados', function() {
  const session = new MockSession();
  const display = new MockTimerDisplay();
  const chart = new MockTimerChart();

  const controller = new TimerTabController({
    session,
    timerDisplay: display,
    timerChart: chart
  });

  runner.assertEqual(controller.session, session, 'Sesión asignada');
  runner.assertEqual(controller.timerDisplay, display, 'Display asignado');
  runner.assertEqual(controller.timerChart, chart, 'Chart asignado');
});

// ========================= CONFIGURACIÓN =========================
runner.test('setSession asigna sesión', function() {
  const controller = new TimerTabController();
  const session = new MockSession();

  controller.setSession(session);

  runner.assertEqual(controller.session, session, 'Sesión configurada');
});

runner.test('setSession lanza error sin sesión válida', function() {
  const controller = new TimerTabController();

  try {
    controller.setSession(null);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('válida'), 'Error correcto');
  }
});

runner.test('setTimerDisplay asigna display', function() {
  const controller = new TimerTabController();
  const display = new MockTimerDisplay();

  controller.setTimerDisplay(display);

  runner.assertEqual(controller.timerDisplay, display, 'Display configurado');
});

runner.test('setTimerChart asigna chart', function() {
  const controller = new TimerTabController();
  const chart = new MockTimerChart();

  controller.setTimerChart(chart);

  runner.assertEqual(controller.timerChart, chart, 'Chart configurado');
});

// ========================= ESTADOS =========================
runner.test('start inicia el cronómetro', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();

  runner.assertEqual(controller.status, 'running', 'Estado es running');
  runner.assertEqual(session.status, 'running', 'Sesión iniciada');
});

runner.test('start lanza error sin sesión', function() {
  const controller = new TimerTabController();

  try {
    controller.start();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('sesión'), 'Error correcto');
  }
});

runner.test('pause pausa el cronómetro', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.pause();

  runner.assertEqual(controller.status, 'paused', 'Estado es paused');
  runner.assertEqual(session.status, 'paused', 'Sesión pausada');
});

runner.test('resume reanuda desde pausa', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.pause();
  controller.resume();

  runner.assertEqual(controller.status, 'running', 'Estado vuelve a running');
  runner.assertEqual(session.status, 'running', 'Sesión reanudada');
});

runner.test('stop detiene el cronómetro', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.stop();

  runner.assertEqual(controller.status, 'stopped', 'Estado es stopped');
  runner.assertEqual(session.status, 'stopped', 'Sesión detenida');
});

runner.test('Flujo completo: start → pause → resume → stop', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  runner.assertEqual(controller.status, 'running', 'Iniciado');

  controller.pause();
  runner.assertEqual(controller.status, 'paused', 'Pausado');

  controller.resume();
  runner.assertEqual(controller.status, 'running', 'Reanudado');

  controller.stop();
  runner.assertEqual(controller.status, 'stopped', 'Detenido');
});

// ========================= MEDICIONES =========================
runner.test('addMeasurement añade a sesión y display', function() {
  const session = new MockSession();
  const display = new MockTimerDisplay();
  const controller = new TimerTabController({ session, timerDisplay: display });

  controller.start();
  const measurement = controller.addMeasurement(52, 'nota');

  runner.assert(measurement !== null, 'Medición devuelta');
  runner.assertEqual(session.measurements.length, 1, 'Medición en sesión');
  runner.assertEqual(display.measurements.length, 1, 'Medición en display');
});

runner.test('addMeasurement lanza error si no está en ejecución', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  try {
    controller.addMeasurement(50);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('ejecución'), 'Error correcto');
  }
});

runner.test('addMeasurement valida temperatura', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();

  try {
    controller.addMeasurement(-10, '');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('válido'), 'Error correcto');
  }
});

// ========================= CONSULTAS =========================
runner.test('getStatus devuelve estado actual', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  runner.assertEqual(controller.getStatus(), 'idle', 'Idle inicial');

  controller.start();
  runner.assertEqual(controller.getStatus(), 'running', 'Running después de start');
});

runner.test('getElapsedSeconds devuelve tiempo', function() {
  const session = new MockSession();
  session.elapsedSeconds = 300;
  const controller = new TimerTabController({ session });

  runner.assertEqual(controller.getElapsedSeconds(), 300, 'Tiempo correcto');
});

runner.test('getProgress devuelve progreso', function() {
  const session = new MockSession();
  session.elapsedSeconds = 500;
  const controller = new TimerTabController({ session });

  const progress = controller.getProgress();

  runner.assert(progress >= 0, 'Progreso >= 0');
  runner.assert(progress <= 100, 'Progreso <= 100');
});

runner.test('getMeasurements devuelve mediciones', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.addMeasurement(50, 'nota 1');
  controller.addMeasurement(52, 'nota 2');

  const measurements = controller.getMeasurements();

  runner.assertEqual(measurements.length, 2, 'Dos mediciones');
});

runner.test('getLastMeasurement devuelve última', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.addMeasurement(50, 'primera');
  controller.addMeasurement(55, 'segunda');

  const last = controller.getLastMeasurement();

  runner.assertEqual(last.tempC, 55, 'Última medición correcta');
});

runner.test('getStats devuelve estadísticas', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.addMeasurement(50, '');

  const stats = controller.getStats();

  runner.assert(stats !== null, 'Stats no es null');
  runner.assert(stats.count >= 0, 'Count válido');
});

// ========================= TEMA =========================
runner.test('setTheme cambia tema en chart', function() {
  const chart = new MockTimerChart();
  const controller = new TimerTabController({ timerChart: chart });

  controller.setTheme('light');

  runner.assertEqual(chart.theme, 'light', 'Tema en chart actualizado');
});

runner.test('getTheme devuelve tema actual', function() {
  const chart = new MockTimerChart();
  const controller = new TimerTabController({ timerChart: chart });

  runner.assertEqual(controller.getTheme(), 'dark', 'Dark es default');

  controller.setTheme('light');
  runner.assertEqual(controller.getTheme(), 'light', 'Tema actualizado');
});

// ========================= GUARDAR Y RESET =========================
runner.test('saveSession guarda datos de sesión', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  controller.start();
  controller.addMeasurement(50, 'nota');

  const saved = controller.saveSession('Mi Sesión');

  runner.assert(saved !== null, 'Datos guardados');
  runner.assertEqual(saved.name, 'Mi Sesión', 'Nombre correcto');
  runner.assert(saved.csv !== undefined, 'CSV incluido');
});

runner.test('resetSession limpia todo', function() {
  const session = new MockSession();
  const display = new MockTimerDisplay();
  const chart = new MockTimerChart();
  const controller = new TimerTabController({ session, timerDisplay: display, timerChart: chart });

  controller.start();
  controller.addMeasurement(50, '');
  controller.stop();
  controller.resetSession();

  runner.assertEqual(session.status, 'initialized', 'Sesión reiniciada');
  runner.assertEqual(display.measurements.length, 0, 'Display limpios');
  runner.assertEqual(chart.measurements.length, 0, 'Chart limpios');
});

// ========================= EXPORTACIÓN =========================
runner.test('exportCSV devuelve CSV válido', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  const csv = controller.exportCSV();

  runner.assert(csv.includes('time'), 'CSV válido');
});

runner.test('exportJSON devuelve JSON válido', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  const json = controller.exportJSON();

  runner.assert(json !== null, 'JSON válido');
});

// ========================= OBSERVADORES =========================
runner.test('subscribe recibe eventos', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  let eventFired = false;
  controller.subscribe(() => { eventFired = true; });

  controller.start();

  runner.assertEqual(eventFired, true, 'Evento disparado');
});

runner.test('unsubscribe detiene eventos', function() {
  const session = new MockSession();
  const controller = new TimerTabController({ session });

  let count = 0;
  const callback = () => { count++; };

  controller.subscribe(callback);
  controller.start();
  const afterSubscribe = count;

  controller.unsubscribe(callback);
  controller.pause();

  runner.assertEqual(count, afterSubscribe, 'No hay más eventos');
});

// ========================= DESTRUCCIÓN =========================
runner.test('destroy limpia recursos', function() {
  const session = new MockSession();
  const chart = new MockTimerChart();
  const controller = new TimerTabController({ session, timerChart: chart });

  controller.start();
  controller.destroy();

  runner.assertEqual(controller.status, 'idle', 'Estado reiniciado');
  runner.assertEqual(controller.session, null, 'Sesión limpiada');
  runner.assertEqual(controller.timerChart, null, 'Chart limpios');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
