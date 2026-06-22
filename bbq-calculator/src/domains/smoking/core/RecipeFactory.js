/**
 * RecipeFactory - Factory helper para crear recetas
 * Responsabilidad única: Convertir inputs de usuario a formato estándar de receta
 */
class RecipeFactory {
  /**
   * Crea una receta a partir de inputs del wizard
   * @param {Object} formData - Datos del formulario del wizard
   * @returns {Object} Receta en formato estándar
   */
  static createFromWizard(formData) {
    return {
      id: RecipeFactory.generateId(),
      meatType: formData.meatType,
      weightKg: RecipeFactory.normalizeWeight(formData.weightKg, formData.weightUnit),
      smokingTempC: RecipeFactory.normalizeTemp(formData.smokingTempC, formData.tempUnit),
      renderingLevel: formData.renderingLevel || 'rosa',
      wrapped: formData.wrapped || false,
      altitudeM: formData.altitudeM || 0,
      createdAt: new Date().toISOString(),
      metadata: {
        userNotes: formData.notes || '',
        source: 'wizard'
      }
    };
  }

  /**
   * Crea una receta a partir de un resultado de cálculo
   * @param {Object} result - Resultado del BBQEngine.calculate()
   * @param {string} name - Nombre descriptivo de la receta
   * @returns {Object} Receta guardable
   */
  static createFromResult(result, name = '') {
    return {
      id: RecipeFactory.generateId(),
      name: name || `${result.meatType} ${result.weightKg}kg`,
      meatType: result.meatType,
      meatName: result.meatName,
      weightKg: result.weightKg,
      smokingTempC: result.smokingTempC,
      estimatedHours: result.totalTimeMinutes / 60,
      calculatedAt: new Date().toISOString(),
      fullResult: result,
      metadata: {
        source: 'calculation'
      }
    };
  }

  /**
   * Convierte peso a unidad estándar (kg)
   * @private
   */
  static normalizeWeight(value, unit) {
    if (unit === 'lbs') {
      return value / 2.20462; // lbs to kg
    }
    return value; // Already in kg
  }

  /**
   * Convierte temperatura a unidad estándar (°C)
   * @private
   */
  static normalizeTemp(value, unit) {
    if (unit === 'F') {
      return (value - 32) * (5 / 9); // °F to °C
    }
    return value; // Already in °C
  }

  /**
   * Genera un ID único para la receta
   * @private
   */
  static generateId() {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida que una receta tenga todos los campos requeridos
   * @param {Object} recipe - Receta a validar
   * @returns {boolean}
   */
  static isValid(recipe) {
    const required = ['id', 'meatType', 'weightKg', 'smokingTempC'];
    return required.every(field => field in recipe && recipe[field] !== null && recipe[field] !== undefined);
  }
}

export default RecipeFactory;
