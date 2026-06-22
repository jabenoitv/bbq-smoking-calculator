/**
 * Tests for RenderingLevelSelector - Niveles de renderización
 * Run with: node src/core/RenderingLevelSelector.test.js
 */

import RenderingLevelSelector from './RenderingLevelSelector.js';

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
    console.log(`\n📋 Ejecutando ${this.tests.length} tests para RenderingLevelSelector\n`);

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
  const selector = new RenderingLevelSelector();
  runner.assert(selector.meatFormulas !== null, 'Tiene fórmulas de carne');
  runner.assert(Object.keys(selector.meatFormulas).length >= 8, 'Tiene al menos 8 carnes');
});

// ========================= SELECCIÓN DE NIVEL =========================
runner.test('selectLevel devuelve temperatura válida', function() {
  const selector = new RenderingLevelSelector();

  const raro = selector.selectLevel('tapapecho', 'raro');
  const rosa = selector.selectLevel('tapapecho', 'rosa');
  const gris = selector.selectLevel('tapapecho', 'gris');

  runner.assert(raro > 0, 'Raro tiene valor positivo');
  runner.assert(rosa > 0, 'Rosa tiene valor positivo');
  runner.assert(gris > 0, 'Gris tiene valor positivo');
  runner.assert(raro < rosa, 'Raro < Rosa');
  runner.assert(rosa < gris, 'Rosa < Gris');
});

runner.test('selectLevel devuelve valores en rango', function() {
  const selector = new RenderingLevelSelector();
  const { min, max } = selector.meatFormulas['tapapecho'].tempRange;

  const raro = selector.selectLevel('tapapecho', 'raro');
  const rosa = selector.selectLevel('tapapecho', 'rosa');
  const gris = selector.selectLevel('tapapecho', 'gris');

  runner.assert(raro >= min && raro <= max, 'Raro en rango');
  runner.assert(rosa >= min && rosa <= max, 'Rosa en rango');
  runner.assert(gris >= min && gris <= max, 'Gris en rango');
});

runner.test('selectLevel lanza error con carne inválida', function() {
  const selector = new RenderingLevelSelector();

  try {
    selector.selectLevel('carne_inexistente', 'rosa');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no válido'), 'Mensaje de error correcto');
  }
});

runner.test('selectLevel lanza error con nivel inválido', function() {
  const selector = new RenderingLevelSelector();

  try {
    selector.selectLevel('tapapecho', 'nivel_inexistente');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('inválido'), 'Mensaje de error correcto');
  }
});

// ========================= TEMPERATURAS POR CARNE =========================
runner.test('getTempsForMeat devuelve objeto completo', function() {
  const selector = new RenderingLevelSelector();
  const temps = selector.getTempsForMeat('tapapecho');

  runner.assert(temps.raro !== undefined, 'Tiene temperatura raro');
  runner.assert(temps.rosa !== undefined, 'Tiene temperatura rosa');
  runner.assert(temps.gris !== undefined, 'Tiene temperatura gris');
  runner.assert(temps.raro < temps.rosa && temps.rosa < temps.gris, 'Orden correcto');
});

runner.test('getTempsForMeat lanza error con carne inválida', function() {
  const selector = new RenderingLevelSelector();

  try {
    selector.getTempsForMeat('carne_inexistente');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no válido'), 'Error correctamente lanzado');
  }
});

// ========================= VALIDACIÓN DE NIVEL =========================
runner.test('isValidLevel valida correctamente', function() {
  const selector = new RenderingLevelSelector();

  runner.assertEqual(selector.isValidLevel('tapapecho', 'raro'), true, 'Raro válido');
  runner.assertEqual(selector.isValidLevel('tapapecho', 'rosa'), true, 'Rosa válido');
  runner.assertEqual(selector.isValidLevel('tapapecho', 'gris'), true, 'Gris válido');
  runner.assertEqual(selector.isValidLevel('tapapecho', 'invalid'), false, 'Invalid level');
  runner.assertEqual(selector.isValidLevel('carne_inexistente', 'rosa'), false, 'Carne inválida');
});

// ========================= DESCRIPCIONES =========================
runner.test('getLevelDescription devuelve textos correctos', function() {
  const selector = new RenderingLevelSelector();

  const descRaro = selector.getLevelDescription('raro');
  const descRosa = selector.getLevelDescription('rosa');
  const descGris = selector.getLevelDescription('gris');

  runner.assert(descRaro.includes('Muy rojo'), 'Descripción raro correcta');
  runner.assert(descRosa.includes('Rojo/Jugoso'), 'Descripción rosa correcta');
  runner.assert(descGris.includes('Bien cocido'), 'Descripción gris correcta');
});

