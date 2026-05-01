import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal
} from 'react-native'
import { useAuthStore } from '../../src/store/authStore'
import { useAccounts } from '../../src/hooks/useData'
import { supabase } from '../../src/lib/supabase'
import { COLORS, clp, numericOnly } from '../../src/lib/format'
import { useFocusEffect } from 'expo-router'

const BANCOS_CL = [
  'Banco BCI', 'Banco Santander', 'Banco de Chile', 'Banco Estado',
  'Banco Falabella', 'Banco Ripley', 'Banco Itaú', 'Banco Security',
  'Banco BICE', 'Banco Scotiabank', 'Mercado Pago', 'Fintual',
  'Tenpo', 'MACH', 'Coopeuch', 'Otro'
]

const TIPOS_CUENTA = [
  { key: 'corriente',       label: 'Corriente',     icono: '🏦' },
  { key: 'vista',           label: 'Vista / RUT',   icono: '💳' },
  { key: 'ahorro',          label: 'Ahorro',        icono: '🐷' },
  { key: 'tarjeta_credito', label: 'T. Crédito',   icono: '💰' },
  { key: 'efectivo',        label: 'Efectivo',      icono: '💵' },
  { key: 'inversion',       label: 'Inversión',     icono: '📈' },
  { key: 'linea_credito',   label: 'Línea Créd.',  icono: '🏧' },
  { key: 'prestamo',        label: 'Préstamo',      icono: '📋' },
]

const COLORS_PALETTE = ['#1D9E75','#378ADD','#EF9F27','#D4537E','#534AB7','#E24B4A','#888780','#0F6E56']
const needsBanco  = ['corriente','vista','ahorro','tarjeta_credito','linea_credito','prestamo','inversion']
const needsLimite = ['tarjeta_credito','linea_credito']
const needsCierre = ['tarjeta_credito']
const needsCuota  = ['prestamo']

const FEATURES_PREMIUM = [
  'Cuentas ilimitadas', 'Metas ilimitadas', 'Presupuestos ilimitados',
  'Historial completo', 'Exportar Excel/PDF', 'Múltiples usuarios', 'Soporte prioritario',
]
const FEATURES_FREE = [
  { label: '3 cuentas', ok: true }, { label: '3 metas', ok: true },
  { label: '3 presupuestos', ok: true }, { label: 'Historial 3 meses', ok: true },
  { label: 'Exportar Excel/PDF', ok: false }, { label: 'Múltiples usuarios', ok: false },
]

function defaultCuentaForm() {
  return { nombre:'', tipo:'corriente', banco:'', banco_otro:'',
    saldo_inicial:'0', color: COLORS_PALETTE[0], icono:'🏦',
    limite_credito:'', cuota_mensual:'', dia_cierre:'' }
}

