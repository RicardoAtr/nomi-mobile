export const clp = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const shortDate = (d) =>
  new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });

export const monthName = (m, y) =>
  new Date(y, m - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

export const MONTHS = [
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

export const COLORS = {
  brand: "#0D5C4A",
  brand2: "#0A4437",
  accent: "#00C896",
  red: "#E53935",
  amber: "#F59E0B",
  text: "#0F172A",
  textSub: "#64748B",
  border: "#E2E8F0",
  gray: "#94A3B8",
  white: "#FFFFFF",
  surface: "#F8FAFC",
  card: "#FFFFFF",
};

export const TIPO_COLOR = {
  ingreso: COLORS.brand,
  gasto: COLORS.red,
  transferencia: COLORS.blue,
};

// Filtra input para solo permitir numeros enteros (sin decimales)
export const numericOnly = (val) => String(val).replace(/[^0-9]/g, "");

// Filtra input para numeros con decimal opcional
export const numericDecimal = (val) =>
  String(val)
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1");

const LOGO_TOKEN = "pk_fo24lHahRy6I1TgvOWe1Tw";

export const BANCOS_LOGOS = {
  "Banco BCI": "bci.cl",
  "Banco Santander": "santander.cl",
  "Banco de Chile": "bancochile.cl",
  "Banco Estado": "bancoestado.cl",
  "Banco Falabella": "bancofalabella.cl",
  "Banco Ripley": "bancoripley.cl",
  "Banco Ita\u00fa": "itau.cl",
  "Banco Security": "bancosecurity.cl",
  "Banco BICE": "bice.cl",
  "Banco Scotiabank": "scotiabank.cl",
  "Mercado Pago": "mercadopago.cl",
  Fintual: "fintual.com",
  Tenpo: "tenpo.cl",
  MACH: "mach.cl",
  Coopeuch: "coopeuch.cl",
};

export const getBancoLogoUrl = (banco) => {
  if (!banco) return null;
  const domain = BANCOS_LOGOS[banco];
  if (!domain) return null;
  return `https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=80&retina=true`;
};

// Formatea numero con puntos mientras escribes (ej: 1.000.000)
export const formatInputCLP = (val) => {
  const num = String(val).replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("es-CL");
};

// Extrae el numero limpio desde un valor formateado
export const parseInputCLP = (val) => {
  return String(val).replace(/[^0-9]/g, "");
};
