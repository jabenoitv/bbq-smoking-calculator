import EventEmitter from './EventEmitter.js';

/**
 * RecipeStore - Gestor de recetas guardadas
 * Almacena y recupera recetas de cálculo de cocción desde localStorage
 */
class RecipeStore extends EventEmitter {
  constructor(storageKey = 'bbq_recipes') {
    super();
    this.storageKey = storageKey;
    this.recipes = this.loadRecipes();
  }

  /**
   * Carga recetas desde localStorage
   * @returns {Object} Diccionario de recetas por ID
   */
  loadRecipes() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      console.warn(`Error cargando recetas: ${err.message}`);
      return {};
    }
  }

  /**
   * Persiste recetas a localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recipes));
      this.emit('recipes-persisted');
    } catch (err) {
      this.emit('storage-error', { error: err.message });
      throw err;
    }
  }

  /**
   * Guarda una receta nueva o actualiza existente
   * @param {Object} recipe - Resultado de cálculo BBQEngine
   * @param {string} customName - Nombre personalizado (opcional)
   * @returns {string} ID de la receta
   */
  saveRecipe(recipe, customName = null) {
    const id = recipe.id || Date.now().toString();
    const name = customName || `${recipe.meatName} ${new Date().toLocaleDateString('es-ES')}`;

    const stored = {
      ...recipe,
      storedName: name,
      storedAt: new Date().toISOString(),
      notes: ''
    };

    this.recipes[id] = stored;
    this.saveToStorage();
    this.emit('recipe-saved', { id, name });
    return id;
  }

  /**
   * Obtiene una receta por ID
   * @param {string} id - ID de la receta
   * @returns {Object|null}
   */
  getRecipe(id) {
    return this.recipes[id] || null;
  }

  /**
   * Lista todas las recetas, opcionalmente filtradas
   * @param {Object} filter - Filtros opcionales {meatType, dateFrom, dateTo}
   * @returns {Array}
   */
  listRecipes(filter = {}) {
    let recipes = Object.values(this.recipes);

    if (filter.meatType) {
      recipes = recipes.filter(r => r.meatType === filter.meatType);
    }

    if (filter.dateFrom) {
      const dateFrom = new Date(filter.dateFrom).getTime();
      recipes = recipes.filter(r => new Date(r.storedAt).getTime() >= dateFrom);
    }

    if (filter.dateTo) {
      const dateTo = new Date(filter.dateTo).getTime();
      recipes = recipes.filter(r => new Date(r.storedAt).getTime() <= dateTo);
    }

    recipes.sort((a, b) => new Date(b.storedAt) - new Date(a.storedAt));
    return recipes;
  }

  /**
   * Actualiza notas de una receta
   * @param {string} id - ID de receta
   * @param {string} notes - Notas
   */
  updateRecipeNotes(id, notes) {
    const recipe = this.recipes[id];
    if (recipe) {
      recipe.notes = notes;
      this.saveToStorage();
      this.emit('recipe-updated', { id });
    }
  }

  /**
   * Elimina una receta
   * @param {string} id - ID de receta
   * @returns {boolean} Éxito
   */
  deleteRecipe(id) {
    if (this.recipes[id]) {
      delete this.recipes[id];
      this.saveToStorage();
      this.emit('recipe-deleted', { id });
      return true;
    }
    return false;
  }

  /**
   * Exporta todas las recetas a JSON
   * @returns {string} JSON string
   */
  exportJSON() {
    return JSON.stringify(this.recipes, null, 2);
  }

  /**
   * Exporta recetas a CSV
   * @returns {string} CSV string
   */
  exportCSV() {
    const recipes = this.listRecipes();
    if (recipes.length === 0) return '';

    const headers = [
      'ID',
      'Fecha',
      'Carne',
      'Peso (kg)',
      'Temp. Ahumado (°C)',
      'Temp. Roja (°C)',
      'Tiempo (horas)',
      'Envuelto',
      'Notas'
    ];

    const rows = recipes.map(r => [
      r.id,
      new Date(r.storedAt).toLocaleDateString('es-ES'),
      r.meatName,
      r.weightKg,
      r.smokingTempC,
      r.desiredRedTempC,
      `${r.estimatedCookingHours}:${String(r.estimatedCookingMinutes).padStart(2, '0')}`,
      r.wrapped ? 'Sí' : 'No',
      r.notes || ''
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    return csv;
  }

  /**
   * Importa recetas desde JSON
   * @param {string} json - JSON string
   * @returns {number} Número de recetas importadas
   */
  importFromJSON(json) {
    try {
      const imported = JSON.parse(json);
      let count = 0;

      for (const id in imported) {
        if (this.validateRecipeSchema(imported[id])) {
          this.recipes[id] = imported[id];
          count++;
        }
      }

      if (count > 0) {
        this.saveToStorage();
        this.emit('recipes-imported', { count });
      }

      return count;
    } catch (err) {
      throw new Error(`Error importando JSON: ${err.message}`);
    }
  }

  /**
   * Valida que una receta tenga el esquema correcto
   * @param {Object} recipe
   * @returns {boolean}
   */
  validateRecipeSchema(recipe) {
    return (
      recipe.meatType &&
      recipe.weightKg &&
      recipe.smokingTempC &&
      recipe.desiredRedTempC &&
      recipe.totalMinutes !== undefined
    );
  }

  /**
   * Obtiene estadísticas de recetas
   * @returns {Object}
   */
  getStats() {
    const recipes = this.listRecipes();
    if (recipes.length === 0) {
      return { count: 0, averageWeight: 0, mostPopularMeat: null };
    }

    const meatCounts = {};
    let totalWeight = 0;

    recipes.forEach(r => {
      meatCounts[r.meatType] = (meatCounts[r.meatType] || 0) + 1;
      totalWeight += r.weightKg;
    });

    return {
      count: recipes.length,
      averageWeight: Math.round((totalWeight / recipes.length) * 100) / 100,
      mostPopularMeat: Object.keys(meatCounts).reduce((a, b) =>
        meatCounts[a] > meatCounts[b] ? a : b
      ),
      meatDistribution: meatCounts
    };
  }

  /**
   * Limpia todas las recetas
   */
  clear() {
    this.recipes = {};
    this.saveToStorage();
    this.emit('recipes-cleared');
  }
}

/**
 * SessionStore - Gestor de sesiones de cocción en vivo
 * Almacena sesiones activas y mediciones de cronómetro
 */
class SessionStore extends EventEmitter {
  constructor(storageKey = 'bbq_sessions') {
    super();
    this.storageKey = storageKey;
    this.sessions = this.loadSessions();
  }

  /**
   * Carga sesiones desde localStorage
   * @returns {Object}
   */
  loadSessions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      console.warn(`Error cargando sesiones: ${err.message}`);
      return {};
    }
  }

  /**
   * Persiste sesiones a localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
      this.emit('sessions-persisted');
    } catch (err) {
      this.emit('storage-error', { error: err.message });
      throw err;
    }
  }

  /**
   * Crea una nueva sesión de cocción
   * @param {Object} recipe - Resultado de cálculo BBQEngine
   * @returns {string} ID de sesión
   */
  createSession(recipe) {
    const id = `session_${Date.now()}`;

    const session = {
      id,
      recipeId: recipe.id,
      meatType: recipe.meatType,
      meatName: recipe.meatName,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'active', // active | paused | completed
      elapsedSeconds: 0,
      measurements: [],
      notes: ''
    };

    this.sessions[id] = session;
    this.saveToStorage();
    this.emit('session-created', { id });
    return id;
  }

  /**
   * Obtiene una sesión
   * @param {string} id - ID de sesión
   * @returns {Object|null}
   */
  getSession(id) {
    return this.sessions[id] || null;
  }

  /**
   * Lista todas las sesiones
   * @returns {Array}
   */
  listSessions() {
    return Object.values(this.sessions).sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
    );
  }

  /**
   * Añade medición a una sesión
   * @param {string} sessionId - ID de sesión
   * @param {number} tempC - Temperatura medida
   * @param {number} elapsedSeconds - Tiempo transcurrido
   * @param {string} note - Nota opcional
   */
  addMeasurement(sessionId, tempC, elapsedSeconds, note = '') {
    const session = this.sessions[sessionId];
    if (!session) throw new Error(`Sesión no encontrada: ${sessionId}`);

    session.measurements.push({
      timestamp: new Date().toISOString(),
      tempC,
      elapsedSeconds,
      note
    });

    session.elapsedSeconds = elapsedSeconds;
    this.saveToStorage();
    this.emit('measurement-added', { sessionId, tempC, elapsedSeconds });
  }

  /**
   * Finaliza una sesión
   * @param {string} sessionId - ID de sesión
   */
  endSession(sessionId) {
    const session = this.sessions[sessionId];
    if (session) {
      session.status = 'completed';
      session.endedAt = new Date().toISOString();
      this.saveToStorage();
      this.emit('session-completed', { sessionId });
    }
  }

  /**
   * Pausa una sesión
   * @param {string} sessionId - ID de sesión
   */
  pauseSession(sessionId) {
    const session = this.sessions[sessionId];
    if (session) {
      session.status = 'paused';
      this.saveToStorage();
      this.emit('session-paused', { sessionId });
    }
  }

  /**
   * Reanuda una sesión
   * @param {string} sessionId - ID de sesión
   */
  resumeSession(sessionId) {
    const session = this.sessions[sessionId];
    if (session) {
      session.status = 'active';
      this.saveToStorage();
      this.emit('session-resumed', { sessionId });
    }
  }

  /**
   * Actualiza notas de una sesión
   * @param {string} sessionId - ID de sesión
   * @param {string} notes - Notas
   */
  updateSessionNotes(sessionId, notes) {
    const session = this.sessions[sessionId];
    if (session) {
      session.notes = notes;
      this.saveToStorage();
      this.emit('session-updated', { sessionId });
    }
  }

  /**
   * Exporta sesión a CSV
   * @param {string} sessionId - ID de sesión
   * @returns {string} CSV
   */
  exportSessionCSV(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) throw new Error(`Sesión no encontrada: ${sessionId}`);

    const headers = ['Tiempo (s)', 'Temperatura (°C)', 'Nota'];
    const rows = session.measurements.map(m => [
      m.elapsedSeconds,
      m.tempC,
      m.note || ''
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    return csv;
  }

  /**
   * Elimina una sesión
   * @param {string} sessionId - ID de sesión
   * @returns {boolean}
   */
  deleteSession(sessionId) {
    if (this.sessions[sessionId]) {
      delete this.sessions[sessionId];
      this.saveToStorage();
      this.emit('session-deleted', { sessionId });
      return true;
    }
    return false;
  }

  /**
   * Limpia todas las sesiones
   */
  clear() {
    this.sessions = {};
    this.saveToStorage();
    this.emit('sessions-cleared');
  }
}

export { RecipeStore, SessionStore };
export default { RecipeStore, SessionStore };
