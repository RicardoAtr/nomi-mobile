import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useAccounts } from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/store/authStore";
import { clp, COLORS, numericOnly } from "../../src/lib/format";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const BANCOS_CL = [
  "Banco BCI",
  "Banco Santander",
  "Banco de Chile",
  "Banco Estado",
  "Banco Falabella",
  "Banco Ripley",
  "Banco Itaú",
  "Banco Security",
  "Banco BICE",
  "Banco Scotiabank",
  "Banco Internacional",
  "Mercado Pago",
  "Fintual",
  "Tenpo",
  "MACH",
  "Coopeuch",
  "Otro",
];

const TIPOS = [
  {
    key: "corriente",
    label: "Corriente",
    icono: "🏦",
    desc: "Cuenta bancaria principal",
  },
  {
    key: "vista",
    label: "Vista / RUT",
    icono: "💳",
    desc: "Banco Estado u otro banco",
  },
  {
    key: "ahorro",
    label: "Ahorro",
    icono: "🐷",
    desc: "Cuenta de ahorro a plazo",
  },
  {
    key: "tarjeta_credito",
    label: "Tarjeta Créd.",
    icono: "💰",
    desc: "Con límite de crédito",
  },
  {
    key: "efectivo",
    label: "Efectivo",
    icono: "💵",
    desc: "Dinero en efectivo",
  },
  {
    key: "inversion",
    label: "Inversión",
    icono: "📈",
    desc: "Fintual, fondos mutuos, etc.",
  },
  {
    key: "linea_credito",
    label: "Línea Créd.",
    icono: "🏧",
    desc: "Línea de crédito bancaria",
  },
  {
    key: "prestamo",
    label: "Préstamo",
    icono: "📋",
    desc: "Crédito de consumo",
  },
];

const COLORS_PALETTE = [
  "#1D9E75",
  "#378ADD",
  "#EF9F27",
  "#D4537E",
  "#534AB7",
  "#E24B4A",
  "#888780",
  "#0F6E56",
];

const TIPO_LABELS = Object.fromEntries(TIPOS.map((t) => [t.key, t.label]));

// Campos extra según tipo
const needsBanco = [
  "corriente",
  "vista",
  "ahorro",
  "tarjeta_credito",
  "linea_credito",
  "prestamo",
];
const needsLimite = ["tarjeta_credito", "linea_credito"];
const needsCuota = ["prestamo"];
const needsCierre = ["tarjeta_credito"];
const isDeuda = ["tarjeta_credito", "linea_credito", "prestamo"];

