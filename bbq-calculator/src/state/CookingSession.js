/**
 * CookingSession - Gestor de estado de sesión de cocción en vivo
 * Responsabilidad única: Gestionar estado de cronómetro y mediciones durante la cocción
 */
class CookingSession {
  constructor(recipeResult) {
    if (!recipeResult) {
      throw new Error('CookingSession requiere un resultado de cálculo');
    }

    this.recipeResult = recipeResult;
    this.startedAt = null;
    this.pausedAt = null;
    this.totalPausedTime = 0;
    this.status = 'initialized'; // initialized, running, paused, stopped
    this.measurements = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Genera ID único para la sesión
   * @private
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicia la sesión de cronómetro
   */
  start() {
    if (this.status === 'running') {
      throw new Error('Sesión ya está en ejecución');
    }

    if (this.status === 'paused') {
      // Reanudar desde pausa
      this.totalPausedTime += Date.now() - this.pausedAt;
      this.pausedAt = null;
    } else if (this.status === 'initialized') {
      // Primera vez iniciando
      this.startedAt = Date.now();
    }

    this.status = 'running';
  }

  /**
   * Pausa la sesión
   */
  pause() {
    if (this.status !== 'running') {
      throw new Error('Solo se puede pausar una sesión en ejecución');
    }

    this.pausedAt = Date.now();
    this.status = 'paused';
  }

  /**
   * Detiene la sesión
   */
  stop() {
    if (this.status === 'stopped') {
      throw new Error('Sesión ya está detenida');
    }

    this.status = 'stopped';
  }

  /**
   * Obtiene los segundos transcurridos desde el inicio (excluyendo tiempo en pausa)
   * @returns {number} Segundos transcurridos
   */
  getElapsedSeconds() {
    if (!this.startedAt) {
      return 0;
    }

    const now = this.status === 'paused' ? this.pausedAt : Date.now();
    const totalTime = now - this.startedAt - this.totalPausedTime;

    return Math.max(0, Math.floor(totalTime / 1000));
  }

  /**
   * Obtiene el estado actual de la sesión
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Añade una medición a la sesión
   * @param {number} tempC - Temperatura medida en °C
   * @param {string} note - Nota opcional
   */
  addMeasurement(tempC, note = '') {
    if (this.status !== 'running') {
      throw new Error('Solo se pueden añadir mediciones durante la ejecución');
    }

    const elapsedSeconds = this.getElapsedSeconds();
    const expectedTemp = this.getExpectedTempAtTime(elapsedSeconds);
    const deviation = tempC - expectedTemp;

    const measurement = {
      time: elapsedSeconds,
      tempC,
      expectedTemp,
      deviation,
      note,
      timestamp: new Date()
    };

    this.measurements.push(measurement);

    return measurement;
  }

  /**
   * Obtiene todas las mediciones
   * @returns {Array}
   */
  getMeasurements() {
    return [...this.measurements];
  }

  /**
   * Obtiene la última medición registrada
   * @returns {Object|null}
   */
  getLastMeasurement() {
    return this.measurements.length > 0
      ? this.measurements[this.measurements.length - 1]
      : null;
  }

  /**
   * Interpola la temperatura esperada para un tiempo dado
   * Usa interpolación lineal entre puntos de la curva esperada
   * @param {number} seconds - Tiempo en segundos
   * @returns {number} Temperatura esperada en °C
   */
  getExpectedTempAtTime(seconds) {
    const phases = this.recipeResult.phases;
    if (!phases || phases.length === 0) {
      return this.recipeResult.desiredRedTempC;
    }

    let currentTime = 0;
    let prevTemp = this.recipeResult.smokingTempC;
    let prevTime = 0;

    for (const phase of phases) {
      const phaseEndTime = currentTime + phase.duration * 60; // Convert to seconds

      if (seconds <= phaseEndTime) {
        // Tiempo está dentro de esta fase
        const rangeStart = phase.temperatureRange?.[0] || prevTemp;
        const rangeEnd = phase.temperatureRange?.[1] || this.recipeResult.desiredRedTempC;

        // Interpolación lineal
        const progress = (seconds - currentTime) / (phaseEndTime - currentTime);
        const expectedTemp = rangeStart + (rangeEnd - rangeStart) * progress;

        return expectedTemp;
      }

      prevTemp = phase.temperatureRange?.[1] || this.recipeResult.desiredRedTempC;
      prevTime = phaseEndTime;
      currentTime = phaseEndTime;
    }

    // Pasado el tiempo total de cocción
    return this.recipeResult.desiredRedTempC;
  }

  /**
   * Obtiene estadísticas de la sesión
   * @returns {Object}
   */
  getStats() {
    if (this.measurements.length === 0) {
      return {
        count: 0,
        averageDeviation: 0,
        maxDeviation: 0,
        minDeviation: 0,
        standardDeviation: 0,
        onTargetPercent: 0
      };
    }

    const deviations = this.measurements.map(m => m.deviation);
    const avgDeviation = deviations.reduce((a, b) => a + b) / deviations.length;
    const maxDeviation = Math.max(...deviations.map(d => Math.abs(d)));
    const minDeviation = Math.min(...deviations.map(d => Math.abs(d)));

    // Desviación estándar
    const variance = deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / deviations.length;
    const stdDeviation = Math.sqrt(variance);

    // Porcentaje dentro de ±1°C
    const onTarget = this.measurements.filter(m => Math.abs(m.deviation) <= 1).length;
    const onTargetPercent = (onTarget / this.measurements.length) * 100;

    return {
      count: this.measurements.length,
      averageDeviation: avgDeviation,
      maxDeviation: maxDeviation,
      minDeviation: minDeviation,
      standardDeviation: stdDeviation,
      onTargetPercent: onTargetPercent
    };
  }

  /**
   * Formatea tiempo de sesión a HH:MM:SS
   * @param {number} seconds - Segundos
   * @returns {string}
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Obtiene resumen de la sesión
   * @returns {Object}
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      meatType: this.recipeResult.meatType,
      estimatedCookingMinutes: this.recipeResult.estimatedCookingMinutes,
      elapsedSeconds: this.getElapsedSeconds(),
      elapsedFormatted: this.formatTime(this.getElapsedSeconds()),
      status: this.status,
      measurementCount: this.measurements.length,
      stats: this.getStats()
    };
  }

  /**
   * Exporta mediciones como CSV
   * @returns {string}
   */
  exportCSV() {
    const headers = ['Tiempo', 'Temp (°C)', 'Esperada (°C)', 'Desviación (°C)', 'Notas'];
    const rows = this.measurements.map(m => [
      this.formatTime(m.time),
      m.tempC.toFixed(1),
      m.expectedTemp.toFixed(1),
      m.deviation.toFixed(1),
      m.note
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csv;
  }

  /**
   * Exporta mediciones como JSON
   * @returns {string}
   */
  exportJSON() {
    const data = {
      sessionId: this.sessionId,
      meatType: this.recipeResult.meatType,
      estimatedCookingMinutes: this.recipeResult.estimatedCookingMinutes,
      elapsedSeconds: this.getElapsedSeconds(),
      status: this.status,
      measurements: this.measurements,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Reinicia la sesión (limpia mediciones pero mantiene receta)
   */
  reset() {
    this.startedAt = null;
    this.pausedAt = null;
    this.totalPausedTime = 0;
    this.status = 'initialized';
    this.measurements = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Obtiene duración total estimada en minutos
   * @returns {number}
   */
  getEstimatedDuration() {
    return this.recipeResult.estimatedCookingMinutes;
  }

  /**
   * Obtiene progreso de la sesión (0-100)
   * @returns {number}
   */
  getProgress() {
    const estimated = this.getEstimatedDuration() * 60; // Convert to seconds
    const elapsed = this.getElapsedSeconds();
    return Math.min(100, Math.max(0, (elapsed / estimated) * 100));
  }
}

export default CookingSession;
