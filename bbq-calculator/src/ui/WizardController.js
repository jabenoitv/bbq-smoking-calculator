/**
 * WizardController - Controlador de navegación del wizard
 * Responsabilidad única: Coordinar navegación entre steps y gestión de formulario
 */
class WizardController {
  constructor(options = {}) {
    this.currentStep = options.startStep || 1;
    this.totalSteps = options.totalSteps || 4;
    this.stepElements = {};
    this.formData = {
      meatType: null,
      weightKg: null,
      smokingTempC: null,
      renderingLevel: 'rosa',
      wrapped: false,
      altitudeM: 0
    };

    this.meatOptions = options.meatOptions || [
      { value: 'tapapecho', label: 'Tapapecho (Brisket)' },
      { value: 'pollo_entero', label: 'Pollo Entero' },
      { value: 'paleta_cerdo', label: 'Paleta de Cerdo (Pork Butt)' },
      { value: 'costillas_cerdo', label: 'Costillas de Cerdo' },
      { value: 'pechuga_pavo', label: 'Pechuga de Pavo' },
      { value: 'muslo_pavo', label: 'Muslo de Pavo' },
      { value: 'brisket_flat', label: 'Brisket Flat' },
      { value: 'chuck_roast', label: 'Chuck Roast' }
    ];

    this.renderingLevels = {
      raro: { label: 'Raro (15% del rango)', color: '#FF6B6B' },
      rosa: { label: 'Rosa (50%, Jugoso)', color: '#FFA500' },
      gris: { label: 'Gris (85%, Textura)', color: '#6BCB77' }
    };

    this.stepValidators = {
      1: (data) => this.validateStep1(data),
      2: (data) => this.validateStep2(data),
      3: (data) => this.validateStep3(data),
      4: (data) => this.validateStep4(data)
    };

    this.observers = [];
  }

  /**
   * Valida datos del Step 1 (selección de carne)
   * @private
   */
  validateStep1(data) {
    if (!data.meatType) {
      throw new Error('Debes seleccionar un tipo de carne');
    }
    return true;
  }

  /**
   * Valida datos del Step 2 (peso)
   * @private
   */
  validateStep2(data) {
    if (!data.weightKg || data.weightKg <= 0) {
      throw new Error('El peso debe ser mayor que 0');
    }
    if (data.weightKg > 50) {
      throw new Error('El peso parece demasiado alto (máx 50kg)');
    }
    return true;
  }

  /**
   * Valida datos del Step 3 (temperatura)
   * @private
   */
  validateStep3(data) {
    if (!data.smokingTempC || data.smokingTempC <= 0) {
      throw new Error('La temperatura debe ser mayor que 0');
    }
    if (data.smokingTempC < 50 || data.smokingTempC > 300) {
      throw new Error('La temperatura debe estar entre 50°C y 300°C');
    }
    return true;
  }

  /**
   * Valida datos del Step 4 (opciones finales)
   * @private
   */
  validateStep4(data) {
    if (!this.renderingLevels[data.renderingLevel]) {
      throw new Error('Nivel de renderización inválido');
    }
    if (data.altitudeM < 0 || data.altitudeM > 8000) {
      throw new Error('La altitud debe estar entre 0 y 8000 metros');
    }
    return true;
  }

  /**
   * Obtiene los datos del formulario actual
   * @returns {Object}
   */
  getFormData() {
    return { ...this.formData };
  }

  /**
   * Actualiza un campo del formulario
   * @param {string} field - Nombre del campo
   * @param {*} value - Nuevo valor
   */
  updateFormField(field, value) {
    if (field in this.formData) {
      this.formData[field] = value;
      this.notifyObservers('fieldUpdated', { field, value });
    }
  }

  /**
   * Obtiene opciones de carnes disponibles
   * @returns {Array}
   */
  getMeatOptions() {
    return [...this.meatOptions];
  }

  /**
   * Obtiene opciones de niveles de renderización
   * @returns {Object}
   */
  getRenderingLevels() {
    return { ...this.renderingLevels };
  }

  /**
   * Obtiene descripción de un nivel de renderización
   * @param {string} level - Clave del nivel
   * @returns {Object|null}
   */
  getRenderingLevelInfo(level) {
    return this.renderingLevels[level] || null;
  }

