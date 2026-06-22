import EventEmitter from './EventEmitter.js';

/**
 * BBQEngine - Motor de cálculo de cocción BBQ
 * Responsabilidad única: Cálculos de cocción BBQ puro, sin DOM
 *
 * MODELO COMPLETO DE TERNEZA (Tenderness Index) - BBQtrail
 * Cada carne tiene 3 fases de cocción:
 * 1. RAMP-UP: 25°C → 62°C (rápido, bark se forma)
 * 2. STALL: 62-68°C (LENTO, evaporación de humedad, terneza)
 * 3. PUSH: 68°C → objetivo (rápido, tiernización final)
 */
class BBQEngine extends EventEmitter {
  constructor() {
    super();
    this.weightUnit = 'kg';
    this.tempUnit = 'C';
    this.userDesiredRedTemp = null;
  }

  /**
   * Obtiene el diccionario completo de fórmulas de cocción
   * @returns {Object} Diccionario de carnes con sus parámetros
   */
  getMeatFormulas() {
    return {
      tapapecho: {
        name: 'Tapapecho (Brisket)',
        rampUpRate: 0.35,
        stallBaseHours: 4.0,
        stallRetardationFactor: 2.5,
        pushUpRate: 0.25,
        barkFormationHours: 2.5,
        wrapDecisionTempC: 63,
        wrapAccelerationFactor: 0.65,
        minTempC: 25,
        desiredRedTempC: 63,
        tempRange: { min: 55, max: 80 },
        standardWeightKg: 4.5,
        holdingMin: 60,
        description: 'Brisket chileno. Corteza gruesa, interior rojo y jugoso.'
      },
      plateada: {
        name: 'Plateada',
        rampUpRate: 0.36,
        stallBaseHours: 3.5,
        stallRetardationFactor: 2.3,
        pushUpRate: 0.26,
        barkFormationHours: 2.2,
        wrapDecisionTempC: 63,
        wrapAccelerationFactor: 0.65,
        minTempC: 25,
        desiredRedTempC: 63,
        tempRange: { min: 55, max: 78 },
        standardWeightKg: 4.0,
        holdingMin: 45,
        description: 'Plateada: Corteza gruesa, interior rojo y jugoso. Stall ligeramente más corto.'
      },
      punta_ganso: {
        name: 'Punta de Ganso (Picaña)',
        rampUpRate: 0.40,
        stallBaseHours: 1.5,
        stallRetardationFactor: 1.8,
        pushUpRate: 0.30,
        barkFormationHours: 1.5,
        wrapDecisionTempC: 55,
        wrapAccelerationFactor: 0.70,
        minTempC: 25,
        desiredRedTempC: 62,
        tempRange: { min: 50, max: 68 },
        standardWeightKg: 2.5,
        holdingMin: 15,
        description: 'Picaña: Término medio-raro, corteza crujiente. Stall corto, NO fall-apart.'
      },
      asado_tira: {
        name: 'Asado de Tira (Short Ribs)',
        rampUpRate: 0.34,
        stallBaseHours: 3.5,
        stallRetardationFactor: 2.4,
        pushUpRate: 0.24,
        barkFormationHours: 2.3,
        wrapDecisionTempC: 63,
        wrapAccelerationFactor: 0.65,
        minTempC: 25,
        desiredRedTempC: 65,
        tempRange: { min: 58, max: 82 },
        standardWeightKg: 3.0,
        holdingMin: 30,
        description: 'Short Ribs: Corteza gruesa, interior rojo y tierno. Cocción larga similar a brisket.'
      },
      paleta_cerdo: {
        name: 'Paleta de Cerdo (Pork Shoulder)',
        rampUpRate: 0.33,
        stallBaseHours: 4.5,
        stallRetardationFactor: 2.6,
        pushUpRate: 0.23,
        barkFormationHours: 2.8,
        wrapDecisionTempC: 64,
        wrapAccelerationFactor: 0.63,
        minTempC: 25,
        desiredRedTempC: 60,
        tempRange: { min: 55, max: 75 },
        standardWeightKg: 5.0,
        holdingMin: 90,
        description: 'Pulled Pork: Rosa/rojo, jugoso. Stall extra largo para tierneza óptima.'
      },
      costillar_cerdo: {
        name: 'Costillar de Cerdo (Pork Ribs)',
        rampUpRate: 0.38,
        stallBaseHours: 2.5,
        stallRetardationFactor: 2.0,
        pushUpRate: 0.28,
        barkFormationHours: 1.8,
        wrapDecisionTempC: 62,
        wrapAccelerationFactor: 0.68,
        minTempC: 25,
        desiredRedTempC: 62,
        tempRange: { min: 60, max: 76 },
        standardWeightKg: 2.0,
        holdingMin: 15,
        description: 'Costillas: Rosa/blanda, cremosa. Método 3-2-1.'
      },
      pollo_entero: {
        name: 'Pollo Entero (Whole Chicken)',
        rampUpRate: 0.45,
        stallBaseHours: 1.0,
        stallRetardationFactor: 1.4,
        pushUpRate: 0.35,
        barkFormationHours: 1.0,
        wrapDecisionTempC: 70,
        wrapAccelerationFactor: 0.75,
        minTempC: 25,
        desiredRedTempC: 72,
        tempRange: { min: 72, max: 74 },
        standardWeightKg: 1.8,
        holdingMin: 10,
        description: 'Pollo: Blanco/seguro (72°C mínimo). Cocción rápida, stall mínimo.'
      },
      pavo_entero: {
        name: 'Pavo Entero (Whole Turkey)',
        rampUpRate: 0.42,
        stallBaseHours: 2.0,
        stallRetardationFactor: 1.9,
        pushUpRate: 0.32,
        barkFormationHours: 2.0,
        wrapDecisionTempC: 70,
        wrapAccelerationFactor: 0.72,
        minTempC: 25,
        desiredRedTempC: 73,
        tempRange: { min: 73, max: 75 },
        standardWeightKg: 5.5,
        holdingMin: 20,
        description: 'Pavo: Blanco/seguro (73°C mínimo). Cocción lenta pero sin stall extremo.'
      }
    };
  }

