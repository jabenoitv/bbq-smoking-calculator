/**
 * CookingCurveCalculator - Generador de datos de gráficas de curva de cocción
 * Responsabilidad única: Convertir fases de cocción a formato Chart.js
 *
 * Genera datos para visualizar:
 * 1. Curva esperada de temperatura durante las 3 fases
 * 2. Interpolación de temperatura en cualquier punto del tiempo
 * 3. Datos formateados para Chart.js
 */
class CookingCurveCalculator {
  constructor() {
    this.phases = null;
    this.totalMinutes = 0;
    this.desiredTemp = 0;
  }

  /**
   * Genera datos de Chart.js desde un resultado de BBQEngine.calculate()
   * @param {Object} result - Resultado de BBQEngine.calculate()
   * @returns {Object} Datos Chart.js { labels, datasets }
   */
  generateFromResult(result) {
    this.phases = result.phases;
    this.totalMinutes = result.totalMinutes;
    this.desiredTemp = result.desiredRedTempC;

    return this.generateFromPhases(
      result.phases,
      result.totalMinutes,
      result.desiredRedTempC
    );
  }

  /**
   * Genera datos de Chart.js desde fases y parámetros
   * @param {Array} phases - Array de fases con { name, duration, tempRange }
   * @param {number} totalMinutes - Duración total
   * @param {number} desiredTemp - Temperatura deseada final
   * @returns {Object} { labels, datasets }
   */
  generateFromPhases(phases, totalMinutes, desiredTemp) {
    if (!phases || phases.length === 0) {
      throw new Error('Se requieren fases para generar curva');
    }

    // Genera puntos cada 30 minutos (2 puntos por hora)
    const interval = 30;
    const numPoints = Math.ceil(totalMinutes / interval) + 1;
    const labels = [];
    const temperatures = [];

    for (let i = 0; i < numPoints; i++) {
      const minutes = i * interval;
      if (minutes <= totalMinutes) {
        labels.push(this.formatTime(minutes));
        temperatures.push(this.interpolateTemp(minutes, phases));
      }
    }

    // Colores para las 3 fases
    const phaseColors = {
      'Ramp-up': '#FF9F1C',      // Naranja: calentamiento rápido
      'STALL': '#FFBE0B',        // Amarillo: meseta (crítico)
      'Renderización': '#6BCB77' // Verde: final
    };

    // Datasets para cada fase
    const datasets = phases.map(phase => {
      const startMinute = this.getPhaseStartTime(phase, phases);
      const endMinute = startMinute + phase.duration;

      // Filtra puntos que caen en esta fase
      const phaseLabels = [];
      const phaseTemps = [];

      for (let i = 0; i < labels.length; i++) {
        const minutes = i * interval;
        if (minutes >= startMinute && minutes <= endMinute) {
          phaseLabels.push(labels[i]);
          phaseTemps.push(temperatures[i]);
        }
      }

      return {
        label: phase.name,
        data: phaseTemps,
        borderColor: phaseColors[phase.name] || '#4D96FF',
        backgroundColor: (phaseColors[phase.name] || '#4D96FF') + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: phaseColors[phase.name] || '#4D96FF',
        pointBorderColor: '#fff',
        pointBorderWidth: 1
      };
    });

    return {
      labels,
      datasets,
      metadata: {
        totalMinutes,
        desiredTemp,
        phases: phases.map(p => ({
          name: p.name,
          duration: p.duration,
          percent: p.percent
        }))
      }
    };
  }

  /**
   * Interpola la temperatura esperada en un tiempo específico
   * @param {number} minutes - Minutos desde el inicio
   * @param {Array} phases - Array de fases
   * @returns {number} Temperatura esperada en °C
   */
  interpolateTemp(minutes, phases = this.phases) {
    if (!phases) {
      throw new Error('Se requieren fases para interpolar temperatura');
    }

    let currentMinute = 0;
    let tempC = 25; // Temperatura inicial

    for (const phase of phases) {
      const phaseStart = currentMinute;
      const phaseEnd = currentMinute + phase.duration;

      if (minutes <= phaseEnd) {
        // Este minuto está en esta fase
        const [phaseMinTemp, phaseMaxTemp] = phase.tempRange;
        const progress = (minutes - phaseStart) / phase.duration;

        // Interpolación lineal dentro de la fase
        tempC = phaseMinTemp + (phaseMaxTemp - phaseMinTemp) * progress;
        return Math.round(tempC * 10) / 10;
      }

      currentMinute = phaseEnd;
    }

    // Si pasamos el final, devolver temperatura deseada
    return this.desiredTemp;
  }

