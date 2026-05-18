import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS } from '../lib/format'

export default function EmptyState({ emoji, title, subtitle, onAction, actionLabel }) {
  return (
    <View style={s.wrap}>
      {emoji ? <Text style={s.emoji}>{emoji}</Text> : null}
      {title ? <Text style={s.title}>{title}</Text> : null}
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {onAction && actionLabel ? (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle: {
    textAlign: 'center', color: COLORS.textSub, fontSize: 14,
    lineHeight: 22, marginBottom: 20, paddingHorizontal: 20,
  },
  btn: { backgroundColor: COLORS.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