  // ========================= CONVERSIONES =========================

  /**
   * Convierte Celsius a Fahrenheit
   * @param {number} c - Temperatura en Celsius
   * @returns {number} Temperatura en Fahrenheit
   */
  celsiusToFahrenheit(c) {
    return Math.round((c * 9 / 5) + 32);
  }

  /**
   * Convierte Fahrenheit a Celsius
   * @param {number} f - Temperatura en Fahrenheit
   * @returns {number} Temperatura en Celsius
   */
  fahrenheitToCelsius(f) {
    return Math.round(((f - 32) * 5 / 9) * 10) / 10;
  }

  /**
   * Convierte kg a libras
   * @param {number} kg - Peso en kilogramos
   * @returns {number} Peso en libras
   */
  kgToLbs(kg) {
    return Math.round(kg * 2.20462 * 10) / 10;
  }

  /**
   * Convierte libras a kg
   * @param {number} lbs - Peso en libras
   * @returns {number} Peso en kilogramos
   */
  lbsToKg(lbs) {
    return Math.round(lbs * 0.453592 * 10) / 10;
  }

  /**
   * CONVERSIONES ESTÁTICAS - Funciones puras sin estado
   * Útiles cuando solo necesitas una conversión rápida sin instancia
   */

  /**
   * Conversión estática: Celsius a Fahrenheit
   * @param {number} c - Temperatura en Celsius
   * @returns {number} Temperatura en Fahrenheit
   */
  static convertTemp(value, fromUnit, toUnit) {
    if (fromUnit === 'C' && toUnit === 'F') {
      return Math.round((value * 9 / 5) + 32);
    } else if (fromUnit === 'F' && toUnit === 'C') {
      return Math.round(((value - 32) * 5 / 9) * 10) / 10;
    }
    return value;
  }

