import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native'
import { COLORS, numericOnly } from '../lib/format'

export const BANCOS_CL = [
  'Banco BCI', 'Banco Santander', 'Banco de Chile', 'Banco Estado',
  'Banco Falabella', 'Banco Ripley', 'Banco Itaú', 'Banco Security',
  'Banco BICE', 'Banco Scotiabank', 'Banco Internacional',
  'Mercado Pago', 'Fintual', 'Tenpo', 'MACH', 'Coopeuch', 'Otro',
]

export const TIPOS = [
  { key: 'corriente',       label: 'Corriente',     icono: '🏦', desc: 'Cuenta bancaria principal' },
  { key: 'vista',           label: 'Vista / RUT',   icono: '💳', desc: 'Banco Estado u otro banco' },
  { key: 'ahorro',          label: 'Ahorro',        icono: '🐷', desc: 'Cuenta de ahorro a plazo' },
  { key: 'tarjeta_credito', label: 'Tarjeta Créd.', icono: '💰', desc: 'Con límite de crédito' },
  { key: 'efectivo',        label: 'Efectivo',      icono: '💵', desc: 'Dinero en efectivo' },
  { key: 'inversion',       label: 'Inversión',     icono: '📈', desc: 'Fintual, fondos mutuos, etc.' },
  { key: 'linea_credito',   label: 'Línea Créd.',  icono: '🏧', desc: 'Línea de crédito bancaria' },
  { key: 'prestamo',        label: 'Préstamo',      icono: '📋', desc: 'Crédito de consumo' },
]

export const COLORS_PALETTE = [
  '#1D9E75', '#378ADD', '#EF9F27', '#D4537E',
  '#534AB7', '#E24B4A', '#888780', '#0F6E56',
]

export const needsBanco  = ['corriente', 'vista', 'ahorro', 'tarjeta_credito', 'linea_credito', 'prestamo', 'inversion']
export const needsLimite = ['tarjeta_credito', 'linea_credito']
export const needsCierre = ['tarjeta_credito']
export const needsCuota  = ['prestamo']
export const isDeuda     = ['tarjeta_credito', 'linea_credito', 'prestamo']

export function defaultCuentaForm() {
  return {
    nombre: '', tipo: 'corriente', banco: '', banco_otro: '',
    saldo_inicial: '0', color: COLORS_PALETTE[0], icono: '🏦',
    limite_credito: '', cuota_mensual: '', dia_cierre: '',
  }
}

