/**
 * App.test.js - Integration tests for App orchestrator (M13)
 * Tests: Domain wiring, state management, cross-domain operations
 */

// Mock localStorage for Node.js environment (before any imports)
globalThis.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Suppress console warnings
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

// Lazy import to ensure localStorage is mocked first
let app;
const loadApp = async () => {
  const module = await import('./App.js');
  app = module.app;
  return app;
};

// Restore console
console.warn = originalWarn;
console.error = originalError;

class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n🧪 Test Suite: ${this.name}`);
    console.log('='.repeat(60));

    for (const { description, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('='.repeat(60));
    console.log(`Results: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

// Test Suite 1: Initialization
const initTests = new TestRunner('App.js - Initialization');

initTests.test('App initializes with all domains', () => {
  if (!app.bbqEngine) throw new Error('BBQEngine not initialized');
  if (!app.cureCalculator) throw new Error('CureCalculator not initialized');
  if (!app.rubCalculator) throw new Error('RubCalculator not initialized');
  if (!app.tabController) throw new Error('TabController not initialized');
  if (!app.notifications) throw new Error('Notifications not initialized');
});

initTests.test('App state initialized correctly', () => {
  if (app.appState.version !== '2.0') throw new Error('Invalid version');
  if (!Array.isArray(app.appState.recipes)) throw new Error('recipes not array');
  if (!Array.isArray(app.appState.activeCures)) throw new Error('activeCures not array');
  if (!app.appState.userPreferences) throw new Error('userPreferences not set');
});

initTests.test('App is EventEmitter', () => {
  if (typeof app.on !== 'function') throw new Error('App.on not a function');
  if (typeof app.emit !== 'function') throw new Error('App.emit not a function');
});

// Test Suite 2: Smoking Domain Operations
const smokingTests = new TestRunner('App.js - Smoking Domain');

smokingTests.test('Calculate smoking time for brisket', () => {
  const result = app.calculateSmokingTime({
    meatType: 'tapapecho',
    weight: 5,
    temp: 110,
    altitude: 0
  });

  if (!result.totalMinutes) throw new Error('No totalMinutes in result');
  if (!result.phases) throw new Error('No phases in result');
  if (result.phases.length !== 3) throw new Error('Expected 3 phases');
});

smokingTests.test('Reject invalid meat type', () => {
  let errorThrown = false;
  try {
    app.calculateSmokingTime({
      meatType: 'invalid_meat',
      weight: 5,
      temp: 110
    });
  } catch (error) {
    errorThrown = true;
  }
  if (!errorThrown) throw new Error('Should have thrown error for invalid meat');
});

smokingTests.test('Save recipe to app state', () => {
  const initialLength = app.appState.recipes.length;
  app.calculateSmokingTime({
    meatType: 'paleta_cerdo',
    weight: 7,
    temp: 107
  });
  if (app.appState.recipes.length !== initialLength + 1) {
    throw new Error('Recipe not saved to app state');
  }
});

// Test Suite 3: Timer Domain Operations
const timerTests = new TestRunner('App.js - Timer Domain');

timerTests.test('Start cooking session', () => {
  const recipe = {
    meatType: 'tapapecho',
    weight: 5,
    temp: 110,
    totalMinutes: 300
  };
  const session = app.startCookingSession(recipe);
  if (!session) throw new Error('Session not created');
  if (app.cookingSession !== session) throw new Error('Session not stored in app');
});

timerTests.test('Add measurement to session', () => {
  const session = app.startCookingSession({ meatType: 'tapapecho', weight: 5, temp: 110, totalMinutes: 300 });
  session.start();
  app.addMeasurement(65);

  const measurements = session.getMeasurements();
  if (!measurements) throw new Error('No measurements in session');
  if (measurements.length === 0) throw new Error('Measurement not added');
});

timerTests.test('Reject measurement without session', () => {
  app.cookingSession = null;
  let errorThrown = false;
  try {
    app.addMeasurement(65);
  } catch (error) {
    errorThrown = true;
  }
  if (!errorThrown) throw new Error('Should throw error when no session');
});

