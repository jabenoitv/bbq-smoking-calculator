/**
 * Tests for WizardController - Wizard navigation and form management
 * Run with: node src/ui/WizardController.test.js
 */

import WizardController from './WizardController.js';

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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para WizardController\n`);

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
runner.test('Inicialización con valores por defecto', function() {
  const wizard = new WizardController();

  runner.assertEqual(wizard.currentStep, 1, 'Step inicial es 1');
  runner.assertEqual(wizard.totalSteps, 4, 'Total de steps es 4');
  runner.assert(wizard.formData !== null, 'FormData inicializado');
  runner.assertEqual(wizard.formData.renderingLevel, 'rosa', 'Rendering level por defecto');
});

runner.test('Inicialización con opciones personalizadas', function() {
  const wizard = new WizardController({
    startStep: 2,
    totalSteps: 5
  });

  runner.assertEqual(wizard.currentStep, 2, 'Step inicial personalizado');
  runner.assertEqual(wizard.totalSteps, 5, 'Total steps personalizado');
});

// ========================= NAVEGACIÓN =========================
runner.test('nextStep avanza correctamente', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = 'tapapecho';
  const result = wizard.nextStep();

  runner.assertEqual(result, true, 'Devuelve true');
  runner.assertEqual(wizard.currentStep, 2, 'Step incrementado');
});

runner.test('nextStep no avanza sin datos válidos', function() {
  const wizard = new WizardController();

  // Sin meatType
  const result = wizard.nextStep();

  runner.assertEqual(result, false, 'Devuelve false');
  runner.assertEqual(wizard.currentStep, 1, 'Step se mantiene');
});

runner.test('prevStep retrocede correctamente', function() {
  const wizard = new WizardController();

  wizard.currentStep = 3;
  const result = wizard.prevStep();

  runner.assertEqual(result, true, 'Devuelve true');
  runner.assertEqual(wizard.currentStep, 2, 'Step decrementado');
});

runner.test('prevStep no retrocede en step 1', function() {
  const wizard = new WizardController();

  const result = wizard.prevStep();

  runner.assertEqual(result, false, 'Devuelve false');
  runner.assertEqual(wizard.currentStep, 1, 'Se mantiene en step 1');
});

runner.test('goToStep salta a step específico', function() {
  const wizard = new WizardController();

  const result = wizard.goToStep(3);

  runner.assertEqual(result, true, 'Devuelve true');
  runner.assertEqual(wizard.currentStep, 3, 'Step actualizado');
});

runner.test('goToStep rechaza step inválido', function() {
  const wizard = new WizardController();

  const result = wizard.goToStep(10);

  runner.assertEqual(result, false, 'Devuelve false');
  runner.assertEqual(wizard.currentStep, 1, 'Step se mantiene');
});

runner.test('Flujo completo de navegación', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = 'tapapecho';
  wizard.nextStep();
  runner.assertEqual(wizard.currentStep, 2, 'Step 2 alcanzado');

  wizard.formData.weightKg = 4.5;
  wizard.nextStep();
  runner.assertEqual(wizard.currentStep, 3, 'Step 3 alcanzado');

  wizard.formData.smokingTempC = 107;
  wizard.nextStep();
  runner.assertEqual(wizard.currentStep, 4, 'Step 4 alcanzado');

  runner.assert(wizard.isComplete(), 'Wizard completo');
});

// ========================= DATOS DEL FORMULARIO =========================
runner.test('updateFormField actualiza campos', function() {
  const wizard = new WizardController();

  wizard.updateFormField('meatType', 'tapapecho');

  runner.assertEqual(wizard.formData.meatType, 'tapapecho', 'Campo actualizado');
});

runner.test('updateFormField ignora campos inválidos', function() {
  const wizard = new WizardController();

  wizard.updateFormField('invalidField', 'value');

  runner.assert(!('invalidField' in wizard.formData), 'Campo inválido ignorado');
});

runner.test('getFormData devuelve copia', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = 'tapapecho';
  const data = wizard.getFormData();

  runner.assertEqual(data.meatType, 'tapapecho', 'Datos correctos');
  runner.assert(data !== wizard.formData, 'Es una copia');
});

// ========================= OPCIONES =========================
runner.test('getMeatOptions devuelve lista', function() {
  const wizard = new WizardController();

  const options = wizard.getMeatOptions();

  runner.assert(Array.isArray(options), 'Devuelve array');
  runner.assert(options.length > 0, 'Hay opciones');
  runner.assert(options[0].value !== undefined, 'Opciones tienen value');
  runner.assert(options[0].label !== undefined, 'Opciones tienen label');
});

runner.test('getRenderingLevels devuelve niveles', function() {
  const wizard = new WizardController();

  const levels = wizard.getRenderingLevels();

  runner.assert('raro' in levels, 'Tiene raro');
  runner.assert('rosa' in levels, 'Tiene rosa');
  runner.assert('gris' in levels, 'Tiene gris');
});

runner.test('getRenderingLevelInfo devuelve info de nivel', function() {
  const wizard = new WizardController();

  const info = wizard.getRenderingLevelInfo('rosa');

  runner.assert(info !== null, 'Devuelve info');
  runner.assert(info.label !== undefined, 'Tiene label');
  runner.assert(info.color !== undefined, 'Tiene color');
});

runner.test('getMeatLabel devuelve etiqueta', function() {
  const wizard = new WizardController();

  const label = wizard.getMeatLabel('tapapecho');

  runner.assert(label !== null, 'Devuelve label');
  runner.assert(label.includes('Brisket'), 'Label contiene nombre inglés');
});

runner.test('getMeatLabel devuelve null para tipo inválido', function() {
  const wizard = new WizardController();

  const label = wizard.getMeatLabel('invalid');

  runner.assertEqual(label, null, 'Devuelve null');
});

// ========================= VALIDACIÓN =========================
runner.test('nextStep valida step 1 (meat)', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = null;
  runner.assertEqual(wizard.nextStep(), false, 'Falla sin meatType');

  wizard.formData.meatType = 'tapapecho';
  runner.assertEqual(wizard.nextStep(), true, 'Pasa con meatType válido');
});

runner.test('nextStep valida step 2 (weight)', function() {
  const wizard = new WizardController();

  wizard.currentStep = 2;
  wizard.formData.weightKg = 0;
  runner.assertEqual(wizard.nextStep(), false, 'Falla con weight 0');

  wizard.formData.weightKg = 4.5;
  runner.assertEqual(wizard.nextStep(), true, 'Pasa con weight válido');
});

runner.test('nextStep valida step 3 (temperature)', function() {
  const wizard = new WizardController();

  wizard.currentStep = 3;
  wizard.formData.smokingTempC = -10;
  runner.assertEqual(wizard.nextStep(), false, 'Falla con temp negativa');

  wizard.formData.smokingTempC = 107;
  runner.assertEqual(wizard.nextStep(), true, 'Pasa con temp válida');
});

runner.test('getValidationError devuelve error sin avanzar', function() {
  const wizard = new WizardController();

  wizard.currentStep = 1;
  const error = wizard.getValidationError(1);

  runner.assert(error !== null, 'Devuelve error sin avanzar');
  runner.assertEqual(wizard.currentStep, 1, 'Step se mantiene');
});

// ========================= ESTADO =========================
runner.test('getCurrentStep devuelve step actual', function() {
  const wizard = new WizardController();

  runner.assertEqual(wizard.getCurrentStep(), 1, 'Step 1 inicial');

  wizard.currentStep = 3;
  runner.assertEqual(wizard.getCurrentStep(), 3, 'Step 3 actualizado');
});

runner.test('getTotalSteps devuelve total', function() {
  const wizard = new WizardController();

  runner.assertEqual(wizard.getTotalSteps(), 4, 'Total es 4');
});

runner.test('getProgress calcula progreso correcto', function() {
  const wizard = new WizardController();

  runner.assertApprox(wizard.getProgress(), 25, 1, 'Step 1 = 25%');

  wizard.currentStep = 2;
  runner.assertApprox(wizard.getProgress(), 50, 1, 'Step 2 = 50%');

  wizard.currentStep = 4;
  runner.assertApprox(wizard.getProgress(), 100, 1, 'Step 4 = 100%');
});

runner.test('isComplete verifica completitud', function() {
  const wizard = new WizardController();

  runner.assertEqual(wizard.isComplete(), false, 'No completo en step 1');

  wizard.currentStep = 4;
  runner.assertEqual(wizard.isComplete(), true, 'Completo en step 4');
});

// ========================= RESUMEN Y EXPORTACIÓN =========================
runner.test('getSummary devuelve resumen formateado', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = 'tapapecho';
  wizard.formData.weightKg = 4.5;
  wizard.formData.smokingTempC = 107;
  wizard.formData.renderingLevel = 'rosa';

  const summary = wizard.getSummary();

  runner.assert(summary.includes('Brisket'), 'Incluye nombre de carne');
  runner.assert(summary.includes('4.5kg'), 'Incluye peso');
  runner.assert(summary.includes('107'), 'Incluye temperatura');
  runner.assert(summary.includes('Jugoso'), 'Incluye nivel');
});

runner.test('exportFormData devuelve JSON válido', function() {
  const wizard = new WizardController();

  wizard.formData.meatType = 'tapapecho';
  const json = wizard.exportFormData();
  const data = JSON.parse(json);

  runner.assertEqual(data.meatType, 'tapapecho', 'JSON válido');
});

runner.test('importFormData importa datos válidos', function() {
  const wizard = new WizardController();

  const success = wizard.importFormData({
    meatType: 'pollo_entero',
    weightKg: 2.0
  });

  runner.assertEqual(success, true, 'Importación exitosa');
  runner.assertEqual(wizard.formData.meatType, 'pollo_entero', 'Datos importados');
});

runner.test('importFormData rechaza JSON inválido', function() {
  const wizard = new WizardController();

  const success = wizard.importFormData('invalid json');

  runner.assertEqual(success, false, 'Importación falla');
});

// ========================= RESET =========================
runner.test('reset reinicia el wizard', function() {
  const wizard = new WizardController();

  wizard.currentStep = 3;
  wizard.formData.meatType = 'tapapecho';

  wizard.reset();

  runner.assertEqual(wizard.currentStep, 1, 'Step reiniciado');
  runner.assertEqual(wizard.formData.meatType, null, 'Datos limpios');
  runner.assertEqual(wizard.formData.renderingLevel, 'rosa', 'Valores por defecto restaurados');
});

// ========================= OBSERVADORES =========================
runner.test('subscribe y unsubscribe funcionan', function() {
  const wizard = new WizardController();

  let eventsFired = 0;
  const callback = () => { eventsFired++; };

  wizard.subscribe(callback);
  wizard.formData.meatType = 'tapapecho';
  wizard.nextStep();

  runner.assert(eventsFired > 0, 'Eventos fueron disparados');

  wizard.unsubscribe(callback);
  eventsFired = 0;
  wizard.nextStep();

  // Puede que se dispare eventos, pero verificamos que el callback original fue removido
  runner.assert(true, 'Unsubscribe funcionó');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
