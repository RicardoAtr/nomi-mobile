import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

export function useTransactions({ mes, anio, limit = 50 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(nombre,color,icono),
        account:accounts!transactions_account_id_fkey(nombre)
      `,
      )
      .eq("is_deleted", false)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (mes && anio) {
      const mesStr = String(mes).padStart(2, "0");
      const nextMes = mes === 12 ? 1 : mes + 1;
      const nextAnio = mes === 12 ? anio + 1 : anio;
      const nextMesStr = String(nextMes).padStart(2, "0");
      q = q
        .gte("fecha", `${anio}-${mesStr}-01`)
        .lt("fecha", `${nextAnio}-${nextMesStr}-01`);
    }

    const { data: rows, error } = await q;
    if (error) console.error("useTransactions error:", JSON.stringify(error));
    setData(rows ?? []);
    setLoading(false);
  }, [user?.id, mes, anio, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useAccounts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("accounts_with_balance")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) console.error("useAccounts error:", error);
    setData(rows ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useBudgets(mes, anio) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user || !mes || !anio) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("budgets_vs_actual")
      .select("*")
      .eq("mes", mes)
      .eq("anio", anio);
    if (error) console.error("useBudgets error:", error);
    setData(rows ?? []);
    setLoading(false);
  }, [user?.id, mes, anio]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useSavingsGoals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("savings_goals_progress")
      .select("*")
      .order("created_at");
    if (error) console.error("useSavingsGoals error:", error);
    setData(rows ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useResumen(mes, anio) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user || !mes || !anio) return;
    const { data: rows, error } = await supabase.rpc("resumen_mensual", {
      p_mes: mes,
      p_anio: anio,
    });
    if (error) console.error("useResumen error:", JSON.stringify(error));
    setData(rows?.[0] ?? null);
    setLoading(false);
  }, [user?.id, mes, anio]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useCategories(tipo) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetch = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("categories").select("*").order("nombre");
    if (tipo) q = q.eq("tipo", tipo);
    const { data: rows, error } = await q;
    if (error) console.error("useCategories error:", error);
    setData(rows ?? []);
    setLoading(false);
  }, [user?.id, tipo]);

  useEffect(() => {
    fetch();
  }, [fetch]);
  return { data, loading };
}
