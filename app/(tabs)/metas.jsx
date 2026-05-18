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
  KeyboardAvoidingView,
  Platform,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSavingsGoals, useAccounts } from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/store/authStore";
import {
  clp,
  COLORS,
  formatInputCLP,
  parseInputCLP,
} from "../../src/lib/format";
import { useFocusEffect } from "expo-router";

const F = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semiBold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extraBold: "Jakarta-ExtraBold",
};

const PALETTE = [
  "#0D5C4A",
  "#378ADD",
  "#EF9F27",
  "#D4537E",
  "#534AB7",
  "#E24B4A",
  "#00C896",
  "#F59E0B",
];
const ICONOS = ["🎯", "🏖", "🚗", "🏠", "💻", "✈️", "📚", "💍", "🎓", "🏋️"];

const defaultForm = () => ({
  nombre: "",
  monto_objetivo: "",
  fecha_limite: "",
  color: PALETTE[0],
  icono: "🎯",
});

export default function Metas() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { data: goals, refetch } = useSavingsGoals();
  const { data: accounts } = useAccounts();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deposits, setDeposits] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm());
  };

  const handleSave = async () => {
    if (!form.nombre || !form.monto_objetivo)
      return Alert.alert("Completa nombre y monto objetivo");
    setSaving(true);
    const { error } = await supabase.from("savings_goals").insert({
      owner_id: user.id,
      nombre: form.nombre,
      monto_objetivo: Number(form.monto_objetivo),
      fecha_limite: form.fecha_limite || null,
      color: form.color,
      icono: form.icono,
    });
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    closeModal();
    refetch();
  };

  const handleDeposit = async (g) => {
    const monto = Number(deposits[g.id] ?? 0);
    if (!monto || monto <= 0) return Alert.alert("Ingresa un monto valido");
    const { error } = await supabase
      .from("savings_goals")
      .update({ monto_actual: Number(g.monto_actual) + monto })
      .eq("id", g.id);
    if (error) return Alert.alert("Error", error.message);
    setDeposits((d) => ({ ...d, [g.id]: "" }));
    refetch();
  };

  const handleDelete = (id) => {
    Alert.alert("Eliminar meta", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await supabase.from("savings_goals").delete().eq("id", id);
          refetch();
        },
      },
    ]);
  };

  const totalAhorrado = goals.reduce(
    (s, g) => s + Number(g.monto_actual ?? 0),
    0,
  );
  const totalObjetivo = goals.reduce(
    (s, g) => s + Number(g.monto_objetivo ?? 0),
    0,
  );

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.title}>Metas de ahorro</Text>
          <Text style={s.subtitle}>
            {goals.length} meta{goals.length !== 1 ? "s" : ""} activa
            {goals.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {goals.length > 0 && (
          <View style={s.resumenCard}>
            <View style={s.resumenItem}>
              <Text style={s.resumenLabel}>Total ahorrado</Text>
              <Text style={[s.resumenVal, { color: COLORS.accent }]}>
                {clp(totalAhorrado)}
              </Text>
            </View>
            <View style={s.resumenDivider} />
            <View style={s.resumenItem}>
              <Text style={s.resumenLabel}>Total objetivo</Text>
              <Text style={s.resumenVal}>{clp(totalObjetivo)}</Text>
            </View>
            <View style={s.resumenDivider} />
            <View style={s.resumenItem}>
              <Text style={s.resumenLabel}>Metas</Text>
              <Text style={s.resumenVal}>{goals.length}</Text>
            </View>
          </View>
        )}

        {goals.length === 0 && (
          <TouchableOpacity
            style={s.emptyCard}
            onPress={() => setShowModal(true)}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
            <Text style={s.emptyTitle}>Sin metas aun</Text>
            <Text style={s.emptySubtitle}>
              Toca para crear tu primera meta de ahorro
            </Text>
          </TouchableOpacity>
        )}

        {goals.map((g) => {
          const pct = Math.min(Number(g.porcentaje ?? 0), 100);
          const falta = Math.max(
            Number(g.monto_objetivo) - Number(g.monto_actual),
            0,
          );
          const diasRestantes = g.fecha_limite
            ? Math.max(
                Math.ceil(
                  (new Date(g.fecha_limite) - new Date()) /
                    (1000 * 60 * 60 * 24),
                ),
                0,
              )
            : null;
          const mesesRestantes = diasRestantes !== null ? Math.max(1, Math.ceil(diasRestantes / 30)) : null;
          const ahorroMensualSugerido = mesesRestantes && falta > 0 ? Math.ceil(falta / mesesRestantes) : null;

          return (
            <TouchableOpacity
              key={g.id}
              style={[s.goalCard, { borderLeftColor: g.color }]}
              onLongPress={() => handleDelete(g.id)}
            >
              <View style={s.goalHeader}>
                <View
                  style={[s.goalIconWrap, { backgroundColor: g.color + "18" }]}
                >
                  <Text style={{ fontSize: 22 }}>{g.icono}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.goalNombre}>{g.nombre}</Text>
                  {diasRestantes !== null && (
                    <Text style={s.goalDias}>
                      {diasRestantes} dias restantes
                    </Text>
                  )}
                </View>
                <Text style={[s.goalPct, { color: g.color }]}>
                  {Number(g.porcentaje ?? 0).toFixed(1)}%
                </Text>
              </View>

              <View style={s.barBg}>
                <View
                  style={[
                    s.barFill,
                    { width: `${pct}%`, backgroundColor: g.color },
                  ]}
                />
              </View>

              <View style={s.goalAmounts}>
                <View>
                  <Text style={s.goalAmtLabel}>Ahorrado</Text>
                  <Text style={[s.goalAmtVal, { color: g.color }]}>
                    {clp(g.monto_actual)}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={s.goalAmtLabel}>Falta</Text>
                  <Text style={s.goalAmtVal}>{clp(falta)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.goalAmtLabel}>Objetivo</Text>
                  <Text style={s.goalAmtVal}>{clp(g.monto_objetivo)}</Text>
                </View>
              </View>

              {ahorroMensualSugerido && (
                <Text style={s.ahorroSugerido}>
                  💡 Ahorra {clp(ahorroMensualSugerido)}/mes para llegar a tiempo
                </Text>
              )}

              <View style={s.depositRow}>
                <TextInput
                  style={s.depositInput}
                  placeholder="Abonar $..."
                  keyboardType="numeric"
                  inputAccessoryViewID="numpad"
                  value={formatInputCLP(deposits[g.id] ?? "")}
                  onChangeText={(v) =>
                    setDeposits((d) => ({ ...d, [g.id]: parseInputCLP(v) }))
                  }
                  placeholderTextColor={COLORS.textSub}
                />
                <TouchableOpacity
                  style={[s.depositBtn, { backgroundColor: g.color }]}
                  onPress={() => handleDeposit(g)}
                >
                  <Text style={s.depositBtnText}>Abonar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
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
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nueva meta</Text>
              <TouchableOpacity onPress={closeModal} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.chipLabel}>Nombre *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="Ej: Vacaciones en Europa"
                value={form.nombre}
                onChangeText={(v) => set("nombre", v)}
                placeholderTextColor={COLORS.textSub}
              />

              <Text style={s.chipLabel}>Monto objetivo $</Text>
              <TextInput
                style={s.modalInput}
                placeholder="Ej: 2.000.000"
                keyboardType="numeric"
                inputAccessoryViewID="numpad"
                value={formatInputCLP(form.monto_objetivo)}
                onChangeText={(v) => set("monto_objetivo", parseInputCLP(v))}
                placeholderTextColor={COLORS.textSub}
              />

              <Text style={s.chipLabel}>Fecha objetivo (opcional)</Text>
              <TouchableOpacity
                style={s.dateBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    s.dateBtnText,
                    !form.fecha_limite && { color: COLORS.textSub },
                  ]}
                >
                  {form.fecha_limite
                    ? new Date(form.fecha_limite + "T12:00:00").toLocaleDateString("es-CL", {
                        day: "2-digit", month: "long", year: "numeric",
                      })
                    : "Seleccionar fecha..."}
                </Text>
                <Text style={{ fontSize: 16 }}>📅</Text>
              </TouchableOpacity>

              <Text style={s.chipLabel}>Icono</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {ICONOS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    onPress={() => set("icono", ic)}
                    style={[
                      s.iconoBtn,
                      form.icono === ic && {
                        backgroundColor: form.color,
                        borderColor: form.color,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.chipLabel}>Color</Text>
              <View style={s.colorRow}>
                {PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => set("color", c)}
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
                  {saving ? "Guardando..." : "Crear meta"}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      <Modal visible={showDatePicker} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
        <View style={s.datePicker}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
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
            minimumDate={new Date()}
            onChange={(e, date) => {
              if (date) {
                setDatePickerDate(date);
                set("fecha_limite", date.toISOString().split("T")[0]);
              }
            }}
          />
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Jakarta-ExtraBold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Jakarta-Bold" },
  resumenCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  resumenItem: { flex: 1, alignItems: "center" },
  resumenDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  resumenLabel: {
    fontSize: 10,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resumenVal: {
    fontSize: 14,
    fontFamily: "Jakarta-ExtraBold",
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    textAlign: "center",
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  goalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  goalNombre: { fontSize: 16, fontFamily: "Jakarta-Bold", color: COLORS.text },
  goalDias: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginTop: 2,
  },
  goalPct: { fontSize: 18, fontFamily: "Jakarta-ExtraBold" },
  barBg: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  barFill: { height: "100%", borderRadius: 3 },
  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  goalAmtLabel: {
    fontSize: 10,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  goalAmtVal: { fontSize: 13, fontFamily: "Jakarta-Bold", color: COLORS.text },
  ahorroSugerido: {
    fontSize: 12,
    fontFamily: "Jakarta-Medium",
    color: COLORS.brand,
    backgroundColor: COLORS.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  depositRow: { flexDirection: "row", gap: 10 },
  depositInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 11,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  depositBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: "center",
  },
  depositBtnText: { color: "#fff", fontFamily: "Jakarta-Bold", fontSize: 14 },
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
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
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
  iconoBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  dateBtn: {
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
  dateBtnText: {
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    flex: 1,
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Jakarta-Bold" },
  datePicker: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
});
