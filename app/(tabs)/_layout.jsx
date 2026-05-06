import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../src/lib/format";

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={[s.tab, focused && s.tabActive]}>
      <Text style={[s.emoji, focused && s.emojiFocused]}>{emoji}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Inicio" emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transacciones"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Flujo" emoji="↕️" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Metas" emoji="⭐" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Perfil" emoji="👤" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="presupuestos" options={{ href: null }} />
      <Tabs.Screen name="cuentas" options={{ href: null }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tab: { alignItems: "center", justifyContent: "center", gap: 2 },
  tabActive: {},
  emoji: { fontSize: 24 },
  emojiFocused: {},
  tabLabel: { fontSize: 10, color: COLORS.textSub, fontWeight: "500" },
  tabLabelActive: { color: COLORS.brand, fontWeight: "600" },
  tab: { alignItems: "center", justifyContent: "center", gap: 2, width: 50 },
});
