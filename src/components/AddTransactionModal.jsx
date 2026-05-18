import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, InputAccessoryView,
  Keyboard, Alert, Vibration, ScrollView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAccounts, useCategories } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { COLORS, formatInputCLP, parseInputCLP } from '../lib/format'

const F = {
  regular:   'Jakarta-Regular',
  medium:    'Jakarta-Medium',
  semiBold:  'Jakarta-SemiBold',
  bold:      'Jakarta-Bold',
  extraBold: 'Jakarta-ExtraBold',
}

const TIPOS = [
  { key: 'gasto',         label: '📉 Gasto',      color: COLORS.red },
  { key: 'ingreso',       label: '📈 Ingreso',     color: COLORS.accent },
  { key: 'transferencia', label: '↔️ Transfer.',   color: '#378ADD' },
]

const defaultForm = () => ({
  tipo:        'gasto',
  monto:       '',
  descripcion: '',
  account_id:  '',
  category_id: '',
  fecha:       new Date().toISOString().split('T')[0],
})

export default function AddTransactionModal({ visible, onClose, onSaved }) {
  const { user } = useAuthStore()
  const { data: accounts } = useAccounts()
  const { data: cats }     = useCategories()
  const [form, setForm]                     = useState(defaultForm())
  const [saving, setSaving]                 = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerDate, setDatePickerDate] = useState(new Date())

  const tipoActual = TIPOS.find(t => t.key === form.tipo)

  const reset = () => {
    setForm(defaultForm())
    setDatePickerDate(new Date())
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!form.monto || !form.descripcion || !form.account_id)
      return Alert.alert('Faltan datos', 'Completa monto, descripcion y cuenta.')
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      ...form,
      monto:      Number(form.monto),
      created_by: user.id,
    })
    setSaving(false)
    if (error) return Alert.alert('Error', error.message)
    Vibration.vibrate(10)
    reset()
    onSaved()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <TouchableOpacity style={s.bg} activeOpacity={1} onPress={handleClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>Nueva transacción</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tipo */}
          <View style={s.tipoRow}>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setForm((f) => ({ ...f, tipo: t.key, category_id: '' }))}
                style={[s.tipoBtn, form.tipo === t.key && { backgroundColor: t.color, borderColor: 'transparent' }]}
              >
                <Text style={[s.tipoBtnText, form.tipo === t.key && { color: '#fff' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={s.input}
            placeholder="Monto $"
            keyboardType="numeric"
            inputAccessoryViewID="numpad-add"
            value={formatInputCLP(form.monto)}
            onChangeText={(v) => setForm((f) => ({ ...f, monto: parseInputCLP(v) }))}
            placeholderTextColor={COLORS.textSub}
          />
          <TextInput
            style={s.input}
            placeholder="Descripción (ej: Supermercado)"
            value={form.descripcion}
            onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
            placeholderTextColor={COLORS.textSub}
          />

          <Text style={s.label}>Cuenta</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {accounts.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setForm((f) => ({ ...f, account_id: a.id }))}
                style={[s.chip, form.account_id === a.id && s.chipActive]}
              >
                <Text style={[s.chipText, form.account_id === a.id && s.chipTextActive]}>
                  {a.icono} {a.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {cats.filter((c) => c.tipo === form.tipo).map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setForm((f) => ({ ...f, category_id: c.id }))}
                style={[s.chip, form.category_id === c.id && s.chipActive]}
              >
                <Text style={[s.chipText, form.category_id === c.id && s.chipTextActive]}>
                  {c.icono} {c.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Fecha</Text>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={s.dateBtnText}>
              {new Date(form.fecha + 'T12:00:00').toLocaleDateString('es-CL', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Text>
            <Text style={{ fontSize: 16 }}>📅</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: tipoActual?.color ?? COLORS.brand }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Guardando...' : 'Guardar transacción'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
        <View style={s.datePicker}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: COLORS.textSub, fontFamily: F.semiBold, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: COLORS.brand, fontFamily: F.bold, fontSize: 15 }}>Listo</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={datePickerDate}
            mode="date"
            display="spinner"
            locale="es-CL"
            textColor={COLORS.text}
            maximumDate={new Date()}
            onChange={(e, date) => {
              if (date) {
                setDatePickerDate(date)
                setForm((f) => ({ ...f, fecha: date.toISOString().split('T')[0] }))
              }
            }}
          />
        </View>
      </Modal>

      <InputAccessoryView nativeID="numpad-add">
        <View style={{ backgroundColor: COLORS.surface, padding: 8, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: COLORS.brand, fontFamily: F.bold, fontSize: 16 }}>Listo</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 18,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  title: { fontSize: 20, fontFamily: F.extraBold, color: COLORS.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, fontFamily: F.bold, color: COLORS.textSub },
  tipoRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tipoBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  tipoBtnText: { fontSize: 12, fontFamily: F.semiBold, color: COLORS.text },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
    fontSize: 14, fontFamily: F.regular, color: COLORS.text,
    backgroundColor: COLORS.surface, marginBottom: 12,
  },
  label: {
    fontSize: 11, fontFamily: F.semiBold, color: COLORS.textSub,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  chipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText:       { fontSize: 12, fontFamily: F.medium, color: COLORS.textSub },
  chipTextActive: { color: '#fff' },
  dateBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
    backgroundColor: COLORS.surface, marginBottom: 14,
  },
  dateBtnText: { fontSize: 14, fontFamily: F.regular, color: COLORS.text, flex: 1 },
  saveBtn:     { borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: F.bold },
  datePicker: {
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20, paddingBottom: 40,
  },
})
