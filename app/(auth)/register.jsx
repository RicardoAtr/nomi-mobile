import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { COLORS } from '../../src/lib/format'

export default function Register() {
  const [nombre, setNombre]     = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { signUp } = useAuthStore()

  const handle = async () => {
    if (!nombre || !email || !password) return Alert.alert('Completa todos los campos')
    if (password.length < 6) return Alert.alert('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    const err = await signUp(email.trim(), password, nombre.trim())
    setLoading(false)
    if (err) return Alert.alert('Error', err.message)
    Alert.alert('¡Cuenta creada!', 'Revisa tu correo para confirmar tu cuenta.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }
    ])
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <View style={s.logo}><Text style={s.logoText}>N</Text></View>
          <Text style={s.brand}>Nomi</Text>
          <Text style={s.slogan}>Tu dinero, ordenado</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Crear cuenta</Text>

          <Text style={s.label}>Nombre completo</Text>
          <TextInput style={s.input} placeholder="Ricardo Torres" placeholderTextColor={COLORS.textSub}
            value={nombre} onChangeText={setNombre} autoCapitalize="words" />

          <Text style={s.label}>Correo electrónico</Text>
          <TextInput style={s.input} placeholder="tu@correo.com" placeholderTextColor={COLORS.textSub}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Contraseña</Text>
          <TextInput style={s.input} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.textSub}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={s.btn} onPress={handle} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={s.link}>
            <Text style={s.linkText}>¿Ya tienes cuenta? <Text style={s.linkBold}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { padding: 24, justifyContent: 'center', flexGrow: 1 },
  top:       { alignItems: 'center', marginBottom: 32 },
  logo:      { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.brand,
               alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:  { color: '#fff', fontSize: 28, fontWeight: '700' },
  brand:     { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  slogan:    { fontSize: 14, color: COLORS.textSub, marginTop: 4, fontStyle: 'italic' },
  card:      { backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
               shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  title:     { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 20 },
  label:     { fontSize: 12, fontWeight: '500', color: COLORS.textSub, marginBottom: 6 },
  input:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14,
               fontSize: 15, color: COLORS.text, marginBottom: 16, backgroundColor: COLORS.bg },
  btn:       { backgroundColor: COLORS.brand, borderRadius: 12, padding: 16,
               alignItems: 'center', marginTop: 4 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  link:      { alignItems: 'center', marginTop: 20 },
  linkText:  { color: COLORS.textSub, fontSize: 14 },
  linkBold:  { color: COLORS.brand, fontWeight: '600' },
})