// ========================= INFORMACIÓN DE NIVEL =========================
runner.test('getLevelInfo devuelve información completa', function() {
  const selector = new RenderingLevelSelector();
  const info = selector.getLevelInfo('tapapecho', 'rosa');

  runner.assertEqual(info.meatType, 'tapapecho', 'Tipo de carne correcto');
  runner.assertEqual(info.level, 'rosa', 'Nivel correcto');
  runner.assert(info.temperatureC > 0, 'Temperatura C positiva');
  runner.assert(info.temperatureF > 0, 'Temperatura F positiva');
  runner.assert(info.description !== undefined, 'Tiene descripción');
  runner.assert(info.progressInRange >= 0 && info.progressInRange <= 100, 'Progreso válido');
});

runner.test('getLevelInfo lanza error con combinación inválida', function() {
  const selector = new RenderingLevelSelector();

  try {
    selector.getLevelInfo('tapapecho', 'invalid_level');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('inválida'), 'Error correcto');
  }
});

// ========================= RESUMEN =========================
runner.test('getSummary devuelve todos los niveles', function() {
  const selector = new RenderingLevelSelector();
  const summary = selector.getSummary('tapapecho');

  runner.assertEqual(summary.meatType, 'tapapecho', 'Tipo correcto');
  runner.assert(summary.meatName !== undefined, 'Tiene nombre');
  runner.assert(summary.meatDescription !== undefined, 'Tiene descripción');
  runner.assert(summary.levels.raro !== undefined, 'Tiene nivel raro');
  runner.assert(summary.levels.rosa !== undefined, 'Tiene nivel rosa');
  runner.assert(summary.levels.gris !== undefined, 'Tiene nivel gris');
});

runner.test('getSummary lanza error con carne inválida', function() {
  const selector = new RenderingLevelSelector();

  try {
    selector.getSummary('carne_inexistente');
    throw new Error('No debería llegar aquí');
  } catch (err) {
    runner.assert(err.message.includes('no válido'), 'Error correcto');
  }
});

// ========================= LISTADO DE CARNES =========================
runner.test('getAvailableMeats devuelve lista completa', function() {
  const selector = new RenderingLevelSelector();
  const meats = selector.getAvailableMeats();

  runner.assert(Array.isArray(meats), 'Devuelve array');
  runner.assert(meats.length >= 8, 'Al menos 8 carnes');
  runner.assert(meats.includes('tapapecho'), 'Incluye brisket');
  runner.assert(meats.includes('pollo_entero'), 'Incluye pollo');
});

// ========================= INFORMACIÓN DE CARNE =========================
runner.test('getMeatInfo devuelve información correcta', function() {
  const selector = new RenderingLevelSelector();
  const info = selector.getMeatInfo('tapapecho');

  runner.assertEqual(info.meatType, 'tapapecho', 'Tipo correcto');
  runner.assert(info.name !== undefined, 'Tiene nombre');
  runner.assert(info.description !== undefined, 'Tiene descripción');
  runner.assert(info.tempRange !== undefined, 'Tiene rango de temp');
  runner.assert(info.rangeSpan > 0, 'Rango tiene amplitud');
});

runner.test('getMeatInfo con todas las carnes', function() {
  const selector = new RenderingLevelSelector();

  for (const meatType of selector.getAvailableMeats()) {
    const info = selector.getMeatInfo(meatType);
    runner.assert(info.tempRange.min < info.tempRange.max, `${meatType} rango válido`);
  }
});

// ========================= RANGOS DE TEMPERATURA =========================
runner.test('Rangos de temperatura son lógicos', function() {
  const selector = new RenderingLevelSelector();

  // Carnes de res: rangos altos (55-80°C)
  const brisketRange = selector.meatFormulas['tapapecho'].tempRange;
  runner.assert(brisketRange.min >= 50, 'Brisket mín >= 50');
  runner.assert(brisketRange.max <= 85, 'Brisket máx <= 85');

  // Carnes de ave: rangos estrechos y altos (72-74°C)
  const polloRange = selector.meatFormulas['pollo_entero'].tempRange;
  runner.assert(polloRange.min >= 72, 'Pollo mín >= 72 (seguridad)');
  runner.assert(polloRange.max <= 75, 'Pollo máx <= 75');
});

// ========================= INYECCIÓN DE FÓRMULAS =========================
runner.test('Constructor acepta fórmulas inyectadas', function() {
  const customFormulas = {
    test_meat: {
      name: 'Test Meat',
      tempRange: { min: 40, max: 70 },
      description: 'Test'
    }
  };

  const selector = new RenderingLevelSelector(customFormulas);
  const temps = selector.getTempsForMeat('test_meat');

  runner.assert(temps.raro !== undefined, 'Fórmulas inyectadas funcionan');
});

// ================================================================
// EJECUTAR TODOS LOS TESTS
// ================================================================
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
