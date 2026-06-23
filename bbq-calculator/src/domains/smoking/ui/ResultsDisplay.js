/**
 * ResultsDisplay - Visualizador de resultados de cálculo
 * Responsabilidad única: Renderizar resultado de BBQEngine en cards/secciones
 */
class ResultsDisplay {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Contenedor con ID "${containerId}" no encontrado`);
    }

    this.currentResult = null;
  }

  /**
   * Limpia el contenedor
   * @private
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Formatea duración en minutos a "Xh Ym"
   * @private
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Renderiza una card de tiempo
   * @private
   */
  renderTimeCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card time-card';
    card.innerHTML = `
      <div class="card-header">⏱️ Tiempo Total Estimado</div>
      <div class="card-content">
        <div class="time-display">${this.formatDuration(result.estimatedCookingMinutes)}</div>
        <div class="time-details">
          <div class="detail-item">
            <span class="detail-label">Horas:</span>
            <span class="detail-value">${result.estimatedCookingHours}h</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Minutos:</span>
            <span class="detail-value">${result.estimatedCookingMinutes}m</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tiempo de Reposo:</span>
            <span class="detail-value">${result.holdingMin}m</span>
          </div>
        </div>
      </div>
    `;
    return card;
  }

  /**
   * Renderiza una card de temperatura
   * @private
   */
  renderTempCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card temp-card';
    card.innerHTML = `
      <div class="card-header">🌡️ Temperaturas</div>
      <div class="card-content">
        <div class="temp-item">
          <span class="temp-label">Ahumador:</span>
          <span class="temp-value">${result.smokingTempC}°C</span>
        </div>
        <div class="temp-item">
          <span class="temp-label">Objetivo Rojo:</span>
          <span class="temp-value">${result.desiredRedTempC}°C</span>
        </div>
        <div class="temp-item">
          <span class="temp-label">Rango Temperatura:</span>
          <span class="temp-value">${result.temperatureRange[0]}°C - ${result.temperatureRange[1]}°C</span>
        </div>
      </div>
    `;
    return card;
  }

  /**
   * Renderiza desglose de fases
   * @private
   */
  renderPhaseBreakdown(result) {
    const section = document.createElement('div');
    section.className = 'result-section phases-section';

    const header = document.createElement('h3');
    header.textContent = '📊 Desglose de Fases';
    section.appendChild(header);

    const phasesContainer = document.createElement('div');
    phasesContainer.className = 'phases-container';

    result.phases.forEach((phase, index) => {
      const phaseDiv = document.createElement('div');
      phaseDiv.className = 'phase-item';
      phaseDiv.innerHTML = `
        <div class="phase-number">${index + 1}</div>
        <div class="phase-info">
          <div class="phase-name">${phase.name}</div>
          <div class="phase-duration">${this.formatDuration(phase.duration)}</div>
          <div class="phase-percent">${phase.percent.toFixed(1)}%</div>
          <div class="phase-range">${phase.tempRange[0]}°C - ${phase.tempRange[1]}°C</div>
        </div>
      `;
      phasesContainer.appendChild(phaseDiv);
    });

    section.appendChild(phasesContainer);
    return section;
  }

  /**
   * Renderiza timeline de eventos
   * @private
   */
  renderTimelineEvents(result) {
    if (!result.events || result.events.length === 0) {
      return null;
    }

    const section = document.createElement('div');
    section.className = 'result-section events-section';

    const header = document.createElement('h3');
    header.textContent = '📅 Eventos Importantes';
    section.appendChild(header);

    const timelineDiv = document.createElement('div');
    timelineDiv.className = 'timeline';

    result.events.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'timeline-event';
      eventDiv.innerHTML = `
        <div class="timeline-time">${this.formatDuration(event.at)}</div>
        <div class="timeline-content">
          <div class="timeline-title">${event.name}</div>
          <div class="timeline-description">${event.reason}</div>
        </div>
      `;
      timelineDiv.appendChild(eventDiv);
    });

    section.appendChild(timelineDiv);
    return section;
  }

  /**
   * Renderiza panel de tips
   * @private
   */
  renderTipsPanel(result) {
    const section = document.createElement('div');
    section.className = 'result-section tips-section';

    const header = document.createElement('h3');
    header.textContent = '💡 Tips de Éxito';
    section.appendChild(header);

    const tips = [
      'Mantén la temperatura del ahumador lo más constante posible',
      'El rellano ("stall") es normal - la temperatura se plateará',
      'Usa un termómetro de sonda para medir temperatura interna',
      'Deja reposar 15-30 minutos antes de cortar para mejor sabor',
      'Acerca el ahumador a la temperatura deseada lentamente'
    ];

    const tipsList = document.createElement('ul');
    tipsList.className = 'tips-list';

    tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsList.appendChild(li);
    });

    section.appendChild(tipsList);
    return section;
  }

  /**
   * Renderiza sección de fórmula utilizada
   * @private
   */
  renderFormulaSection(result) {
    if (!result.formula) {
      return null;
    }

    const section = document.createElement('div');
    section.className = 'result-section formula-section';

    const header = document.createElement('h3');
    header.textContent = '⚙️ Fórmula Utilizada';
    section.appendChild(header);

    const formulaDiv = document.createElement('div');
    formulaDiv.className = 'formula-content';

    const formulaText = document.createElement('p');
    formulaText.innerHTML = `
      Carne: <strong>${result.formula.meatType}</strong><br/>
      Peso: <strong>${result.formula.weightKg}kg</strong><br/>
      Temperatura Ahumador: <strong>${result.formula.smokingTempC}°C</strong><br/>
      Ratio Cocción: <strong>${result.formula.cookingRatio} h/kg</strong><br/>
      Altitud: <strong>${result.formula.altitudeM}m (Factor: ${result.formula.altitudeFactor.toFixed(2)}x)</strong>
    `;
    formulaDiv.appendChild(formulaText);

    section.appendChild(formulaDiv);
    return section;
  }

  /**
   * Muestra resultados completamente
   * @param {Object} result - Resultado de BBQEngine.calculate()
   */
  display(result) {
    if (!result) {
      throw new Error('Se requiere un resultado de cálculo');
    }

    this.currentResult = result;
    this.clear();

    // Crear contenedor principal
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-container';

    // Cards principales
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'results-cards';
    cardsDiv.appendChild(this.renderTimeCard(result));
    cardsDiv.appendChild(this.renderTempCard(result));
    resultsDiv.appendChild(cardsDiv);

    // Secciones
    const sectionsDiv = document.createElement('div');
    sectionsDiv.className = 'results-sections';

    sectionsDiv.appendChild(this.renderPhaseBreakdown(result));

    const eventsSection = this.renderTimelineEvents(result);
    if (eventsSection) {
      sectionsDiv.appendChild(eventsSection);
    }

    sectionsDiv.appendChild(this.renderTipsPanel(result));

    const formulaSection = this.renderFormulaSection(result);
    if (formulaSection) {
      sectionsDiv.appendChild(formulaSection);
    }

    resultsDiv.appendChild(sectionsDiv);

    this.container.appendChild(resultsDiv);
  }

  /**
   * Obtiene el resultado actual
   * @returns {Object|null}
   */
  getCurrentResult() {
    return this.currentResult;
  }

  /**
   * Limpia la visualización
   */
  clearDisplay() {
    this.clear();
    this.currentResult = null;
  }

  /**
   * Exporta resultado como JSON
   * @returns {string}
   */
  exportJSON() {
    if (!this.currentResult) {
      throw new Error('No hay resultado para exportar');
    }

    return JSON.stringify(this.currentResult, null, 2);
  }

  /**
   * Exporta resultado como HTML printable
   * @returns {string}
   */
  exportHTML() {
    if (!this.currentResult) {
      throw new Error('No hay resultado para exportar');
    }

    const result = this.currentResult;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BBQ Smoking Calculator - Resultado</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 10px 0; }
          .phase { background: #f5f5f5; padding: 10px; margin: 5px 0; border-left: 4px solid #FF9F1C; }
          .temp { font-size: 24px; font-weight: bold; color: #FF9F1C; }
        </style>
      </head>
      <body>
        <h1>Resultado de Cálculo BBQ</h1>
        <div class="card">
          <h2>Tiempo Total</h2>
          <div class="temp">${this.formatDuration(result.estimatedCookingMinutes)}</div>
        </div>
        <div class="card">
          <h2>Temperaturas</h2>
          <p>Ahumador: <strong>${result.smokingTempC}°C</strong></p>
          <p>Objetivo Rojo: <strong>${result.desiredRedTempC}°C</strong></p>
        </div>
        <div class="card">
          <h2>Fases</h2>
          ${result.phases.map(p => `
            <div class="phase">
              <strong>${p.name}</strong> - ${this.formatDuration(p.duration)}
              <br/>${p.tempRange[0]}°C - ${p.tempRange[1]}°C
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    return html;
  }
}

export default ResultsDisplay;
