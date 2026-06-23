/**
 * Tests for Shared Domain - Validator, TabController, Notifications
 * Run with: node src/domains/shared/shared.test.js
 */

import Validator from './Validator.js';
import TabController from './TabController.js';
import Notifications from './Notifications.js';

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('📋 Ejecutando tests para Shared Domain\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Resultados: ${this.passed} pasados, ${this.failed} fallidos`);
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

const runner = new TestRunner();

// ========== VALIDATOR TESTS (28+) ==========

runner.test('Validator: Validar parámetros BBQ correctos', () => {
  const result = Validator.validateBBQParams({
    meatType: 'brisket',
    weight: 3,
    temp: 110
  });
  if (!result.isValid) throw new Error('Should be valid');
  if (result.errors.length > 0) throw new Error('Should have no errors');
});

runner.test('Validator: Rechazar meatType faltante', () => {
  const result = Validator.validateBBQParams({
    weight: 3,
    temp: 110
  });
  if (result.isValid) throw new Error('Should be invalid');
  if (!result.errors.some(e => e.includes('meatType'))) throw new Error('Should error on meatType');
});

runner.test('Validator: Rechazar weight inválido', () => {
  const result = Validator.validateBBQParams({
    meatType: 'brisket',
    weight: -1,
    temp: 110
  });
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Advertencia para weight fuera de rango', () => {
  const result = Validator.validateBBQParams({
    meatType: 'brisket',
    weight: 100,
    temp: 110
  });
  if (result.warnings.length === 0) throw new Error('Should have warning');
});

runner.test('Validator: Validar parámetros cura correctos', () => {
  const result = Validator.validateCureParams({
    cureType: 'bacon',
    weightKg: 2,
    thickness: 3
  });
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Rechazar cureType faltante', () => {
  const result = Validator.validateCureParams({
    weightKg: 2,
    thickness: 3
  });
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Rechazar thickness inválido', () => {
  const result = Validator.validateCureParams({
    cureType: 'bacon',
    weightKg: 2,
    thickness: 0
  });
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Advertencia para thickness fuera de rango', () => {
  const result = Validator.validateCureParams({
    cureType: 'bacon',
    weightKg: 2,
    thickness: 50
  });
  if (result.warnings.length === 0) throw new Error('Should have warning');
});

runner.test('Validator: Validar resultado BBQ correcto', () => {
  const result = Validator.validateBBQResult({
    totalMinutes: 240,
    internalTempC: 63,
    phases: ['ramp-up', 'stall', 'push']
  });
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Rechazar totalMinutes negativo', () => {
  const result = Validator.validateBBQResult({
    totalMinutes: -1,
    internalTempC: 63,
    phases: []
  });
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Advertencia para totalMinutes > 24 horas', () => {
  const result = Validator.validateBBQResult({
    totalMinutes: 1500,
    internalTempC: 63,
    phases: []
  });
  if (result.warnings.length === 0) throw new Error('Should have warning');
});

runner.test('Validator: Validar temperatura válida', () => {
  const result = Validator.validateTemperature(25);
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Rechazar temperatura bajo cero absoluto', () => {
  const result = Validator.validateTemperature(-300);
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Advertencia para temperatura > 1000°C', () => {
  const result = Validator.validateTemperature(1500);
  if (result.warnings.length === 0) throw new Error('Should have warning');
});

runner.test('Validator: Validar peso válido', () => {
  const result = Validator.validateWeight(5);
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Rechazar peso negativo', () => {
  const result = Validator.validateWeight(-1);
  if (result.isValid) throw new Error('Should be invalid');
});

runner.test('Validator: Validar email correcto', () => {
  if (!Validator.validateEmail('test@example.com')) throw new Error('Should be valid');
});

runner.test('Validator: Rechazar email inválido', () => {
  if (Validator.validateEmail('invalid-email')) throw new Error('Should be invalid');
});

runner.test('Validator: Validar propiedades requeridas presentes', () => {
  const result = Validator.validateRequired(
    { name: 'test', value: 1 },
    ['name', 'value']
  );
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Detectar propiedades requeridas faltantes', () => {
  const result = Validator.validateRequired(
    { name: 'test' },
    ['name', 'value']
  );
  if (result.isValid) throw new Error('Should be invalid');
  if (result.missingProps.length !== 1) throw new Error('Should have 1 missing');
});

runner.test('Validator: Validar propiedades numéricas correctas', () => {
  const result = Validator.validateNumeric(
    { x: 1, y: 2 },
    ['x', 'y']
  );
  if (!result.isValid) throw new Error('Should be valid');
});

runner.test('Validator: Detectar propiedades numéricas inválidas', () => {
  const result = Validator.validateNumeric(
    { x: 'string', y: 2 },
    ['x', 'y']
  );
  if (result.isValid) throw new Error('Should be invalid');
  if (result.invalidProps.length !== 1) throw new Error('Should have 1 invalid');
});

// ========== TAB CONTROLLER TESTS (26+) ==========

runner.test('TabController: Obtener tab actual por defecto', () => {
  const tc = new TabController();
  if (tc.getCurrentTab() !== 'ahumado') throw new Error('Should be ahumado');
});

runner.test('TabController: Cambiar a tab válido', () => {
  const tc = new TabController();
  if (!tc.switchTab('cronometro')) throw new Error('Should switch');
  if (tc.getCurrentTab() !== 'cronometro') throw new Error('Should be cronometro');
});

runner.test('TabController: Rechazar tab inválido', () => {
  const tc = new TabController();
  if (tc.switchTab('invalid')) throw new Error('Should fail');
});

runner.test('TabController: Obtener tab label actual', () => {
  const tc = new TabController();
  const label = tc.getCurrentTabLabel();
  if (!label || !label.includes('Ahumado')) throw new Error('Should have Ahumado label');
});

runner.test('TabController: Obtener descripción tab actual', () => {
  const tc = new TabController();
  const desc = tc.getCurrentTabDescription();
  if (!desc || desc.length === 0) throw new Error('Should have description');
});

runner.test('TabController: Agregar al historial al cambiar tab', () => {
  const tc = new TabController();
  tc.switchTab('cronometro');
  tc.switchTab('gadgets');
  const history = tc.getHistory();
  if (history.length < 3) throw new Error('Should have at least 3 in history');
  if (history[history.length - 1] !== 'gadgets') throw new Error('Last should be gadgets');
});

runner.test('TabController: Volver a tab anterior', () => {
  const tc = new TabController();
  tc.switchTab('cronometro');
  tc.switchTab('gadgets');
  if (!tc.goBack()) throw new Error('Should go back');
  if (tc.getCurrentTab() !== 'cronometro') throw new Error('Should be cronometro');
});

runner.test('TabController: No volver si no hay historial', () => {
  const tc = new TabController();
  if (tc.goBack()) throw new Error('Should not go back');
});

runner.test('TabController: Obtener todos los tabs disponibles', () => {
  const tc = new TabController();
  const tabs = tc.getAvailableTabs();
  if (!Array.isArray(tabs)) throw new Error('Should be array');
  if (tabs.length !== 5) throw new Error('Should have 5 tabs');
  if (!tabs.includes('ahumado')) throw new Error('Should include ahumado');
});

runner.test('TabController: Obtener información de todos los tabs', () => {
  const tc = new TabController();
  const info = tc.getTabsInfo();
  if (!Array.isArray(info)) throw new Error('Should be array');
  if (info.length !== 5) throw new Error('Should have 5 tabs');
  if (!info[0].label) throw new Error('Should have label');
  if (!info[0].description) throw new Error('Should have description');
});

runner.test('TabController: Limpiar historial', () => {
  const tc = new TabController();
  tc.switchTab('cronometro');
  tc.switchTab('gadgets');
  tc.clearHistory();
  const history = tc.getHistory();
  if (history.length !== 1) throw new Error('Should have only 1 in history');
});

runner.test('TabController: Limitar tamaño del historial', () => {
  const tc = new TabController();
  const tabs = tc.getAvailableTabs();
  // Cambiar de tab 15 veces
  for (let i = 0; i < 15; i++) {
    tc.switchTab(tabs[i % tabs.length]);
  }
  const history = tc.getHistory();
  if (history.length > tc.maxHistory + 1) throw new Error('Should limit history');
});

runner.test('TabController: Validar tab válido', () => {
  const tc = new TabController();
  if (!tc.isValidTab('ahumado')) throw new Error('ahumado should be valid');
  if (tc.isValidTab('invalid')) throw new Error('invalid should not be valid');
});

runner.test('TabController: No cambiar si ya está en el tab', () => {
  const tc = new TabController();
  const history1 = tc.getHistory().length;
  tc.switchTab('ahumado'); // Ya está aquí
  const history2 = tc.getHistory().length;
  if (history2 > history1) throw new Error('Should not add to history');
});

runner.test('TabController: Emitir evento al cambiar tab', () => {
  const tc = new TabController();
  let eventFired = false;
  tc.on('tab-changed', () => { eventFired = true; });
  tc.switchTab('cronometro');
  if (!eventFired) throw new Error('Should emit tab-changed');
});

runner.test('TabController: Incluir desde y hacia en evento', () => {
  const tc = new TabController();
  let event = null;
  tc.on('tab-changed', (e) => { event = e; });
  tc.switchTab('cronometro');
  if (event.from !== 'ahumado') throw new Error('Should have from: ahumado');
  if (event.to !== 'cronometro') throw new Error('Should have to: cronometro');
});

// ========== NOTIFICATIONS TESTS (26+) ==========

runner.test('Notifications: Mostrar notificación', () => {
  const notif = new Notifications();
  const result = notif.show('Test message', 'info', 1000);
  if (!result.id) throw new Error('Should have id');
  if (result.message !== 'Test message') throw new Error('Should have message');
});

runner.test('Notifications: Mostrar notificación de éxito', () => {
  const notif = new Notifications();
  const result = notif.success('Success!');
  if (result.type !== 'success') throw new Error('Should be success type');
});

runner.test('Notifications: Mostrar notificación de error', () => {
  const notif = new Notifications();
  const result = notif.error('Error occurred!');
  if (result.type !== 'error') throw new Error('Should be error type');
});

runner.test('Notifications: Mostrar notificación de advertencia', () => {
  const notif = new Notifications();
  const result = notif.warning('Warning!');
  if (result.type !== 'warning') throw new Error('Should be warning type');
});

runner.test('Notifications: Mostrar notificación de información', () => {
  const notif = new Notifications();
  const result = notif.info('Info!');
  if (result.type !== 'info') throw new Error('Should be info type');
});

runner.test('Notifications: Obtener notificaciones activas', () => {
  const notif = new Notifications();
  notif.show('Message 1', 'info', 1000);
  notif.show('Message 2', 'error', 1000);
  const active = notif.getActive();
  if (active.length !== 2) throw new Error('Should have 2 notifications');
});

runner.test('Notifications: Descartar notificación por ID', () => {
  const notif = new Notifications();
  const msg = notif.show('Test', 'info', 1000);
  const dismissed = notif.dismiss(msg.id);
  if (!dismissed) throw new Error('Should dismiss');
  if (notif.getCount() !== 0) throw new Error('Should have 0 after dismiss');
});

runner.test('Notifications: Descartar todas las notificaciones', () => {
  const notif = new Notifications();
  notif.show('Message 1', 'info', 1000);
  notif.show('Message 2', 'error', 1000);
  const count = notif.dismissAll();
  if (count !== 2) throw new Error('Should dismiss 2');
  if (notif.getCount() !== 0) throw new Error('Should have 0 after dismissAll');
});

runner.test('Notifications: Obtener notificaciones por tipo', () => {
  const notif = new Notifications();
  notif.show('Success 1', 'success', 1000);
  notif.show('Error 1', 'error', 1000);
  notif.show('Success 2', 'success', 1000);
  const successes = notif.getByType('success');
  if (successes.length !== 2) throw new Error('Should have 2 success');
});

runner.test('Notifications: Contar notificaciones', () => {
  const notif = new Notifications();
  notif.show('Message 1', 'info', 1000);
  notif.show('Message 2', 'error', 1000);
  if (notif.getCount() !== 2) throw new Error('Should have count 2');
});

runner.test('Notifications: Limpiar todas las notificaciones', () => {
  const notif = new Notifications();
  notif.show('Message 1', 'info', 1000);
  notif.show('Message 2', 'error', 1000);
  notif.clear();
  if (notif.getCount() !== 0) throw new Error('Should have 0 after clear');
});

runner.test('Notifications: Usar duración corta', () => {
  const notif = new Notifications();
  const msg = notif.show('Test', 'info', Notifications.DURATIONS.SHORT);
  if (msg.duration !== Notifications.DURATIONS.SHORT) throw new Error('Should use SHORT duration');
});

runner.test('Notifications: Usar duración larga', () => {
  const notif = new Notifications();
  const msg = notif.show('Test', 'error', Notifications.DURATIONS.LONG);
  if (msg.duration !== Notifications.DURATIONS.LONG) throw new Error('Should use LONG duration');
});

runner.test('Notifications: Notificación persistente (sin auto-dismiss)', () => {
  const notif = new Notifications();
  const msg = notif.show('Test', 'info', Notifications.DURATIONS.PERSISTENT);
  if (msg.duration !== null) throw new Error('Should be null duration');
});

runner.test('Notifications: Emitir evento cuando se muestra', () => {
  const notif = new Notifications();
  let eventFired = false;
  notif.on('notification-shown', () => { eventFired = true; });
  notif.show('Test', 'info', 1000);
  if (!eventFired) throw new Error('Should emit notification-shown');
});

runner.test('Notifications: Emitir evento cuando se descarta', () => {
  const notif = new Notifications();
  const msg = notif.show('Test', 'info', 1000);
  let eventFired = false;
  notif.on('notification-dismissed', () => { eventFired = true; });
  notif.dismiss(msg.id);
  if (!eventFired) throw new Error('Should emit notification-dismissed');
});

runner.test('Notifications: Rechazar mensaje vacío', () => {
  const notif = new Notifications();
  try {
    notif.show('', 'info', 1000);
    throw new Error('Should throw for empty message');
  } catch (err) {
    if (!err.message.includes('required')) throw err;
  }
});

runner.test('Notifications: Rechazar tipo inválido', () => {
  const notif = new Notifications();
  try {
    notif.show('Test', 'invalid-type', 1000);
    throw new Error('Should throw for invalid type');
  } catch (err) {
    if (!err.message.includes('Invalid type')) throw err;
  }
});

runner.run();
