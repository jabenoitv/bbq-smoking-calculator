/**
 * Tests for DataPersistence (RecipeStore + SessionStore)
 * Run with: node src/core/DataPersistence.test.js
 * Note: Requires localStorage polyfill for Node.js testing
 */

import { RecipeStore, SessionStore } from './DataPersistence.js';

// Polyfill localStorage para Node.js
if (typeof global !== 'undefined' && !global.localStorage) {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para DataPersistence\n`);

    for (const test of this.tests) {
      try {
        localStorage.clear();
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

// Fixture: receta de ejemplo
const mockRecipe = {
  id: 'recipe_1',
  meatType: 'tapapecho',
  meatName: 'Tapapecho (Brisket)',
  weightKg: 4.5,
  smokingTempC: 107,
  desiredRedTempC: 63,
  estimatedCookingHours: 18,
  estimatedCookingMinutes: 30,
  totalMinutes: 1110,
  wrapped: false,
  holdingMin: 60,
  temperatureRange: [],
  phases: [],
  events: [],
  formula: {},
  calculatedAt: new Date().toLocaleString('es-ES')
};

// ========================= RECIPE STORE =========================
runner.test('RecipeStore inicializa correctamente', function() {
  const store = new RecipeStore();
  runner.assert(store.recipes !== null, 'Tiene diccionario de recetas');
  runner.assertEqual(store.listRecipes().length, 0, 'Inicialmente vacío');
});

runner.test('RecipeStore guarda receta', function() {
  const store = new RecipeStore();
  const id = store.saveRecipe(mockRecipe);

  runner.assert(id !== null, 'Devuelve ID');
  runner.assert(store.getRecipe(id) !== null, 'Receta está guardada');
});

runner.test('RecipeStore lista recetas', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const recipes = store.listRecipes();
  runner.assertEqual(recipes.length, 1, 'Lista devuelve 1 receta');
});

runner.test('RecipeStore filtra por tipo de carne', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const recipe2 = { ...mockRecipe, id: 'recipe_2', meatType: 'pollo_entero' };
  store.saveRecipe(recipe2);

  const brisket = store.listRecipes({ meatType: 'tapapecho' });
  runner.assertEqual(brisket.length, 1, 'Filtra por carne correctamente');
});

runner.test('RecipeStore elimina receta', function() {
  const store = new RecipeStore();
  const id = store.saveRecipe(mockRecipe);

  const deleted = store.deleteRecipe(id);
  runner.assertEqual(deleted, true, 'Devuelve true');
  runner.assertEqual(store.getRecipe(id), null, 'Receta fue eliminada');
});

runner.test('RecipeStore actualiza notas', function() {
  const store = new RecipeStore();
  const id = store.saveRecipe(mockRecipe);

  store.updateRecipeNotes(id, 'Excelente resultado');
  const recipe = store.getRecipe(id);
  runner.assertEqual(recipe.notes, 'Excelente resultado', 'Notas se actualizan');
});

runner.test('RecipeStore exporta JSON', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const json = store.exportJSON();
  runner.assert(json.includes('tapapecho'), 'JSON contiene datos');
  runner.assert(json.includes('"storedName"'), 'JSON contiene metadatos');
});

runner.test('RecipeStore exporta CSV', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const csv = store.exportCSV();
  runner.assert(csv.includes('Carne'), 'CSV contiene headers');
  runner.assert(csv.includes('Brisket'), 'CSV contiene datos');
});

runner.test('RecipeStore importa JSON', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const json = store.exportJSON();

  const store2 = new RecipeStore('bbq_recipes_2');
  const imported = store2.importFromJSON(json);

  runner.assert(imported > 0, 'Se importaron recetas');
  runner.assertEqual(store2.listRecipes().length, imported, 'Cantidad correcta');
});

runner.test('RecipeStore obtiene estadísticas', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  const stats = store.getStats();
  runner.assertEqual(stats.count, 1, 'Count es correcto');
  runner.assertEqual(stats.averageWeight, mockRecipe.weightKg, 'Weight promedio');
  runner.assertEqual(stats.mostPopularMeat, 'tapapecho', 'Carne más popular');
});

runner.test('RecipeStore vacía todas las recetas', function() {
  const store = new RecipeStore();
  store.saveRecipe(mockRecipe);

  store.clear();
  runner.assertEqual(store.listRecipes().length, 0, 'Todas eliminadas');
});

runner.test('RecipeStore emite eventos', function() {
  const store = new RecipeStore();
  let eventFired = false;

  store.on('recipe-saved', () => {
    eventFired = true;
  });

  store.saveRecipe(mockRecipe);
  runner.assertEqual(eventFired, true, 'Evento recipe-saved emitido');
});

// ========================= SESSION STORE =========================
runner.test('SessionStore inicializa correctamente', function() {
  const store = new SessionStore();
  runner.assert(store.sessions !== null, 'Tiene diccionario de sesiones');
  runner.assertEqual(store.listSessions().length, 0, 'Inicialmente vacío');
});

runner.test('SessionStore crea sesión', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  runner.assert(sessionId !== null, 'Devuelve ID');
  const session = store.getSession(sessionId);
  runner.assert(session !== null, 'Sesión está guardada');
  runner.assertEqual(session.status, 'active', 'Status es active');
});

runner.test('SessionStore lista sesiones', function() {
  const store = new SessionStore();
  store.createSession(mockRecipe);

  const sessions = store.listSessions();
  runner.assertEqual(sessions.length, 1, 'Lista devuelve 1 sesión');
});

runner.test('SessionStore añade medición', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  store.addMeasurement(sessionId, 52.5, 300, 'Primera medición');

  const session = store.getSession(sessionId);
  runner.assertEqual(session.measurements.length, 1, 'Medición añadida');
  runner.assertEqual(session.measurements[0].tempC, 52.5, 'Temperatura correcta');
});

runner.test('SessionStore finaliza sesión', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  store.endSession(sessionId);

  const session = store.getSession(sessionId);
  runner.assertEqual(session.status, 'completed', 'Status es completed');
  runner.assert(session.endedAt !== null, 'endedAt está configurado');
});

runner.test('SessionStore pausa/reanuda sesión', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  store.pauseSession(sessionId);
  let session = store.getSession(sessionId);
  runner.assertEqual(session.status, 'paused', 'Status es paused');

  store.resumeSession(sessionId);
  session = store.getSession(sessionId);
  runner.assertEqual(session.status, 'active', 'Status es active nuevamente');
});

runner.test('SessionStore actualiza notas', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  store.updateSessionNotes(sessionId, 'Sesión completa');

  const session = store.getSession(sessionId);
  runner.assertEqual(session.notes, 'Sesión completa', 'Notas actualizadas');
});

runner.test('SessionStore exporta CSV', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  store.addMeasurement(sessionId, 50, 300, 'Med 1');
  store.addMeasurement(sessionId, 55, 600, 'Med 2');

  const csv = store.exportSessionCSV(sessionId);
  runner.assert(csv.includes('Tiempo'), 'CSV contiene headers');
  runner.assert(csv.includes('50'), 'CSV contiene medición 1');
  runner.assert(csv.includes('55'), 'CSV contiene medición 2');
});

runner.test('SessionStore elimina sesión', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  const deleted = store.deleteSession(sessionId);
  runner.assertEqual(deleted, true, 'Devuelve true');
  runner.assertEqual(store.getSession(sessionId), null, 'Sesión fue eliminada');
});

runner.test('SessionStore vacía todas las sesiones', function() {
  const store = new SessionStore();
  store.createSession(mockRecipe);

  store.clear();
  runner.assertEqual(store.listSessions().length, 0, 'Todas eliminadas');
});

runner.test('SessionStore emite eventos', function() {
  const store = new SessionStore();
  let eventFired = false;

  store.on('session-created', () => {
    eventFired = true;
  });

  store.createSession(mockRecipe);
  runner.assertEqual(eventFired, true, 'Evento session-created emitido');
});

runner.test('SessionStore emite evento measurement-added', function() {
  const store = new SessionStore();
  const sessionId = store.createSession(mockRecipe);

  let eventFired = false;
  store.on('measurement-added', (data) => {
    eventFired = true;
  });

  store.addMeasurement(sessionId, 52, 300);
  runner.assertEqual(eventFired, true, 'Evento measurement-added emitido');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
