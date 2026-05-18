# NOMI — Prompt Maestro para Claude Code
# Perspectiva Senior: Ingeniería + Diseño + Finanzas + Producto

Pega este archivo en la raíz del proyecto como `CLAUDE.md`.
Luego en Claude Code escribe: "Lee CLAUDE.md y empieza por la FASE 1."

---

## Contexto del proyecto

**Nomi** es una app móvil de finanzas personales para usuarios chilenos.
Stack: React Native 0.81 + Expo SDK 54 + Expo Router v6 + Supabase + Zustand v5.
Montos siempre en CLP (pesos chilenos), sin decimales.

---

## Estructura actual

```
app/
├── _layout.jsx                  ← Root: auth redirect
├── (auth)/
│   ├── _layout.jsx
│   ├── login.jsx
│   └── register.jsx
└── (tabs)/
    ├── _layout.jsx              ← Tab bar con emojis
    ├── index.jsx                ← Dashboard principal
    ├── transacciones.jsx        ← Lista + modal agregar
    ├── cuentas.jsx              ← Gestión de cuentas
    ├── metas.jsx                ← Metas de ahorro
    ├── presupuestos.jsx         ← Presupuestos mensuales
    └── perfil.jsx               ← Perfil + cuentas + plan

src/
├── lib/
│   ├── supabase.js              ← Cliente singleton (NO TOCAR)
│   └── format.js                ← COLORS, clp(), shortDate(), etc. (NO TOCAR)
├── store/
│   └── authStore.js             ← Zustand auth (NO TOCAR)
└── hooks/
    └── useData.js               ← Hooks de datos (NO TOCAR)
```

---

## Reglas absolutas — NUNCA violar

1. NO modificar: `supabase.js`, `authStore.js`, `format.js`, `useData.js`
2. Auth siempre por `useAuthStore` — nunca `supabase.auth` directo en pantallas
3. Datos siempre por hooks de `useData.js` — no duplicar queries
4. Soft delete en transactions: `is_deleted = true`, nunca DELETE real
5. Montos: `numericOnly()` en inputs, `clp()` para display
6. Colores siempre desde `COLORS` — nunca hardcoded
7. Sin TypeScript — JS puro, sin cambiar extensiones
8. No instalar librerías de gráficos pesadas (Chart.js, Victory, etc.)
9. RLS activo en Supabase — no bypassear con service_role en cliente

---

## Schema de Supabase (inferido del código — NO modificar tablas sin instrucción)

```sql
profiles         → id, nombre, nickname, email, plan ('free'|'premium'), rol, created_at
accounts         → id, owner_id, nombre, tipo, banco, saldo_inicial, color, icono, notas(JSON), is_active, created_at
categories       → id, nombre, color, icono, tipo ('ingreso'|'gasto'|'transferencia')
transactions     → id, monto, tipo, descripcion, fecha, is_deleted, created_by, category_id, account_id
budgets          → id, owner_id, category_id, mes, anio, monto_limite
savings_goals    → id, owner_id, nombre, icono, color, monto_objetivo, monto_actual, fecha_limite, is_completed

-- Vistas
accounts_with_balance      → accounts + saldo_actual calculado
budgets_vs_actual          → budgets + gastado, disponible, porcentaje_usado, category_nombre, category_icono, category_color
savings_goals_progress     → savings_goals + porcentaje, faltante, dias_restantes

-- RPC
resumen_mensual(p_mes, p_anio) → { total_ingresos, total_gastos, balance_neto, num_transacciones }
```

---

## Diagnóstico completo del código actual

### Lo que está bien — no cambiar
- Arquitectura limpia: hooks separados, store centralizado, sin prop drilling
- UX de formularios con chips horizontales scrollables — patrón correcto para móvil
- Soft delete implementado correctamente en transacciones
- Sistema de semáforo en presupuestos (verde/amber/rojo) — correcto financieramente
- Metadata de cuentas en JSON — solución pragmática, migrar en fase 3
- Modal bottom sheet consistente en todas las pantallas
- Patrimonio visible en múltiples puntos

### Problemas encontrados — corregir en orden

