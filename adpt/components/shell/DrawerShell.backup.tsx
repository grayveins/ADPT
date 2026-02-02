// app/_layout.tsx
import { Drawer } from "expo-router/drawer";
import { View, TouchableOpacity, Text, SafeAreaView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

// ------------------- Custom Header -------------------
function CustomHeader() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ backgroundColor: "#4A5568" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "#4A5568",
          paddingTop: Platform.OS === "ios" ? 0 : 12,
        }}
      >
        <TouchableOpacity onPress={() => navigation.dispatch({ type: "OPEN_DRAWER" })}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>

        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          GPT Personal Training
        </Text>

        <View style={{ width: 28 }} />
      </View>
    </SafeAreaView>
  );
}

// ------------------- Custom Drawer -------------------
function CustomDrawerContent(props: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7FAFC" }}>
      {/* Profile section */}
      <View
        style={{
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          backgroundColor: "#EDF2F7",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
          <View
            style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#A0AEC0", marginRight: 15 }}
          />
          <View>
            <Text style={{ color: "#2D3748", fontSize: 18, fontWeight: "bold" }}>Gavin Cruz</Text>
            <Text style={{ color: "#718096", fontSize: 14 }}>gerrardcruz09@gmail.com</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#4A5568",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: "transparent",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#4A5568",
          }}
        >
          <Text style={{ color: "#4A5568", fontWeight: "600" }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Drawer items */}
      <View style={{ padding: 15, flex: 1 }}>
        {[
          { icon: "barbell", label: "Adaptive Coach" },
          { icon: "stats-chart", label: "Work" },
          { icon: "flame", label: "Calories: 0.1" },
          { icon: "nutrition", label: "Protein: 0.01" },
          { icon: "fast-food", label: "Carb: 0.09" },
          { icon: "water", label: "Fats: 0.09" },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
              borderBottomWidth: idx === 5 ? 0 : 1,
              borderBottomColor: "#E2E8F0",
            }}
          >
            <Ionicons name={item.icon as any} size={22} color="#4A5568" style={{ marginRight: 15 }} />
            <Text style={{ color: "#2D3748", fontSize: 16 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ------------------- Layout -------------------
export default function Layout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#F7FAFC" }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          header: () => <CustomHeader />,
          drawerStyle: {
            backgroundColor: "#F7FAFC",
            width: 300,
          },
          drawerLabelStyle: {
            color: "#2D3748",
          },
          drawerActiveTintColor: "#4A5568",
          drawerInactiveTintColor: "#718096",
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "Home",
          }}
        />
      </Drawer>
    </View>
  );
}