timerTests.test('Stop cooking session', () => {
  app.startCookingSession({ meatType: 'tapapecho', weight: 5, temp: 110, totalMinutes: 300 });
  const stopped = app.stopCookingSession();
  if (!stopped) throw new Error('Session not returned');
  if (app.cookingSession !== null) throw new Error('Session not cleared');
});

// Test Suite 4: Curing Domain Operations
const curingTests = new TestRunner('App.js - Curing Domain');

curingTests.test('Calculate cure parameters', () => {
  const result = app.calculateCure({
    cureType: 'bacon',
    weightKg: 2,
    thickness: 5
  });

  if (!result.saltGrams) throw new Error('No saltGrams');
  if (!result.sugarGrams) throw new Error('No sugarGrams');
  if (!result.cureDays) throw new Error('No cureDays');
});

curingTests.test('Start cure tracking', () => {
  const cure = app.startCureTracking({
    type: 'bacon',
    weightKg: 2,
    thickness: 5,
    saltGrams: 40,
    sugarGrams: 20,
    cureTimeDays: 10
  });

  if (!cure.id) throw new Error('Cure has no id');
  if (cure.status !== 'active') throw new Error('Cure not active');
});

curingTests.test('Complete cure', () => {
  const cure = app.startCureTracking({
    type: 'bacon',
    weightKg: 2,
    thickness: 5,
    saltGrams: 40,
    sugarGrams: 20,
    cureTimeDays: 10
  });

  const completed = app.completeCure(cure.id);
  if (completed.status !== 'completed') throw new Error('Cure not marked completed');
});

curingTests.test('Delete cure', () => {
  const cure = app.startCureTracking({
    type: 'bacon',
    weightKg: 2,
    thickness: 5,
    saltGrams: 40,
    sugarGrams: 20,
    cureTimeDays: 10
  });

  const initialCount = app.getActiveCures().length;
  const success = app.deleteCure(cure.id);
  if (!success) throw new Error('Delete operation failed');
  if (app.getActiveCures().length !== initialCount - 1) {
    throw new Error('Cure not deleted');
  }
});

curingTests.test('Get cure stats', () => {
  app.cureStore.clear();
  app.startCureTracking({
    type: 'bacon',
    weightKg: 2,
    thickness: 5,
    saltGrams: 40,
    sugarGrams: 20,
    cureTimeDays: 10
  });

  const stats = app.getCureStats();
  if (stats.total !== 1) throw new Error('Stats total incorrect');
  if (stats.active !== 1) throw new Error('Stats active incorrect');
  if (stats.completed !== 0) throw new Error('Stats completed incorrect');
});

// Test Suite 5: Gadgets Domain Operations
const gadgetsTests = new TestRunner('App.js - Gadgets Domain');

gadgetsTests.test('Calculate rub for brisket', () => {
  const result = app.calculateRub('brisket', 5);
  if (!result.rubGrams) throw new Error('No rubGrams');
  if (result.rubGrams < 400 || result.rubGrams > 800) throw new Error('rubGrams out of range');
});

gadgetsTests.test('Convert temperature C to F', () => {
  const result = app.convertTemperature(100, 'C');
  if (!result.fahrenheit) throw new Error('No fahrenheit in result');
  if (Math.abs(result.fahrenheit.value - 212) > 1) throw new Error('Conversion inaccurate');
});

gadgetsTests.test('Convert temperature F to C', () => {
  const result = app.convertTemperature(32, 'F');
  if (!result.celsius) throw new Error('No celsius in result');
  if (Math.abs(result.celsius.value - 0) > 1) throw new Error('Conversion inaccurate');
});

gadgetsTests.test('Convert weight kg to lbs', () => {
  const result = app.convertWeight(1, 'kg');
  if (!result.lbs) throw new Error('No lbs in result');
  if (Math.abs(result.lbs.value - 2.20462) > 0.1) throw new Error('Conversion inaccurate');
});

gadgetsTests.test('Convert weight lbs to kg', () => {
  const result = app.convertWeight(2.20462, 'lbs');
  if (!result.kg) throw new Error('No kg in result');
  if (Math.abs(result.kg.value - 1) > 0.1) throw new Error('Conversion inaccurate');
});

gadgetsTests.test('Detect altitude', async () => {
  try {
    const result = await app.detectAltitude();
    if (result === undefined) throw new Error('No result returned');
  } catch (error) {
    // Expected in test environment (no geolocation)
    if (!error.message.includes('Geolocation') && !error.message.includes('failed')) {
      throw error;
    }
  }
});