**Código / bugs:**
- `console.log` de debug en producción en `index.jsx` líneas handleDeleteBudget
- HTML entities (`&#127919;`, `&#9992;&#65039;`) en `metas.jsx` — no renderizan en RN, usar emojis directos
- `useEffect(() => { refetch() }, [mes])` redundante en `transacciones.jsx` — el hook ya reacciona
- Año fijo `const [anio] = useState(...)` en transacciones y presupuestos — no permite navegar entre años
- Sin `try/catch` en varios `await supabase.from(...)` — errores silenciosos
- Sin `KeyboardAvoidingView` en modales de `metas.jsx`

**Duplicación:**
- Formulario de cuenta duplicado exactamente en `cuentas.jsx` y `perfil.jsx` (handleCreate, TIPOS, BANCOS_CL, etc.)
- Selector de mes duplicado en index, transacciones, presupuestos — mismo pattern copy-paste
- Barra de progreso duplicada en todas las pantallas

**Finanzas / lógica de negocio:**
- Patrimonio incorrecto: tarjetas de crédito y préstamos se suman al patrimonio en vez de restar
- Presupuestos no muestran proyección al fin de mes
- Transacciones sin selector de fecha — siempre registra hoy
- Sin categoría "transferencia" en modal de nueva transacción
- Metas sin cálculo de ahorro mensual sugerido para llegar a tiempo

**UX / diseño:**
- `presupuestos` y `cuentas` ocultos del tab bar (`href: null`) — son funcionalidades core inaccesibles
- Eliminar transacción es long press sin ningún hint visual para el usuario
- Sin feedback haptico en acciones importantes
- Loading muestra texto "Cargando..." en vez de spinner visual

**Supabase / performance:**
- Sin índices explícitos en queries frecuentes (transactions por user + fecha)
- Metadata de cuentas en columna `notas` como JSON string — deuda técnica

---

## Plan de trabajo — confirmar antes de avanzar entre fases

### FASE 1 — Auditoría y limpieza rápida

Lee todos los archivos. Luego realiza sin cambiar UX:

1. Eliminar todos los `console.log` en `index.jsx`
2. Reemplazar HTML entities en `metas.jsx` por emojis directos:
   `'&#127919;'` → `'🎯'`, `'&#9992;&#65039;'` → `'✈️'`, etc.
3. Eliminar `useEffect(() => { refetch() }, [mes])` redundante en `transacciones.jsx`
4. Agregar `try/catch` con `Alert.alert('Error', error.message)` en todos los `await supabase` sin manejo de error
5. Agregar `KeyboardAvoidingView` en modal de `metas.jsx`
6. Reemplazar texto "Cargando..." por `<ActivityIndicator size="small" color={COLORS.brand} />` centrado

---

### FASE 2 — Componentes compartidos

Crear `src/components/`:

**`MonthYearSelector.jsx`**
```jsx
// Props: { mes, anio, onChange(mes, anio) }
// UI: flechas de año ◀ 2024 ▶ + chips de mes horizontal
// Reemplazar el selector duplicado en index.jsx, transacciones.jsx, presupuestos.jsx
```

**`ProgressBar.jsx`**
```jsx
// Props: { value, max, height = 6, showSemaforo = false }
// showSemaforo: verde < 80%, amber 80-100%, rojo > 100%
// Reemplazar todas las barBg/barFill duplicadas
```

**`EmptyState.jsx`**
```jsx
// Props: { emoji, title, subtitle, onAction, actionLabel }
// Reemplazar todos los emptyWrap duplicados
```

**`BottomSheet.jsx`**
```jsx
// Props: { visible, onClose, children, maxHeight = '90%' }
// Incluye: overlay oscuro, handle, borderRadius, KeyboardAvoidingView
// Reemplazar todos los Modal bottom sheet duplicados
```

**`CuentaForm.jsx`**
```jsx
// Props: { form, setForm, onSave, onClose, saving, editingCuenta }
// Extrae TODO el formulario de cuenta de cuentas.jsx y perfil.jsx
// Incluye el modal de banco adentro
// Una vez creado, reemplazar en ambas pantallas
```

Después de crear cada componente, actualizar las pantallas que lo usan. Verificar funcionalidad igual a antes.

---

### FASE 3 — Correcciones de finanzas y datos

