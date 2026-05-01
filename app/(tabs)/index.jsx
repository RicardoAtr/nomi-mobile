import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import {
  useTransactions,
  useAccounts,
  useSavingsGoals,
  useResumen,
  useBudgets,
  useCategories,
} from "../../src/hooks/useData";
import { clp, COLORS, MONTHS, numericOnly } from "../../src/lib/format";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";

const now = new Date();

export default function Home() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    category_id: "",
    monto_limite: "",
  });
  const [savingBudget, setSavingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { profile, user, fetchProfile } = useAuthStore();

  const { data: txs, refetch: refetchTx } = useTransactions({
    mes,
    anio,
    limit: 6,
  });
  const { data: accounts, refetch: refetchAcc } = useAccounts();
  const { data: goals, refetch: refetchGoals } = useSavingsGoals();
  const { data: resumen, refetch: refetchResumen } = useResumen(mes, anio);
  const { data: budgets, refetch: refetchBudgets } = useBudgets(mes, anio);
  const { data: cats } = useCategories("gasto");

  const totalPatrimonio = accounts.reduce(
    (s, a) => s + Number(a.saldo_actual ?? 0),
    0,
  );
  const balance = resumen?.balance_neto ?? 0;

  useFocusEffect(
    useCallback(() => {
      refetchTx();
      refetchAcc();
      refetchGoals();
      refetchResumen();
      refetchBudgets();
      if (user) fetchProfile(user);
    }, [mes, anio]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTx(),
      refetchAcc(),
      refetchGoals(),
      refetchResumen(),
      refetchBudgets(),
    ]);
    setRefreshing(false);
  };

  const openBudgetEdit = (b) => {
    setEditingBudget(b);
    setBudgetForm({
      category_id: b.category_id,
      monto_limite: String(b.monto_limite),
    });
    setShowBudgetModal(true);
  };

  const handleDeleteBudget = async (id) => {
    console.log("Eliminando presupuesto id:", id); // ← agrega esto
    Alert.alert("Eliminar presupuesto", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          console.log("Confirmado, eliminando..."); // ← y esto
          const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", id);
          console.log("Resultado:", error ? error.message : "OK"); // ← y esto
          setEditingBudget(null);
          setBudgetForm({ category_id: "", monto_limite: "" });
          setShowBudgetModal(false);
          refetchBudgets();
        },
      },
    ]);
  };

  const handleSaveBudget = async () => {
    if (!budgetForm.category_id || !budgetForm.monto_limite)
      return Alert.alert("Completa categoria y monto");
    setSavingBudget(true);
    if (editingBudget) {
      await supabase
        .from("budgets")
        .update({ monto_limite: Number(budgetForm.monto_limite) })
        .eq("id", editingBudget.id);
    } else {
      await supabase.from("budgets").upsert(
        {
          owner_id: user.id,
          category_id: budgetForm.category_id,
          monto_limite: Number(budgetForm.monto_limite),
          mes,
          anio,
        },
        { onConflict: "owner_id,category_id,mes,anio" },
      );
    }
    setSavingBudget(false);
    setEditingBudget(null);
    setBudgetForm({ category_id: "", monto_limite: "" });
    setShowBudgetModal(false);
    refetchBudgets();
  };

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.brand}
        />
      }
    >
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>
            Hola, {profile?.nickname || profile?.nombre?.split(" ")[0]} 👋
          </Text>
          <Text style={s.subtitle}>Tu dinero, ordenado</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(profile?.nombre ?? "U").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.patrimonioCard}>
        <Text style={s.patrimonioLabel}>Patrimonio total</Text>
        <Text style={s.patrimonioVal}>{clp(totalPatrimonio)}</Text>
        <View style={s.patrimonioRow}>
          <View style={s.patrimonioTag}>
            <Text style={s.patrimonioTagText}>
              {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={s.patrimonioSub}>Todas las cuentas activas</Text>
        </View>
        <View style={s.circle1} />
        <View style={s.circle2} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.monthScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {MONTHS.map((m, i) => (
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

      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderLeftColor: COLORS.brand }]}>
          <Text style={s.kpiEmoji}>📈</Text>
          <Text style={s.kpiLabel}>Ingresos</Text>
          <Text style={[s.kpiVal, { color: COLORS.brand }]}>
            {clp(resumen?.total_ingresos ?? 0)}
          </Text>
        </View>
        <View style={[s.kpiCard, { borderLeftColor: COLORS.red }]}>
          <Text style={s.kpiEmoji}>📉</Text>
          <Text style={s.kpiLabel}>Gastos</Text>
          <Text style={[s.kpiVal, { color: COLORS.red }]}>
            {clp(resumen?.total_gastos ?? 0)}
          </Text>
        </View>
        <View
          style={[
            s.kpiCard,
            { borderLeftColor: balance >= 0 ? COLORS.brand : COLORS.red },
          ]}
        >
          <Text style={s.kpiEmoji}>{balance >= 0 ? "✅" : "⚠️"}</Text>
          <Text style={s.kpiLabel}>Balance</Text>
          <Text
            style={[
              s.kpiVal,
              { color: balance >= 0 ? COLORS.brand : COLORS.red },
            ]}
          >
            {clp(balance)}
          </Text>
        </View>
      </View>

      {accounts.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Mis cuentas</Text>
            <Text style={s.sectionSub}>{clp(totalPatrimonio)}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
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
              const semaforo =
                pct > 80 ? COLORS.red : pct > 50 ? COLORS.amber : COLORS.brand;
              return (
                <View
                  key={a.id}
                  style={[s.cuentaCard, { borderTopColor: a.color }]}
                >
                  <View style={s.cuentaCardHeader}>
                    <View
                      style={[
                        s.cuentaIconWrap,
                        { backgroundColor: a.color + "18" },
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{a.icono}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cuentaNombre} numberOfLines={1}>
                        {a.nombre}
                      </Text>
                      {a.banco && (
                        <Text style={s.cuentaBanco} numberOfLines={1}>
                          {a.banco}
                        </Text>
                      )}
                    </View>
                  </View>
                  {limite ? (
                    <>
                      <View style={s.barBg}>
                        <View
                          style={[
                            s.barFill,
                            { width: `${pct}%`, backgroundColor: semaforo },
                          ]}
                        />
                      </View>
                      <Text style={[s.cuentaSaldo, { color: semaforo }]}>
                        {pct.toFixed(0)}% usado
                      </Text>
                      <Text style={s.cuentaLimite}>Limite {clp(limite)}</Text>
                    </>
                  ) : (
                    <Text
                      style={[
                        s.cuentaSaldo,
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
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Presupuestos</Text>
          <TouchableOpacity onPress={() => setShowBudgetModal(true)}>
            <Text style={s.sectionAction}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        {budgets.length === 0 ? (
          <TouchableOpacity
            style={s.budgetEmpty}
            onPress={() => setShowBudgetModal(true)}
          >
            <Text style={s.budgetEmptyText}>
              Toca para agregar un presupuesto mensual
            </Text>
          </TouchableOpacity>
        ) : (
          budgets.map((b) => {
            const pct = Number(b.porcentaje_usado ?? 0);
            const over = pct > 100;
            const warn = pct > 80;
            const barColor = over
              ? COLORS.red
              : warn
                ? COLORS.amber
                : COLORS.brand;
            return (
              <TouchableOpacity
                key={b.id}
                style={s.budgetRow}
                onPress={() => openBudgetEdit(b)}
              >
                <Text style={s.budgetIcon}>{b.category_icono}</Text>
                <View style={{ flex: 1 }}>
                  <View style={s.budgetLabelRow}>
                    <Text style={s.budgetName}>{b.category_nombre}</Text>
                    <Text style={[s.budgetPct, { color: barColor }]}>
                      {pct.toFixed(0)}%
                    </Text>
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
                  <View style={s.budgetAmounts}>
                    <Text style={s.budgetAmt}>{clp(b.gastado)}</Text>
                    <Text style={s.budgetAmt}>{clp(b.monto_limite)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Ultimos movimientos</Text>
          <Text style={s.sectionSub}>
            {MONTHS[mes - 1]} {anio}
          </Text>
        </View>
        {txs.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Sin movimientos este mes</Text>
          </View>
        ) : (
          txs.map((tx, idx) => (
            <View
              key={tx.id}
              style={[
                s.txRow,
                idx === txs.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View
                style={[
                  s.txIcon,
                  {
                    backgroundColor: (tx.category?.color ?? COLORS.gray) + "18",
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>
                  {tx.category?.icono ?? "💰"}
                </Text>
              </View>
              <View style={s.txInfo}>
                <Text style={s.txName} numberOfLines={1}>
                  {tx.descripcion}
                </Text>
                <Text style={s.txCat}>
                  {tx.category?.nombre ?? "Sin categoria"}
                </Text>
              </View>
              <View style={s.txRight}>
                <Text
                  style={[
                    s.txAmount,
                    {
                      color: tx.tipo === "ingreso" ? COLORS.brand : COLORS.red,
                    },
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
                        color:
                          tx.tipo === "ingreso" ? COLORS.brand2 : COLORS.red,
                      },
                    ]}
                  >
                    {tx.tipo}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {goals.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Metas de ahorro</Text>
            <Text style={s.sectionSub}>
              {goals.length} activa{goals.length !== 1 ? "s" : ""}
            </Text>
          </View>
          {goals.slice(0, 3).map((g, idx) => (
            <View
              key={g.id}
              style={[
                s.goalRow,
                idx === Math.min(goals.length, 3) - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={[s.goalIcon, { backgroundColor: g.color + "18" }]}>
                <Text style={{ fontSize: 18 }}>{g.icono}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.goalHeader}>
                  <Text style={s.goalName}>{g.nombre}</Text>
                  <Text style={[s.goalPct, { color: g.color }]}>
                    {g.porcentaje}%
                  </Text>
                </View>
                <View style={s.barBg}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${Math.min(Number(g.porcentaje), 100)}%`,
                        backgroundColor: g.color,
                      },
                    ]}
                  />
                </View>
                <View style={s.goalAmounts}>
                  <Text style={s.budgetAmt}>{clp(g.monto_actual)}</Text>
                  <Text style={s.budgetAmt}>{clp(g.monto_objetivo)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />

      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
          setBudgetForm({ category_id: "", monto_limite: "" });
        }}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={() => {
              setShowBudgetModal(false);
              setEditingBudget(null);
              setBudgetForm({ category_id: "", monto_limite: "" });
            }}
          />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBudgetModal(false);
                  setEditingBudget(null);
                  setBudgetForm({ category_id: "", monto_limite: "" });
                }}
                style={s.modalClose}
              >
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.chipLabel}>Categoria de gasto</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16, opacity: editingBudget ? 0.5 : 1 }}
              scrollEnabled={!editingBudget}
            >
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() =>
                    setBudgetForm((f) => ({ ...f, category_id: c.id }))
                  }
                  style={[
                    s.chip,
                    budgetForm.category_id === c.id && s.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      budgetForm.category_id === c.id && s.chipTextActive,
                    ]}
                  >
                    {c.icono} {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.chipLabel}>Limite mensual $</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ej: 200000"
              keyboardType="numeric"
              value={budgetForm.monto_limite}
              onChangeText={(v) =>
                setBudgetForm((f) => ({ ...f, monto_limite: numericOnly(v) }))
              }
              placeholderTextColor={COLORS.textSub}
            />
            {editingBudget && (
              <TouchableOpacity
                style={[
                  s.saveBtn,
                  { backgroundColor: COLORS.red, marginBottom: 10 },
                ]}
                onPress={() => handleDeleteBudget(editingBudget.id)}
              >
                <Text style={s.saveBtnText}>Eliminar presupuesto</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSaveBudget}
              disabled={savingBudget}
            >
              <Text style={s.saveBtnText}>
                {savingBudget
                  ? "Guardando..."
                  : editingBudget
                    ? "Guardar cambios"
                    : "Guardar presupuesto"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSub,
    marginTop: 3,
    fontStyle: "italic",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  patrimonioCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 130,
  },
  patrimonioLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  patrimonioVal: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 12,
  },
  patrimonioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  patrimonioTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  patrimonioTagText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  patrimonioSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
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
  monthScroll: { marginBottom: 16 },
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
  monthText: { fontSize: 13, color: COLORS.textSub, fontWeight: "500" },
  monthTextActive: { color: "#fff", fontWeight: "600" },
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3,
  },
  kpiEmoji: { fontSize: 16, marginBottom: 6 },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textSub,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiVal: { fontSize: 13, fontWeight: "800" },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  sectionSub: { fontSize: 12, color: COLORS.textSub },
  sectionAction: { fontSize: 13, color: COLORS.brand, fontWeight: "600" },
  budgetEmpty: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  budgetEmptyText: { fontSize: 13, color: COLORS.textSub },
  budgetRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  budgetIcon: { fontSize: 20, marginTop: 2 },
  budgetLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetName: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  budgetPct: { fontSize: 12, fontWeight: "700" },
  budgetAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  budgetAmt: { fontSize: 11, color: COLORS.textSub },
  barBg: {
    height: 6,
    backgroundColor: "#F4F6F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  emptyWrap: { alignItems: "center", paddingVertical: 20 },
  emptyText: { fontSize: 13, color: COLORS.textSub },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F6F9",
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 3,
  },
  txCat: { fontSize: 12, color: COLORS.textSub },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  txBadgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  goalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  goalPct: { fontSize: 13, fontWeight: "700" },
  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cuentaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    width: 160,
    borderTopWidth: 3,
  },
  cuentaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cuentaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cuentaNombre: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  cuentaBanco: { fontSize: 11, color: COLORS.textSub },
  cuentaSaldo: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  cuentaLimite: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
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
    paddingBottom: 36,
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
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: "#F8F9FA",
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: "500", color: COLORS.textSub },
  chipTextActive: { color: "#fff" },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#F8F9FA",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
