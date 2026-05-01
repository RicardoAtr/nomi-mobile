import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useSavingsGoals } from '../../src/hooks/useData'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/store/authStore'
import { clp, COLORS, numericOnly } from '../../src/lib/format'

const PALETTE = ['#1D9E75','#378ADD','#EF9F27','#D4537E','#534AB7','#E24B4A']
const ICONOS  = ['&#127919;','&#9992;&#65039;','&#127968;','&#128663;','&#128241;','&#128055;','&#127891;','&#128141;','&#127958;&#65039;','&#128170;']

export default function Metas() {
  const { user } = useAuthStore()
  const { data: goals, loading, refetch } = useSavingsGoals()
  const [showForm, setShowForm] = useState(false)
  const [deposits, setDeposits] = useState({})
  const [form, setForm] = useState({ nombre:'', monto_objetivo:'', fecha_limite:'', color: PALETTE[0], icono:'&#127919;' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalMetas    = goals.length
  const totalAhorrado = goals.reduce((s, g) => s + Number(g.monto_actual), 0)
  const totalObjetivo = goals.reduce((s, g) => s + Number(g.monto_objetivo), 0)

  const handleCreate = async () => {
    if (!form.nombre || !form.monto_objetivo) return Alert.alert('Completa nombre y monto objetivo')
    setSaving(true)
    await supabase.from('savings_goals').insert({
      owner_id: user.id, nombre: form.nombre, icono: form.icono, color: form.color,
      monto_objetivo: Number(form.monto_objetivo), fecha_limite: form.fecha_limite || null,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ nombre:'', monto_objetivo:'', fecha_limite:'', color: PALETTE[0], icono:'&#127919;' })
    refetch()
  }

  const handleDeposit = async (goal) => {
    const amount = Number(deposits[goal.id] ?? 0)
    if (!amount) return Alert.alert('Ingresa un monto')
    const nuevo = Math.min(Number(goal.monto_actual) + amount, Number(goal.monto_objetivo))
    await supabase.from('savings_goals').update({
      monto_actual: nuevo, is_completed: nuevo >= Number(goal.monto_objetivo)
    }).eq('id', goal.id)
    setDeposits(d => ({ ...d, [goal.id]: '' }))
    refetch()
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Metas de ahorro</Text>
          <Text style={s.subtitle}>{totalMetas} meta{totalMetas !== 1 ? 's' : ''} activa{totalMetas !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, showForm && s.addBtnCancel]} onPress={() => setShowForm(v => !v)}>
          <Text style={s.addBtnText}>{showForm ? 'Cancelar' : '+ Nueva'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {totalMetas > 0 && (
          <View style={s.resumenCard}>
            <View style={s.resumenRow}>
              <View style={s.resumenItem}>
                <Text style={s.resumenLabel}>Total ahorrado</Text>
                <Text style={s.resumenVal}>{clp(totalAhorrado)}</Text>
              </View>
              <View style={s.resumenDivider} />
              <View style={s.resumenItem}>
                <Text style={s.resumenLabel}>Total objetivo</Text>
                <Text style={s.resumenVal}>{clp(totalObjetivo)}</Text>
              </View>
              <View style={s.resumenDivider} />
              <View style={s.resumenItem}>
                <Text style={s.resumenLabel}>Metas</Text>
                <Text style={s.resumenVal}>{totalMetas}</Text>
              </View>
            </View>
          </View>
        )}

        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Nueva meta</Text>
            <TextInput style={s.input} placeholder="Nombre (ej: Fondo de emergencia)"
              value={form.nombre} onChangeText={v => set('nombre', v)} placeholderTextColor={COLORS.textSub} />
            <TextInput style={s.input} placeholder="Monto objetivo $" keyboardType="numeric"
              value={form.monto_objetivo} onChangeText={v => set('monto_objetivo', numericOnly(v))} placeholderTextColor={COLORS.textSub} />
            <TextInput style={s.input} placeholder="Fecha limite YYYY-MM-DD (opcional)"
              value={form.fecha_limite} onChangeText={v => set('fecha_limite', v)} placeholderTextColor={COLORS.textSub} />
            <Text style={s.chipLabel}>Color</Text>
            <View style={s.colorRow}>
              {PALETTE.map(c => (
                <TouchableOpacity key={c} onPress={() => set('color', c)}
                  style={[s.colorDot, { backgroundColor: c },
                    form.color === c && { borderWidth: 3, borderColor: '#fff', shadowColor: c, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 }
                  ]} />
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: form.color }]}
              onPress={handleCreate} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Guardando...' : 'Crear meta'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.listWrap}>
          {loading && <Text style={s.empty}>Cargando...</Text>}
          {!loading && goals.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>&#127919;</Text>
              <Text style={s.emptyTitle}>Sin metas aun</Text>
              <Text style={s.empty}>Define tus objetivos financieros y realiza seguimiento</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowForm(true)}>
                <Text style={s.emptyBtnText}>Crear primera meta</Text>
              </TouchableOpacity>
            </View>
          )}
          {goals.map(g => (
            <View key={g.id} style={[s.goalCard, { borderLeftColor: g.color, borderLeftWidth: 4 }]}>
              <View style={s.goalTop}>
                <View style={[s.goalIconWrap, { backgroundColor: g.color + '18' }]}>
                  <Text style={{ fontSize: 26 }}>{g.icono}</Text>
                </View>
                <View style={s.goalInfo}>
                  <Text style={s.goalName}>{g.nombre}</Text>
                  {g.dias_restantes !== null && (
                    <Text style={[s.goalDias, { color: g.dias_restantes < 30 ? COLORS.red : COLORS.textSub }]}>
                      {g.dias_restantes > 0 ? `${g.dias_restantes} dias restantes` : 'Meta vencida'}
                    </Text>
                  )}
                </View>
                <View style={s.goalPctWrap}>
                  <Text style={[s.goalPct, { color: g.color }]}>{g.porcentaje}%</Text>
                </View>
              </View>

              <View style={s.barBg}>
                <View style={[s.barFill, {
                  width: `${Math.min(Number(g.porcentaje), 100)}%`,
                  backgroundColor: g.color
                }]} />
              </View>

              <View style={s.goalAmounts}>
                <View>
                  <Text style={s.goalAmtLabel}>Ahorrado</Text>
                  <Text style={[s.goalAmtVal, { color: g.color }]}>{clp(g.monto_actual)}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.goalAmtLabel}>Falta</Text>
                  <Text style={s.goalAmtVal}>{clp(g.faltante)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.goalAmtLabel}>Objetivo</Text>
                  <Text style={s.goalAmtVal}>{clp(g.monto_objetivo)}</Text>
                </View>
              </View>

              <View style={s.depositRow}>
                <TextInput style={s.depositInput} placeholder="Abonar $..." keyboardType="numeric"
                  value={deposits[g.id] ?? ''} placeholderTextColor={COLORS.textSub}
                  onChangeText={v => setDeposits(d => ({ ...d, [g.id]: numericOnly(v) }))} />
                <TouchableOpacity style={[s.depositBtn, { backgroundColor: g.color }]}
                  onPress={() => handleDeposit(g)}>
                  <Text style={s.depositBtnText}>Abonar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F4F6F9' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
                    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title:          { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle:       { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  addBtn:         { backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnCancel:   { backgroundColor: '#888780' },
  addBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  resumenCard:    { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20,
                    padding: 18, marginBottom: 16 },
  resumenRow:     { flexDirection: 'row', alignItems: 'center' },
  resumenItem:    { flex: 1, alignItems: 'center' },
  resumenDivider: { width: 1, height: 40, backgroundColor: '#F4F6F9' },
  resumenLabel:   { fontSize: 11, color: COLORS.textSub, fontWeight: '600', marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: 0.4 },
  resumenVal:     { fontSize: 16, fontWeight: '800', color: COLORS.text },
  formCard:       { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 18, marginBottom: 16 },
  formTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  input:          { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
                    fontSize: 14, color: COLORS.text, backgroundColor: '#F8F9FA', marginBottom: 12 },
  chipLabel:      { fontSize: 11, fontWeight: '600', color: COLORS.textSub, marginBottom: 10,
                    textTransform: 'uppercase', letterSpacing: 0.5 },
  colorRow:       { flexDirection: 'row', gap: 12, marginBottom: 18 },
  colorDot:       { width: 32, height: 32, borderRadius: 16 },
  saveBtn:        { borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
  listWrap:       { paddingHorizontal: 20 },
  emptyWrap:      { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  empty:          { textAlign: 'center', color: COLORS.textSub, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  emptyBtn:       { backgroundColor: COLORS.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  goalCard:       { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  goalTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  goalIconWrap:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalInfo:       { flex: 1 },
  goalName:       { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  goalDias:       { fontSize: 12, fontWeight: '500' },
  goalPctWrap:    {},
  goalPct:        { fontSize: 20, fontWeight: '800' },
  barBg:          { height: 8, backgroundColor: '#F4F6F9', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  barFill:        { height: '100%', borderRadius: 4 },
  goalAmounts:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  goalAmtLabel:   { fontSize: 10, color: COLORS.textSub, fontWeight: '600', textTransform: 'uppercase',
                    letterSpacing: 0.4, marginBottom: 4 },
  goalAmtVal:     { fontSize: 14, fontWeight: '700', color: COLORS.text },
  depositRow:     { flexDirection: 'row', gap: 10 },
  depositInput:   { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: COLORS.text, backgroundColor: '#F8F9FA' },
  depositBtn:     { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center' },
  depositBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
