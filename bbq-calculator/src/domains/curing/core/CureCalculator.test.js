/**
 * Tests for CureCalculator - Motor de cálculo de curaciones
 * Run with: node src/domains/curing/core/CureCalculator.test.js
 */

import CureCalculator from './CureCalculator.js';

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
    console.log('📋 Ejecutando tests para CureCalculator\n');

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

runner.test('Obtener perfiles de cura disponibles', () => {
  const profiles = CureCalculator.getCureProfiles();

  if (!profiles.bacon) throw new Error('Bacon profile missing');
  if (!profiles.pastrami) throw new Error('Pastrami profile missing');
  if (!profiles.corned_beef) throw new Error('Corned beef profile missing');
  if (!profiles.jerky) throw new Error('Jerky profile missing');
});

runner.test('Calcular bacon: cantidades correctas', () => {
  const result = CureCalculator.calculate({
    cureType: 'bacon',
    weightKg: 2.0,
    thickness: 3.0
  });

  if (result.saltGrams < 85 || result.saltGrams > 95) {
    throw new Error(`Salt calculation wrong: ${result.saltGrams}g (expected ~90g)`);
  }
  if (result.sugarGrams < 35 || result.sugarGrams > 45) {
    throw new Error(`Sugar calculation wrong: ${result.sugarGrams}g (expected ~40g)`);
  }
});

runner.test('Calcular pastrami: tiempo de cura por espesor', () => {
  const result = CureCalculator.calculate({
    cureType: 'pastrami',
    weightKg: 3.0,
    thickness: 5.0
  });

  // 5cm espesor * 2.5 = 12.5 días, mínimo 5 para pastrami
  if (result.cureDays < 5 || result.cureDays > 15) {
    throw new Error(`Cure time calculation wrong: ${result.cureDays}d`);
  }
});

runner.test('Calcular corned beef: incluye curing salt', () => {
  const result = CureCalculator.calculate({
    cureType: 'corned_beef',
    weightKg: 2.5,
    thickness: 4.0
  });

  if (result.pinkSaltGrams <= 0) {
    throw new Error('Pink salt should be included for corned beef');
  }
});

runner.test('Calcular jerky: sin curing salt', () => {
  const result = CureCalculator.calculate({
    cureType: 'jerky',
    weightKg: 1.0,
    thickness: 0.5
  });

  if (result.pinkSaltGrams > 0) {
    throw new Error('Jerky should not use pink salt');
  }
  if (result.sugarGrams <= 0) {
    throw new Error('Jerky should have sugar');
  }
});

runner.test('Rechazar parámetros inválidos', () => {
  try {
    CureCalculator.calculate({ cureType: 'bacon', weightKg: 1.0 });
    throw new Error('Should have thrown error for missing thickness');
  } catch (err) {
    if (!err.message.includes('Missing required parameters')) {
      throw err;
    }
  }
});

runner.test('Rechazar tipo de cura desconocido', () => {
  try {
    CureCalculator.calculate({
      cureType: 'unknown',
      weightKg: 1.0,
      thickness: 3.0
    });
    throw new Error('Should have thrown error for unknown cure type');
  } catch (err) {
    if (!err.message.includes('Unknown cure type')) {
      throw err;
    }
  }
});

runner.test('Calcular sal total', () => {
  const result = CureCalculator.calculate({
    cureType: 'bacon',
    weightKg: 1.0,
    thickness: 3.0
  });

  const total = CureCalculator.getTotalSalt(result);

  if (total !== result.saltGrams + result.pinkSaltGrams) {
    throw new Error('Total salt calculation wrong');
  }
});

runner.test('Validar seguridad: concentración USDA', () => {
  const result = CureCalculator.calculate({
    cureType: 'bacon',
    weightKg: 1.0,
    thickness: 2.0
  });

  const validation = CureCalculator.validateSafety(result);

  if (!validation.isValid && validation.warnings.length === 0) {
    throw new Error('Validation failed but no warnings provided');
  }
});

runner.test('Advertir si tiempo de cura muy corto', () => {
  const result = CureCalculator.calculate({
    cureType: 'jerky',
    weightKg: 0.5,
    thickness: 0.3 // Muy delgado, cureDays será 2
  });

  const validation = CureCalculator.validateSafety(result);

  if (!validation.warnings.some(w => w.includes('very short'))) {
    throw new Error('Should warn when cure time is very short');
  }
});

runner.test('Generar receta formateada', () => {
  const result = CureCalculator.calculate({
    cureType: 'bacon',
    weightKg: 2.0,
    thickness: 3.0
  });

  const recipe = CureCalculator.renderRecipe(result);

  if (!recipe.includes('BACON')) throw new Error('Recipe missing name');
  if (!recipe.includes('g')) throw new Error('Recipe missing salt grams');
  if (!recipe.includes('Refrigerate')) throw new Error('Recipe missing instructions');
  if (recipe.length < 100) throw new Error('Recipe too short');
});

runner.test('Calcular progreso de cura activa', () => {
  const activeCure = {
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
    estimatedCompletionDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 días en futuro
  };

  const progress = CureCalculator.getProgress(activeCure);

  if (progress.percentComplete < 30 || progress.percentComplete > 45) {
    throw new Error(`Progress calculation wrong: ${progress.percentComplete}%`);
  }
  if (progress.daysRemaining < 3 || progress.daysRemaining > 5) {
    throw new Error(`Days remaining wrong: ${progress.daysRemaining}`);
  }
  if (progress.isComplete) {
    throw new Error('Should not be complete yet');
  }
});

runner.test('Marcar cura como completada', () => {
  const activeCure = {
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 días atrás
    estimatedCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 día atrás
  };

  const progress = CureCalculator.getProgress(activeCure);

  if (!progress.isComplete) {
    throw new Error('Cure should be marked as complete');
  }
});

runner.test('Incluir fecha de finalización estimada', () => {
  const result = CureCalculator.calculate({
    cureType: 'bacon',
    weightKg: 2.0,
    thickness: 3.0
  });

  if (!result.estimatedCompletionDate) {
    throw new Error('Missing estimated completion date');
  }

  const completionDate = new Date(result.estimatedCompletionDate);
  const startDate = new Date(result.startDate);

  const expectedDays = result.cureDays + result.postCureDays;
  const actualDays = Math.ceil((completionDate - startDate) / (1000 * 60 * 60 * 24));

  if (Math.abs(actualDays - expectedDays) > 1) {
    throw new Error(`Completion date calculation wrong: expected ${expectedDays}d, got ${actualDays}d`);
  }
});

runner.run();