export default function Perfil() {
  const { profile, signOut, fetchProfile, user } = useAuthStore()
  const { data: accounts, refetch: refetchAcc } = useAccounts()
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saved, setSaved]       = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')
  const [showCuentaModal, setShowCuentaModal] = useState(false)
  const [showBancoModal, setShowBancoModal]   = useState(false)
  const [cuentaForm, setCuentaForm] = useState(defaultCuentaForm())
  const [savingCuenta, setSavingCuenta] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState(null)
  const isPremium = profile?.plan === 'premium'

  useFocusEffect(useCallback(() => {
    if (profile?.nickname) setNickname(profile.nickname)
    refetchAcc()
  }, [profile]))

  const handleSaveNickname = async () => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ nickname }).eq('id', user.id)
    if (!error) { await fetchProfile(user); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut }
    ])
  }

  const tipoActual = TIPOS_CUENTA.find(t => t.key === cuentaForm.tipo)
  const bancoFinal = cuentaForm.banco === 'Otro' ? cuentaForm.banco_otro : cuentaForm.banco
  const setTipo = (key) => {
    const t = TIPOS_CUENTA.find(t => t.key === key)
    setCuentaForm({ ...defaultCuentaForm(), tipo: key, icono: t?.icono ?? '🏦', color: cuentaForm.color })
  }

  const openCuentaEdit = (a) => {
    const meta = (() => { try { return JSON.parse(a.notas ?? '') } catch { return null } })()
    setEditingCuenta(a)
    setCuentaForm({
      nombre: a.nombre, tipo: a.tipo, banco: a.banco || '', banco_otro: '',
      saldo_inicial: String(a.saldo_inicial), color: a.color, icono: a.icono,
      limite_credito: meta?.limite_credito ? String(meta.limite_credito) : '',
      cuota_mensual: meta?.cuota_mensual ? String(meta.cuota_mensual) : '',
      dia_cierre: meta?.dia_cierre ? String(meta.dia_cierre) : '',
    })
    setShowCuentaModal(true)
  }

  const handleCreateCuenta = async () => {
    if (!cuentaForm.nombre) return Alert.alert('Ingresa un nombre para la cuenta')
    if (needsBanco.includes(cuentaForm.tipo) && !bancoFinal)
      return Alert.alert('Selecciona o ingresa el banco')
    setSavingCuenta(true)
    const payload = {
      owner_id: user.id, nombre: cuentaForm.nombre, tipo: cuentaForm.tipo,
      banco: bancoFinal || null, saldo_inicial: Number(cuentaForm.saldo_inicial) || 0,
      color: cuentaForm.color, icono: cuentaForm.icono,
    }
    if (needsLimite.includes(cuentaForm.tipo) && cuentaForm.limite_credito) {
      payload.notas = JSON.stringify({
        limite_credito: Number(cuentaForm.limite_credito),
        dia_cierre: cuentaForm.dia_cierre || null,
        cuota_mensual: cuentaForm.cuota_mensual || null,
      })
    }
    let error
    if (editingCuenta) {
      const res = await supabase.from('accounts').update(payload).eq('id', editingCuenta.id)
      error = res.error
    } else {
      const res = await supabase.from('accounts').insert(payload)
      error = res.error
    }
    setSavingCuenta(false)
    if (error) return Alert.alert('Error', error.message)
    setEditingCuenta(null)
    setCuentaForm(defaultCuentaForm())
    setShowCuentaModal(false)
    refetchAcc()
  }

  const handleCuentaOptions = (account) => {
    Alert.alert(
      account.nombre,
      'Qué quieres hacer con esta cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: account.is_active ? 'Desactivar' : 'Activar',
          onPress: async () => {
            await supabase.from('accounts').update({ is_active: !account.is_active }).eq('id', account.id)
            refetchAcc()
          }
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Eliminar cuenta',
              'Se eliminará la cuenta y todos sus movimientos. Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: async () => {
                    await supabase.from('accounts').update({ is_active: false }).eq('id', account.id)
                    await supabase.from('accounts').delete().eq('id', account.id)
                    refetchAcc()
                  }
                }
              ]
            )
          }
        }
      ]
    )
  }

  const totalPatrimonio = accounts.reduce((s, a) => s + Number(a.saldo_actual ?? 0), 0)

  return (
    <View style={s.container}>
      <View style={s.headerCard}>
        <View style={s.avatarLarge}>
          <Text style={s.avatarText}>{(profile?.nombre ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.nameText}>{profile?.nombre ?? '—'}</Text>
        <Text style={s.emailText}>{profile?.email ?? '—'}</Text>
        {profile?.nickname && <Text style={s.nicknameText}>@{profile.nickname}</Text>}
        <View style={[s.planChip, isPremium && s.planChipPremium]}>
          <Text style={[s.planChipText, isPremium && s.planChipTextPremium]}>
            {isPremium ? '⭐ Premium' : '🔥 Plan Gratis'}
          </Text>
        </View>
        <View style={s.tabs}>
          {['perfil','cuentas','plan'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)}
              style={[s.tab, activeTab === t && s.tabActive]}>
              <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>
                {t === 'perfil' ? 'Perfil' : t === 'cuentas' ? 'Cuentas' : 'Plan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── PERFIL ── */}
        {activeTab === 'perfil' && (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Personalización</Text>
              <Text style={s.label}>¿Cómo te llamamos?</Text>
              <TextInput style={s.input} value={nickname} onChangeText={setNickname}
                placeholder="Ej: RicardoDev" placeholderTextColor={COLORS.textSub} />
              <Text style={s.hint}>Si tienes apodo, el saludo del inicio lo usará.</Text>
              <TouchableOpacity style={[s.saveBtn, saved && { backgroundColor: '#0F6E56' }]}
                onPress={handleSaveNickname}>
                <Text style={s.saveBtnText}>{saved ? '✓ Guardado' : 'Guardar cambios'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Sesión</Text>
              <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
                <Text style={s.signOutIcon}>🚪</Text>
                <Text style={s.signOutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.version}>Nomi v1.0 — Tu dinero, ordenado</Text>
          </>
        )}

        {/* ── CUENTAS ── */}
        {activeTab === 'cuentas' && (
          <>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View>
                  <Text style={s.sectionTitle}>Mis cuentas</Text>
                  <Text style={s.sectionSub}>Patrimonio: {clp(totalPatrimonio)}</Text>
                </View>
                <TouchableOpacity style={s.addBtn} onPress={() => setShowCuentaModal(true)}>
                  <Text style={s.addBtnText}>+ Nueva</Text>
                </TouchableOpacity>
              </View>
              {accounts.length === 0 && (
                <TouchableOpacity style={s.emptyDashed} onPress={() => setShowCuentaModal(true)}>
                  <Text style={s.emptyDashedText}>Toca para agregar tu primera cuenta</Text>
                </TouchableOpacity>
              )}
              {accounts.map(a => {
                const meta = (() => { try { return JSON.parse(a.notas ?? '') } catch { return null } })()
                const limite = meta?.limite_credito
                const usado = Math.abs(Number(a.saldo_actual))
                const pctUsado = limite ? Math.min((usado / limite) * 100, 100) : 0
                const semaforo = pctUsado > 80 ? COLORS.red : pctUsado > 50 ? COLORS.amber : COLORS.brand
                const tipoLabel = TIPOS_CUENTA.find(t => t.key === a.tipo)?.label ?? a.tipo

                return (
                  <TouchableOpacity key={a.id}
                    style={[s.accountRow, { borderLeftColor: a.color, opacity: a.is_active ? 1 : 0.5 }]}
                    onLongPress={() => handleCuentaOptions(a)}>
                    <View style={[s.accountIconWrap, { backgroundColor: a.color + '18' }]}>
                      <Text style={{ fontSize: 22 }}>{a.icono}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.accountNameRow}>
                        <Text style={s.accountNombre}>{a.nombre}</Text>
                        <View style={[s.tipoBadge, { backgroundColor: a.color + '18' }]}>
                          <Text style={[s.tipoBadgeText, { color: a.color }]}>{tipoLabel}</Text>
                        </View>
                      </View>
                      {a.banco && <Text style={s.accountBanco}>{a.banco}</Text>}
                      {limite ? (
                        <>
                          <View style={s.barBg}>
                            <View style={[s.barFill, { width: `${pctUsado}%`, backgroundColor: semaforo }]} />
                          </View>
                          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop: 4 }}>
                            <Text style={s.accountSub}>{clp(usado)} usado</Text>
                            <Text style={[s.accountSub, { color: semaforo, fontWeight:'700' }]}>{pctUsado.toFixed(0)}%</Text>
                            <Text style={s.accountSub}>Límite {clp(limite)}</Text>
                          </View>
                        </>
                      ) : (
                        <Text style={[s.accountSaldo, { color: Number(a.saldo_actual) >= 0 ? COLORS.text : COLORS.red }]}>
                          {clp(a.saldo_actual)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
              {accounts.length > 0 && (
                <Text style={s.hintSmall}>Mantén presionada una cuenta para más opciones</Text>
              )}
            </View>
          </>
        )}

        {/* ── PLAN ── */}
        {activeTab === 'plan' && (
          <>
            {!isPremium ? (
              <>
                <View style={s.upgradeCard}>
                  <Text style={s.upgradeTitle}>✨ Pásate a Premium</Text>
                  <Text style={s.upgradeDesc}>Desbloquea todo el potencial de Nomi.</Text>
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {FEATURES_PREMIUM.map(f => (
                      <View key={f} style={{ flexDirection:'row', gap: 10, alignItems:'center' }}>
                        <Text style={{ color:'#fff', fontWeight:'700' }}>✓</Text>
                        <Text style={{ color:'rgba(255,255,255,0.9)', fontSize:14, fontWeight:'500' }}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={s.upgradeBtn}
                    onPress={() => Alert.alert('Próximamente', 'Las suscripciones estarán disponibles pronto.')}>
                    <Text style={s.upgradeBtnText}>Ver planes — desde $2.990/mes</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Tu plan actual</Text>
                  {FEATURES_FREE.map(f => (
                    <View key={f.label} style={s.featureRow}>
                      <Text style={{ color: f.ok ? COLORS.brand : '#D1D5DB', fontWeight:'800', width:20 }}>
                        {f.ok ? '✓' : '✕'}
                      </Text>
                      <Text style={[s.featureText, !f.ok && { color:'#9CA3AF' }]}>{f.label}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={[s.section, { alignItems:'center', paddingVertical: 32 }]}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
                <Text style={[s.sectionTitle, { textAlign:'center' }]}>Eres Premium</Text>
                <Text style={{ color: COLORS.textSub, textAlign:'center', marginTop: 6 }}>
                  Tienes acceso a todas las funciones de Nomi.
                </Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal nueva cuenta */}
      <Modal visible={showCuentaModal} animationType="slide" transparent onRequestClose={() => { setShowCuentaModal(false); setEditingCuenta(null); setCuentaForm(defaultCuentaForm()) }}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => { setShowCuentaModal(false); setEditingCuenta(null); setCuentaForm(defaultCuentaForm()) }} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.modalTitle}>{editingCuenta ? 'Editar cuenta' : 'Nueva cuenta'}</Text>
                {tipoActual && <Text style={s.modalSub}>{tipoActual.label}</Text>}
              </View>
              <TouchableOpacity onPress={() => setShowCuentaModal(false)} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.chipLabel}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {TIPOS_CUENTA.map(t => (
                  <TouchableOpacity key={t.key} onPress={() => setTipo(t.key)}
                    style={[s.tipoChip, cuentaForm.tipo === t.key && s.tipoChipActive]}>
                    <Text style={{ fontSize: 18, marginBottom: 3 }}>{t.icono}</Text>
                    <Text style={[s.tipoChipText, cuentaForm.tipo === t.key && s.tipoChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.chipLabel}>Nombre *</Text>
              <TextInput style={s.modalInput} placeholder={`Ej: ${tipoActual?.label} BCI`}
                value={cuentaForm.nombre} onChangeText={v => setCuentaForm(f => ({...f, nombre: v}))}
                placeholderTextColor={COLORS.textSub} />
              {needsBanco.includes(cuentaForm.tipo) && (
                <>
                  <Text style={s.chipLabel}>Banco / Institución *</Text>
                  <TouchableOpacity style={s.selectBtn} onPress={() => setShowBancoModal(true)}>
                    <Text style={[s.selectBtnText, !cuentaForm.banco && { color: COLORS.textSub }]}>
                      {cuentaForm.banco || 'Seleccionar...'}
                    </Text>
                    <Text style={s.selectArrow}>▾</Text>
                  </TouchableOpacity>
                  {cuentaForm.banco === 'Otro' && (
                    <TextInput style={s.modalInput} placeholder="Escribe el nombre..."
                      value={cuentaForm.banco_otro} onChangeText={v => setCuentaForm(f => ({...f, banco_otro: v}))}
                      placeholderTextColor={COLORS.textSub} />
                  )}
                </>
              )}
              <Text style={s.chipLabel}>Saldo inicial $</Text>
              <TextInput style={s.modalInput} placeholder="0" keyboardType="numeric"
                value={cuentaForm.saldo_inicial}
                onChangeText={v => setCuentaForm(f => ({...f, saldo_inicial: numericOnly(v)}))}
                placeholderTextColor={COLORS.textSub} />
              {needsLimite.includes(cuentaForm.tipo) && (
                <>
                  <Text style={s.chipLabel}>Límite de crédito $</Text>
                  <TextInput style={s.modalInput} placeholder="Ej: 1000000" keyboardType="numeric"
                    value={cuentaForm.limite_credito}
                    onChangeText={v => setCuentaForm(f => ({...f, limite_credito: numericOnly(v)}))}
                    placeholderTextColor={COLORS.textSub} />
                </>
              )}
              {needsCierre.includes(cuentaForm.tipo) && (
                <>
                  <Text style={s.chipLabel}>Día de cierre</Text>
                  <TextInput style={s.modalInput} placeholder="Ej: 15" keyboardType="numeric"
                    value={cuentaForm.dia_cierre}
                    onChangeText={v => setCuentaForm(f => ({...f, dia_cierre: numericOnly(v)}))}
                    placeholderTextColor={COLORS.textSub} />
                </>
              )}
              {needsCuota.includes(cuentaForm.tipo) && (
                <>
                  <Text style={s.chipLabel}>Cuota mensual $</Text>
                  <TextInput style={s.modalInput} placeholder="Ej: 150000" keyboardType="numeric"
                    value={cuentaForm.cuota_mensual}
                    onChangeText={v => setCuentaForm(f => ({...f, cuota_mensual: numericOnly(v)}))}
                    placeholderTextColor={COLORS.textSub} />
                </>
              )}
              <Text style={s.chipLabel}>Color</Text>
              <View style={s.colorRow}>
                {COLORS_PALETTE.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCuentaForm(f => ({...f, color: c}))}
                    style={[s.colorDot, { backgroundColor: c },
                      cuentaForm.color === c && { borderWidth:3, borderColor:'#fff',
                        shadowColor: c, shadowOpacity:0.6, shadowRadius:4, elevation:4 }
                    ]} />
                ))}
              </View>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: cuentaForm.color }]}
                onPress={handleCreateCuenta} disabled={savingCuenta}>
                <Text style={s.saveBtnText}>{savingCuenta ? 'Guardando...' : editingCuenta ? 'Guardar cambios' : `Crear ${tipoActual?.label ?? 'cuenta'}`}</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal banco */}
      <Modal visible={showBancoModal} animationType="slide" transparent onRequestClose={() => setShowBancoModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setShowBancoModal(false)} />
          <View style={[s.modalSheet, { maxHeight: '60%' }]}>
            <View style={s.modalHandle} />
            <Text style={[s.modalTitle, { marginBottom: 16 }]}>Seleccionar banco</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANCOS_CL.map(b => (
                <TouchableOpacity key={b} style={s.bancoRow}
                  onPress={() => { setCuentaForm(f => ({...f, banco: b, banco_otro:''})); setShowBancoModal(false) }}>
                  <Text style={[s.bancoText, cuentaForm.banco === b && { color: COLORS.brand, fontWeight:'700' }]}>{b}</Text>
                  {cuentaForm.banco === b && <Text style={{ color: COLORS.brand }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F4F6F9' },
  headerCard:         { backgroundColor: COLORS.brand, paddingTop: 60, paddingBottom: 0,
                        paddingHorizontal: 20, alignItems: 'center' },
  avatarLarge:        { width: 80, height: 80, borderRadius: 40,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText:         { color: '#fff', fontSize: 32, fontWeight: '800' },
  nameText:           { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  emailText:          { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  nicknameText:       { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight:'600', marginBottom: 6 },
  planChip:           { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14,
                        paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  planChipPremium:    { backgroundColor: '#FAEEDA' },
  planChipText:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  planChipTextPremium:{ color: '#854F0B' },
  tabs:               { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)',
                        borderRadius: 16, padding: 4, gap: 4, width: '100%' },
  tab:                { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive:          { backgroundColor: '#fff' },
  tabText:            { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive:      { color: COLORS.brand },
  section:            { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20,
                        padding: 18, marginTop: 16 },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle:       { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionSub:         { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  label:              { fontSize: 11, fontWeight: '600', color: COLORS.textSub, marginBottom: 8,
                        textTransform: 'uppercase', letterSpacing: 0.5 },
  input:              { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
                        fontSize: 14, color: COLORS.text, backgroundColor: '#F8F9FA', marginBottom: 8 },
  hint:               { fontSize: 12, color: COLORS.textSub, marginBottom: 16, lineHeight: 18 },
  hintSmall:          { fontSize: 11, color: COLORS.textSub, fontStyle:'italic', marginTop: 8, textAlign:'center' },
  saveBtn:            { backgroundColor: COLORS.brand, borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  signOutBtn:         { flexDirection: 'row', alignItems: 'center', gap: 12,
                        padding: 14, backgroundColor: '#FEF2F2', borderRadius: 14 },
  signOutIcon:        { fontSize: 20 },
  signOutText:        { fontSize: 15, fontWeight: '600', color: COLORS.red },
  version:            { textAlign: 'center', color: COLORS.textSub, fontSize: 12,
                        fontStyle: 'italic', marginTop: 20, marginBottom: 4 },
  addBtn:             { backgroundColor: COLORS.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText:         { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyDashed:        { borderWidth: 1.5, borderColor: COLORS.border, borderStyle:'dashed',
                        borderRadius: 12, padding: 16, alignItems: 'center' },
  emptyDashedText:    { fontSize: 13, color: COLORS.textSub },
  accountRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F4F6F9',
                        borderLeftWidth: 3, paddingLeft: 10, marginLeft: -10 },
  accountIconWrap:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accountNameRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  accountNombre:      { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tipoBadge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tipoBadgeText:      { fontSize: 10, fontWeight: '700' },
  accountBanco:       { fontSize: 12, color: COLORS.textSub, marginBottom: 6 },
  accountSaldo:       { fontSize: 16, fontWeight: '800', marginTop: 4 },
  accountSub:         { fontSize: 11, color: COLORS.textSub },
  barBg:              { height: 6, backgroundColor: '#F4F6F9', borderRadius: 3, overflow:'hidden', marginTop: 6 },
  barFill:            { height: '100%', borderRadius: 3 },
  upgradeCard:        { backgroundColor: COLORS.brand, marginHorizontal: 20, borderRadius: 20,
                        padding: 22, marginTop: 16 },
  upgradeTitle:       { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  upgradeDesc:        { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 18 },
  upgradeBtn:         { backgroundColor: '#fff', borderRadius: 14, padding: 15, alignItems: 'center' },
  upgradeBtnText:     { color: COLORS.brand, fontSize: 15, fontWeight: '800' },
  featureRow:         { flexDirection: 'row', alignItems: 'center', gap: 12,
                        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F4F6F9' },
  featureText:        { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  modalOverlay:       { flex: 1, justifyContent: 'flex-end' },
  modalBg:            { position: 'absolute', top:0, left:0, right:0, bottom:0,
                        backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                        padding: 20, paddingBottom: 0, maxHeight: '90%' },
  modalHandle:        { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2,
                        alignSelf: 'center', marginBottom: 18 },
  modalTitle:         { fontSize: 20, fontWeight: '800', color: COLORS.text },
  modalSub:           { fontSize: 12, color: COLORS.textSub, marginTop: 3 },
  modalClose:         { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F6F9',
                        alignItems: 'center', justifyContent: 'center' },
  modalCloseText:     { fontSize: 13, color: COLORS.textSub, fontWeight: '700' },
  chipLabel:          { fontSize: 11, fontWeight: '600', color: COLORS.textSub, marginBottom: 8,
                        textTransform: 'uppercase', letterSpacing: 0.5 },
  tipoChip:           { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
                        borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border,
                        marginRight: 10, backgroundColor: '#F8F9FA', minWidth: 82 },
  tipoChipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tipoChipText:       { fontSize: 10, fontWeight: '600', color: COLORS.textSub, textAlign: 'center' },
  tipoChipTextActive: { color: '#fff' },
  selectBtn:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
                        backgroundColor: '#F8F9FA', marginBottom: 12 },
  selectBtnText:      { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  selectArrow:        { fontSize: 14, color: COLORS.textSub },
  modalInput:         { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 13,
                        fontSize: 14, color: COLORS.text, backgroundColor: '#F8F9FA', marginBottom: 12 },
  colorRow:           { flexDirection: 'row', gap: 12, marginBottom: 20 },
  colorDot:           { width: 32, height: 32, borderRadius: 16 },
  bancoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F4F6F9' },
  bancoText:          { fontSize: 15, color: COLORS.text },
})
