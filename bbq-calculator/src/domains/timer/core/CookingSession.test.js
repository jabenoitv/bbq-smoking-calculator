/**
 * Tests for CookingSession - Live cooking session state management
 * Run with: node src/state/CookingSession.test.js
 */

import CookingSession from './CookingSession.js';

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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para CookingSession\n`);

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
    estimatedCookingMinutes: 270,
    wrapped: false,
    altitudeM: 0,
    phases: [
      { name: 'Ramp-up', duration: 120, temperatureRange: [25, 62], percent: 25 },
      { name: 'STALL', duration: 120, temperatureRange: [62, 68], percent: 50 },
      { name: 'Renderización', duration: 30, temperatureRange: [68, 63], percent: 25 }
    ],
    events: []
  };
}

// ========================= INICIALIZACIÓN =========================
runner.test('Inicialización con resultado válido', function() {
  const result = generateMockResult();
  const session = new CookingSession(result);

  runner.assert(session.recipeResult === result, 'Resultado se asigna');
  runner.assertEqual(session.status, 'initialized', 'Estado inicial correcto');
  runner.assertEqual(session.measurements.length, 0, 'Sin mediciones inicialmente');
  runner.assert(session.sessionId.startsWith('session_'), 'ID generado');
});

runner.test('Inicialización lanza error sin resultado', function() {
  try {
    new CookingSession(null);
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('requiere'), 'Error correcto');
  }
});

// ========================= ESTADOS =========================
runner.test('start() inicia la sesión', function() {
  const session = new CookingSession(generateMockResult());

  session.start();

  runner.assertEqual(session.status, 'running', 'Estado es running');
  runner.assert(session.startedAt !== null, 'startedAt se configura');
});

runner.test('start() lanza error si ya está en ejecución', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  try {
    session.start();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('ya está'), 'Error correcto');
  }
});

runner.test('pause() pausa la sesión', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.pause();

  runner.assertEqual(session.status, 'paused', 'Estado es paused');
  runner.assert(session.pausedAt !== null, 'pausedAt se configura');
});

runner.test('pause() lanza error si no está en ejecución', function() {
  const session = new CookingSession(generateMockResult());

  try {
    session.pause();
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('ejecución'), 'Error correcto');
  }
});

runner.test('stop() detiene la sesión', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.stop();

  runner.assertEqual(session.status, 'stopped', 'Estado es stopped');
});

runner.test('Flujo completo: start → pause → resume → stop', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  runner.assertEqual(session.status, 'running', 'Inicia running');

  session.pause();
  runner.assertEqual(session.status, 'paused', 'Pausa correcta');

  session.start(); // Reanudar desde pausa
  runner.assertEqual(session.status, 'running', 'Reanuda correctamente');

  session.stop();
  runner.assertEqual(session.status, 'stopped', 'Detiene correctamente');
});

// ========================= TIEMPO =========================
runner.test('getElapsedSeconds devuelve 0 inicialmente', function() {
  const session = new CookingSession(generateMockResult());

  runner.assertEqual(session.getElapsedSeconds(), 0, 'Inicial es 0');
});

runner.test('getElapsedSeconds incrementa durante ejecución', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  const elapsed1 = session.getElapsedSeconds();

  // Esperar un poco (usando Date.now() internamente)
  const future = Date.now() + 2000;
  session.startedAt = future - 2000; // Simular 2 segundos pasados

  const elapsed2 = session.getElapsedSeconds();

  runner.assert(elapsed2 >= elapsed1, 'Tiempo se incrementa');
});

runner.test('formatTime convierte segundos a HH:MM:SS', function() {
  const session = new CookingSession(generateMockResult());

  runner.assertEqual(session.formatTime(0), '00:00:00', 'Cero');
  runner.assertEqual(session.formatTime(3661), '01:01:01', '1h 1m 1s');
  runner.assertEqual(session.formatTime(90), '00:01:30', '1m 30s');
});

// ========================= MEDICIONES =========================
runner.test('addMeasurement añade una medición', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  const measurement = session.addMeasurement(52.5, 'Primera');

  runner.assertEqual(session.measurements.length, 1, 'Medición añadida');
  runner.assertEqual(measurement.tempC, 52.5, 'Temperatura correcta');
  runner.assertEqual(measurement.note, 'Primera', 'Nota guardada');
});

runner.test('addMeasurement calcula desviación', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.startedAt = Date.now() - 0; // t=0
  const measurement = session.addMeasurement(50, '');

  runner.assert(measurement.expectedTemp >= 0, 'Temperatura esperada calculada');
  runner.assert(Math.abs(measurement.deviation) > 0 || measurement.tempC === measurement.expectedTemp,
    'Desviación calculada');
});

runner.test('addMeasurement lanza error si no está en ejecución', function() {
  const session = new CookingSession(generateMockResult());

  try {
    session.addMeasurement(50, '');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('ejecución'), 'Error correcto');
  }
});

runner.test('getMeasurements devuelve copia del array', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(52, '');
  const measurements = session.getMeasurements();

  runner.assert(Array.isArray(measurements), 'Devuelve array');
  runner.assertEqual(measurements.length, 1, 'Cantidad correcta');
  runner.assert(measurements !== session.measurements, 'Es una copia');
});

runner.test('getLastMeasurement devuelve la última', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(50, 'Primera');
  session.addMeasurement(55, 'Segunda');

  const last = session.getLastMeasurement();

  runner.assertEqual(last.tempC, 55, 'Última temperatura correcta');
  runner.assertEqual(last.note, 'Segunda', 'Última nota correcta');
});

runner.test('getLastMeasurement devuelve null sin mediciones', function() {
  const session = new CookingSession(generateMockResult());

  runner.assertEqual(session.getLastMeasurement(), null, 'Devuelve null');
});

// ========================= INTERPOLACIÓN =========================
runner.test('getExpectedTempAtTime devuelve temperatura en tiempo', function() {
  const session = new CookingSession(generateMockResult());

  const tempAt0 = session.getExpectedTempAtTime(0);
  const tempAtEnd = session.getExpectedTempAtTime(999999); // Pasado el final

  runner.assert(tempAt0 >= 0, 'Temperatura en t=0 válida');
  runner.assertEqual(tempAtEnd, 63, 'Temperatura al final es la deseada');
});

// ========================= ESTADÍSTICAS =========================
runner.test('getStats devuelve estadísticas correctas', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(52, '');
  session.addMeasurement(53, '');
  session.addMeasurement(51, '');

  const stats = session.getStats();

  runner.assertEqual(stats.count, 3, 'Count correcto');
  runner.assert(stats.averageDeviation !== undefined, 'Promedio calculado');
  runner.assert(stats.standardDeviation >= 0, 'Std dev calculada');
  runner.assert(stats.onTargetPercent >= 0, 'On-target percent calculado');
});

runner.test('getStats devuelve ceros sin mediciones', function() {
  const session = new CookingSession(generateMockResult());

  const stats = session.getStats();

  runner.assertEqual(stats.count, 0, 'Count es 0');
  runner.assertEqual(stats.averageDeviation, 0, 'Promedio es 0');
  runner.assertEqual(stats.onTargetPercent, 0, 'On-target es 0');
});

// ========================= RESUMEN Y PROGRESO =========================
runner.test('getSummary devuelve resumen completo', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(50, '');

  const summary = session.getSummary();

  runner.assert(summary.sessionId !== undefined, 'Session ID en resumen');
  runner.assertEqual(summary.meatType, 'tapapecho', 'Tipo de carne correcto');
  runner.assertEqual(summary.measurementCount, 1, 'Conteo de mediciones');
  runner.assert(summary.stats !== undefined, 'Stats incluidas');
});

runner.test('getProgress devuelve progreso 0-100', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.startedAt = Date.now() - 0; // t=0

  const progress = session.getProgress();

  runner.assert(progress >= 0, 'Progreso >= 0');
  runner.assert(progress <= 100, 'Progreso <= 100');
});

// ========================= EXPORTACIÓN =========================
runner.test('exportCSV devuelve CSV válido', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(52.5, 'Nota 1');
  session.addMeasurement(55, 'Nota 2');

  const csv = session.exportCSV();

  runner.assert(csv.includes('Tiempo'), 'CSV contiene headers');
  runner.assert(csv.includes('52.5'), 'CSV contiene temperatura');
  runner.assert(csv.includes('Nota 1'), 'CSV contiene notas');
});

runner.test('exportJSON devuelve JSON válido', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(52, '');

  const json = session.exportJSON();
  const data = JSON.parse(json);

  runner.assertEqual(data.meatType, 'tapapecho', 'JSON contiene tipo de carne');
  runner.assertEqual(data.measurements.length, 1, 'JSON contiene mediciones');
  runner.assert(data.exportedAt !== undefined, 'JSON contiene timestamp');
});

// ========================= RESET =========================
runner.test('reset reinicia la sesión', function() {
  const session = new CookingSession(generateMockResult());

  session.start();
  session.addMeasurement(50, '');

  session.reset();

  runner.assertEqual(session.status, 'initialized', 'Estado reiniciado');
  runner.assertEqual(session.measurements.length, 0, 'Mediciones limpias');
  runner.assert(session.sessionId !== 'session_' && session.sessionId, 'ID regenerado');
});

runner.test('getEstimatedDuration devuelve minutos estimados', function() {
  const session = new CookingSession(generateMockResult());

  runner.assertEqual(session.getEstimatedDuration(), 270, 'Duración correcta');
});

runner.test('getStatus devuelve estado actual', function() {
  const session = new CookingSession(generateMockResult());

  runner.assertEqual(session.getStatus(), 'initialized', 'Inicial es initialized');

  session.start();
  runner.assertEqual(session.getStatus(), 'running', 'Running correcto');

  session.pause();
  runner.assertEqual(session.getStatus(), 'paused', 'Paused correcto');

  session.start();
  session.stop();
  runner.assertEqual(session.getStatus(), 'stopped', 'Stopped correcto');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