export default function Cuentas() {
  const { user } = useAuthStore();
  const { data: accounts, loading, refetch } = useAccounts();
  const [showModal, setShowModal] = useState(false);
  const [showBancoModal, setShowBancoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    return {
      nombre: "",
      tipo: "corriente",
      banco: "",
      banco_otro: "",
      saldo_inicial: "0",
      color: COLORS_PALETTE[0],
      icono: "🏦",
      limite_credito: "",
      cuota_mensual: "",
      dia_cierre: "",
    };
  }

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  const totalPatrimonio = accounts.reduce(
    (s, a) => s + Number(a.saldo_actual ?? 0),
    0,
  );

  const resetForm = () => {
    setForm(defaultForm());
    setShowModal(false);
  };

  const bancoFinal = form.banco === "Otro" ? form.banco_otro : form.banco;

  const handleCreate = async () => {
    if (!form.nombre) return Alert.alert("Ingresa un nombre para la cuenta");
    if (needsBanco.includes(form.tipo) && !bancoFinal)
      return Alert.alert("Selecciona o ingresa el banco / institución");

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

    // Campos extra en metadata (guardamos en notas por ahora, hasta extender el schema)
    if (needsLimite.includes(form.tipo) && form.limite_credito) {
      payload.notas = JSON.stringify({
        limite_credito: Number(form.limite_credito),
        dia_cierre: form.dia_cierre || null,
        cuota_mensual: form.cuota_mensual || null,
      });
    }

    const { error } = await supabase.from("accounts").insert(payload);
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    resetForm();
    refetch();
  };

  const handleToggle = async (id, is_active) => {
    Alert.alert(
      is_active ? "Desactivar cuenta" : "Activar cuenta",
      is_active
        ? "La cuenta no aparecerá en los cálculos."
        : "La cuenta volverá a aparecer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await supabase
              .from("accounts")
              .update({ is_active: !is_active })
              .eq("id", id);
            refetch();
          },
        },
      ],
    );
  };

  const tipoActual = TIPOS.find((t) => t.key === form.tipo);

  const setTipo = (key) => {
    const t = TIPOS.find((t) => t.key === key);
    setForm((f) => ({
      ...defaultForm(),
      tipo: key,
      icono: t?.icono ?? "🏦",
      color: f.color,
    }));
  };

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Mis Cuentas</Text>
            <Text style={s.subtitle}>
              {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} activa
              {accounts.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
            <Text style={s.addBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        <View style={s.patrimonioCard}>
          <Text style={s.patrimonioLabel}>Patrimonio total</Text>
          <Text style={s.patrimonioVal}>{clp(totalPatrimonio)}</Text>
          <Text style={s.patrimonioSub}>Suma de todas tus cuentas activas</Text>
          <View style={s.circle1} />
          <View style={s.circle2} />
        </View>

        <View style={s.listWrap}>
          {loading && <Text style={s.empty}>Cargando...</Text>}
          {!loading && accounts.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🏦</Text>
              <Text style={s.emptyTitle}>Sin cuentas aún</Text>
              <Text style={s.empty}>
                Agrega tu primera cuenta para empezar a registrar movimientos
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => setShowModal(true)}
              >
                <Text style={s.emptyBtnText}>Agregar primera cuenta</Text>
              </TouchableOpacity>
            </View>
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
            const pctUsado = limite ? Math.min((usado / limite) * 100, 100) : 0;
            const semaforo =
              pctUsado > 80
                ? COLORS.red
                : pctUsado > 50
                  ? COLORS.amber
                  : COLORS.brand;

            return (
              <TouchableOpacity
                key={a.id}
                style={[
                  s.accountCard,
                  { borderLeftColor: a.color, borderLeftWidth: 4 },
                ]}
                onLongPress={() => handleToggle(a.id, a.is_active)}
              >
                <View
                  style={[
                    s.accountIconWrap,
                    { backgroundColor: a.color + "18" },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{a.icono}</Text>
                </View>
                <View style={s.accountInfo}>
                  <View style={s.accountRow}>
                    <Text style={s.accountNombre}>{a.nombre}</Text>
                    <View
                      style={[s.tipoBadge, { backgroundColor: a.color + "18" }]}
                    >
                      <Text style={[s.tipoBadgeText, { color: a.color }]}>
                        {TIPO_LABELS[a.tipo] ?? a.tipo}
                      </Text>
                    </View>
                  </View>
                  {a.banco && <Text style={s.accountBanco}>{a.banco}</Text>}

                  {/* Barra semáforo para tarjeta/línea */}
                  {limite && (
                    <View style={s.limiteWrap}>
                      <View style={s.limiteLabelRow}>
                        <Text style={s.limiteLabel}>Cupo usado</Text>
                        <Text style={[s.limitePct, { color: semaforo }]}>
                          {pctUsado.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={s.barBg}>
                        <View
                          style={[
                            s.barFill,
                            {
                              width: `${pctUsado}%`,
                              backgroundColor: semaforo,
                            },
                          ]}
                        />
                      </View>
                      <View style={s.limiteRow}>
                        <Text style={s.limiteText}>Usado: {clp(usado)}</Text>
                        <Text style={s.limiteText}>Límite: {clp(limite)}</Text>
                      </View>
                    </View>
                  )}

                  {!limite && (
                    <View style={s.accountFooter}>
                      <View>
                        <Text style={s.saldoLabel}>Saldo actual</Text>
                        <Text
                          style={[
                            s.saldoVal,
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
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={s.saldoLabel}>Saldo inicial</Text>
                        <Text style={s.saldoInicialVal}>
                          {clp(a.saldo_inicial)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.hint}>
          Mantén presionada una cuenta para activarla o desactivarla
        </Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal nueva cuenta */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={resetForm}
          />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Nueva cuenta</Text>
                {tipoActual && (
                  <Text style={s.modalSubtitle}>{tipoActual.desc}</Text>
                )}
              </View>
              <TouchableOpacity onPress={resetForm} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tipo */}
              <Text style={s.chipLabel}>Tipo de cuenta</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 18 }}
              >
                {TIPOS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTipo(t.key)}
                    style={[
                      s.tipoChip,
                      form.tipo === t.key && s.tipoChipActive,
                    ]}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>
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

              {/* Nombre */}
              <Text style={s.inputLabel}>Nombre *</Text>
              <TextInput
                style={s.modalInput}
                placeholder={`Ej: ${tipoActual?.label ?? "Mi cuenta"} BCI`}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholderTextColor={COLORS.textSub}
              />

              {/* Banco selector */}
              {needsBanco.includes(form.tipo) && (
                <>
                  <Text style={s.inputLabel}>
                    {form.tipo === "inversion"
                      ? "Institución *"
                      : "Banco / Institución *"}
                  </Text>
                  <TouchableOpacity
                    style={s.selectBtn}
                    onPress={() => setShowBancoModal(true)}
                  >
                    <Text
                      style={[
                        s.selectBtnText,
                        !form.banco && { color: COLORS.textSub },
                      ]}
                    >
                      {form.banco || "Seleccionar..."}
                    </Text>
                    <Text style={s.selectArrow}>▾</Text>
                  </TouchableOpacity>
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

              {/* Saldo / monto */}
              <Text style={s.inputLabel}>
                {isDeuda.includes(form.tipo)
                  ? "Saldo usado actualmente $"
                  : "Saldo inicial $"}
              </Text>
              <TextInput
                style={s.modalInput}
                placeholder="0"
                keyboardType="numeric"
                returnKeyType="done"
                value={form.saldo_inicial}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, saldo_inicial: numericOnly(v) }))
                }
                placeholderTextColor={COLORS.textSub}
              />

              {/* Límite crédito */}
              {needsLimite.includes(form.tipo) && (
                <>
                  <Text style={s.inputLabel}>Límite de crédito $</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 1.000.000"
                    keyboardType="numeric"
                    value={form.limite_credito}
                    returnKeyType="done"
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, limite_credito: numericOnly(v) }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}

              {/* Día de cierre (tarjeta) */}
              {needsCierre.includes(form.tipo) && (
                <>
                  <Text style={s.inputLabel}>Día de cierre del mes</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 15"
                    keyboardType="numeric"
                    value={form.dia_cierre}
                    returnKeyType="done"
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, dia_cierre: numericOnly(v) }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}

              {/* Cuota mensual (préstamo) */}
              {needsCuota.includes(form.tipo) && (
                <>
                  <Text style={s.inputLabel}>Cuota mensual $</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder="Ej: 150.000"
                    keyboardType="numeric"
                    value={form.cuota_mensual}
                    returnKeyType="done"
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, cuota_mensual: numericOnly(v) }))
                    }
                    placeholderTextColor={COLORS.textSub}
                  />
                </>
              )}

              {/* Color */}
              <Text style={s.inputLabel}>Color</Text>
              <View style={s.colorRow}>
                {COLORS_PALETTE.map((c) => (
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
                onPress={handleCreate}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>
                  {saving
                    ? "Guardando..."
                    : `Crear ${tipoActual?.label ?? "cuenta"}`}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal selector de banco */}
      <Modal
        visible={showBancoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBancoModal(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={() => setShowBancoModal(false)}
          />
          <View style={[s.modalSheet, { maxHeight: "60%" }]}>
            <View style={s.modalHandle} />
            <Text style={[s.modalTitle, { marginBottom: 16 }]}>
              Seleccionar banco
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BANCOS_CL.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={s.bancoRow}
                  onPress={() => {
                    setForm((f) => ({ ...f, banco: b, banco_otro: "" }));
                    setShowBancoModal(false);
                  }}
                >
                  <Text
                    style={[
                      s.bancoText,
                      form.banco === b && {
                        color: COLORS.brand,
                        fontWeight: "700",
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
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  patrimonioCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 120,
  },
  patrimonioLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  patrimonioVal: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 6,
  },
  patrimonioSub: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    right: -40,
    top: -40,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    right: 50,
    bottom: -35,
  },
  listWrap: { paddingHorizontal: 20 },
  emptyWrap: { alignItems: "center", paddingVertical: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  empty: {
    textAlign: "center",
    color: COLORS.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  accountCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  accountIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: { flex: 1 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  accountNombre: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tipoBadgeText: { fontSize: 10, fontWeight: "700" },
  accountBanco: { fontSize: 12, color: COLORS.textSub, marginBottom: 10 },
  accountFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  saldoLabel: {
    fontSize: 10,
    color: COLORS.textSub,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  saldoVal: { fontSize: 18, fontWeight: "800" },
  saldoInicialVal: { fontSize: 13, fontWeight: "600", color: COLORS.textSub },
  limiteWrap: { marginTop: 6 },
  limiteLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  limiteLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  limitePct: { fontSize: 12, fontWeight: "800" },
  barBg: {
    height: 7,
    backgroundColor: "#F4F6F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: { height: "100%", borderRadius: 4 },
  limiteRow: { flexDirection: "row", justifyContent: "space-between" },
  limiteText: { fontSize: 11, color: COLORS.textSub },
  hint: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textSub,
    fontStyle: "italic",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  modalSubtitle: { fontSize: 12, color: COLORS.textSub, marginTop: 3 },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 13, color: COLORS.textSub, fontWeight: "700" },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSub,
    marginBottom: 6,
    marginTop: 4,
  },
  tipoChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
    backgroundColor: "#F8F9FA",
    minWidth: 84,
  },
  tipoChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tipoChipText: {
    fontSize: 10,
    fontWeight: "600",
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
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
  },
  selectBtnText: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  selectArrow: { fontSize: 14, color: COLORS.textSub },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#F8F9FA",
    marginBottom: 12,
  },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  bancoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F6F9",
  },
  bancoText: { fontSize: 15, color: COLORS.text },
});