  /**
   * Obtiene el minuto de inicio de una fase
   * @param {Object} phase - Fase a buscar
   * @param {Array} phases - Array de todas las fases
   * @returns {number} Minuto de inicio
   */
  getPhaseStartTime(phase, phases = this.phases) {
    let startTime = 0;
    for (const p of phases) {
      if (p === phase) break;
      startTime += p.duration;
    }
    return startTime;
  }

  /**
   * Formatea minutos como "Xh Ym"
   * @param {number} minutes - Minutos
   * @returns {string}
   */
  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Genera datos para una gráfica de desviación (real vs esperado)
   * @param {Object} result - Resultado de BBQEngine.calculate()
   * @param {Array} measurements - Array de { time, temp } desde cronómetro
   * @returns {Object} { labels, datasets } para Chart.js
   */
  generateDeviationChart(result, measurements) {
    if (!measurements || measurements.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const expectedLabels = [];
    const expectedTemps = [];
    const measurementLabels = [];
    const measurementTemps = [];
    const deviationTemps = [];

    // Genera esperada
    this.phases = result.phases;
    this.totalMinutes = result.totalMinutes;

    const interval = 30;
    for (let i = 0; i * interval <= result.totalMinutes; i++) {
      const minutes = i * interval;
      expectedLabels.push(this.formatTime(minutes));
      const temp = this.interpolateTemp(minutes, result.phases);
      expectedTemps.push(temp);
    }

    // Procesa mediciones
    for (const m of measurements) {
      const temp = this.interpolateTemp(m.elapsedSeconds / 60, result.phases);
      const deviation = m.tempC - temp;

      measurementLabels.push(this.formatTime(m.elapsedSeconds / 60));
      measurementTemps.push(m.tempC);
      deviationTemps.push(deviation);
    }

    return {
      labels: expectedLabels,
      datasets: [
        {
          label: 'Temperatura Esperada',
          data: expectedTemps,
          borderColor: '#4D96FF',
          backgroundColor: '#4D96FF20',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 2
        },
        {
          label: 'Mediciones Reales',
          data: measurements.map(m => m.tempC),
          borderColor: '#FF6B6B',
          backgroundColor: '#FF6B6B40',
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: '#FF6B6B'
        }
      ]
    };
  }

  /**
   * Calcula estadísticas de deviación
   * @param {Object} result - Resultado de cálculo
   * @param {Array} measurements - Mediciones reales
   * @returns {Object} { avgDeviation, maxDeviation, minDeviation }
   */
  calculateDeviationStats(result, measurements) {
    if (!measurements || measurements.length === 0) {
      return { avgDeviation: 0, maxDeviation: 0, minDeviation: 0 };
    }

    this.phases = result.phases;

    const deviations = measurements.map(m => {
      const expected = this.interpolateTemp(m.elapsedSeconds / 60, result.phases);
      return m.tempC - expected;
    });

    return {
      avgDeviation: Math.round(
        (deviations.reduce((a, b) => a + b, 0) / deviations.length) * 10
      ) / 10,
      maxDeviation: Math.max(...deviations),
      minDeviation: Math.min(...deviations),
      measurements: measurements.length
    };
  }

  /**
   * Genera tabla de referencias para debugging
   * @param {Array} phases
   * @param {number} totalMinutes
   * @returns {Array} Array de puntos con { time, tempRange, phase }
   */
  generateReferenceTable(phases = this.phases, totalMinutes = this.totalMinutes) {
    const table = [];
    const interval = 60; // Cada hora

    for (let i = 0; i * interval <= totalMinutes; i++) {
      const minutes = i * interval;
      let currentMinute = 0;
      let phaseInfo = null;

      for (const phase of phases) {
        const phaseEnd = currentMinute + phase.duration;
        if (minutes <= phaseEnd) {
          phaseInfo = phase;
          break;
        }
        currentMinute = phaseEnd;
      }

      const temp = this.interpolateTemp(minutes, phases);
      table.push({
        time: this.formatTime(minutes),
        minutes: minutes,
        temperature: temp,
        phase: phaseInfo?.name || 'N/A',
        tempRange: phaseInfo?.tempRange || [null, null]
      });
    }

    return table;
  }
}

export default CookingCurveCalculator;
