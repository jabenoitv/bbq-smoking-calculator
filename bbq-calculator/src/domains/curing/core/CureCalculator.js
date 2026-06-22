/**
 * CureCalculator - Motor de cálculo de curaciones
 * Responsabilidad única: Cálculo de curaciones (bacon, pastrami, corned beef, jerky)
 */

import { CURE_PROFILES, CURE_STANDARDS } from './curings-data.js';

class CureCalculator {
  /**
   * Obtiene todos los perfiles de cura disponibles
   * @returns {Object} Diccionario de perfiles
   */
  static getCureProfiles() {
    return { ...CURE_PROFILES };
  }

  /**
   * Calcula la cantidad de sal, azúcar y tiempo para una cura
   * @param {Object} params
   *   - cureType {string}: bacon, pastrami, corned_beef, jerky
   *   - weightKg {number}: Peso de la carne en kg
   *   - thickness {number}: Espesor aproximado en cm (afecta penetración)
   * @returns {Object} Resultado del cálculo
   */
  static calculate(params) {
    const { cureType, weightKg, thickness } = params;

    if (!cureType || !weightKg || !thickness) {
      throw new Error('Missing required parameters: cureType, weightKg, thickness');
    }

    const profile = CURE_PROFILES[cureType];
    if (!profile) {
      throw new Error(`Unknown cure type: ${cureType}`);
    }

    // Conversión a gramos
    const weightGrams = weightKg * 1000;

    // Calcular cantidades
    const saltGrams = (weightGrams * profile.saltPct) / 100;
    const pinkSaltGrams = (weightGrams * profile.pinkSaltPct) / 100;
    const sugarGrams = (weightGrams * profile.sugarPct) / 100;

    // Ajustar tiempo de cura basado en espesor
    // Aproximadamente 2-3 días per cm de espesor, mínimo lo indicado
    const estimatedCureDays = Math.max(
      profile.cureMinDays,
      Math.ceil(thickness * 2.5)
    );

    return {
      cureType,
      name: profile.name,
      weightKg,
      thickness,
      saltGrams: Math.round(saltGrams * 10) / 10, // 1 decimal
      pinkSaltGrams: Math.round(pinkSaltGrams * 100) / 100, // 2 decimals
      sugarGrams: Math.round(sugarGrams * 10) / 10,
      cureDays: estimatedCureDays,
      postCureDays: profile.postCureDays,
      totalDays: estimatedCureDays + profile.postCureDays,
      tempRange: profile.postCureTemp,
      woodSuggestion: profile.woodSuggestion,
      method: profile.method,
      notes: profile.notes,
      startDate: new Date().toISOString(),
      estimatedCompletionDate: CureCalculator.addDays(
        new Date(),
        estimatedCureDays + profile.postCureDays
      ).toISOString()
    };
  }

  /**
   * Calcula la cantidad total de sal (regular + curing salt)
   * @param {Object} cureResult - Resultado de calculate()
   * @returns {number} Gramos totales de sal
   */
  static getTotalSalt(cureResult) {
    return cureResult.saltGrams + cureResult.pinkSaltGrams;
  }

  /**
   * Valida que los parámetros sean seguros según estándares USDA
   * @param {Object} cureResult - Resultado de calculate()
   * @returns {Object} { isValid, warnings }
   */
  static validateSafety(cureResult) {
    const warnings = [];

    // Verificar que la concentración de Cure #1 sea segura
    const totalWeightGrams = cureResult.weightKg * 1000;
    const nitriteConcentration = (cureResult.pinkSaltGrams / totalWeightGrams) * 100;

    if (nitriteConcentration > 0.25) {
      warnings.push(
        `Curing salt concentration (${nitriteConcentration.toFixed(2)}%) exceeds USDA limit (0.25%)`
      );
    }

    // Advertir si el tiempo es muy corto
    if (cureResult.cureDays < 3) {
      warnings.push('Cure time is very short; penetration may be incomplete');
    }

    // Advertir si es muy largo (oxidación)
    if (cureResult.cureDays > 30) {
      warnings.push('Cure time is very long; risk of over-salting');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Genera un string con las instrucciones de la receta
   * @param {Object} cureResult - Resultado de calculate()
   * @returns {string} Instrucciones formateadas
   */
  static renderRecipe(cureResult) {
    const { name, saltGrams, pinkSaltGrams, sugarGrams, cureDays, postCureDays, woodSuggestion, notes } = cureResult;

    return `
${name.toUpperCase()} RECIPE
${'='.repeat(40)}

INGREDIENTS (for ${cureResult.weightKg}kg meat):
  • Regular salt: ${saltGrams}g
  • Curing salt (#1): ${pinkSaltGrams}g
  • Sugar: ${sugarGrams}g

INSTRUCTIONS:
  1. Mix all salts and sugar together
  2. Rub mixture evenly on all surfaces of meat
  3. Vacuum seal or wrap tightly
  4. Refrigerate for ${cureDays} days
  5. Rinse thoroughly under running water
  6. Pat dry and hang to cure for ${postCureDays} more days
  7. Maintain temperature: ${cureResult.tempRange.min}–${cureResult.tempRange.max}°C

SMOKING TIPS:
  • Use ${woodSuggestion}
  • Smoke at low temperature (50-70°C)
  • Total smoking time: 2-4 hours depending on size

NOTES:
  ${notes}

Estimated completion: ${new Date(cureResult.estimatedCompletionDate).toLocaleDateString()}
    `.trim();
  }

  /**
   * Helper: Añade días a una fecha
   * @private
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Calcula el progreso de una cura activa
   * @param {Object} activeCure - Objeto con startDate y estimatedCompletionDate
   * @returns {Object} { percentComplete, daysRemaining, isComplete }
   */
  static getProgress(activeCure) {
    const now = new Date();
    const start = new Date(activeCure.startDate);
    const end = new Date(activeCure.estimatedCompletionDate);

    const totalTime = end - start;
    const elapsedTime = now - start;
    const percentComplete = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    return {
      percentComplete: Math.round(percentComplete),
      daysRemaining,
      isComplete: now >= end
    };
  }
}

export default CureCalculator;
