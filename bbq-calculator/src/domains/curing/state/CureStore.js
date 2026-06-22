/**
 * CureStore - Persistencia de curados activos
 * Responsabilidad única: Gestionar curados activos en localStorage
 */

class CureStore {
  constructor() {
    this.activeCures = this.loadActiveCures();
  }

  /**
   * Obtiene todos los curados activos
   * @returns {Array}
   */
  getActiveCures() {
    return [...this.activeCures];
  }

  /**
   * Obtiene un curado activo por ID
   * @param {string} cureId
   * @returns {Object|null}
   */
  getActiveCure(cureId) {
    const cure = this.activeCures.find(c => c.id === cureId);
    return cure ? { ...cure } : null;
  }

  /**
   * Añade un nuevo curado activo
   * @param {Object} cureData - Resultado de CureCalculator.calculate()
   * @returns {Object} El curado creado con ID
   */
  addActiveCure(cureData) {
    const cure = {
      id: `cure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...cureData,
      status: 'active', // active, completed, discarded
      createdAt: new Date().toISOString(),
      userNotes: cureData.userNotes || ''
    };

    this.activeCures.push(cure);
    this.persistActiveCures();

    return { ...cure };
  }

  /**
   * Actualiza un curado activo
   * @param {string} cureId
   * @param {Object} updates - Campos a actualizar
   * @returns {Object|null} Curado actualizado o null si no existe
   */
  updateActiveCure(cureId, updates) {
    const index = this.activeCures.findIndex(c => c.id === cureId);

    if (index === -1) return null;

    this.activeCures[index] = {
      ...this.activeCures[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.persistActiveCures();
    return { ...this.activeCures[index] };
  }

  /**
   * Marca un curado como completado
   * @param {string} cureId
   * @param {Object} completionData - Datos opcionales (notas, etc.)
   * @returns {Object|null}
   */
  markComplete(cureId, completionData = {}) {
    return this.updateActiveCure(cureId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      ...completionData
    });
  }

  /**
   * Elimina un curado activo
   * @param {string} cureId
   * @returns {boolean} true si fue eliminado
   */
  deleteActiveCure(cureId) {
    const initialLength = this.activeCures.length;

    this.activeCures = this.activeCures.filter(c => c.id !== cureId);

    if (this.activeCures.length < initialLength) {
      this.persistActiveCures();
      return true;
    }

    return false;
  }

  /**
   * Obtiene estadísticas de curados
   * @returns {Object}
   */
  getStats() {
    const active = this.activeCures.filter(c => c.status === 'active').length;
    const completed = this.activeCures.filter(c => c.status === 'completed').length;
    const total = this.activeCures.length;

    return {
      total,
      active,
      completed,
      discarded: total - active - completed
    };
  }

  /**
   * Exporta curados activos como JSON
   * @returns {string}
   */
  exportJSON() {
    return JSON.stringify(
      {
        version: '1.0',
        exportDate: new Date().toISOString(),
        cures: this.activeCures
      },
      null,
      2
    );
  }

  /**
   * Importa curados desde JSON
   * @param {string} jsonData
   * @returns {Object} { success, count, errors }
   */
  importJSON(jsonData) {
    try {
      const parsed = JSON.parse(jsonData);

      if (!Array.isArray(parsed.cures)) {
        throw new Error('Invalid JSON: cures must be an array');
      }

      const errors = [];

      for (const cure of parsed.cures) {
        if (!cure.id || !cure.cureType) {
          errors.push('Skipped cure: missing id or cureType');
          continue;
        }

        const existing = this.activeCures.find(c => c.id === cure.id);

        if (!existing) {
          this.activeCures.push(cure);
        }
      }

      this.persistActiveCures();

      return {
        success: true,
        count: parsed.cures.length - errors.length,
        errors
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Limpia curados completados más antiguos que N días
   * @param {number} daysOld - Elimina completados hace más de N días
   * @returns {number} Cantidad eliminada
   */
  cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialLength = this.activeCures.length;

    this.activeCures = this.activeCures.filter(cure => {
      if (cure.status === 'completed' && cure.completedAt) {
        const completedDate = new Date(cure.completedAt);
        return completedDate > cutoffDate;
      }
      return true;
    });

    if (this.activeCures.length < initialLength) {
      this.persistActiveCures();
    }

    return initialLength - this.activeCures.length;
  }

  /**
   * Carga curados activos del almacenamiento
   * @private
   */
  loadActiveCures() {
    try {
      const stored = localStorage.getItem('activeCures');

      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }

      return [];
    } catch (error) {
      console.warn('Failed to load active cures from storage:', error);
      return [];
    }
  }

  /**
   * Persiste curados activos a almacenamiento
   * @private
   */
  persistActiveCures() {
    try {
      localStorage.setItem('activeCures', JSON.stringify(this.activeCures));
    } catch (error) {
      console.error('Failed to persist active cures to storage:', error);
    }
  }
}

export default CureStore;