export default function CuentaForm({ form, setForm, onSave, saving, editingCuenta }) {
  const [showBancoModal, setShowBancoModal] = useState(false)

  const tipoActual = TIPOS.find(t => t.key === form.tipo)

  const setTipo = (key) => {
    const t = TIPOS.find(t => t.key === key)
    setForm(f => ({ ...defaultCuentaForm(), tipo: key, icono: t?.icono ?? '🏦', color: f.color }))
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.label}>Tipo de cuenta</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
          {TIPOS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTipo(t.key)}
              style={[s.tipoChip, form.tipo === t.key && s.tipoChipActive]}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{t.icono}</Text>
              <Text style={[s.tipoChipText, form.tipo === t.key && s.tipoChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.label}>Nombre *</Text>
        <TextInput style={s.input}
          placeholder={`Ej: ${tipoActual?.label ?? 'Mi cuenta'} BCI`}
          value={form.nombre}
          onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
          placeholderTextColor={COLORS.textSub} />

        {needsBanco.includes(form.tipo) && (
          <>
            <Text style={s.label}>Banco / Institución *</Text>
            <TouchableOpacity style={s.selectBtn} onPress={() => setShowBancoModal(true)}>
              <Text style={[s.selectText, !form.banco && { color: COLORS.textSub }]}>
                {form.banco || 'Seleccionar...'}
              </Text>
              <Text style={s.selectArrow}>▾</Text>
            </TouchableOpacity>
            {form.banco === 'Otro' && (
              <TextInput style={s.input} placeholder="Escribe el nombre..."
                value={form.banco_otro}
                onChangeText={v => setForm(f => ({ ...f, banco_otro: v }))}
                placeholderTextColor={COLORS.textSub} />
            )}
          </>
        )}

        <Text style={s.label}>
          {isDeuda.includes(form.tipo) ? 'Saldo usado actualmente $' : 'Saldo inicial $'}
        </Text>
        <TextInput style={s.input}
          placeholder="0" keyboardType="numeric"
          value={form.saldo_inicial}
          onChangeText={v => setForm(f => ({ ...f, saldo_inicial: numericOnly(v) }))}
          placeholderTextColor={COLORS.textSub} />

        {needsLimite.includes(form.tipo) && (
          <>
            <Text style={s.label}>Límite de crédito $</Text>
            <TextInput style={s.input} placeholder="Ej: 1.000.000"
              keyboardType="numeric" value={form.limite_credito}
              onChangeText={v => setForm(f => ({ ...f, limite_credito: numericOnly(v) }))}
              placeholderTextColor={COLORS.textSub} />
          </>
        )}

        {needsCierre.includes(form.tipo) && (
          <>
            <Text style={s.label}>Día de cierre del mes</Text>
            <TextInput style={s.input} placeholder="Ej: 15"
              keyboardType="numeric" value={form.dia_cierre}
              onChangeText={v => setForm(f => ({ ...f, dia_cierre: numericOnly(v) }))}
              placeholderTextColor={COLORS.textSub} />
          </>
        )}

        {needsCuota.includes(form.tipo) && (
          <>
            <Text style={s.label}>Cuota mensual $</Text>
            <TextInput style={s.input} placeholder="Ej: 150.000"
              keyboardType="numeric" value={form.cuota_mensual}
              onChangeText={v => setForm(f => ({ ...f, cuota_mensual: numericOnly(v) }))}
              placeholderTextColor={COLORS.textSub} />
          </>
        )}

        <Text style={s.label}>Color</Text>
        <View style={s.colorRow}>
          {COLORS_PALETTE.map(c => (
            <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, color: c }))}
              style={[s.colorDot, { backgroundColor: c },
                form.color === c && { borderWidth: 3, borderColor: '#fff',
                  shadowColor: c, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 }
              ]} />
          ))}
        </View>

        <TouchableOpacity style={[s.saveBtn, { backgroundColor: form.color }]}
          onPress={onSave} disabled={saving}>
          <Text style={s.saveBtnText}>
            {saving ? 'Guardando...' : editingCuenta
              ? 'Guardar cambios'
              : `Crear ${tipoActual?.label ?? 'cuenta'}`}
          </Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal interno para seleccionar banco */}
      <Modal visible={showBancoModal} animationType="slide" transparent
        onRequestClose={() => setShowBancoModal(false)}>
        <View style={s.bancoOverlay}>
          <TouchableOpacity style={s.bancoBg} activeOpacity={1}
            onPress={() => setShowBancoModal(false)} />
          <View style={s.bancoSheet}>
            <View style={s.bancoHandle} />
            <Text style={s.bancoTitle}>Seleccionar banco</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANCOS_CL.map(b => (
                <TouchableOpacity key={b} style={s.bancoRow}
                  onPress={() => {
                    setForm(f => ({ ...f, banco: b, banco_otro: '' }))
                    setShowBancoModal(false)
                  }}>
                  <Text style={[s.bancoText, form.banco === b && { color: COLORS.brand, fontFamily: 'Jakarta-Bold' }]}>
                    {b}
                  </Text>
                  {form.banco === b && <Text style={{ color: COLORS.brand }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  label: {
    fontSize: 11, fontFamily: 'Jakarta-SemiBold', color: COLORS.textSub, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
  },
  tipoChip: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border,
    marginRight: 10, backgroundColor: '#F8F9FA', minWidth: 84,
  },
  tipoChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tipoChipText: { fontSize: 10, fontFamily: 'Jakarta-SemiBold', color: COLORS.textSub, textAlign: 'center' },
  tipoChipTextActive: { color: '#fff' },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
    backgroundColor: '#F8F9FA', marginBottom: 12,
  },
  selectText: { fontSize: 14, color: COLORS.text, fontFamily: 'Jakarta-Medium' },
  selectArrow: { fontSize: 14, color: COLORS.textSub },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
    fontSize: 14, color: COLORS.text, fontFamily: 'Jakarta-Regular', backgroundColor: '#F8F9FA', marginBottom: 12,
  },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Jakarta-Bold' },
  bancoOverlay: { flex: 1, justifyContent: 'flex-end' },
  bancoBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bancoSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 0, maxHeight: '60%',
  },
  bancoHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 18,
  },
  bancoTitle: { fontSize: 20, fontFamily: 'Jakarta-ExtraBold', color: COLORS.text, marginBottom: 16 },
  bancoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F4F6F9',
  },
  bancoText: { fontSize: 15, fontFamily: 'Jakarta-Regular', color: COLORS.text },
})
