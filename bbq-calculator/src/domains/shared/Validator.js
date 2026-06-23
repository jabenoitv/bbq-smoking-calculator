/**
 * Validator - Multi-layer validation for BBQ data
 * Responsabilidad única: Validación schema, reglas de negocio, y restricciones físicas
 */

class Validator {
  /**
   * Valida parámetros de cálculo BBQ
   * @param {Object} params - { meatType, weight, temp, ... }
   * @returns {Object} { isValid, errors, warnings }
   */
  static validateBBQParams(params) {
    const errors = [];
    const warnings = [];

    // Schema validation
    if (!params.meatType) {
      errors.push('meatType is required');
    }
    if (typeof params.weight !== 'number' || params.weight <= 0) {
      errors.push('weight must be a positive number');
    }
    if (!params.temp || typeof params.temp !== 'number') {
      errors.push('temp must be a positive number');
    }

    // Range validation
    if (params.weight && (params.weight < 0.5 || params.weight > 50)) {
      warnings.push('weight is outside typical range (0.5-50kg)');
    }
    if (params.temp && (params.temp < 100 || params.temp > 300)) {
      warnings.push('temp is outside typical smoking range (100-300°C)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida parámetros de cura
   * @param {Object} params - { cureType, weightKg, thickness }
   * @returns {Object} { isValid, errors, warnings }
   */
  static validateCureParams(params) {
    const errors = [];
    const warnings = [];

    if (!params.cureType) {
      errors.push('cureType is required');
    }
    if (!params.weightKg || typeof params.weightKg !== 'number') {
      errors.push('weightKg must be a positive number');
    }
    if (!params.thickness || typeof params.thickness !== 'number') {
      errors.push('thickness must be a positive number (cm)');
    }

    if (params.weightKg && (params.weightKg < 0.5 || params.weightKg > 50)) {
      warnings.push('weightKg is outside typical range (0.5-50kg)');
    }
    if (params.thickness && (params.thickness < 0.5 || params.thickness > 20)) {
      warnings.push('thickness is outside typical range (0.5-20cm)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida resultado de cálculo BBQ
   * @param {Object} result - Resultado de BBQEngine.calculate()
   * @returns {Object} { isValid, errors, warnings }
   */
  static validateBBQResult(result) {
    const errors = [];
    const warnings = [];

    if (!result.totalMinutes || result.totalMinutes <= 0) {
      errors.push('totalMinutes must be positive');
    }
    if (!result.internalTempC || result.internalTempC <= 0) {
      errors.push('internalTempC must be positive');
    }
    if (!result.phases || !Array.isArray(result.phases)) {
      errors.push('phases must be array');
    }

    // Physical constraints
    if (result.totalMinutes > 24 * 60) {
      warnings.push('totalMinutes exceeds 24 hours');
    }
    if (result.internalTempC > 100) {
      warnings.push('internalTempC exceeds boiling point');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida temperatura (rango físico)
   * @param {number} tempC
   * @returns {Object} { isValid, errors, warnings }
   */
  static validateTemperature(tempC) {
    const errors = [];
    const warnings = [];

    if (typeof tempC !== 'number') {
      errors.push('Temperature must be a number');
    } else if (tempC < -273.15) {
      errors.push('Temperature below absolute zero');
    } else if (tempC > 1000) {
      warnings.push('Temperature exceeds typical BBQ range');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida peso
   * @param {number} weightKg
   * @returns {Object} { isValid, errors, warnings }
   */
  static validateWeight(weightKg) {
    const errors = [];
    const warnings = [];

    if (typeof weightKg !== 'number') {
      errors.push('Weight must be a number');
    } else if (weightKg <= 0) {
      errors.push('Weight must be positive');
    } else if (weightKg > 100) {
      warnings.push('Weight exceeds typical range (>100kg)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida email
   * @param {string} email
   * @returns {boolean}
   */
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Valida que objeto tenga todas las propiedades requeridas
   * @param {Object} obj
   * @param {string[]} requiredProps
   * @returns {Object} { isValid, missingProps }
   */
  static validateRequired(obj, requiredProps) {
    const missingProps = requiredProps.filter(prop => !(prop in obj));
    return {
      isValid: missingProps.length === 0,
      missingProps
    };
  }

  /**
   * Valida que todos los valores sean numéricos
   * @param {Object} obj
   * @param {string[]} numericProps
   * @returns {Object} { isValid, invalidProps }
   */
  static validateNumeric(obj, numericProps) {
    const invalidProps = numericProps.filter(prop => typeof obj[prop] !== 'number');
    return {
      isValid: invalidProps.length === 0,
      invalidProps
    };
  }
}

export default Validator;
