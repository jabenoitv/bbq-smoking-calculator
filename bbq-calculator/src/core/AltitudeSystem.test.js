/**
 * Tests for AltitudeSystem - Detección de altitud
 * Run with: node src/core/AltitudeSystem.test.js
 */

import AltitudeSystem from './AltitudeSystem.js';

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

  assertApprox(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(message || `Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
    }
  }

  async run() {
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para AltitudeSystem\n`);

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
runner.test('Inicialización correcta', function() {
  const system = new AltitudeSystem();
  runner.assertEqual(system.getAltitude(), 0, 'Altitud inicial es 0');
  runner.assertEqual(system.isDetected(), false, 'No detectada inicialmente');
});

// ========================= CÁLCULO DE AJUSTE =========================
runner.test('Cálculo de factor de ajuste', function() {
  const system = new AltitudeSystem();

  const factor0 = system.calculateAdjustment(0);
  runner.assertEqual(factor0, 1.0, '0m = 1.0x (sin ajuste)');

  const factor1000 = system.calculateAdjustment(1000);
  runner.assertApprox(factor1000, 1.08, 0.001, '1000m = 1.08x (+8%)');

  const factor2000 = system.calculateAdjustment(2000);
  runner.assertApprox(factor2000, 1.16, 0.001, '2000m = 1.16x (+16%)');

  const factor1850 = system.calculateAdjustment(1850);
  runner.assertApprox(factor1850, 1.148, 0.001, '1850m = 1.148x');
});

// ========================= ALTITUD MANUAL =========================
runner.test('Establecer altitud manualmente', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(1850);

  runner.assertEqual(system.getAltitude(), 1850, 'Altitud se establece correctamente');
  runner.assertEqual(system.isDetected(), true, 'Marca como detectada');
});

runner.test('Altitud manual rechaza valores negativos', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(-100);

  runner.assertEqual(system.getAltitude(), 0, 'Valores negativos se convierten a 0');
});

// ========================= INFORMACIÓN DE UBICACIÓN =========================
runner.test('Información de ubicación sin detectar', function() {
  const system = new AltitudeSystem();
  const location = system.getLocation();

  runner.assertEqual(location, null, 'Devuelve null sin detección');
});

runner.test('Información de ubicación con altitud manual', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(1500);

  const location = system.getLocation();
  runner.assert(location !== null, 'Devuelve ubicación');
  runner.assertEqual(location.altitude, 1500, 'Altitud correcta');
  runner.assertApprox(
    location.adjustmentFactor,
    1.12,
    0.01,
    'Factor de ajuste correcto'
  );
});

// ========================= FORMATO =========================
runner.test('Formato de altitud sin detectar', function() {
  const system = new AltitudeSystem();
  const formatted = system.formatAltitude();

  runner.assertEqual(formatted, 'No detectada', 'Formato sin detección');
});

runner.test('Formato de altitud detectada', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(1000);
  const formatted = system.formatAltitude();

  runner.assert(
    formatted.includes('1000m'),
    'Incluye altitud en metros'
  );
  runner.assert(
    formatted.includes('1.08'),
    'Incluye factor de ajuste'
  );
});

// ========================= EVENTOS =========================
runner.test('Eventos EventEmitter funcionan', function() {
  const system = new AltitudeSystem();
  let eventFired = false;
  let eventData = null;

  system.on('altitude-manual-set', (data) => {
    eventFired = true;
    eventData = data;
  });

  system.setAltitudeManual(2000);

  runner.assertEqual(eventFired, true, 'Evento se disparó');
  runner.assertEqual(eventData.altitude, 2000, 'Datos del evento correctos');
});

runner.test('Evento de reset', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(1500);

  let resetFired = false;
  system.on('altitude-reset', () => {
    resetFired = true;
  });

  system.reset();

  runner.assertEqual(resetFired, true, 'Evento reset se disparó');
  runner.assertEqual(system.getAltitude(), 0, 'Altitud se resetea');
  runner.assertEqual(system.isDetected(), false, 'Marca como no detectada');
});

// ========================= GETADJUSTMENTFACTOR (ALIAS) =========================
runner.test('getAdjustmentFactor como alias', function() {
  const system = new AltitudeSystem();
  system.setAltitudeManual(1000);

  const factor1 = system.getAdjustmentFactor();
  const factor2 = system.calculateAdjustment(1000);

  runner.assertApprox(factor1, factor2, 0.001, 'getAdjustmentFactor es alias');
});

runner.test('getAdjustmentFactor con parámetro', function() {
  const system = new AltitudeSystem();

  const factor = system.getAdjustmentFactor(2000);
  runner.assertApprox(factor, 1.16, 0.001, 'Acepta parámetro altitud');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
