import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, Dimensions, SafeAreaView
} from 'react-native'
import { useTransactions, useAccounts, useCategories } from '../../src/hooks/useData'
import { supabase } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/store/authStore'
import { clp, shortDate, COLORS, numericOnly } from '../../src/lib/format'

const now = new Date()
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Transacciones() {
  const [mes, setMes]       = useState(now.getMonth() + 1)
  const [anio]              = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]     = useState({
    tipo: 'gasto', monto: '', descripcion: '',
    account_id: '', category_id: '',
    fecha: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const { user } = useAuthStore()

  const { data: txs, loading, refetch } = useTransactions({ mes, anio, limit: 100 })
  const { data: accounts } = useAccounts()
  const { data: cats }     = useCategories()

  useEffect(() => { refetch() }, [mes])

  const filtered = txs.filter(t =>
    !search || t.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  const totales = filtered.reduce((acc, t) => {
    if (t.tipo === 'ingreso') acc.ingresos += Number(t.monto)
    if (t.tipo === 'gasto')   acc.gastos   += Number(t.monto)
    return acc
  }, { ingresos: 0, gastos: 0 })

  const resetForm = () => {
    setForm({ tipo:'gasto', monto:'', descripcion:'', account_id:'', category_id:'', fecha: new Date().toISOString().split('T')[0] })
    setShowModal(false)
  }

  const handleSave = async () => {
    if (!form.monto || !form.descripcion || !form.account_id)
      return Alert.alert('Faltan datos', 'Completa monto, descripcion y cuenta.')
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      ...form, monto: Number(form.monto), created_by: user.id
    })
    setSaving(false)
    if (error) return Alert.alert('Error', error.message)
    resetForm()
    refetch()
  }

  const handleDelete = (id) => {
    Alert.alert('Eliminar', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await supabase.from('transactions').update({ is_deleted: true }).eq('id', id)
        refetch()
      }}
    ])
  }

  return (
    <View style={s.container}>
      {/* Todo en un solo ScrollView para evitar gaps */}
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Header sticky */}
        <View style={s.stickyHeader}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.title}>Movimientos</Text>
              <Text style={s.subtitle}>{MESES[mes-1]} {anio}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
              <Text style={s.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
            {MESES.map((m, i) => (
              <TouchableOpacity key={m} onPress={() => setMes(i + 1)}
                style={[s.monthBtn, mes === i + 1 && s.monthBtnActive]}>
                <Text style={[s.monthText, mes === i + 1 && s.monthTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Totales */}
        <View style={s.totalesRow}>
          <View style={[s.totalCard, { borderTopColor: COLORS.brand }]}>
            <Text style={s.totalLabel}>Ingresos</Text>
            <Text style={[s.totalVal, { color: COLORS.brand }]}>{clp(totales.ingresos)}</Text>
          </View>
          <View style={[s.totalCard, { borderTopColor: COLORS.red }]}>
            <Text style={s.totalLabel}>Gastos</Text>
            <Text style={[s.totalVal, { color: COLORS.red }]}>{clp(totales.gastos)}</Text>
          </View>
          <View style={[s.totalCard, {
            borderTopColor: totales.ingresos - totales.gastos >= 0 ? COLORS.brand : COLORS.red
          }]}>
            <Text style={s.totalLabel}>Balance</Text>
            <Text style={[s.totalVal, {
              color: totales.ingresos - totales.gastos >= 0 ? COLORS.brand : COLORS.red
            }]}>{clp(totales.ingresos - totales.gastos)}</Text>
          </View>
        </View>

        {/* Búsqueda */}
        <View style={s.searchWrap}>
          <TextInput style={s.searchInput} placeholder="Buscar movimientos..."
            placeholderTextColor={COLORS.textSub} value={search} onChangeText={setSearch} />
        </View>

        {/* Lista */}
        {loading && <Text style={s.empty}>Cargando...</Text>}
        {!loading && filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.empty}>Sin movimientos este mes</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={s.emptyBtnText}>Agregar el primero</Text>
            </TouchableOpacity>
          </View>
        )}
        {filtered.map((tx, idx) => (
          <TouchableOpacity key={tx.id} style={s.txCard}
            onLongPress={() => handleDelete(tx.id)}>
            <View style={[s.txIconWrap,
              { backgroundColor: (tx.category?.color ?? COLORS.gray) + '18' }]}>
              <Text style={{ fontSize: 22 }}>{tx.category?.icono ?? '💰'}</Text>
            </View>
            <View style={s.txInfo}>
              <Text style={s.txName} numberOfLines={1}>{tx.descripcion}</Text>
              <Text style={s.txMeta}>{tx.category?.nombre ?? 'Sin categoria'} · {shortDate(tx.fecha)}</Text>
            </View>
            <View style={s.txRight}>
              <Text style={[s.txAmount, { color: tx.tipo === 'ingreso' ? COLORS.brand : COLORS.red }]}>
                {tx.tipo === 'ingreso' ? '+' : '-'}{clp(tx.monto)}
              </Text>
              <View style={[s.txBadge,
                { backgroundColor: tx.tipo === 'ingreso' ? '#E1F5EE' : '#FCEBEB' }]}>
                <Text style={[s.txBadgeText,
                  { color: tx.tipo === 'ingreso' ? COLORS.brand2 : COLORS.red }]}>
                  {tx.tipo}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal bottom sheet */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={resetForm}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={resetForm} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nueva transaccion</Text>
              <TouchableOpacity onPress={resetForm} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.tipoRow}>
              {['ingreso','gasto'].map(t => (
                <TouchableOpacity key={t}
                  onPress={() => setForm(f => ({ ...f, tipo: t, category_id: '' }))}
                  style={[s.tipoBtn,
                    form.tipo === t && {
                      backgroundColor: t === 'ingreso' ? COLORS.brand : COLORS.red,
                      borderColor: 'transparent'
                    }
                  ]}>
                  <Text style={[s.tipoBtnText, form.tipo === t && { color: '#fff' }]}>
                    {t === 'ingreso' ? '📈  Ingreso' : '📉  Gasto'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={s.modalInput} placeholder="Monto $" keyboardType="numeric"
              value={form.monto} onChangeText={v => setForm(f => ({ ...f, monto: numericOnly(v) }))}
              placeholderTextColor={COLORS.textSub} />
            <TextInput style={s.modalInput} placeholder="Descripcion (ej: Supermercado)"
              value={form.descripcion} onChangeText={v => setForm(f => ({ ...f, descripcion: v }))}
              placeholderTextColor={COLORS.textSub} />

            <Text style={s.chipLabel}>Cuenta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {accounts.map(a => (
                <TouchableOpacity key={a.id}
                  onPress={() => setForm(f => ({ ...f, account_id: a.id }))}
                  style={[s.chip, form.account_id === a.id && s.chipActive]}>
                  <Text style={[s.chipText, form.account_id === a.id && s.chipTextActive]}>
                    {a.icono} {a.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.chipLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {cats.filter(c => c.tipo === form.tipo).map(c => (
                <TouchableOpacity key={c.id}
                  onPress={() => setForm(f => ({ ...f, category_id: c.id }))}
                  style={[s.chip, form.category_id === c.id && s.chipActive]}>
                  <Text style={[s.chipText, form.category_id === c.id && s.chipTextActive]}>
                    {c.icono} {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: form.tipo === 'ingreso' ? COLORS.brand : COLORS.red }]}
              onPress={handleSave} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Guardando...' : 'Guardar transaccion'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F4F6F9' },
  scroll:         { flex: 1 },
  stickyHeader:   { backgroundColor: '#F4F6F9', paddingTop: 60 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
                    paddingHorizontal: 20, paddingBottom: 12 },
  title:          { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle:       { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  addBtn:         { backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  monthBtn:       { paddingHorizontal: 16, height: 34, borderRadius: 20, justifyContent: 'center',
                    alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  monthBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  monthText:      { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
  monthTextActive:{ color: '#fff', fontWeight: '600' },
  totalesRow:     { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  totalCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderTopWidth: 3 },
  totalLabel:     { fontSize: 10, color: COLORS.textSub, fontWeight: '600', marginBottom: 4,
                    textTransform: 'uppercase', letterSpacing: 0.5 },
  totalVal:       { fontSize: 13, fontWeight: '800' },
  searchWrap:     { paddingHorizontal: 20, marginBottom: 12 },
  searchInput:    { backgroundColor: '#fff', borderRadius: 14, padding: 12,
                    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  emptyWrap:      { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:     { fontSize: 40, marginBottom: 12 },
  empty:          { textAlign: 'center', color: COLORS.textSub, fontSize: 14, marginBottom: 16 },
  emptyBtn:       { backgroundColor: COLORS.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  txCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                    borderRadius: 16, padding: 14, marginBottom: 10, marginHorizontal: 20 },
  txIconWrap:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center',
                    justifyContent: 'center', marginRight: 12 },
  txInfo:         { flex: 1 },
  txName:         { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  txMeta:         { fontSize: 12, color: COLORS.textSub },
  txRight:        { alignItems: 'flex-end', gap: 5 },
  txAmount:       { fontSize: 15, fontWeight: '800' },
  txBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  txBadgeText:    { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  modalOverlay:   { flex: 1, justifyContent: 'flex-end' },
  modalBg:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                    padding: 20, paddingBottom: 36 },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
                    alignSelf: 'center', marginBottom: 18 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 18 },
  modalTitle:     { fontSize: 20, fontWeight: '800', color: COLORS.text },
  modalClose:     { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F6F9',
                    alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 13, color: COLORS.textSub, fontWeight: '700' },
  tipoRow:        { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tipoBtn:        { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5,
                    borderColor: COLORS.border, alignItems: 'center' },
  tipoBtnText:    { fontSize: 14, fontWeight: '600', color: COLORS.text },
  modalInput:     { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
                    fontSize: 14, color: COLORS.text, backgroundColor: '#F8F9FA', marginBottom: 12 },
  chipLabel:      { fontSize: 11, fontWeight: '600', color: COLORS.textSub, marginBottom: 8,
                    textTransform: 'uppercase', letterSpacing: 0.5 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                    borderColor: COLORS.border, marginRight: 8, backgroundColor: '#F8F9FA' },
  chipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText:       { fontSize: 12, fontWeight: '500', color: COLORS.textSub },
  chipTextActive: { color: '#fff' },
  saveBtn:        { borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
})
