import { View, StyleSheet } from 'react-native'
import { COLORS } from '../lib/format'

export default function ProgressBar({ value, max, height = 6, color, showSemaforo = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  let barColor = color ?? COLORS.brand
  if (showSemaforo) {
    const ratio = max > 0 ? value / max : 0
    barColor = ratio > 1 ? COLORS.red : ratio > 0.8 ? COLORS.amber : COLORS.brand
  }

  return (
    <View style={[s.bg, { height }]}>
      <View style={[s.fill, { width: `${pct}%`, backgroundColor: barColor, height }]} />
    </View>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#F4F6F9', borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
})
