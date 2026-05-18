import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/authStore";
import { useAccounts } from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import {
  COLORS,
  clp,
  getBancoLogoUrl,
  formatInputCLP,
  parseInputCLP,
} from "../../src/lib/format";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const F = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semiBold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extraBold: "Jakarta-ExtraBold",
};

const BANCOS_CL = [
  "Banco BCI",
  "Banco Santander",
  "Banco de Chile",
  "Banco Estado",
  "Banco Falabella",
  "Banco Ripley",
  "Banco Ita\u00fa",
  "Banco Security",
  "Banco BICE",
  "Banco Scotiabank",
  "Mercado Pago",
  "Fintual",
  "Tenpo",
  "MACH",
  "Coopeuch",
  "Otro",
];

const TIPOS_CUENTA = [
  { key: "corriente", label: "Corriente", icono: "\ud83c\udfe6" },
  { key: "vista", label: "Vista / RUT", icono: "\ud83d\udcb3" },
  { key: "ahorro", label: "Ahorro", icono: "\ud83d\udc37" },
  { key: "tarjeta_credito", label: "T. Credito", icono: "\ud83d\udcb0" },
  { key: "efectivo", label: "Efectivo", icono: "\ud83d\udcb5" },
  { key: "inversion", label: "Inversion", icono: "\ud83d\udcc8" },
  { key: "linea_credito", label: "Linea Cred.", icono: "\ud83c\udfe7" },
  { key: "prestamo", label: "Prestamo", icono: "\ud83d\udccb" },
];

const PALETTE = [
  "#0D5C4A",
  "#378ADD",
  "#EF9F27",
  "#D4537E",
  "#534AB7",
  "#E24B4A",
  "#888780",
  "#00C896",
];
const needsBanco = [
  "corriente",
  "vista",
  "ahorro",
  "tarjeta_credito",
  "linea_credito",
  "prestamo",
  "inversion",
];
const needsLimite = ["tarjeta_credito", "linea_credito"];
const needsCierre = ["tarjeta_credito"];
const needsCuota = ["prestamo"];

const FEATURES_PREMIUM = [
  "Cuentas ilimitadas",
  "Metas ilimitadas",
  "Presupuestos ilimitados",
  "Historial completo",
  "Exportar Excel/PDF",
  "Soporte prioritario",
];
const FEATURES_FREE = [
  { label: "3 cuentas", ok: true },
  { label: "3 metas", ok: true },
  { label: "3 presupuestos", ok: true },
  { label: "Historial 3 meses", ok: true },
  { label: "Exportar Excel/PDF", ok: false },
  { label: "Soporte prioritario", ok: false },
];

