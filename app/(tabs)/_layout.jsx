import { useState } from "react";
import { Tabs } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../src/lib/format";
import AddTransactionModal from "../../src/components/AddTransactionModal";

export default function TabsLayout() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: s.tabBar,
          tabBarActiveTintColor: COLORS.brand,
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: s.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: "Inicio",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transacciones"
          options={{
            tabBarLabel: "Flujo",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="swap-vertical-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="nueva"
          options={{
            tabBarLabel: "",
            tabBarIcon: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                style={s.addButton}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.85}
              >
                <View style={s.addButtonInner}>
                  <Ionicons name="add" size={30} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="metas"
          options={{
            tabBarLabel: "Metas",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flag-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            tabBarLabel: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="presupuestos" options={{ href: null }} />
        <Tabs.Screen name="compromisos" options={{ href: null }} />
        <Tabs.Screen name="cuentas" options={{ href: null }} />
      </Tabs>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => setShowAdd(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Jakarta-Medium",
  },
  addButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