**3.1 Patrimonio correcto**
En `index.jsx` y `cuentas.jsx`, reemplazar el cálculo de `totalPatrimonio`:
```js
const TIPOS_DEUDA = ['tarjeta_credito', 'linea_credito', 'prestamo']
const activos = accounts
  .filter(a => !TIPOS_DEUDA.includes(a.tipo))
  .reduce((s, a) => s + Number(a.saldo_actual ?? 0), 0)
const deudas = accounts
  .filter(a => TIPOS_DEUDA.includes(a.tipo))
  .reduce((s, a) => s + Math.abs(Number(a.saldo_actual ?? 0)), 0)
const patrimonioNeto = activos - deudas
```
En la card de patrimonio mostrar tres cifras: Activos | Deudas | Neto

**3.2 Año mutable**
Convertir `const [anio] = useState(...)` a `const [anio, setAnio] = useState(...)` en transacciones y presupuestos.
El `MonthYearSelector` del paso 2 ya maneja el onChange de ambos.

**3.3 Selector de fecha en transacciones**
En el modal de `transacciones.jsx`, agregar campo fecha:
```jsx
<Text style={s.chipLabel}>Fecha</Text>
<TextInput
  style={s.modalInput}
  placeholder="YYYY-MM-DD"
  value={form.fecha}
  onChangeText={v => setForm(f => ({ ...f, fecha: v }))}
  placeholderTextColor={COLORS.textSub}
/>
```
Validar formato antes de guardar: si no es fecha válida, mostrar alert.

**3.4 Tipo transferencia**
En `transacciones.jsx`, agregar 'transferencia' al selector de tipo:
```jsx
{['ingreso', 'gasto', 'transferencia'].map(t => (
  <TouchableOpacity key={t}
    onPress={() => setForm(f => ({ ...f, tipo: t, category_id: '' }))}
    style={[s.tipoBtn, form.tipo === t && {
      backgroundColor: t === 'ingreso' ? COLORS.brand : t === 'gasto' ? COLORS.red : COLORS.blue,
      borderColor: 'transparent'
    }]}>
    <Text style={[s.tipoBtnText, form.tipo === t && { color: '#fff' }]}>
      {t === 'ingreso' ? '📈 Ingreso' : t === 'gasto' ? '📉 Gasto' : '↔️ Transfer.'}
    </Text>
  </TouchableOpacity>
))}
```

**3.5 Migración de metadata de cuentas**
Crear `supabase/migrations/001_account_columns.sql`:
```sql
-- Agregar columnas propias para metadata de cuenta
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS limite_credito bigint,
  ADD COLUMN IF NOT EXISTS dia_cierre     smallint,
  ADD COLUMN IF NOT EXISTS cuota_mensual  bigint;

-- Migrar datos existentes desde notas JSON
UPDATE accounts
SET
  limite_credito = (notas::json->>'limite_credito')::bigint,
  dia_cierre     = (notas::json->>'dia_cierre')::smallint,
  cuota_mensual  = (notas::json->>'cuota_mensual')::bigint
WHERE notas IS NOT NULL AND notas != '' AND notas != 'null';
```
Luego actualizar `CuentaForm.jsx` para usar columnas directas.
Actualizar los lectores de metadata en `index.jsx`, `cuentas.jsx` y `perfil.jsx`:
reemplazar `JSON.parse(a.notas ?? '')` por `a.limite_credito`, `a.dia_cierre`, etc.

---

### FASE 4 — UX y producto

**4.1 Tab bar — exponer presupuestos**
En `app/(tabs)/_layout.jsx`, cambiar `presupuestos` de `href: null` a tab visible.
Usar react-native-svg para íconos simples en vez de emojis:
- Inicio: casa SVG
- Flujo: flechas arriba/abajo SVG
- Presupuestos: gráfico de barras SVG
- Metas: estrella SVG
- Perfil: persona SVG

Si los SVG son complejos, mantener emojis — no complicar innecesariamente.

**4.2 Proyección de presupuesto**
En `presupuestos.jsx`, dentro de cada card de budget, agregar después de la barra:
```js
const hoy = new Date().getDate()
const diasEnMes = new Date(anio, mes, 0).getDate()
const gastoProyectado = hoy > 0 ? Math.round((Number(b.gastado) / hoy) * diasEnMes) : 0
const excede = gastoProyectado > Number(b.monto_limite)
```
Si `excede`, mostrar texto amber: `"Al ritmo actual: ${clp(gastoProyectado)} al cierre"`

