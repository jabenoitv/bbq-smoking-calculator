/**
 * TimerTabController - Coordinador del tab de cronómetro en vivo
 * Responsabilidad única: Coordinar UI del cronómetro, sesión, y visualizaciones
 */
class TimerTabController {
  constructor(options = {}) {
    this.timerDisplayId = options.timerDisplayId || 'timer-display';
    this.logTableId = options.logTableId || 'timer-log';
    this.timerChartId = options.timerChartId || 'timer-chart';
    this.controlsContainerId = options.controlsContainerId || 'timer-controls';

    // Componentes opcionales (inyectados)
    this.timerDisplay = options.timerDisplay || null;
    this.timerChart = options.timerChart || null;
    this.session = options.session || null;

    // Estado
    this.status = 'idle'; // idle, running, paused, stopped
    this.interval = null;
    this.updateFrequency = options.updateFrequency || 1000; // 1 segundo

    // Observadores
    this.observers = [];
  }

  /**
   * Establece la sesión de cocción
   * @param {CookingSession} session
   */
  setSession(session) {
    if (!session) {
      throw new Error('Se requiere una sesión válida');
    }

    this.session = session;
    this.notifyObservers('sessionSet', { session });
  }

  /**
   * Establece el display del cronómetro
   * @param {TimerDisplay} display
   */
  setTimerDisplay(display) {
    this.timerDisplay = display;
  }

  /**
   * Establece el gráfico del cronómetro
   * @param {TimerChart} chart
   */
  setTimerChart(chart) {
    this.timerChart = chart;
  }

  /**
   * Inicia el cronómetro
   */
  start() {
    if (!this.session) {
      throw new Error('No hay sesión configurada');
    }

    if (this.status === 'running') {
      throw new Error('Cronómetro ya está en ejecución');
    }

    this.session.start();
    this.status = 'running';

    this.interval = setInterval(() => {
      this.updateDisplay();
    }, this.updateFrequency);

    this.notifyObservers('timerStarted', { elapsed: this.session.getElapsedSeconds() });
  }