function defaultForm() {
  return {
    nombre: "",
    tipo: "corriente",
    banco: "",
    banco_otro: "",
    saldo_inicial: "0",
    color: PALETTE[0],
    icono: "\ud83c\udfe6",
    limite_credito: "",
    cuota_mensual: "",
    dia_cierre: "",
  };
}

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { profile, signOut, fetchProfile, user, uploadAvatar } = useAuthStore();
  const { data: accounts, refetch: refetchAcc } = useAccounts();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [showModal, setShowModal] = useState(false);
  const [showBancoList, setShowBancoList] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const isPremium = profile?.plan === "premium";

  useFocusEffect(
    useCallback(() => {
      if (profile?.nickname) setNickname(profile.nickname);
      refetchAcc();
    }, [profile]),
  );

  const handleSaveNickname = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", user.id);
    if (!error) {
      await fetchProfile(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar sesion", "Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: signOut },
    ]);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      await uploadAvatar(result.assets[0].uri);
      setUploadingAvatar(false);
    }
  };

  const tipoActual = TIPOS_CUENTA.find((t) => t.key === form.tipo);
  const bancoFinal = form.banco === "Otro" ? form.banco_otro : form.banco;

  const setTipo = (key) => {
    const t = TIPOS_CUENTA.find((t) => t.key === key);
    setForm({
      ...defaultForm(),
      tipo: key,
      icono: t?.icono ?? "\ud83c\udfe6",
      color: form.color,
    });
  };

  const openEdit = (a) => {
    const meta = (() => {
      try {
        return JSON.parse(a.notas ?? "");
      } catch {
        return null;
      }
    })();
    setEditing(a);
    setForm({
      nombre: a.nombre,
      tipo: a.tipo,
      banco: a.banco || "",
      banco_otro: "",
      saldo_inicial: String(a.saldo_inicial),
      color: a.color,
      icono: a.icono,
      limite_credito: meta?.limite_credito ? String(meta.limite_credito) : "",
      cuota_mensual: meta?.cuota_mensual ? String(meta.cuota_mensual) : "",
      dia_cierre: meta?.dia_cierre ? String(meta.dia_cierre) : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm());
    setShowBancoList(false);
  };

  const handleSave = async () => {
    if (!form.nombre) return Alert.alert("Ingresa un nombre para la cuenta");
    if (needsBanco.includes(form.tipo) && !bancoFinal)
      return Alert.alert("Selecciona el banco");
    setSaving(true);
    const payload = {
      owner_id: user.id,
      nombre: form.nombre,
      tipo: form.tipo,
      banco: bancoFinal || null,
      saldo_inicial: Number(form.saldo_inicial) || 0,
      color: form.color,
      icono: form.icono,
    };
    if (needsLimite.includes(form.tipo) && form.limite_credito) {
      payload.notas = JSON.stringify({
        limite_credito: Number(form.limite_credito),
        dia_cierre: form.dia_cierre || null,
        cuota_mensual: form.cuota_mensual || null,
      });
    }
    let error;
    if (editing) {
      const res = await supabase
        .from("accounts")
        .update(payload)
        .eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("accounts").insert(payload);
      error = res.error;
    }
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    closeModal();
    refetchAcc();
  };

  const handleOptions = (account) => {
    Alert.alert(account.nombre, "Que quieres hacer?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Editar", onPress: () => openEdit(account) },
      {
        text: account.is_active ? "Desactivar" : "Activar",
        onPress: async () => {
          await supabase
            .from("accounts")
            .update({ is_active: !account.is_active })
            .eq("id", account.id);
          refetchAcc();
        },
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          Alert.alert("Eliminar cuenta", "Esta accion no se puede deshacer.", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                await supabase.from("accounts").delete().eq("id", account.id);
                refetchAcc();
              },
            },
          ]);
        },
      },
    ]);
  };

  const totalPatrimonio = accounts.reduce(
    (s, a) => s + Number(a.saldo_actual ?? 0),
    0,
  );

  return (
    <View style={s.container}>
      <View style={[s.headerCard, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={s.avatarWrap}
          onPress={handlePickAvatar}
          activeOpacity={0.8}
        >
          {uploadingAvatar ? (
            <Text style={{ color: "#fff", fontFamily: F.medium }}>...</Text>
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatarPhoto} />
          ) : (
            <Text style={s.avatarText}>
              {(profile?.nombre ?? "U").charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickAvatar} style={s.avatarEditBtn}>
          <Text style={s.avatarEditText}>Cambiar foto</Text>
        </TouchableOpacity>
        <Text style={s.nameText}>{profile?.nombre ?? "—"}</Text>
        <Text style={s.emailText}>{profile?.email ?? "—"}</Text>
        <View style={[s.planChip, isPremium && s.planChipPremium]}>
          <Text style={[s.planChipText, isPremium && s.planChipTextPremium]}>
            {isPremium ? "Premium" : "Plan Gratis"}
          </Text>
        </View>
        <View style={s.tabsRow}>
          {["perfil", "cuentas", "plan"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[s.tab, activeTab === t && s.tabActive]}
            >
              <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>
                {t === "perfil"
                  ? "Perfil"
                  : t === "cuentas"
                    ? "Cuentas"
                    : "Plan"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "perfil" && (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Personalizacion</Text>
              <Text style={s.label}>Como te llamamos?</Text>
              <TextInput
                style={s.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Ej: RicardoDev"
                placeholderTextColor={COLORS.textSub}
              />
              <Text style={s.hint}>El saludo del inicio usara tu apodo.</Text>
              <TouchableOpacity
                style={[s.saveBtn, saved && { backgroundColor: COLORS.accent }]}
                onPress={handleSaveNickname}
              >
                <Text style={s.saveBtnText}>
                  {saved ? "Guardado" : "Guardar cambios"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Sesion</Text>
              <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
                <Text style={s.signOutText}>Cerrar sesion</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.version}>Nomi v1.0 — Tu dinero, ordenado</Text>
          </>
        )}

        {activeTab === "cuentas" && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Mis cuentas</Text>
                <Text style={s.sectionSub}>{clp(totalPatrimonio)}</Text>
              </View>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={s.addBtnText}>+ Nueva</Text>
              </TouchableOpacity>
            </View>
            {accounts.length === 0 && (
              <TouchableOpacity
                style={s.emptyDashed}
                onPress={() => setShowModal(true)}
              >
                <Text style={s.emptyDashedText}>
                  Toca para agregar tu primera cuenta
                </Text>
              </TouchableOpacity>
            )}
            {accounts.map((a) => {
              const meta = (() => {
                try {
                  return JSON.parse(a.notas ?? "");
                } catch {
                  return null;
                }
              })();
              const limite = meta?.limite_credito;
              const usado = Math.abs(Number(a.saldo_actual));
              const pct = limite ? Math.min((usado / limite) * 100, 100) : 0;
              const sem =
                pct > 80 ? COLORS.red : pct > 50 ? COLORS.amber : COLORS.accent;
              const tipoLabel =
                TIPOS_CUENTA.find((t) => t.key === a.tipo)?.label ?? a.tipo;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    s.accountRow,
                    { borderLeftColor: a.color, opacity: a.is_active ? 1 : 0.5 },
                  ]}
                  onPress={() => handleOptions(a)}
                >
                  <View
                    style={[s.accountIcon, { backgroundColor: a.color + "18" }]}
                  >
                    {getBancoLogoUrl(a.banco) ? (
                      <Image
                        source={{ uri: getBancoLogoUrl(a.banco) }}
                        style={{ width: 30, height: 30, borderRadius: 6 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 22 }}>{a.icono}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.accountNameRow}>
                      <Text style={s.accountNombre}>{a.nombre}</Text>
                      <View
                        style={[
                          s.tipoBadge,
                          { backgroundColor: a.color + "18" },
                        ]}
                      >
                        <Text style={[s.tipoBadgeText, { color: a.color }]}>
                          {tipoLabel}
                        </Text>
                      </View>
                    </View>
                    {a.banco && <Text style={s.accountBanco}>{a.banco}</Text>}
                    {limite ? (
                      <>
                        <View style={s.barBg}>
                          <View
                            style={[
                              s.barFill,
                              { width: `${pct}%`, backgroundColor: sem },
                            ]}
                          />
                        </View>
                        <Text
                          style={[s.accountSub, { color: sem, marginTop: 4 }]}
                        >
                          {pct.toFixed(0)}% de {clp(limite)}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          s.accountSaldo,
                          {
                            color:
                              Number(a.saldo_actual) >= 0
                                ? COLORS.text
                                : COLORS.red,
                          },
                        ]}
                      >
                        {clp(a.saldo_actual)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {accounts.length > 0 && (
              <Text style={s.hintSmall}>
                Toca una cuenta para editar o desactivar
              </Text>
            )}
          </View>
        )}

        {activeTab === "plan" && (
          <>
            {!isPremium ? (
              <>
                <View style={s.upgradeCard}>
                  <Text style={s.upgradeTitle}>Pasate a Premium</Text>
                  <Text style={s.upgradeDesc}>
                    Desbloquea todo el potencial de Nomi.
                  </Text>
                  {FEATURES_PREMIUM.map((f) => (
                    <View
                      key={f}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{ color: COLORS.accent, fontFamily: F.bold }}
                      >
                        ✓
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: 14,
                          fontFamily: F.medium,
                        }}
                      >
                        {f}
                      </Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={s.upgradeBtn}
                    onPress={() =>
                      Alert.alert(
                        "Proximamente",
                        "Las suscripciones estaran disponibles pronto.",
                      )
                    }
                  >
                    <Text style={s.upgradeBtnText}>
                      Ver planes — desde $2.990/mes
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Tu plan actual</Text>
                  {FEATURES_FREE.map((f) => (
                    <View key={f.label} style={s.featureRow}>
                      <Text
                        style={{
                          color: f.ok ? COLORS.accent : "#D1D5DB",
                          fontFamily: F.bold,
                          width: 20,
                        }}
                      >
                        {f.ok ? "✓" : "✕"}
                      </Text>
                      <Text
                        style={[
                          s.featureText,
                          !f.ok && { color: COLORS.textSub },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View
                style={[
                  s.section,
                  { alignItems: "center", paddingVertical: 32 },
                ]}
              >
                <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
                <Text style={[s.sectionTitle, { textAlign: "center" }]}>
                  Eres Premium
                </Text>
                <Text
                  style={{
                    color: COLORS.textSub,
                    textAlign: "center",
                    marginTop: 6,
                    fontFamily: F.regular,
                  }}
                >
                  Tienes acceso a todas las funciones de Nomi.
                </Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalOverlay}
        >
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeaderRow}>
              <Text style={s.modalTitle}>
                {editing ? "Editar cuenta" : "Nueva cuenta"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text style={s.chipLabel}>Tipo</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {TIPOS_CUENTA.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTipo(t.key)}
                    style={[
                      s.tipoChip,
                      form.tipo === t.key && s.tipoChipActive,
                    ]}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 3 }}>
                      {t.icono}
                    </Text>
                    <Text
                      style={[
                        s.tipoChipText,
                        form.tipo === t.key && s.tipoChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.chipLabel}>Nombre *</Text>
              <TextInput
                style={s.modalInput}
                placeholder={`Ej: ${tipoActual?.label} BCI`}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholderTextColor={COLORS.textSub}
              />
              {needsBanco.includes(form.tipo) && (
                <>
                  <Text style={s.chipLabel}>Banco *</Text>
                  <TouchableOpacity
                    style={s.selectBtn}
                    onPress={() => setShowBancoList((v) => !v)}
                  >
                    <Text
                      style={[
                        s.selectBtnText,
                        !form.banco && { color: COLORS.textSub },
                      ]}
                    >
                      {form.banco || "Seleccionar..."}
                    </Text>
                    <Text style={s.selectArrow}>
                      {showBancoList ? "▴" : "▾"}
                    </Text>
                  </TouchableOpacity>
                  {showBancoList && (
                    <View style={s.bancoDropdown}>
                      <ScrollView
                        style={{ maxHeight: 200 }}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                      >
                        {BANCOS_CL.map((b) => (
                          <TouchableOpacity
                            key={b}
                            style={s.bancoRow}
                            onPress={() => {
                              setForm((f) => ({
                                ...f,
                                banco: b,
                                banco_otro: "",
                              }));
                              setShowBancoList(false);
                            }}
                          >
                            {getBancoLogoUrl(b) && (
                              <Image
                                source={{ uri: getBancoLogoUrl(b) }}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  marginRight: 8,
                                }}
                                resizeMode="contain"
                              />
                            )}
                            <Text
                              style={[
                                s.bancoText,
                                form.banco === b && {
                                  color: COLORS.brand,
                                  fontFamily: F.bold,
                                },
                              ]}
                            >
                              {b}
                            </Text>
                            {form.banco === b && (
                              <Text style={{ color: COLORS.brand }}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {form.banco === "Otro" && (
                    <TextInput
                      style={s.modalInput}
                      placeholder="Escribe el nombre..."
                      value={form.banco_otro}
                      onChangeText={(v) =>
                        setForm((f) => ({ ...f, banco_otro: v }))
                      }
                      placeholderTextColor={COLORS.textSub}
                    />
                  )}
                </>
              )}
              <Text style={s.chipLabel}>Saldo inicial $</Text>
              <TextInput
                style={s.modalInput}
                placeholder="0"
                keyboardType="numeric"
                inputAccessoryViewID="numpad"
                value={formatInputCLP(form.saldo_inicial)}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, saldo_inicial: parseInputCLP(v) }))
                }
                placeholderTextColor={COLORS.textSub}
              />
              {needsLimite.includes(form.tipo) && (
                <>
                  <Text style={s.chipLabel}>Limite de credito $</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 1.000.000"
                    keyboardType="numeric"
                    inputAccessoryViewID="numpad"
                    value={formatInputCLP(form.limite_credito)}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        limite_credito: parseInputCLP(v),
                      }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}
              {needsCierre.includes(form.tipo) && (
                <>
                  <Text style={s.chipLabel}>Dia de cierre</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 15"
                    keyboardType="numeric"
                    inputAccessoryViewID="numpad"
                    value={form.dia_cierre}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        dia_cierre: v.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}
              {needsCuota.includes(form.tipo) && (
                <>
                  <Text style={s.chipLabel}>Cuota mensual $</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 150.000"
                    keyboardType="numeric"
                    inputAccessoryViewID="numpad"
                    value={formatInputCLP(form.cuota_mensual)}
                    onChangeText={(v) =>
                      setForm((f) => ({
                        ...f,
                        cuota_mensual: parseInputCLP(v),
                      }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}
              <Text style={s.chipLabel}>Color</Text>
              <View style={s.colorRow}>
                {PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                    style={[
                      s.colorDot,
                      { backgroundColor: c },
                      form.color === c && {
                        borderWidth: 3,
                        borderColor: "#fff",
                        shadowColor: c,
                        shadowOpacity: 0.6,
                        shadowRadius: 4,
                        elevation: 4,
                      },
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: form.color }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>
                  {saving
                    ? "Guardando..."
                    : editing
                      ? "Guardar cambios"
                      : `Crear ${tipoActual?.label ?? "cuenta"}`}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        <InputAccessoryView nativeID="numpad">
          <View
            style={{
              backgroundColor: COLORS.surface,
              padding: 8,
              alignItems: "flex-end",
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: COLORS.brand,
                  fontFamily: F.bold,
                  fontSize: 16,
                }}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerCard: {
    backgroundColor: COLORS.brand,
    paddingBottom: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarPhoto: { width: 82, height: 82, borderRadius: 41 },
  avatarText: { color: "#fff", fontSize: 32, fontFamily: "Jakarta-ExtraBold" },
  avatarEditBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  avatarEditText: { color: "#fff", fontSize: 12, fontFamily: "Jakarta-Medium" },
  nameText: {
    fontSize: 20,
    fontFamily: "Jakarta-ExtraBold",
    color: "#fff",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 10,
  },
  planChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  planChipPremium: { backgroundColor: "#FAEEDA" },
  planChipText: { color: "#fff", fontSize: 13, fontFamily: "Jakarta-SemiBold" },
  planChipTextPremium: { color: "#854F0B" },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 16,
    padding: 4,
    gap: 4,
    width: "100%",
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: {
    fontSize: 13,
    fontFamily: "Jakarta-SemiBold",
    color: "rgba(255,255,255,0.65)",
  },
  tabTextActive: { color: COLORS.brand },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginBottom: 16,
  },
  hintSmall: {
    fontSize: 11,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Jakarta-Bold" },
  signOutBtn: {
    padding: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.red,
  },
  version: {
    textAlign: "center",
    color: COLORS.textSub,
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    marginTop: 20,
    marginBottom: 4,
  },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Jakarta-Bold" },
  emptyDashed: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  emptyDashedText: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  accountNombre: {
    fontSize: 14,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
  },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tipoBadgeText: { fontSize: 10, fontFamily: "Jakarta-Bold" },
  accountBanco: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginBottom: 4,
  },
  accountSaldo: { fontSize: 16, fontFamily: "Jakarta-ExtraBold", marginTop: 4 },
  accountSub: {
    fontSize: 11,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  barBg: {
    height: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  barFill: { height: "100%", borderRadius: 3 },
  upgradeCard: {
    backgroundColor: COLORS.brand,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 22,
    marginTop: 16,
  },
  upgradeTitle: {
    fontSize: 22,
    fontFamily: "Jakarta-ExtraBold",
    color: "#fff",
    marginBottom: 8,
  },
  upgradeDesc: {
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
  },
  upgradeBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  upgradeBtnText: {
    color: COLORS.brand,
    fontSize: 15,
    fontFamily: "Jakarta-ExtraBold",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Jakarta-Medium",
    color: COLORS.text,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 0,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Jakarta-ExtraBold",
    color: COLORS.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 13,
    fontFamily: "Jakarta-Bold",
    color: COLORS.textSub,
  },
  chipLabel: {
    fontSize: 11,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipoChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
    backgroundColor: COLORS.surface,
    minWidth: 82,
  },
  tipoChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tipoChipText: {
    fontSize: 10,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    textAlign: "center",
  },
  tipoChipTextActive: { color: "#fff" },
  selectBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  selectBtnText: {
    fontSize: 14,
    fontFamily: "Jakarta-Medium",
    color: COLORS.text,
  },
  selectArrow: { fontSize: 14, color: COLORS.textSub },
  bancoDropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  bancoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bancoText: {
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    flex: 1,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
});