**4.3 Alertas en dashboard**
En `index.jsx`, agregar entre KPIs y sección de cuentas:

```jsx
// Alerta si balance negativo
{(resumen?.balance_neto ?? 0) < 0 && (
  <View style={s.alertCard}>
    <Text style={s.alertText}>⚠️ Este mes gastas más de lo que ingresas</Text>
  </View>
)}

// Presupuesto más crítico
{budgets.some(b => Number(b.porcentaje_usado) > 80) && (
  <View style={s.warningCard}>
    <Text style={s.warningText}>
      🔴 {budgets.filter(b => Number(b.porcentaje_usado) > 80).length} presupuesto(s) cerca del límite
    </Text>
  </View>
)}
```

**4.4 Hint visual para eliminar transacciones**
Debajo de la lista en `transacciones.jsx`:
```jsx
<Text style={s.hintText}>Mantén presionada una transacción para eliminarla</Text>
```
Agregar estilo `hintText`: `{ textAlign: 'center', fontSize: 11, color: COLORS.textSub, fontStyle: 'italic', marginBottom: 8 }`

**4.5 Cálculo de ahorro sugerido en metas**
En `metas.jsx`, dentro de cada goalCard, si hay `fecha_limite` y `dias_restantes > 0`:
```js
const mesesRestantes = Math.max(1, Math.ceil(g.dias_restantes / 30))
const ahorroMensualSugerido = Math.ceil(g.faltante / mesesRestantes)
```
Mostrar: `"Ahorra ${clp(ahorroMensualSugerido)}/mes para llegar a tiempo"`

---

### FASE 5 — Supabase: índices y RLS

Crear `supabase/migrations/002_performance_and_security.sql`:

```sql
-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tx_user_fecha
  ON transactions(created_by, fecha DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_budgets_user_mes
  ON budgets(owner_id, mes, anio);

CREATE INDEX IF NOT EXISTS idx_goals_owner_active
  ON savings_goals(owner_id)
  WHERE is_completed = false;

-- Verificar RLS habilitado
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals  ENABLE ROW LEVEL SECURITY;

-- Función helper para policies
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT auth.uid() $$;

-- Policies básicas (solo si no existen)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='own_transactions') THEN
    CREATE POLICY own_transactions ON transactions
      FOR ALL USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='accounts' AND policyname='own_accounts') THEN
    CREATE POLICY own_accounts ON accounts
      FOR ALL USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budgets' AND policyname='own_budgets') THEN
    CREATE POLICY own_budgets ON budgets
      FOR ALL USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_goals' AND policyname='own_goals') THEN
    CREATE POLICY own_goals ON savings_goals
      FOR ALL USING (owner_id = auth.uid());
  END IF;
END $$;
```

---

### FASE 6 — Pulido final

1. Verificar que todas las pantallas usan SafeAreaView o paddingTop dinámico (no hardcoded 60)
2. Verificar que todos los modales tienen KeyboardAvoidingView correcto por plataforma
3. Asegurar que no queda ningún color hardcoded fuera de COLORS
4. Agregar `Vibration.vibrate(10)` de React Native en onPress de guardar y confirmar eliminar
5. Revisar que `anio` es mutable en todas las pantallas que usan MonthYearSelector
6. Test de flujo completo: crear cuenta → crear transacción → ver en dashboard → crear presupuesto → ver alerta
7. Revisar que `presupuestos` y `cuentas` son accesibles desde el tab bar

---

## Convenciones de código

- Estilos: `StyleSheet.create` al final, variable `s`
- Componentes funcionales con hooks únicamente
- Imports: React → RN → expo-router → stores → hooks → components → utils
- Sin comentarios obvios — solo donde la lógica financiera no es evidente
- Nombres: camelCase para componentes, minúsculas para páginas Expo Router

---

## Cómo empezar

1. Lee todos los archivos en `app/` y `src/`
2. Responde con un resumen de lo que encontraste en cada pantalla (confirma que leíste todo)
3. Espera mi "ok" y empieza FASE 1

¿Listo? Empieza leyendo los archivos.