  /**
   * Pausa el cronómetro
   */
  pause() {
    if (this.status !== 'running') {
      throw new Error('Solo se puede pausar un cronómetro en ejecución');
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.session.pause();
    this.status = 'paused';

    this.notifyObservers('timerPaused', { elapsed: this.session.getElapsedSeconds() });
  }

  /**
   * Reanuda el cronómetro desde pausa
   */
  resume() {
    if (this.status !== 'paused') {
      throw new Error('Solo se puede reanudar un cronómetro pausado');
    }

    this.session.start(); // Llamar a start() reanuda desde pausa
    this.status = 'running';

    this.interval = setInterval(() => {
      this.updateDisplay();
    }, this.updateFrequency);

    this.notifyObservers('timerResumed', { elapsed: this.session.getElapsedSeconds() });
  }

  /**
   * Detiene el cronómetro
   */
  stop() {
    if (this.status === 'stopped') {
      throw new Error('Cronómetro ya está detenido');
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.session.stop();
    this.status = 'stopped';

    this.notifyObservers('timerStopped', { elapsed: this.session.getElapsedSeconds() });
  }

  /**
   * Actualiza el display del cronómetro
   * @private
   */
  updateDisplay() {
    if (!this.session || !this.timerDisplay) {
      return;
    }

    const elapsed = this.session.getElapsedSeconds();
    this.timerDisplay.setTime(elapsed);

    // Actualizar progreso
    const progress = this.session.getProgress();
    this.notifyObservers('progressUpdated', { progress, elapsed });
  }

  /**
   * Añade una medición de temperatura
   * @param {number} tempC - Temperatura en °C
   * @param {string} note - Nota opcional
   */
  addMeasurement(tempC, note = '') {
    if (this.status !== 'running') {
      throw new Error('Solo se pueden añadir mediciones durante ejecución');
    }

    if (typeof tempC !== 'number' || tempC < 0) {
      throw new Error('Temperatura debe ser un número válido');
    }

    const measurement = this.session.addMeasurement(tempC, note);

    // Actualizar display
    if (this.timerDisplay) {
      const deviationColor = this.getDeviationColor(measurement.deviation);
      this.timerDisplay.addMeasurement(tempC, measurement.expectedTemp, note);
    }

    // Actualizar gráfico
    if (this.timerChart) {
      const deviationColor = this.getDeviationColor(measurement.deviation);
      this.timerChart.addMeasurement(measurement.time, tempC, deviationColor);
    }

    this.notifyObservers('measurementAdded', { measurement });

    return measurement;
  }

  /**
   * Calcula color de desviación basado en diferencia
   * @private
   */
  getDeviationColor(deviation) {
    const absDeviation = Math.abs(deviation);

    if (absDeviation <= 1) {
      return 'green';
    } else if (absDeviation <= 3) {
      return 'orange';
    } else {
      return 'red';
    }
  }

  /**
   * Obtiene el estado actual del cronómetro
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Obtiene tiempo transcurrido
   * @returns {number} Segundos
   */
  getElapsedSeconds() {
    if (!this.session) {
      return 0;
    }

    return this.session.getElapsedSeconds();
  }

  /**
   * Obtiene progreso actual (0-100)
   * @returns {number}
   */
  getProgress() {
    if (!this.session) {
      return 0;
    }

    return this.session.getProgress();
  }

  /**
   * Obtiene mediciones actuales
   * @returns {Array}
   */
  getMeasurements() {
    if (!this.session) {
      return [];
    }

    return this.session.getMeasurements();
  }

  /**
   * Obtiene última medición
   * @returns {Object|null}
   */
  getLastMeasurement() {
    if (!this.session) {
      return null;
    }

    return this.session.getLastMeasurement();
  }

  /**
   * Obtiene estadísticas de la sesión
   * @returns {Object}
   */
  getStats() {
    if (!this.session) {
      return null;
    }

    return this.session.getStats();
  }

  /**
   * Obtiene información de desviación
   * @returns {Object|null}
   */
  getDeviationInfo() {
    if (!this.timerChart) {
      return null;
    }

    return this.timerChart.getDeviationStats();
  }

  /**
   * Obtiene resumen de la sesión actual
   * @returns {Object}
   */
  getSummary() {
    if (!this.session) {
      return null;
    }

    return this.session.getSummary();
  }

  /**
   * Guarda la sesión con nombre
   * @param {string} name - Nombre de la sesión
   */
  saveSession(name) {
    if (!this.session) {
      throw new Error('No hay sesión para guardar');
    }

    const sessionData = {
      name,
      summary: this.session.getSummary(),
      measurements: this.session.getMeasurements(),
      csv: this.session.exportCSV(),
      json: this.session.exportJSON(),
      savedAt: new Date().toISOString()
    };

    this.notifyObservers('sessionSaved', { sessionData });

    return sessionData;
  }

  /**
   * Reinicia la sesión actual
   */
  resetSession() {
    if (this.status === 'running' || this.status === 'paused') {
      throw new Error('Detén el cronómetro antes de reiniciar');
    }

    if (this.session) {
      this.session.reset();
    }

    if (this.timerDisplay) {
      this.timerDisplay.clear();
    }

    if (this.timerChart) {
      this.timerChart.clear();
    }

    this.notifyObservers('sessionReset', {});
  }

  /**
   * Obtiene configuración de tema
   * @returns {string}
   */
  getTheme() {
    if (this.timerChart) {
      return this.timerChart.getTheme();
    }
    return 'dark';
  }

  /**
   * Cambia el tema
   * @param {string} theme - 'dark' o 'light'
   */
  setTheme(theme) {
    if (this.timerDisplay && this.timerDisplay.setTheme) {
      this.timerDisplay.setTheme(theme);
    }

    if (this.timerChart && this.timerChart.setTheme) {
      this.timerChart.setTheme(theme);
    }

    this.notifyObservers('themeChanged', { theme });
  }

  /**
   * Exporta la sesión como CSV
   * @returns {string}
   */
  exportCSV() {
    if (!this.session) {
      throw new Error('No hay sesión para exportar');
    }

    return this.session.exportCSV();
  }

  /**
   * Exporta la sesión como JSON
   * @returns {string}
   */
  exportJSON() {
    if (!this.session) {
      throw new Error('No hay sesión para exportar');
    }

    return this.session.exportJSON();
  }

  /**
   * Suscribe a eventos del controlador
   * @param {Function} callback
   */
  subscribe(callback) {
    this.observers.push(callback);
  }

  /**
   * Desuscribe de eventos
   * @param {Function} callback
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notifica a observadores
   * @private
   */
  notifyObservers(eventType, data) {
    this.observers.forEach(callback => {
      callback({ eventType, data, controller: this });
    });
  }

  /**
   * Destruye el controlador y limpia recursos
   */
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.session) {
      if (this.status === 'running') {
        this.session.stop();
      }
      this.session = null;
    }

    if (this.timerDisplay) {
      this.timerDisplay = null;
    }

    if (this.timerChart) {
      if (this.timerChart.destroy) {
        this.timerChart.destroy();
      }
      this.timerChart = null;
    }

    this.observers = [];
    this.status = 'idle';
  }
}

export default TimerTabController;
