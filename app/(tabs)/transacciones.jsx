import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MonthYearSelector from "../../src/components/MonthYearSelector";
import AddTransactionModal from "../../src/components/AddTransactionModal";
import { useTransactions, useAccounts } from "../../src/hooks/useData";
import { supabase } from "../../src/lib/supabase";
import { clp, shortDate, COLORS } from "../../src/lib/format";

const F = {
  regular:   "Jakarta-Regular",
  medium:    "Jakarta-Medium",
  semiBold:  "Jakarta-SemiBold",
  bold:      "Jakarta-Bold",
  extraBold: "Jakarta-ExtraBold",
};

const now = new Date();

export default function Transacciones() {
  const insets = useSafeAreaInsets();
  const [mes, setMes]                 = useState(now.getMonth() + 1);
  const [anio, setAnio]               = useState(now.getFullYear());
  const [search, setSearch]           = useState("");
  const [filtroAccount, setFiltroAccount] = useState(null);
  const [showModal, setShowModal]     = useState(false);

  const { data: txs, loading, refetch } = useTransactions({ mes, anio, limit: 100 });
  const { data: accounts } = useAccounts();

  useFocusEffect(
    useCallback(() => { refetch() }, [])
  );

  const filtered = txs.filter(
    (t) =>
      (!search || t.descripcion?.toLowerCase().includes(search.toLowerCase())) &&
      (!filtroAccount || t.account_id === filtroAccount),
  );

  const totales = filtered.reduce(
    (acc, t) => {
      if (t.tipo === "ingreso") acc.ingresos += Number(t.monto);
      if (t.tipo === "gasto")   acc.gastos   += Number(t.monto);
      return acc;
    },
    { ingresos: 0, gastos: 0 },
  );

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
        <View style={[s.stickyHeader, { paddingTop: insets.top }]}>
          <View style={s.headerRow}>
            <Text style={s.title}>Movimientos</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
              <Text style={s.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          <MonthYearSelector
            mes={mes}
            anio={anio}
            onChange={(m, a) => { setMes(m); setAnio(a); setFiltroAccount(null); }}
          />
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

        {accounts.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
          >
            <TouchableOpacity
              onPress={() => setFiltroAccount(null)}
              style={[s.cuentaChip, !filtroAccount && s.cuentaChipActive]}
            >
              <Text style={[s.cuentaChipText, !filtroAccount && s.cuentaChipTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {accounts.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setFiltroAccount(filtroAccount === a.id ? null : a.id)}
                style={[
                  s.cuentaChip,
                  filtroAccount === a.id && { backgroundColor: a.color, borderColor: a.color },
                ]}
              >
                <Text style={[s.cuentaChipText, filtroAccount === a.id && s.cuentaChipTextActive]}>
                  {a.icono} {a.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading && (
          <Text style={[s.empty, { textAlign: "center", marginTop: 40 }]}>
            Cargando...
          </Text>
        )}
        {!loading && filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.empty}>Sin movimientos este mes</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={s.emptyBtnText}>Agregar el primero</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.length > 0 && (
          <Text style={s.hintText}>Mantén presionada una transacción para eliminarla</Text>
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
                  { backgroundColor: tx.tipo === "ingreso" ? "#E1F5EE" : "#FCEBEB" },
                ]}
              >
                <Text
                  style={[
                    s.txBadgeText,
                    { color: tx.tipo === "ingreso" ? COLORS.accent : COLORS.red },
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

      <AddTransactionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { refetch(); setShowModal(false); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.surface },
  scroll:      { flex: 1 },
  stickyHeader: { backgroundColor: COLORS.surface },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: F.extraBold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: F.bold },
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
    fontFamily: F.semiBold,
    color: COLORS.textSub,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalVal:    { fontSize: 13, fontFamily: F.extraBold },
  searchWrap:  { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: F.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyWrap:  { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  empty: {
    color: COLORS.textSub,
    fontSize: 14,
    fontFamily: F.regular,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { color: "#fff", fontFamily: F.bold, fontSize: 13 },
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
  txInfo:   { flex: 1 },
  txName: {
    fontSize: 14,
    fontFamily: F.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  txMeta: {
    fontSize: 12,
    fontFamily: F.regular,
    color: COLORS.textSub,
  },
  cuentaChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cuentaChipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  cuentaChipText:       { fontSize: 12, fontFamily: F.medium, color: COLORS.textSub },
  cuentaChipTextActive: { color: "#fff", fontFamily: F.semiBold },
  hintText: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: F.regular,
    color: COLORS.textSub,
    fontStyle: "italic",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  txRight:     { alignItems: "flex-end", gap: 5 },
  txAmount:    { fontSize: 15, fontFamily: F.extraBold },
  txBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  txBadgeText: { fontSize: 10, fontFamily: F.bold },
});
