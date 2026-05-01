export const clp = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

export const shortDate = (d) =>
  new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })

export const monthName = (m, y) =>
  new Date(y, m - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

export const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export const COLORS = {
  brand:   '#1D9E75',
  brand2:  '#0F6E56',
  red:     '#E24B4A',
  amber:   '#EF9F27',
  blue:    '#378ADD',
  purple:  '#534AB7',
  gray:    '#888780',
  light:   '#F1EFE8',
  white:   '#FFFFFF',
  bg:      '#F8F9FA',
  text:    '#1a1a1a',
  textSub: '#6b7280',
  border:  '#E5E7EB',
}

export const TIPO_COLOR = {
  ingreso:       COLORS.brand,
  gasto:         COLORS.red,
  transferencia: COLORS.blue,
}

// Filtra input para solo permitir numeros enteros (sin decimales)
export const numericOnly = (val) => String(val).replace(/[^0-9]/g, '')

// Filtra input para numeros con decimal opcional
export const numericDecimal = (val) => String(val).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
