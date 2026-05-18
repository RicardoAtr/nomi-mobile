import { useState, useEffect } from "react";
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
import {
  useTransactions,
  useAccounts,
  useCategories,
} from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/store/authStore";
import {
  clp,
  shortDate,
  COLORS,
  formatInputCLP,
  parseInputCLP,
} from "../../src/lib/format";

const F = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semiBold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extraBold: "Jakarta-ExtraBold",
};

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const now = new Date();

export default function Transacciones() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    tipo: "gasto",
    monto: "",
    descripcion: "",
    account_id: "",
    category_id: "",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const { user } = useAuthStore();

  const {
    data: txs,
    loading,
    refetch,
  } = useTransactions({ mes, anio, limit: 100 });
  const { data: accounts } = useAccounts();
  const { data: cats } = useCategories();

  useEffect(() => {
    refetch();
  }, [mes]);

  const filtered = txs.filter(
    (t) =>
      !search || t.descripcion?.toLowerCase().includes(search.toLowerCase()),
  );

  const totales = filtered.reduce(
    (acc, t) => {
      if (t.tipo === "ingreso") acc.ingresos += Number(t.monto);
      if (t.tipo === "gasto") acc.gastos += Number(t.monto);
      return acc;
    },
    { ingresos: 0, gastos: 0 },
  );

  const resetForm = () => {
    setForm({
      tipo: "gasto",
      monto: "",
      descripcion: "",
      account_id: "",
      category_id: "",
      fecha: new Date().toISOString().split("T")[0],
    });
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!form.monto || !form.descripcion || !form.account_id)
      return Alert.alert(
        "Faltan datos",
        "Completa monto, descripcion y cuenta.",
      );
    setSaving(true);
    const { error } = await supabase.from("transactions").insert({
      ...form,
      monto: Number(form.monto),
      created_by: user.id,
    });
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    resetForm();
    refetch();
  };

  const handleDelete = (id) => {
    Alert.alert("Eliminar", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("transactions")
            .update({ is_deleted: true })
            .eq("id", id);
          refetch();
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={s.stickyHeader}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.title}>Movimientos</Text>
              <Text style={s.subtitle}>
                {MESES[mes - 1]} {anio}
              </Text>
            </View>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setShowModal(true)}
            >
              <Text style={s.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
              paddingBottom: 12,
            }}
          >
            {MESES.map((m, i) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMes(i + 1)}
                style={[s.monthBtn, mes === i + 1 && s.monthBtnActive]}
              >
                <Text style={[s.monthText, mes === i + 1 && s.monthTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={s.totalesRow}>
          <View style={[s.totalCard, { borderTopColor: COLORS.accent }]}>
            <Text style={s.totalLabel}>Ingresos</Text>
            <Text style={[s.totalVal, { color: COLORS.accent }]}>
              {clp(totales.ingresos)}
            </Text>
          </View>
          <View style={[s.totalCard, { borderTopColor: COLORS.red }]}>
            <Text style={s.totalLabel}>Gastos</Text>
            <Text style={[s.totalVal, { color: COLORS.red }]}>
              {clp(totales.gastos)}
            </Text>
          </View>
          <View
            style={[
              s.totalCard,
              {
                borderTopColor:
                  totales.ingresos - totales.gastos >= 0
                    ? COLORS.accent
                    : COLORS.red,
              },
            ]}
          >
            <Text style={s.totalLabel}>Balance</Text>
            <Text
              style={[
                s.totalVal,
                {
                  color:
                    totales.ingresos - totales.gastos >= 0
                      ? COLORS.accent
                      : COLORS.red,
                },
              ]}
            >
              {clp(totales.ingresos - totales.gastos)}
            </Text>
          </View>
        </View>

        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar movimientos..."
            placeholderTextColor={COLORS.textSub}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading && (
          <Text style={[s.empty, { textAlign: "center", marginTop: 40 }]}>
            Cargando...
          </Text>
        )}
        {!loading && filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.empty}>Sin movimientos este mes</Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => setShowModal(true)}
            >
              <Text style={s.emptyBtnText}>Agregar el primero</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.map((tx) => (
          <TouchableOpacity
            key={tx.id}
            style={s.txCard}
            onLongPress={() => handleDelete(tx.id)}
          >
            <View
              style={[
                s.txIconWrap,
                { backgroundColor: (tx.category?.color ?? COLORS.gray) + "18" },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{tx.category?.icono ?? "💰"}</Text>
            </View>
            <View style={s.txInfo}>
              <Text style={s.txName} numberOfLines={1}>
                {tx.descripcion}
              </Text>
              <Text style={s.txMeta}>
                {tx.category?.nombre ?? "Sin categoria"} · {shortDate(tx.fecha)}
              </Text>
            </View>
            <View style={s.txRight}>
              <Text
                style={[
                  s.txAmount,
                  { color: tx.tipo === "ingreso" ? COLORS.accent : COLORS.red },
                ]}
              >
                {tx.tipo === "ingreso" ? "+" : "-"}
                {clp(tx.monto)}
              </Text>
              <View
                style={[
                  s.txBadge,
                  {
                    backgroundColor:
                      tx.tipo === "ingreso" ? "#E1F5EE" : "#FCEBEB",
                  },
                ]}
              >
                <Text
                  style={[
                    s.txBadgeText,
                    {
                      color: tx.tipo === "ingreso" ? COLORS.accent : COLORS.red,
                    },
                  ]}
                >
                  {tx.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalOverlay}
        >
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={resetForm}
          />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nueva transaccion</Text>
              <TouchableOpacity onPress={resetForm} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={s.tipoRow}>
              {["ingreso", "gasto"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() =>
                    setForm((f) => ({ ...f, tipo: t, category_id: "" }))
                  }
                  style={[
                    s.tipoBtn,
                    form.tipo === t && {
                      backgroundColor:
                        t === "ingreso" ? COLORS.accent : COLORS.red,
                      borderColor: "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.tipoBtnText,
                      form.tipo === t && { color: "#fff" },
                    ]}
                  >
                    {t === "ingreso" ? "Ingreso" : "Gasto"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.modalInput}
              placeholder="Monto $"
              keyboardType="numeric"
              inputAccessoryViewID="numpad"
              value={formatInputCLP(form.monto)}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, monto: parseInputCLP(v) }))
              }
              placeholderTextColor={COLORS.textSub}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Descripcion (ej: Supermercado)"
              value={form.descripcion}
              onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
              placeholderTextColor={COLORS.textSub}
            />

            <Text style={s.chipLabel}>Cuenta</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setForm((f) => ({ ...f, account_id: a.id }))}
                  style={[s.chip, form.account_id === a.id && s.chipActive]}
                >
                  <Text
                    style={[
                      s.chipText,
                      form.account_id === a.id && s.chipTextActive,
                    ]}
                  >
                    {a.icono} {a.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.chipLabel}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              {cats
                .filter((c) => c.tipo === form.tipo)
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() =>
                      setForm((f) => ({ ...f, category_id: c.id }))
                    }
                    style={[s.chip, form.category_id === c.id && s.chipActive]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        form.category_id === c.id && s.chipTextActive,
                      ]}
                    >
                      {c.icono} {c.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={s.chipLabel}>Fecha</Text>
            <TouchableOpacity
              style={s.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={s.dateBtnText}>
                {new Date(form.fecha + "T12:00:00").toLocaleDateString(
                  "es-CL",
                  { day: "2-digit", month: "long", year: "numeric" },
                )}
              </Text>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </TouchableOpacity>
            <Modal visible={showDatePicker} transparent animationType="slide">
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              />
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 20,
                  paddingBottom: 40,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text
                      style={{
                        color: COLORS.textSub,
                        fontFamily: "Jakarta-SemiBold",
                        fontSize: 15,
                      }}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text
                      style={{
                        color: COLORS.brand,
                        fontFamily: "Jakarta-Bold",
                        fontSize: 15,
                      }}
                    >
                      Listo
                    </Text>
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
                      setDatePickerDate(date);
                      const iso = date.toISOString().split("T")[0];
                      setForm((f) => ({ ...f, fecha: iso }));
                    }
                  }}
                />
              </View>
            </Modal>

            <TouchableOpacity
              style={[
                s.saveBtn,
                {
                  backgroundColor:
                    form.tipo === "ingreso" ? COLORS.accent : COLORS.red,
                },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={s.saveBtnText}>
                {saving ? "Guardando..." : "Guardar transaccion"}
              </Text>
            </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { flex: 1 },
  stickyHeader: { backgroundColor: COLORS.surface, paddingTop: 60 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  monthBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  monthText: {
    fontSize: 13,
    fontFamily: "Jakarta-Medium",
    color: COLORS.textSub,
  },
  monthTextActive: { color: "#fff", fontFamily: "Jakarta-SemiBold" },
  totalesRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  totalCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderTopWidth: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalVal: { fontSize: 13, fontFamily: "Jakarta-ExtraBold" },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  empty: {
    color: COLORS.textSub,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { color: "#fff", fontFamily: "Jakarta-Bold", fontSize: 13 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  txIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txName: {
    fontSize: 14,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  txMeta: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  txRight: { alignItems: "flex-end", gap: 5 },
  txAmount: { fontSize: 15, fontFamily: "Jakarta-ExtraBold" },
  txBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  txBadgeText: { fontSize: 10, fontFamily: "Jakarta-Bold" },
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
    paddingBottom: 36,
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
    marginBottom: 18,
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
  tipoRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  tipoBtnText: {
    fontSize: 14,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
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
  chipLabel: {
    fontSize: 11,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: {
    fontSize: 12,
    fontFamily: "Jakarta-Medium",
    color: COLORS.textSub,
  },
  chipTextActive: { color: "#fff" },
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
});
