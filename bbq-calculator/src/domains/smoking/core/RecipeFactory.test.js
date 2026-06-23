/**
 * Tests for RecipeFactory - Factory de recetas
 * Run with: node src/domains/smoking/core/RecipeFactory.test.js
 */

import RecipeFactory from './RecipeFactory.js';

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
    console.log('📋 Ejecutando tests para RecipeFactory\n');

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

runner.test('Crear receta desde wizard data', () => {
  const formData = {
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 110,
    tempUnit: 'C',
    weightUnit: 'kg',
    renderingLevel: 'rosa',
    wrapped: false,
    altitudeM: 1850
  };

  const recipe = RecipeFactory.createFromWizard(formData);

  if (!recipe.id) throw new Error('Recipe ID not generated');
  if (recipe.meatType !== 'tapapecho') throw new Error('Meat type mismatch');
  if (recipe.weightKg !== 4.5) throw new Error('Weight not normalized');
  if (recipe.smokingTempC !== 110) throw new Error('Temp not normalized');
  if (recipe.renderingLevel !== 'rosa') throw new Error('Rendering level mismatch');
});

runner.test('Crear receta desde resultado (resultado BBQEngine)', () => {
  const result = {
    meatType: 'tapapecho',
    meatName: 'Tapapecho (Brisket)',
    weightKg: 4.5,
    smokingTempC: 110,
    totalTimeMinutes: 480
  };

  const recipe = RecipeFactory.createFromResult(result, 'Mi Brisket 2025');

  if (!recipe.id) throw new Error('Recipe ID not generated');
  if (recipe.name !== 'Mi Brisket 2025') throw new Error('Custom name not used');
  if (recipe.estimatedHours !== 8) throw new Error('Hours not calculated correctly');
  if (!recipe.fullResult) throw new Error('Full result not stored');
});

runner.test('Normalizar peso: lbs a kg', () => {
  const kg = RecipeFactory.normalizeWeight(10, 'lbs');
  const expected = 10 / 2.20462;

  if (Math.abs(kg - expected) > 0.01) {
    throw new Error(`Weight normalization failed: got ${kg}, expected ${expected}`);
  }
});

runner.test('Normalizar peso: kg se queda igual', () => {
  const kg = RecipeFactory.normalizeWeight(4.5, 'kg');

  if (kg !== 4.5) throw new Error('Weight should not be converted if already in kg');
});

runner.test('Normalizar temperatura: °F a °C', () => {
  const celsius = RecipeFactory.normalizeTemp(230, 'F');
  const expected = (230 - 32) * (5 / 9);

  if (Math.abs(celsius - expected) > 0.1) {
    throw new Error(`Temp normalization failed: got ${celsius}, expected ${expected}`);
  }
});

runner.test('Normalizar temperatura: °C se queda igual', () => {
  const celsius = RecipeFactory.normalizeTemp(110, 'C');

  if (celsius !== 110) throw new Error('Temp should not be converted if already in C');
});

runner.test('Generar ID único cada vez', () => {
  const id1 = RecipeFactory.generateId();
  const id2 = RecipeFactory.generateId();

  if (id1 === id2) throw new Error('Generated IDs should be unique');
  if (!id1.startsWith('recipe_')) throw new Error('ID should have recipe_ prefix');
});

runner.test('Validar receta válida', () => {
  const recipe = {
    id: 'recipe_123',
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 110
  };

  if (!RecipeFactory.isValid(recipe)) {
    throw new Error('Valid recipe should pass validation');
  }
});

runner.test('Rechazar receta sin ID', () => {
  const recipe = {
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 110
  };

  if (RecipeFactory.isValid(recipe)) {
    throw new Error('Recipe without ID should fail validation');
  }
});

runner.test('Rechazar receta con campos nulos', () => {
  const recipe = {
    id: 'recipe_123',
    meatType: null,
    weightKg: 4.5,
    smokingTempC: 110
  };

  if (RecipeFactory.isValid(recipe)) {
    throw new Error('Recipe with null meatType should fail validation');
  }
});

runner.test('Usar nombre generado si no se proporciona', () => {
  const result = {
    meatType: 'tapapecho',
    meatName: 'Tapapecho (Brisket)',
    weightKg: 4.5,
    smokingTempC: 110,
    totalTimeMinutes: 480
  };

  const recipe = RecipeFactory.createFromResult(result);

  if (recipe.name !== 'tapapecho 4.5kg') {
    throw new Error(`Generated name should be 'tapapecho 4.5kg', got '${recipe.name}'`);
  }
});

runner.test('Incluir metadata de origen', () => {
  const formData = {
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 110,
    tempUnit: 'C',
    weightUnit: 'kg'
  };

  const recipe = RecipeFactory.createFromWizard(formData);

  if (recipe.metadata.source !== 'wizard') {
    throw new Error('Metadata source should be "wizard"');
  }
});

runner.test('Incluir timestamp de creación', () => {
  const formData = {
    meatType: 'tapapecho',
    weightKg: 4.5,
    smokingTempC: 110,
    tempUnit: 'C',
    weightUnit: 'kg'
  };

  const recipe = RecipeFactory.createFromWizard(formData);
  const now = new Date();
  const created = new Date(recipe.createdAt);

  if (Math.abs(now - created) > 1000) { // 1 segundo de diferencia máxima
    throw new Error('createdAt timestamp should be recent');
  }
});

runner.run();
