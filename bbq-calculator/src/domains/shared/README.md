# 🔀 Shared Domain

**Responsabilidad:** Utilidades transversales, persistencia, validación, eventos, notificaciones — compartidas por todos los dominios

## Módulos

### Core
- **EventEmitter.js** — Base pub/sub para comunicación entre módulos
  - Métodos: `on()`, `off()`, `emit()`, `removeAllListeners()`
  - Todos los módulos que necesitan observable extienden esto
  - Patrón Observer para acoplamiento débil

- **DataPersistence.js** (M4) — Persistencia localStorage
  - Classes: `RecipeStore` (recetas guardadas), `SessionStore` (sesiones timer), `StateManager` (estado global)
  - Métodos CRUD: `save()`, `load()`, `delete()`, `list()`
  - Exportación: `exportCSV()`, `exportJSON()`, `importFromJSON()`
  - Validación de esquema integrada
  - Datos:
    - `recipes` — recetas del tab Ahumado
    - `activeCures` — curados activos del tab Mis Curados
    - `sessions` — sesiones timer guardadas
    - `userPreferences` — unidades, temas, preferencias

### Validation
- **Validator.js** (NEW) — Validación multi-capa
  - Métodos: `validateSchema()`, `validateBusinessRules()`, `validatePhysics()`
  - Validación de inputs en todos los dominios
  - Warnings para valores sospechosos (valores muy altos/bajos)
  - Validación de restricciones físicas (temperaturas, pesos, etc.)

### Utils
- **TabController.js** (NEW) — Control de navegación entre tabs
  - Métodos: `switchTab(tabName)`, `getActiveTab()`, `enableTab()`, `disableTab()`
  - Gestión de estado: qué tab está visible
  - Emite eventos: `tab-changed`, `tab-activated`
  - Tabs disponibles: ahumado, cronometro, curados, mis-curados, gadgets

- **Notifications.js** (NEW) — Sistema de notificaciones toast
  - Métodos: `showToast(message, type, duration)`, `dismiss(id)`
  - Tipos: success, error, warning, info
  - Queue de notificaciones
  - Auto-dismiss después de duración

### Constants
- **constants.js** (NEW) — Constantes compartidas
  - `MEAT_FORMULAS` — Datos de cocción por tipo de carne
  - `TEMPERATURE_UNITS` — Conversión °C ↔ °F
  - `WEIGHT_UNITS` — Conversión kg ↔ lbs
  - `TAB_NAMES` — IDs de tabs
  - `NOTIFICATION_TYPES` — Tipos de notificaciones
  - `ALTITUDE_FORMULA` — Fórmula de ajuste por altitud

## Flujo de Datos

```
Todos los módulos en todos los dominios:
  ↓
Necesitan eventos → EventEmitter.extend()
  ↓
Necesitan persistencia → DataPersistence.save/load()
  ↓
Necesitan validar → Validator.validate()
  ↓
Necesitan mostrar mensajes → Notifications.showToast()
  ↓
Necesitan cambiar tab → TabController.switchTab()
  ↓
Necesitan constantes → constants.MEAT_FORMULAS, etc.
```

## Dependencias Internas

- EventEmitter (independiente)
- DataPersistence (usa constants para validación)
- Validator (usa constants)
- TabController (independiente)
- Notifications (independiente)
- constants (independiente)

## Tests

- `EventEmitter.test.js` — 12 tests
- `DataPersistence.test.js` — 24 tests
- `Validator.test.js` — 25 tests (nuevos)
- `TabController.test.js` — 20 tests (nuevos)
- `Notifications.test.js` — 15 tests (nuevos)
- `shared.test.js` — integración dominio

**Total: 96+ tests**

## Estados

- ✅ EventEmitter: Completo (existente)
- ✅ DataPersistence: Completo (refactorizado)
- 🆕 Validator: Requiere implementación
- 🆕 TabController: Requiere implementación
- 🆕 Notifications: Requiere implementación
- 🆕 constants.js: Requiere consolidación

## Notas Arquitectónicas

- Este es el único dominio que todos los demás dependen
- CRITICAL: Mantener las interfaces estables para no romper dependientes
- Estrategia "frozen modules": Una vez implementado, no modificar sin versioning
- Cambios aquí afectan a TODOS los dominios → validar bien antes de publicar
