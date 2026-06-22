/**
 * RenderingLevelSelector - Mapeo de niveles de renderización a temperaturas
 * Responsabilidad única: Seleccionar temperatura según nivel de cocción deseado
 *
 * Niveles de renderización BBQ:
 * - Raro (muy rojo): ~15% del rango de temperatura
 * - Rosa (rojo/jugoso): ~50% del rango (default)
 * - Gris (bien cocido): ~85% del rango
 */
class RenderingLevelSelector {
  constructor(meatFormulas = null) {
    this.meatFormulas = meatFormulas || this.getDefaultMeatFormulas();
  }

  /**
   * Obtiene las fórmulas de carne con sus rangos de temperatura
   * Permite inyectar fórmulas externas (ej. desde BBQEngine)
   */
  getDefaultMeatFormulas() {
    return {
      tapapecho: {
        name: 'Tapapecho (Brisket)',
        tempRange: { min: 55, max: 80 },
        description: 'Brisket chileno. Corteza gruesa, interior rojo y jugoso.'
      },
      plateada: {
        name: 'Plateada',
        tempRange: { min: 55, max: 78 },
        description: 'Plateada: Corteza gruesa, interior rojo y jugoso.'
      },
      punta_ganso: {
        name: 'Punta de Ganso (Picaña)',
        tempRange: { min: 50, max: 68 },
        description: 'Picaña: Término medio-raro, corteza crujiente.'
      },
      asado_tira: {
        name: 'Asado de Tira (Short Ribs)',
        tempRange: { min: 58, max: 82 },
        description: 'Short Ribs: Corteza gruesa, interior rojo y tierno.'
      },
      paleta_cerdo: {
        name: 'Paleta de Cerdo (Pork Shoulder)',
        tempRange: { min: 55, max: 75 },
        description: 'Pulled Pork: Rosa/rojo, jugoso.'
      },
      costillar_cerdo: {
        name: 'Costillar de Cerdo (Pork Ribs)',
        tempRange: { min: 60, max: 76 },
        description: 'Costillas: Rosa/blanda, cremosa.'
      },
      pollo_entero: {
        name: 'Pollo Entero (Whole Chicken)',
        tempRange: { min: 72, max: 74 },
        description: 'Pollo: Blanco/seguro (72°C mínimo).'
      },
      pavo_entero: {
        name: 'Pavo Entero (Whole Turkey)',
        tempRange: { min: 73, max: 75 },
        description: 'Pavo: Blanco/seguro (73°C mínimo).'
      }
    };
  }

  /**
   * Selecciona la temperatura para un nivel de renderización específico
   * @param {string} meatType - Tipo de carne
   * @param {string} level - Nivel ('raro' | 'rosa' | 'gris')
   * @returns {number} Temperatura en Celsius
   * @throws Error si la carne o nivel no son válidos
   */
  selectLevel(meatType, level) {
    const formula = this.meatFormulas[meatType];
    if (!formula) {
      throw new Error(`Tipo de carne no válido: ${meatType}`);
    }

    if (!this.isValidLevel(meatType, level)) {
      throw new Error(`Nivel de renderización inválido: ${level}`);
    }

    const { min, max } = formula.tempRange;
    const range = max - min;

    switch (level) {
      case 'raro':
        return min + Math.round(range * 0.15);
      case 'rosa':
        return min + Math.round(range * 0.5);
      case 'gris':
        return max - Math.round(range * 0.15);
      default:
        throw new Error(`Nivel desconocido: ${level}`);
    }
  }

  /**
   * Obtiene todas las temperaturas de renderización para una carne
   * @param {string} meatType - Tipo de carne
   * @returns {Object} { raro: X, rosa: Y, gris: Z }
   * @throws Error si la carne no es válida
   */
  getTempsForMeat(meatType) {
    const formula = this.meatFormulas[meatType];
    if (!formula) {
      throw new Error(`Tipo de carne no válido: ${meatType}`);
    }

    return {
      raro: this.selectLevel(meatType, 'raro'),
      rosa: this.selectLevel(meatType, 'rosa'),
      gris: this.selectLevel(meatType, 'gris')
    };
  }

  /**
   * Verifica si un nivel de renderización es válido
   * @param {string} meatType - Tipo de carne
   * @param {string} level - Nivel a validar
   * @returns {boolean}
   */
  isValidLevel(meatType, level) {
    const formula = this.meatFormulas[meatType];
    if (!formula) return false;

    const validLevels = ['raro', 'rosa', 'gris'];
    return validLevels.includes(level);
  }

  /**
   * Obtiene la descripción de un nivel de renderización
   * @param {string} level - Nivel
   * @returns {string} Descripción
   */
  getLevelDescription(level) {
    const descriptions = {
      raro: '🔴 Muy rojo (15-25°C bajo óptimo)',
      rosa: '🔶 Rojo/Jugoso (5-15°C bajo óptimo) - RECOMENDADO',
      gris: '🟤 Bien cocido (máximo rango)'
    };
    return descriptions[level] || 'Nivel desconocido';
  }

  /**
   * Obtiene información completa sobre un nivel para una carne
   * @param {string} meatType - Tipo de carne
   * @param {string} level - Nivel
   * @returns {Object}
   */
  getLevelInfo(meatType, level) {
    if (!this.isValidLevel(meatType, level)) {
      throw new Error(`Combinación inválida: ${meatType} + ${level}`);
    }

    const formula = this.meatFormulas[meatType];
    const temp = this.selectLevel(meatType, level);

    return {
      meatType,
      meatName: formula.name,
      level,
      description: this.getLevelDescription(level),
      temperatureC: temp,
      temperatureF: Math.round((temp * 9 / 5) + 32),
      tempRange: formula.tempRange,
      progressInRange: ((temp - formula.tempRange.min) / (formula.tempRange.max - formula.tempRange.min)) * 100
    };
  }

  /**
   * Obtiene un resumen de todos los niveles para una carne
   * @param {string} meatType - Tipo de carne
   * @returns {Object}
   */
  getSummary(meatType) {
    const formula = this.meatFormulas[meatType];
    if (!formula) {
      throw new Error(`Tipo de carne no válido: ${meatType}`);
    }

    return {
      meatType,
      meatName: formula.name,
      meatDescription: formula.description,
      tempRange: formula.tempRange,
      levels: {
        raro: this.getLevelInfo(meatType, 'raro'),
        rosa: this.getLevelInfo(meatType, 'rosa'),
        gris: this.getLevelInfo(meatType, 'gris')
      }
    };
  }

  /**
   * Lista todos los tipos de carne disponibles
   * @returns {Array}
   */
  getAvailableMeats() {
    return Object.keys(this.meatFormulas);
  }

  /**
   * Obtiene información de una carne
   * @param {string} meatType - Tipo de carne
   * @returns {Object}
   */
  getMeatInfo(meatType) {
    const formula = this.meatFormulas[meatType];
    if (!formula) {
      throw new Error(`Tipo de carne no válido: ${meatType}`);
    }

    return {
      meatType,
      name: formula.name,
      description: formula.description,
      tempRange: formula.tempRange,
      rangeSpan: formula.tempRange.max - formula.tempRange.min
    };
  }
}

export default RenderingLevelSelector;
