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
  Image,
  InputAccessoryView,
  Keyboard,
  Platform,
  Vibration,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MonthYearSelector from '../../src/components/MonthYearSelector'
import ProgressBar from '../../src/components/ProgressBar'
import { useAuthStore } from "../../src/store/authStore";
import {
  useTransactions,
  useAccounts,
  useSavingsGoals,
  useResumen,
  useBudgets,
  useCategories,
} from "../../src/hooks/useData";
import {
  clp,
  COLORS,
  MONTHS,
  formatInputCLP,
  parseInputCLP,
  getBancoLogoUrl,
} from "../../src/lib/format";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

const F = {
  regular: "Jakarta-Regular",
  medium: "Jakarta-Medium",
  semiBold: "Jakarta-SemiBold",
  bold: "Jakarta-Bold",
  extraBold: "Jakarta-ExtraBold",
};

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
  const [editingBudget, setEditingBudget] = useState(null);
  const [savingBudget, setSavingBudget] = useState(false);
  const { profile, user, fetchProfile } = useAuthStore();
  const router = useRouter();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const insets = useSafeAreaInsets()

  const { data: txs, refetch: refetchTx } = useTransactions({
    mes,
    anio,
    limit: 5,
  });
  const { data: accounts, refetch: refetchAcc } = useAccounts();
  const { data: goals, refetch: refetchGoals } = useSavingsGoals();
  const { data: resumen, refetch: refetchResumen } = useResumen(mes, anio);
  const { data: budgets, refetch: refetchBudgets } = useBudgets(mes, anio);
  const { data: cats } = useCategories("gasto");

  const TIPOS_DEUDA = ['tarjeta_credito', 'linea_credito', 'prestamo']
  const activos = accounts.filter(a => !TIPOS_DEUDA.includes(a.tipo))
    .reduce((s, a) => s + Number(a.saldo_actual ?? 0), 0)
  const deudas = accounts.filter(a => TIPOS_DEUDA.includes(a.tipo))
    .reduce((s, a) => s + Math.abs(Number(a.saldo_actual ?? 0)), 0)
  const patrimonioNeto = activos - deudas
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

  const handleAvatarPress = () => setShowAvatarMenu(true);

  const openBudgetEdit = (b) => {
    setEditingBudget(b);
    setBudgetForm({
      category_id: b.category_id,
      monto_limite: String(b.monto_limite),
    });
    setShowBudgetModal(true);
  };

  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setEditingBudget(null);
    setBudgetForm({ category_id: "", monto_limite: "" });
  };

  const handleDeleteBudget = async (id) => {
    Alert.alert("Eliminar presupuesto", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("budgets").delete().eq("id", id);
          if (error) return Alert.alert("Error", error.message);
          Vibration.vibrate(10);
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
    Vibration.vibrate(10);
    closeBudgetModal();
    refetchBudgets();
  };

  const nombre = profile?.nickname || profile?.nombre?.split(" ")[0] || "tú";

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.accent}
        />
      }
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.greeting}>Hola, {nombre} 👋</Text>
          <Text style={s.subtitle}>Tu dinero, ordenado</Text>
        </View>
        <TouchableOpacity
          style={s.avatar}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarText}>
              {(profile?.nombre ?? "U").charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Patrimonio */}
      <View style={s.patrimonioCard}>
        <View style={s.patrimonioInner}>
          <Text style={s.patrimonioLabel}>Patrimonio neto</Text>
          <Text style={s.patrimonioVal}>{clp(patrimonioNeto)}</Text>
          <View style={s.patrimonioRow}>
            <View style={s.patrimonioTag}>
              <Text style={s.patrimonioTagText}>Activos {clp(activos)}</Text>
            </View>
            {deudas > 0 && (
              <View style={[s.patrimonioTag, { backgroundColor: 'rgba(255,80,80,0.25)' }]}>
                <Text style={s.patrimonioTagText}>Deudas {clp(deudas)}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={s.circle1} />
        <View style={s.circle2} />
      </View>

      <MonthYearSelector mes={mes} anio={anio} onChange={(m, a) => { setMes(m); setAnio(a) }} />

      {/* KPIs */}
      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderTopColor: COLORS.accent }]}>
          <Text style={s.kpiLabel}>Ingresos</Text>
          <Text style={[s.kpiVal, { color: COLORS.accent }]}>
            {clp(resumen?.total_ingresos ?? 0)}
          </Text>
        </View>
        <View style={[s.kpiCard, { borderTopColor: COLORS.red }]}>
          <Text style={s.kpiLabel}>Gastos</Text>
          <Text style={[s.kpiVal, { color: COLORS.red }]}>
            {clp(resumen?.total_gastos ?? 0)}
          </Text>
        </View>
        <View
          style={[
            s.kpiCard,
            { borderTopColor: balance >= 0 ? COLORS.accent : COLORS.red },
          ]}
        >
          <Text style={s.kpiLabel}>Balance</Text>
          <Text
            style={[
              s.kpiVal,
              { color: balance >= 0 ? COLORS.accent : COLORS.red },
            ]}
          >
            {clp(balance)}
          </Text>
        </View>
      </View>

      {balance < 0 && (
        <View style={s.alertCard}>
          <Text style={s.alertText}>⚠️ Este mes gastas más de lo que ingresas</Text>
        </View>
      )}
      {budgets.some(b => Number(b.porcentaje_usado) > 80) && (
        <View style={s.warningCard}>
          <Text style={s.warningText}>
            🔴 {budgets.filter(b => Number(b.porcentaje_usado) > 80).length} presupuesto(s) cerca del límite
          </Text>
        </View>
      )}

      {/* Mis cuentas */}
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
                pct > 80 ? COLORS.red : pct > 50 ? COLORS.amber : COLORS.accent;
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
                      {getBancoLogoUrl(a.banco) ? (
                        <Image
                          source={{ uri: getBancoLogoUrl(a.banco) }}
                          style={{ width: 28, height: 28, borderRadius: 6 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 20 }}>{a.icono}</Text>
                      )}
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
                      <Text
                        style={[
                          s.cuentaSaldo,
                          { color: semaforo, fontSize: 13 },
                        ]}
                      >
                        {pct.toFixed(0)}% usado
                      </Text>
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

      {/* Presupuestos */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Presupuestos</Text>
          <TouchableOpacity onPress={() => setShowBudgetModal(true)}>
            <Text style={s.sectionAction}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        {budgets.length === 0 ? (
          <TouchableOpacity
            style={s.emptyDashed}
            onPress={() => setShowBudgetModal(true)}
          >
            <Text style={s.emptyDashedText}>
              Toca para agregar un presupuesto mensual
            </Text>
          </TouchableOpacity>
        ) : (
          budgets.map((b) => {
            const pct = Number(b.porcentaje_usado ?? 0);
            const barColor =
              pct > 100 ? COLORS.red : pct > 80 ? COLORS.amber : COLORS.accent;
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

      {/* Ultimos movimientos */}
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
              <Text
                style={[
                  s.txAmount,
                  { color: tx.tipo === "ingreso" ? COLORS.accent : COLORS.red },
                ]}
              >
                {tx.tipo === "ingreso" ? "+" : "-"}
                {clp(tx.monto)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Metas */}
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <Text style={s.budgetAmt}>{clp(g.monto_actual)}</Text>
                  <Text style={s.budgetAmt}>{clp(g.monto_objetivo)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />

      {/* Avatar Menu */}
      <Modal
        visible={showAvatarMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvatarMenu(false)}
      >
        <TouchableOpacity
          style={s.modalBg}
          activeOpacity={1}
          onPress={() => setShowAvatarMenu(false)}
        />
        <View style={s.menuSheet}>
          <View style={s.modalHandle} />
          <View style={s.menuAvatar}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={s.menuAvatarImg}
              />
            ) : (
              <View style={s.menuAvatarFallback}>
                <Text style={s.menuAvatarText}>
                  {(profile?.nombre ?? "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={s.menuName}>{profile?.nombre ?? "—"}</Text>
              <Text style={s.menuEmail}>{profile?.email ?? "—"}</Text>
            </View>
          </View>
          <View style={s.menuDivider} />
          {[
            {
              icon: "👤",
              label: "Ver perfil",
              action: () => {
                setShowAvatarMenu(false);
                router.push("/(tabs)/perfil");
              },
            },
            {
              icon: "➕",
              label: "Agregar movimiento",
              action: () => {
                setShowAvatarMenu(false);
                router.push("/(tabs)/transacciones");
              },
            },
            {
              icon: "🎯",
              label: "Nueva meta",
              action: () => {
                setShowAvatarMenu(false);
                router.push("/(tabs)/metas");
              },
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.menuItem}
              onPress={item.action}
            >
              <Text style={s.menuItemIcon}>{item.icon}</Text>
              <Text style={s.menuItemLabel}>{item.label}</Text>
              <Text style={s.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={s.menuCancel}
            onPress={() => setShowAvatarMenu(false)}
          >
            <Text style={s.menuCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal presupuesto */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={closeBudgetModal}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBg}
            activeOpacity={1}
            onPress={closeBudgetModal}
          />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"}
              </Text>
              <TouchableOpacity onPress={closeBudgetModal} style={s.modalClose}>
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
              placeholder="Ej: 200.000"
              keyboardType="numeric"
              inputAccessoryViewID="numpad"
              value={formatInputCLP(budgetForm.monto_limite)}
              onChangeText={(v) =>
                setBudgetForm((f) => ({ ...f, monto_limite: parseInputCLP(v) }))
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
        <InputAccessoryView nativeID="numpad">
          <View
            style={{
              backgroundColor: "#F8FAFC",
              padding: 8,
              alignItems: "flex-end",
              borderTopWidth: 1,
              borderTopColor: "#E2E8F0",
            }}
          >
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: COLORS.brand,
                  fontWeight: "700",
                  fontSize: 16,
                  fontFamily: F.bold,
                }}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
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
    fontFamily: "Jakarta-ExtraBold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
    marginTop: 3,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: "Jakarta-Bold" },
  patrimonioCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.brand,
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 140,
  },
  patrimonioInner: { padding: 24, zIndex: 1 },
  patrimonioLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Jakarta-Medium",
    marginBottom: 6,
  },
  patrimonioVal: {
    color: "#fff",
    fontSize: 36,
    fontFamily: "Jakarta-ExtraBold",
    letterSpacing: -1,
    marginBottom: 14,
  },
  patrimonioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  patrimonioTag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  patrimonioTagText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Jakarta-SemiBold",
  },
  patrimonioSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
  },
  circle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(0,200,150,0.12)",
    right: -50,
    top: -50,
  },
  circle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,200,150,0.08)",
    right: 40,
    bottom: -40,
  },
  monthScroll: { marginBottom: 16 },
  monthBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
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
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderTopWidth: 3,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiVal: { fontSize: 13, fontFamily: "Jakarta-ExtraBold" },
  section: {
    backgroundColor: COLORS.card,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Jakarta-Bold",
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.brand,
  },
  emptyDashed: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyDashedText: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  emptyWrap: { alignItems: "center", paddingVertical: 20 },
  emptyText: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
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
  budgetName: {
    fontSize: 13,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
  },
  budgetPct: { fontSize: 12, fontFamily: "Jakarta-Bold" },
  budgetAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  budgetAmt: {
    fontSize: 11,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  barBg: {
    height: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
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
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
    marginBottom: 3,
  },
  txCat: { fontSize: 12, fontFamily: "Jakarta-Regular", color: COLORS.textSub },
  txAmount: { fontSize: 14, fontFamily: "Jakarta-Bold" },
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
  goalName: {
    fontSize: 14,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
  },
  goalPct: { fontSize: 13, fontFamily: "Jakarta-Bold" },
  cuentaCard: {
    backgroundColor: COLORS.surface,
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
  cuentaNombre: {
    fontSize: 13,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
  },
  cuentaBanco: {
    fontSize: 11,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  cuentaSaldo: { fontSize: 16, fontFamily: "Jakarta-ExtraBold", marginTop: 4 },

  menuSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  menuAvatar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  menuAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  menuAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  menuAvatarText: { color: "#fff", fontSize: 20, fontFamily: "Jakarta-Bold" },
  menuName: { fontSize: 16, fontFamily: "Jakarta-Bold", color: COLORS.text },
  menuEmail: {
    fontSize: 13,
    fontFamily: "Jakarta-Regular",
    color: COLORS.textSub,
  },
  menuDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  menuItemIcon: { fontSize: 22, width: 32, textAlign: "center" },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.text,
  },
  menuItemArrow: { fontSize: 22, color: COLORS.textSub },
  menuCancel: {
    marginTop: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    alignItems: "center",
  },
  menuCancelText: {
    fontSize: 15,
    fontFamily: "Jakarta-SemiBold",
    color: COLORS.textSub,
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
    backgroundColor: COLORS.card,
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
    color: COLORS.textSub,
    fontFamily: "Jakarta-Bold",
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
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    fontFamily: "Jakarta-Regular",
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Jakarta-Bold" },
});
