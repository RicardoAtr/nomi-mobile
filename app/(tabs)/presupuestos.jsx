import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MonthYearSelector from "../../src/components/MonthYearSelector";
import { useBudgets, useCategories } from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/store/authStore";
import { clp, COLORS, numericOnly } from "../../src/lib/format";

const now = new Date();

export default function Presupuestos() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: "", monto_limite: "" });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const { data: budgets, loading, refetch } = useBudgets(mes, anio);
  const { data: cats } = useCategories("gasto");

  const totalLimit = budgets.reduce((s, b) => s + Number(b.monto_limite), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.gastado), 0);
  const pctTotal =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  const handleSave = async () => {
    if (!form.category_id || !form.monto_limite)
      return Alert.alert("Completa categoria y monto");
    setSaving(true);
    await supabase.from("budgets").upsert(
      {
        owner_id: user.id,
        category_id: form.category_id,
        monto_limite: Number(form.monto_limite),
        mes,
        anio,
      },
      { onConflict: "owner_id,category_id,mes,anio" },
    );
    setSaving(false);
    setForm({ category_id: "", monto_limite: "" });
    setShowForm(false);
    refetch();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Presupuestos</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, showForm && s.addBtnCancel]}
          onPress={() => setShowForm((v) => !v)}
        >
          <Text style={s.addBtnText}>{showForm ? "Cancelar" : "+ Nuevo"}</Text>
        </TouchableOpacity>
      </View>

      <MonthYearSelector mes={mes} anio={anio} onChange={(m, a) => { setMes(m); setAnio(a); }} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {totalLimit > 0 && (
          <View style={s.resumenCard}>
            <View style={s.resumenTop}>
              <View>
                <Text style={s.resumenLabel}>Total presupuestado</Text>
                <Text style={s.resumenTotal}>{clp(totalLimit)}</Text>
              </View>
              <View style={s.resumenRight}>
                <Text style={s.resumenPct}>{pctTotal.toFixed(0)}%</Text>
                <Text style={s.resumenPctSub}>utilizado</Text>
              </View>
            </View>
            <View style={s.resumenBarBg}>
              <View
                style={[
                  s.resumenBar,
                  {
                    width: `${pctTotal}%`,
                    backgroundColor:
                      pctTotal > 90
                        ? COLORS.red
                        : pctTotal > 70
                          ? COLORS.amber
                          : COLORS.brand,
                  },
                ]}
              />
            </View>
            <View style={s.resumenFooter}>
              <Text style={s.resumenFooterText}>
                Gastado: {clp(totalSpent)}
              </Text>
              <Text
                style={[
                  s.resumenFooterText,
                  {
                    color:
                      totalLimit - totalSpent >= 0 ? COLORS.brand : COLORS.red,
                  },
                ]}
              >
                Disponible: {clp(totalLimit - totalSpent)}
              </Text>
            </View>
          </View>
        )}

        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Nuevo presupuesto</Text>
            <Text style={s.chipLabel}>Categoria de gasto</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setForm((f) => ({ ...f, category_id: c.id }))}
                  style={[
                    s.chip,
                    form.category_id === c.id && {
                      backgroundColor: COLORS.brand,
                      borderColor: COLORS.brand,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      form.category_id === c.id && { color: "#fff" },
                    ]}
                  >
                    {c.icono} {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={s.input}
              placeholder="Limite mensual $"
              keyboardType="numeric"
              returnKeyType="done"
              value={form.monto_limite}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, monto_limite: numericOnly(v) }))
              }
              placeholderTextColor={COLORS.textSub}
            />
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={s.saveBtnText}>
                {saving ? "Guardando..." : "Guardar presupuesto"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.listWrap}>
          {loading && <Text style={s.empty}>Cargando...</Text>}
          {!loading && budgets.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🎯</Text>
              <Text style={s.emptyTitle}>Sin presupuestos</Text>
              <Text style={s.empty}>
                Agrega un presupuesto para controlar tus gastos
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => setShowForm(true)}
              >
                <Text style={s.emptyBtnText}>Crear primer presupuesto</Text>
              </TouchableOpacity>
            </View>
          )}
          {budgets.map((b) => {
            const pct = Number(b.porcentaje_usado ?? 0);
            const over = pct > 100;
            const warn = pct > 80;
            const barColor = over
              ? COLORS.red
              : warn
                ? COLORS.amber
                : COLORS.brand;
            const bgColor = over ? "#FCEBEB" : warn ? "#FAEEDA" : "#E1F5EE";
            const textColor = over
              ? COLORS.red
              : warn
                ? "#854F0B"
                : COLORS.brand2;
            const hoy = new Date().getDate();
            const diasEnMes = new Date(anio, mes, 0).getDate();
            const gastoProyectado = hoy > 0 ? Math.round((Number(b.gastado) / hoy) * diasEnMes) : 0;
            const excede = gastoProyectado > Number(b.monto_limite);

            return (
              <View key={b.id} style={s.budgetCard}>
                <View style={s.budgetTop}>
                  <View
                    style={[
                      s.budgetIconWrap,
                      { backgroundColor: b.category_color + "20" },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{b.category_icono}</Text>
                  </View>
                  <View style={s.budgetInfo}>
                    <Text style={s.budgetName}>{b.category_nombre}</Text>
                    <Text style={s.budgetAmounts}>
                      {clp(b.gastado)} de {clp(b.monto_limite)}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: bgColor }]}>
                    <Text style={[s.badgeText, { color: textColor }]}>
                      {over ? "Excedido" : warn ? "Casi agotado" : "Al dia"}
                    </Text>
                  </View>
                </View>
                <View style={s.barBg}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <View style={s.budgetFooter}>
                  <Text
                    style={[
                      s.budgetDisp,
                      { color: over ? COLORS.red : COLORS.textSub },
                    ]}
                  >
                    {over
                      ? "Excedido " + clp(Math.abs(b.disponible))
                      : "Disponible " + clp(b.disponible)}
                  </Text>
                  <Text style={[s.budgetPct, { color: barColor }]}>
                    {pct.toFixed(0)}%
                  </Text>
                </View>
                {excede && (
                  <Text style={s.proyeccionText}>
                    Al ritmo actual: {clp(gastoProyectado)} al cierre
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontFamily: "Jakarta-ExtraBold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnCancel: { backgroundColor: "#888780" },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Jakarta-Bold" },
  monthScroll: { marginBottom: 16 },
  monthBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  monthText: { fontSize: 12, color: COLORS.textSub, fontFamily: "Jakarta-Medium" },
  monthTextActive: { color: "#fff", fontFamily: "Jakarta-SemiBold" },
  resumenCard: {
    backgroundColor: COLORS.brand,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  resumenTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  resumenLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Jakarta-Medium",
    marginBottom: 4,
  },
  resumenTotal: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Jakarta-ExtraBold",
    letterSpacing: -0.5,
  },
  resumenRight: { alignItems: "flex-end" },
  resumenPct: { color: "#fff", fontSize: 28, fontFamily: "Jakarta-ExtraBold" },
  resumenPctSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Jakarta-Regular" },
  resumenBarBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  resumenBar: { height: "100%", borderRadius: 4 },
  resumenFooter: { flexDirection: "row", justifyContent: "space-between" },
  resumenFooterText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Jakarta-Medium",
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
    marginBottom: 14,
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
    backgroundColor: "#F8F9FA",
  },
  chipText: { fontSize: 12, fontFamily: "Jakarta-Medium", color: COLORS.textSub },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#F8F9FA",
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Jakarta-Bold" },
  listWrap: { paddingHorizontal: 20 },
  emptyWrap: { alignItems: "center", paddingVertical: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  empty: {
    textAlign: "center",
    color: COLORS.textSub,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyBtnText: { color: "#fff", fontFamily: "Jakarta-Bold", fontSize: 14 },
  budgetCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  budgetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  budgetIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetInfo: { flex: 1 },
  budgetName: {
    fontSize: 15,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
    marginBottom: 3,
  },
  budgetAmounts: { fontSize: 12, fontFamily: "Jakarta-Regular", color: COLORS.textSub },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: "Jakarta-Bold" },
  barBg: {
    height: 7,
    backgroundColor: "#F4F6F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  barFill: { height: "100%", borderRadius: 4 },
  budgetFooter: { flexDirection: "row", justifyContent: "space-between" },
  budgetDisp: { fontSize: 12, color: COLORS.textSub, fontFamily: "Jakarta-Medium" },
  budgetPct: { fontSize: 13, fontFamily: "Jakarta-ExtraBold" },
  proyeccionText: {
    fontSize: 11,
    fontFamily: "Jakarta-Medium",
    color: COLORS.amber,
    marginTop: 6,
  },
});