  /**
   * Valida y avanza al siguiente step
   * @returns {boolean}
   */
  nextStep() {
    try {
      const validator = this.stepValidators[this.currentStep];
      if (validator) {
        validator(this.formData);
      }

      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.notifyObservers('stepChanged', { step: this.currentStep });
        return true;
      }

      return false;
    } catch (err) {
      this.notifyObservers('validationError', { error: err.message, step: this.currentStep });
      return false;
    }
  }

  /**
   * Retrocede al paso anterior
   * @returns {boolean}
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.notifyObservers('stepChanged', { step: this.currentStep });
      return true;
    }
    return false;
  }

  /**
   * Salta a un step específico (si es válido)
   * @param {number} stepNumber
   * @returns {boolean}
   */
  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) {
      return false;
    }

    this.currentStep = stepNumber;
    this.notifyObservers('stepChanged', { step: this.currentStep });
    return true;
  }

  /**
   * Obtiene el step actual
   * @returns {number}
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * Obtiene el total de steps
   * @returns {number}
   */
  getTotalSteps() {
    return this.totalSteps;
  }

  /**
   * Obtiene el progreso del wizard (0-100)
   * @returns {number}
   */
  getProgress() {
    return (this.currentStep / this.totalSteps) * 100;
  }

  /**
   * Verifica si el wizard está completo
   * @returns {boolean}
   */
  isComplete() {
    return this.currentStep >= this.totalSteps;
  }

  /**
   * Reinicia el wizard
   */
  reset() {
    this.currentStep = 1;
    this.formData = {
      meatType: null,
      weightKg: null,
      smokingTempC: null,
      renderingLevel: 'rosa',
      wrapped: false,
      altitudeM: 0
    };
    this.notifyObservers('reset', {});
  }

  /**
   * Obtén la etiqueta de un tipo de carne
   * @param {string} meatType
   * @returns {string|null}
   */
  getMeatLabel(meatType) {
    const meat = this.meatOptions.find(m => m.value === meatType);
    return meat ? meat.label : null;
  }

  /**
   * Verifica si un step puede ser validado
   * @param {number} stepNumber
   * @returns {boolean}
   */
  canValidateStep(stepNumber) {
    return stepNumber in this.stepValidators;
  }

  /**
   * Obtén error de validación para un step (sin avanzar)
   * @param {number} stepNumber
   * @returns {string|null}
   */
  getValidationError(stepNumber) {
    try {
      const validator = this.stepValidators[stepNumber];
      if (validator) {
        validator(this.formData);
      }
      return null;
    } catch (err) {
      return err.message;
    }
  }

  /**
   * Suscribe a cambios del wizard
   * @param {Function} callback
   */
  subscribe(callback) {
    this.observers.push(callback);
  }

  /**
   * Desuscribe de cambios
   * @param {Function} callback
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notifica a observadores sobre cambios
   * @private
   */
  notifyObservers(eventType, data) {
    this.observers.forEach(callback => {
      callback({ eventType, data, wizard: this });
    });
  }

  /**
   * Obtiene resumen del formulario actual
   * @returns {string}
   */
  getSummary() {
    const meatLabel = this.getMeatLabel(this.formData.meatType);
    const renderingLabel = this.renderingLevels[this.formData.renderingLevel]?.label;

    return `${meatLabel} - ${this.formData.weightKg}kg - ${this.formData.smokingTempC}°C - ${renderingLabel}${this.formData.wrapped ? ' (Envuelto)' : ''}`;
  }

  /**
   * Exporta los datos del formulario
   * @returns {string} JSON
   */
  exportFormData() {
    return JSON.stringify(this.formData, null, 2);
  }

  /**
   * Importa datos en el formulario
   * @param {Object|string} data
   * @returns {boolean}
   */
  importFormData(data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      Object.keys(parsed).forEach(key => {
        if (key in this.formData) {
          this.formData[key] = parsed[key];
        }
      });

      this.notifyObservers('dataImported', { data: this.formData });
      return true;
    } catch (err) {
      return false;
    }
  }
}

export default WizardController;
