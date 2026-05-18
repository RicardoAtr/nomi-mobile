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
import { useCompromisos } from "../../src/hooks/useData";
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
const ICONOS = ["🤝", "👫", "👨‍👩‍👧", "🏦", "💼", "🏠", "🚗", "📱", "💊", "🎓"];

const defaultForm = () => ({
  tipo: "me_deben",
  contacto: "",
  descripcion: "",
  monto: "",
  fecha_compromiso: "",
  color: PALETTE[0],
  icono: "🤝",
  notas: "",
});

export default function Compromisos() {
  const { user } = useAuthStore();
  const { data: compromisos, refetch } = useCompromisos();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState("todos");
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
    if (!form.contacto || !form.monto)
      return Alert.alert("Completa contacto y monto");
    setSaving(true);
    const { error } = await supabase.from("compromisos").insert({
      owner_id: user.id,
      tipo: form.tipo,
      contacto: form.contacto,
      descripcion: form.descripcion || null,
      monto: Number(form.monto),
      fecha_compromiso: form.fecha_compromiso || null,
      color: form.color,
      icono: form.icono,
      notas: form.notas || null,
    });
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    closeModal();
    refetch();
  };

  const handlePago = async (c) => {
    Alert.alert(
      "Marcar como pagado",
      `Confirmas que ${c.tipo === "me_deben" ? c.contacto + " te pago" : "pagaste a " + c.contacto} ${clp(c.monto)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            await supabase
              .from("compromisos")
              .update({ pagado: true, monto_pagado: c.monto })
              .eq("id", c.id);
            refetch();
          },
        },
      ],
    );
  };

  const handleDelete = (id) => {
    Alert.alert("Eliminar", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await supabase.from("compromisos").delete().eq("id", id);
          refetch();
        },
      },
    ]);
  };

  const filtered = compromisos.filter((c) => {
    if (activeFilter === "todos") return !c.pagado;
    if (activeFilter === "me_deben") return !c.pagado && c.tipo === "me_deben";
    if (activeFilter === "debo") return !c.pagado && c.tipo === "debo";
    if (activeFilter === "pagados") return c.pagado;
    return true;
  });

  const totalMeDeben = compromisos
    .filter((c) => !c.pagado && c.tipo === "me_deben")
    .reduce((s, c) => s + Number(c.monto), 0);
  const totalDebo = compromisos
    .filter((c) => !c.pagado && c.tipo === "debo")
    .reduce((s, c) => s + Number(c.monto), 0);

  const hoy = new Date();
  const estaVencido = (fecha) => fecha && new Date(fecha) < hoy;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Compromisos</Text>
          <Text style={s.subtitle}>Deudas y prestamos</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* Resumen */}
        <View style={s.resumenRow}>
          <View style={[s.resumenCard, { borderTopColor: COLORS.accent }]}>
            <Text style={s.resumenLabel}>Me deben</Text>
            <Text style={[s.resumenVal, { color: COLORS.accent }]}>
              {clp(totalMeDeben)}
            </Text>
          </View>
          <View style={[s.resumenCard, { borderTopColor: COLORS.red }]}>
            <Text style={s.resumenLabel}>Debo</Text>
            <Text style={[s.resumenVal, { color: COLORS.red }]}>
              {clp(totalDebo)}
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {[
            { key: "todos", label: "Pendientes" },
            { key: "me_deben", label: "Me deben" },
            { key: "debo", label: "Debo" },
            { key: "pagados", label: "Pagados" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[s.filterBtn, activeFilter === f.key && s.filterBtnActive]}
            >
              <Text
                style={[
                  s.filterText,
                  activeFilter === f.key && s.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 && (
          <TouchableOpacity
            style={s.emptyCard}
            onPress={() => setShowModal(true)}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🤝</Text>
            <Text style={s.emptyTitle}>Sin compromisos</Text>
            <Text style={s.emptySubtitle}>
              {activeFilter === "pagados"
                ? "No hay compromisos pagados aun"
                : "Toca para registrar un prestamo o deuda"}
            </Text>
          </TouchableOpacity>
        )}

        {filtered.map((c) => {
          const vencido = estaVencido(c.fecha_compromiso);
          const pendiente = Number(c.monto) - Number(c.monto_pagado);
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                s.card,
                {
                  borderLeftColor:
                    c.tipo === "me_deben" ? COLORS.accent : COLORS.red,
                },
                c.pagado && { opacity: 0.6 },
              ]}
              onLongPress={() => handleDelete(c.id)}
            >
              <View style={s.cardHeader}>
                <View style={[s.iconWrap, { backgroundColor: c.color + "18" }]}>
                  <Text style={{ fontSize: 22 }}>{c.icono}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardContacto}>{c.contacto}</Text>
                    <View
                      style={[
                        s.tipoBadge,
                        {
                          backgroundColor:
                            c.tipo === "me_deben" ? "#E1F5EE" : "#FCEBEB",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.tipoBadgeText,
                          {
                            color:
                              c.tipo === "me_deben"
                                ? COLORS.accent
                                : COLORS.red,
                          },
                        ]}
                      >
                        {c.tipo === "me_deben" ? "Me debe" : "Debo"}
                      </Text>
                    </View>
                  </View>
                  {c.descripcion && (
                    <Text style={s.cardDesc}>{c.descripcion}</Text>
                  )}
                  {c.fecha_compromiso && (
                    <View style={s.fechaRow}>
                      <Text
                        style={[
                          s.cardFecha,
                          vencido && !c.pagado && { color: COLORS.red },
                        ]}
                      >
                        {vencido && !c.pagado ? "Vencio: " : "Fecha: "}
                        {new Date(c.fecha_compromiso).toLocaleDateString(
                          "es-CL",
                        )}
                      </Text>
                      {vencido && !c.pagado && (
                        <View style={s.vencidoBadge}>
                          <Text style={s.vencidoText}>Vencido</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={s.cardFooter}>
                <View>
                  <Text style={s.cardMontoLabel}>Monto total</Text>
                  <Text
                    style={[
                      s.cardMonto,
                      {
                        color:
                          c.tipo === "me_deben" ? COLORS.accent : COLORS.red,
                      },
                    ]}
                  >
                    {clp(c.monto)}
                  </Text>
                </View>
                {!c.pagado && (
                  <TouchableOpacity
                    style={[
                      s.pagarBtn,
                      {
                        backgroundColor:
                          c.tipo === "me_deben" ? COLORS.accent : COLORS.red,
                      },
                    ]}
                    onPress={() => handlePago(c)}
                  >
                    <Text style={s.pagarBtnText}>
                      {c.tipo === "me_deben" ? "Cobrar" : "Pagar"}
                    </Text>
                  </TouchableOpacity>
                )}
                {c.pagado && (
                  <View style={s.pagadoBadge}>
                    <Text style={s.pagadoText}>Pagado</Text>
                  </View>
                )}
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
              <Text style={s.modalTitle}>Nuevo compromiso</Text>
              <TouchableOpacity onPress={closeModal} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tipo */}
              <View style={s.tipoRow}>
                {[
                  { key: "me_deben", label: "Me deben", color: COLORS.accent },
                  { key: "debo", label: "Debo", color: COLORS.red },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => set("tipo", t.key)}
                    style={[
                      s.tipoBtn,
                      form.tipo === t.key && {
                        backgroundColor: t.color,
                        borderColor: t.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.tipoBtnText,
                        form.tipo === t.key && { color: "#fff" },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.chipLabel}>
                {form.tipo === "me_deben"
                  ? "Quien te debe *"
                  : "A quien le debes *"}
              </Text>
              <TextInput
                style={s.modalInput}
                placeholder={
                  form.tipo === "me_deben" ? "Ej: Juan Perez" : "Ej: Banco BCI"
                }
                value={form.contacto}
                onChangeText={(v) => set("contacto", v)}
                placeholderTextColor={COLORS.textSub}
              />

              <Text style={s.chipLabel}>Descripcion</Text>
              <TextInput
                style={s.modalInput}
                placeholder="Ej: Prestamo para arriendo"
                value={form.descripcion}
                onChangeText={(v) => set("descripcion", v)}
                placeholderTextColor={COLORS.textSub}
              />

              <Text style={s.chipLabel}>Monto $</Text>
              <TextInput
                style={s.modalInput}
                placeholder="Ej: 50.000"
                keyboardType="numeric"
                inputAccessoryViewID="numpad"
                value={formatInputCLP(form.monto)}
                onChangeText={(v) => set("monto", parseInputCLP(v))}
                placeholderTextColor={COLORS.textSub}
              />

              <Text style={s.chipLabel}>Fecha compromiso (opcional)</Text>
              <TouchableOpacity
                style={s.dateBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    s.dateBtnText,
                    !form.fecha_compromiso && { color: COLORS.textSub },
                  ]}
                >
                  {form.fecha_compromiso
                    ? new Date(
                        form.fecha_compromiso + "T12:00:00",
                      ).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Seleccionar fecha..."}
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
                    onChange={(e, date) => {
                      if (date) {
                        setDatePickerDate(date);
                        const iso = date.toISOString().split("T")[0];
                        set("fecha_compromiso", iso);
                      }
                    }}
                  />
                </View>
              </Modal>

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
                        backgroundColor:
                          form.tipo === "me_deben" ? COLORS.accent : COLORS.red,
                        borderColor: "transparent",
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
                style={[
                  s.saveBtn,
                  {
                    backgroundColor:
                      form.tipo === "me_deben" ? COLORS.accent : COLORS.red,
                  },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>
                  {saving ? "Guardando..." : "Guardar compromiso"}
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
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 60,
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
  resumenRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  resumenCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderTopWidth: 3,
  },
  resumenLabel: {
    fontSize: 11,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  resumenVal: { fontSize: 18, fontFamily: "Jakarta-ExtraBold" },
  filterBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  filterText: {
    fontSize: 13,
    fontFamily: "Jakarta-Medium",
    color: COLORS.textSub,
  },
  filterTextActive: { color: "#fff", fontFamily: "Jakarta-SemiBold" },
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  cardContacto: {
    fontSize: 16,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
  },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tipoBadgeText: { fontSize: 10, fontFamily: "Jakarta-Bold" },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginBottom: 3,
  },
  fechaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardFecha: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  vencidoBadge: {
    backgroundColor: "#FCEBEB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vencidoText: { fontSize: 10, fontFamily: "Jakarta-Bold", color: COLORS.red },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMontoLabel: {
    fontSize: 11,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  cardMonto: { fontSize: 20, fontFamily: "Jakarta-ExtraBold" },
  pagarBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  pagarBtnText: { color: "#fff", fontFamily: "Jakarta-Bold", fontSize: 14 },
  pagadoBadge: {
    backgroundColor: "#E1F5EE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pagadoText: {
    color: COLORS.accent,
    fontFamily: "Jakarta-Bold",
    fontSize: 13,
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
  tipoRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
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
});