// Test Suite 6: Tab Navigation (Shared Domain)
const tabTests = new TestRunner('App.js - Tab Navigation');

tabTests.test('Get initial tab', () => {
  const tab = app.getCurrentTab();
  if (tab !== 'ahumado') throw new Error('Initial tab should be ahumado');
});

tabTests.test('Switch tab', () => {
  const success = app.switchTab('cronometro');
  if (!success) throw new Error('Tab switch failed');
  if (app.getCurrentTab() !== 'cronometro') throw new Error('Tab not switched');
});

tabTests.test('Get current tab label', () => {
  app.switchTab('curados');
  const label = app.getCurrentTabLabel();
  if (!label || label.length === 0) throw new Error('No label returned');
});

tabTests.test('Get all tabs info', () => {
  const tabs = app.getTabsInfo();
  if (!Array.isArray(tabs)) throw new Error('tabs is not array');
  if (tabs.length !== 5) throw new Error('Expected 5 tabs');
  if (!tabs.every(t => t.name && t.label && t.description)) {
    throw new Error('Tab info incomplete');
  }
});

// Test Suite 7: Notifications (Shared Domain)
const notificationTests = new TestRunner('App.js - Notifications');

notificationTests.test('Show success notification', () => {
  app.notifications.clear();
  app.showNotification('Test success', 'success');
  const active = app.getNotifications();
  if (active.length === 0) throw new Error('Notification not shown');
  if (active[0].type !== 'success') throw new Error('Wrong type');
});

notificationTests.test('Show error notification', () => {
  app.notifications.clear();
  app.showNotification('Test error', 'error');
  const active = app.getNotifications();
  if (active[0].type !== 'error') throw new Error('Wrong type');
});

notificationTests.test('Get active notifications', () => {
  app.notifications.clear();
  app.showNotification('Msg1', 'info');
  app.showNotification('Msg2', 'info');
  const active = app.getNotifications();
  if (active.length !== 2) throw new Error('Wrong count');
});

// Test Suite 8: State Management
const stateTests = new TestRunner('App.js - State Management');

stateTests.test('Get app state', () => {
  const state = app.getAppState();
  if (!state.version) throw new Error('No version');
  if (!state.currentTab) throw new Error('No currentTab');
  if (!state.activeCures) throw new Error('No activeCures');
});

stateTests.test('Reset app', () => {
  app.calculateSmokingTime({
    meatType: 'tapapecho',
    weight: 5,
    temp: 110
  });
  app.reset();

  if (app.appState.recipes.length !== 0) throw new Error('Recipes not cleared');
  if (app.appState.activeCures.length !== 0) throw new Error('Cures not cleared');
  if (app.cookingSession !== null) throw new Error('Session not cleared');
});

// Run all test suites
async function runAllTests() {
  // Load app first (after localStorage is mocked)
  await loadApp();

  const results = [];

  results.push(await initTests.run());
  results.push(await smokingTests.run());
  results.push(await timerTests.run());
  results.push(await curingTests.run());
  results.push(await gadgetsTests.run());
  results.push(await tabTests.run());
  results.push(await notificationTests.run());
  results.push(await stateTests.run());

  const totalTests = [
    initTests.passed + initTests.failed,
    smokingTests.passed + smokingTests.failed,
    timerTests.passed + timerTests.failed,
    curingTests.passed + curingTests.failed,
    gadgetsTests.passed + gadgetsTests.failed,
    tabTests.passed + tabTests.failed,
    notificationTests.passed + notificationTests.failed,
    stateTests.passed + stateTests.failed
  ].reduce((a, b) => a + b, 0);

  const totalPassed = [
    initTests.passed,
    smokingTests.passed,
    timerTests.passed,
    curingTests.passed,
    gadgetsTests.passed,
    tabTests.passed,
    notificationTests.passed,
    stateTests.passed
  ].reduce((a, b) => a + b, 0);

  console.log(`\n📊 TOTAL: ${totalPassed}/${totalTests} tests passed`);
  return results.every(r => r === true);
}

// Run tests
runAllTests().catch(console.error);
