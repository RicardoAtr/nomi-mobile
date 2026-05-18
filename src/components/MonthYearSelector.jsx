import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS, MONTHS } from '../lib/format'

export default function MonthYearSelector({ mes, anio, onChange }) {
  return (
    <View>
      <View style={s.yearRow}>
        <TouchableOpacity onPress={() => onChange(mes, anio - 1)} style={s.arrow}>
          <Text style={s.arrowText}>◀</Text>
        </TouchableOpacity>
        <Text style={s.yearText}>{anio}</Text>
        <TouchableOpacity onPress={() => onChange(mes, anio + 1)} style={s.arrow}>
          <Text style={s.arrowText}>▶</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={m} onPress={() => onChange(i + 1, anio)}
            style={[s.monthBtn, mes === i + 1 && s.monthBtnActive]}>
            <Text style={[s.monthText, mes === i + 1 && s.monthTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  yearRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingVertical: 6,
  },
  arrow: { padding: 8 },
  arrowText: { fontSize: 13, color: COLORS.textSub },
  yearText: { fontSize: 15, fontWeight: '700', color: COLORS.text, minWidth: 48, textAlign: 'center' },
  monthBtn: {
    paddingHorizontal: 16, height: 34, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
  },
  monthBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  monthText: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
  monthTextActive: { color: '#fff', fontWeight: '600' },
})
