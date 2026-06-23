/**
 * Tests for CureStore - Persistencia de curados activos
 * Run with: node src/domains/curing/state/CureStore.test.js
 */

import CureStore from './CureStore.js';

// Mock localStorage para testing
global.localStorage = {
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
    console.log('📋 Ejecutando tests para CureStore\n');

    for (const { name, fn } of this.tests) {
      try {
        // Clear localStorage antes de cada test
        global.localStorage.clear();

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

runner.test('Crear nuevo CureStore', () => {
  const store = new CureStore();

  if (!Array.isArray(store.getActiveCures())) {
    throw new Error('getActiveCures should return an array');
  }
});

runner.test('Añadir un nuevo curado', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    thickness: 3.0,
    saltGrams: 90,
    pinkSaltGrams: 5,
    sugarGrams: 40,
    cureDays: 7,
    postCureDays: 3,
    totalDays: 10,
    startDate: new Date().toISOString(),
    estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  };

  const cure = store.addActiveCure(cureData);

  if (!cure.id) throw new Error('Cure ID not generated');
  if (cure.status !== 'active') throw new Error('Status should be "active"');
  if (store.getActiveCures().length !== 1) throw new Error('Cure not added to store');
});

runner.test('Obtener curado por ID', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  const added = store.addActiveCure(cureData);
  const retrieved = store.getActiveCure(added.id);

  if (!retrieved) throw new Error('Cure not retrieved');
  if (retrieved.id !== added.id) throw new Error('ID mismatch');
});

runner.test('Obtener curado no existente retorna null', () => {
  const store = new CureStore();

  const retrieved = store.getActiveCure('nonexistent');

  if (retrieved !== null) throw new Error('Should return null for nonexistent cure');
});

runner.test('Actualizar curado existente', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  const cure = store.addActiveCure(cureData);
  const updated = store.updateActiveCure(cure.id, { userNotes: 'Test note' });

  if (!updated) throw new Error('Update failed');
  if (updated.userNotes !== 'Test note') throw new Error('Update not applied');
  if (!updated.updatedAt) throw new Error('updatedAt timestamp not set');
});

runner.test('Marcar curado como completado', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  const cure = store.addActiveCure(cureData);
  const completed = store.markComplete(cure.id);

  if (completed.status !== 'completed') throw new Error('Status not updated');
  if (!completed.completedAt) throw new Error('completedAt not set');
});

runner.test('Eliminar curado activo', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  const cure = store.addActiveCure(cureData);
  const deleted = store.deleteActiveCure(cure.id);

  if (!deleted) throw new Error('Delete failed');
  if (store.getActiveCures().length !== 0) throw new Error('Cure not deleted');
});

runner.test('Eliminar curado no existente retorna false', () => {
  const store = new CureStore();

  const deleted = store.deleteActiveCure('nonexistent');

  if (deleted) throw new Error('Should return false for nonexistent cure');
});

runner.test('Obtener estadísticas', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  const cure1 = store.addActiveCure(cureData);
  const cure2 = store.addActiveCure(cureData);

  store.markComplete(cure1.id);

  const stats = store.getStats();

  if (stats.total !== 2) throw new Error('Total count wrong');
  if (stats.active !== 1) throw new Error('Active count wrong');
  if (stats.completed !== 1) throw new Error('Completed count wrong');
});

runner.test('Exportar a JSON', () => {
  const store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  store.addActiveCure(cureData);

  const json = store.exportJSON();
  const parsed = JSON.parse(json);

  if (!parsed.version) throw new Error('Missing version in export');
  if (!parsed.exportDate) throw new Error('Missing exportDate in export');
  if (!Array.isArray(parsed.cures)) throw new Error('Missing cures array in export');
  if (parsed.cures.length !== 1) throw new Error('Cures count wrong in export');
});

runner.test('Importar desde JSON', () => {
  const store = new CureStore();

  const importData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    cures: [
      {
        id: 'cure_123',
        cureType: 'bacon',
        name: 'Bacon',
        weightKg: 2.0,
        status: 'active',
        startDate: new Date().toISOString()
      }
    ]
  };

  const result = store.importJSON(JSON.stringify(importData));

  if (!result.success) throw new Error('Import failed');
  if (result.count !== 1) throw new Error('Import count wrong');
  if (store.getActiveCures().length !== 1) throw new Error('Cure not imported');
});

runner.test('Rechazar JSON inválido', () => {
  const store = new CureStore();

  const result = store.importJSON('invalid json');

  if (result.success) throw new Error('Should fail for invalid JSON');
  if (result.errors.length === 0) throw new Error('Should have errors');
});

runner.test('Limpiar curados antiguos', () => {
  const store = new CureStore();

  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 40); // 40 días atrás

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: oldDate.toISOString()
  };

  const cure = store.addActiveCure(cureData);

  // Marcar como completado hace 40 días
  const completedDate = new Date();
  completedDate.setDate(completedDate.getDate() - 40);

  store.updateActiveCure(cure.id, {
    status: 'completed',
    completedAt: completedDate.toISOString()
  });

  const cleaned = store.cleanup(30); // Limpiar más de 30 días

  if (cleaned !== 1) throw new Error(`Should have cleaned 1 cure, cleaned ${cleaned}`);
});

runner.test('Persistencia en localStorage', () => {
  let store = new CureStore();

  const cureData = {
    cureType: 'bacon',
    name: 'Bacon',
    weightKg: 2.0,
    startDate: new Date().toISOString()
  };

  store.addActiveCure(cureData);

  // Crear nuevo store - debe cargar del localStorage
  store = new CureStore();

  if (store.getActiveCures().length !== 1) {
    throw new Error('Persistence failed - cure not loaded from localStorage');
  }
});

runner.run();