  /**
   * Conversión estática: Peso
   * @param {number} value - Valor a convertir
   * @param {string} fromUnit - Unidad origen ('kg' o 'lbs')
   * @param {string} toUnit - Unidad destino ('kg' o 'lbs')
   * @returns {number} Peso convertido
   */
  static convertWeight(value, fromUnit, toUnit) {
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return Math.round(value * 2.20462 * 10) / 10;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      return Math.round(value * 0.453592 * 10) / 10;
    }
    return value;
  }

  // ========================= AJUSTES POR ALTITUD =========================

  /**
   * Aplica ajuste de cocción por altitud
   * Fórmula: +8% de tiempo por cada 1000m de elevación
   * @param {number} timeMinutes - Tiempo de cocción en minutos
   * @param {number} altitudeM - Altitud en metros
   * @returns {number} Tiempo ajustado en minutos
   */
  applyAltitudeAdjustment(timeMinutes, altitudeM) {
    const factor = this.getAltitudeAdjustmentFactor(altitudeM);
    return Math.round(timeMinutes * factor);
  }

  /**
   * Calcula el factor multiplicador de altitud
   * @param {number} altitudeM - Altitud en metros
   * @returns {number} Factor multiplicador (1.0 = sin ajuste, 1.08 = +8% a 1000m)
   */
  getAltitudeAdjustmentFactor(altitudeM) {
    const adjustment = 0.08;
    const metersPerUnit = 1000;
    return 1 + (altitudeM / metersPerUnit) * adjustment;
  }

  // ========================= NIVELES DE RENDERIZACIÓN =========================

  /**
   * Selecciona temperatura según el nivel de renderización deseado
   * @param {string} meatType - Tipo de carne
   * @param {string} level - Nivel ('raro' | 'rosa' | 'gris')
   * @returns {number} Temperatura en Celsius
   */
  selectRenderingLevel(meatType, level) {
    const formula = this.getMeatFormulas()[meatType];
    if (!formula) throw new Error(`Tipo de carne no válido: ${meatType}`);

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
        return formula.desiredRedTempC;
    }
  }

  /**
   * Obtiene todas las temperaturas de renderización para una carne
   * @param {string} meatType - Tipo de carne
   * @returns {Object} { raro, rosa, gris }
   */
  getTempsForMeat(meatType) {
    return {
      raro: this.selectRenderingLevel(meatType, 'raro'),
      rosa: this.selectRenderingLevel(meatType, 'rosa'),
      gris: this.selectRenderingLevel(meatType, 'gris')
    };
  }

  // ========================= CÁLCULO PRINCIPAL =========================

  /**
   * Calcula el tiempo total de ahumado y todas sus fases
   * @param {Object} params - Parámetros del cálculo
   * @param {string} params.meatType - Tipo de carne
   * @param {number} params.weightKg - Peso en kilogramos
   * @param {number} params.smokingTempC - Temperatura de ahumado en Celsius
   * @param {number} params.desiredRedTempC - Temperatura roja deseada (opcional)
   * @param {boolean} params.wrapped - ¿Envuelta? (default: false)
   * @param {number} params.altitudeM - Altitud en metros (default: 0)
   * @returns {Object} Resultado completo del cálculo
   */
  calculate(params) {
    this.emit('calculation-started');

    try {
      const {
        meatType,
        weightKg,
        smokingTempC,
        desiredRedTempC = null,
        wrapped = false,
        altitudeM = 0
      } = params;

      const formula = this.getMeatFormulas()[meatType];
      if (!formula) throw new Error('Tipo de carne inválido');

      // ==================== MODELO COMPLETO DE TERNEZA ====================
      // FASE 1: RAMP-UP (25°C → 62°C)
      const rampUpTempDiff = 62 - 25;
      const rampUpMinutes = rampUpTempDiff / formula.rampUpRate;

      // FASE 2: STALL (62-68°C)
      const stallMinutes = this.calculateStallTime(formula, weightKg, smokingTempC);
      const stallMinutesAdjusted = wrapped
        ? stallMinutes * formula.wrapAccelerationFactor
        : stallMinutes;

      // FASE 3: RENDERIZACIÓN (68°C → objetivo)
      const finalDesiredTempC = desiredRedTempC || formula.desiredRedTempC;
      const pushTempDiff = finalDesiredTempC - 68;
      const pushMinutes = pushTempDiff / formula.pushUpRate;

      // Total de tiempo (sin ajuste por altitud aún)
      let totalMinutes = Math.round(rampUpMinutes + stallMinutesAdjusted + pushMinutes);

      // Aplicar ajuste por altitud si se proporciona
      if (altitudeM > 0) {
        totalMinutes = this.applyAltitudeAdjustment(totalMinutes, altitudeM);
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Generar timeline con EVENTOS
      const events = [
        {
          at: 0,
          msg: '🔥 Iniciar ahumado',
          phase: 'start'
        },
        {
          at: Math.round(rampUpMinutes),
          msg: '🌳 Bark se está formando - mantén la tapa cerrada',
          phase: 'bark'
        },
        {
          at: Math.round(rampUpMinutes + 30),
          msg: `⚠️ STALL detectado (${formula.stallBaseHours.toFixed(1)}h aprox) ${!wrapped ? '- CONSIDERA ENVOLVER' : '(ya envuelto)'}`,
          phase: 'stall_warning'
        },
        {
          at: Math.round(rampUpMinutes + stallMinutesAdjusted),
          msg: '✅ Stall superado - recta final hacia la terneza',
          phase: 'stall_end'
        },
        {
          at: Math.round(totalMinutes - 15),
          msg: '🔔 Últimos 15 minutos - prepara el reposo',
          phase: 'final_alert'
        },
        {
          at: totalMinutes,
          msg: `✅ RENDERIZACIÓN LISTA @ ${finalDesiredTempC}°C (rojo/jugoso) - REPOSA ${formula.holdingMin} min`,
          phase: 'done'
        }
      ];

      // Fases (para visual)
      const phases = [
        {
          name: 'Ramp-up',
          duration: Math.round(rampUpMinutes),
          tempRange: [25, 62],
          percent: (rampUpMinutes / totalMinutes) * 100
        },
        {
          name: 'STALL',
          duration: Math.round(stallMinutesAdjusted),
          tempRange: [62, 68],
          percent: (stallMinutesAdjusted / totalMinutes) * 100,
          wrapped,
          warning: true
        },
        {
          name: 'Renderización',
          duration: Math.round(pushMinutes),
          tempRange: [68, finalDesiredTempC],
          percent: (pushMinutes / totalMinutes) * 100
        }
      ];

      // Generar progresión de temperatura
      const temperatureRange = this.generateTempRange(25, finalDesiredTempC, 8);

      // Resultado final
      const result = {
        id: Date.now(),
        meatType,
        meatName: formula.name,
        weightKg: Math.round(weightKg * 100) / 100,
        weightLbs: this.kgToLbs(weightKg),
        smokingTempC: Math.round(smokingTempC),
        smokingTempF: this.celsiusToFahrenheit(smokingTempC),
        estimatedCookingHours: hours,
        estimatedCookingMinutes: minutes,
        totalMinutes: totalMinutes,
        minTempC: 25,
        minTempF: this.celsiusToFahrenheit(25),
        desiredRedTempC: finalDesiredTempC,
        desiredRedTempF: this.celsiusToFahrenheit(finalDesiredTempC),
        userSelected: desiredRedTempC !== null,
        holdingMin: formula.holdingMin,
        temperatureRange: temperatureRange,
        phases: phases,
        events: events,
        wrapped: wrapped,
        altitudeM: altitudeM,
        altitudeAdjustmentFactor: altitudeM > 0 ? this.getAltitudeAdjustmentFactor(altitudeM) : 1.0,
        formula: formula,
        calculatedAt: new Date().toLocaleString('es-ES')
      };

      this.emit('calculation-complete', result);
      return result;
    } catch (err) {
      this.emit('calculation-error', err);
      throw err;
    }
  }

  /**
   * Calcula duración del STALL (fase crítica de terneza)
   * Fórmula: baseStall × weight^0.8 × tempFactor
   * @param {Object} formula - Fórmula de la carne
   * @param {number} weightKg - Peso en kg
   * @param {number} smokingTempC - Temperatura de ahumado en °C
   * @returns {number} Duración del stall en minutos
   */
  calculateStallTime(formula, weightKg, smokingTempC) {
    const baseStallHours = formula.stallBaseHours;
    const weightFactor = Math.pow(weightKg, 0.8);
    const tempDiffFromBaseline = smokingTempC - 107;
    const tempFactor = Math.max(0.5, 1 - (tempDiffFromBaseline * 0.08));
    const stallHours = baseStallHours * weightFactor * tempFactor;
    return Math.round(stallHours * 60);
  }

  /**
   * Genera rango de temperaturas para gráfico
   * @param {number} minTempC - Temperatura mínima
   * @param {number} maxTempC - Temperatura máxima
   * @param {number} steps - Número de pasos
   * @returns {Array} Array de objetos { tempC, stage }
   */
  generateTempRange(minTempC, maxTempC, steps) {
    const result = [];
    const range = maxTempC - minTempC;

    if (range === 0) {
      const startTemp = 40;
      const stepSize = (maxTempC - startTemp) / steps;
      for (let i = 0; i <= steps; i++) {
        const temp = startTemp + stepSize * i;
        result.push({
          tempC: Math.round(temp),
          stage: this.getStageForProgress(i / steps)
        });
      }
      return result;
    }

    const step = range / steps;
    for (let i = 0; i <= steps; i++) {
      const temp = minTempC + step * i;
      result.push({
        tempC: Math.round(temp),
        stage: this.getStageForProgress(i / steps)
      });
    }
    return result;
  }

  /**
   * Obtiene la etapa de cocción según el progreso
   * @param {number} progress - Progreso de 0 a 1
   * @returns {string} Nombre de la etapa
   */
  getStageForProgress(progress) {
    if (progress < 0.25) return 'Cocción inicial';
    if (progress < 0.55) return 'Stall (meseta)';
    if (progress < 0.85) return 'Cocción avanzada';
    if (progress < 1) return 'Casi listo';
    return 'Listo - retirar';
  }

  /**
   * Obtiene el color para una barra según la temperatura
   * @param {number} tempC - Temperatura actual en °C
   * @param {number} optimalC - Temperatura óptima en °C
   * @param {number} minC - Temperatura mínima en °C
   * @returns {string} Color hex
   */
  getColorForTemp(tempC, optimalC, minC) {
    const range = optimalC - minC;
    if (range === 0) {
      const pct = tempC / optimalC;
      if (pct < 0.5) return '#FF6B6B';
      if (pct < 0.75) return '#FFD93D';
      if (pct < 0.95) return '#6BCB77';
      return '#4D96FF';
    }
    const pct = (tempC - minC) / range;
    if (pct < 0.25) return '#FF6B6B';
    if (pct < 0.55) return '#FFD93D';
    if (pct < 0.85) return '#6BCB77';
    return '#4D96FF';
  }
}

export default BBQEngine;
