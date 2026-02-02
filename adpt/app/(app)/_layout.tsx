// app/(app)/_layout.tsx
import React, { useEffect, useState } from "react";
import { Drawer } from "expo-router/drawer";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { darkColors } from "@/src/theme";

function CustomHeader() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        {/* Menu Button */}
        <TouchableOpacity
          onPress={() => navigation.dispatch({ type: "OPEN_DRAWER" })}
        >
          <Ionicons name="menu" size={24} color={darkColors.text} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle}>ADPT</Text>

        {/* Spacer to balance layout */}
        <View style={styles.headerSpacer} />
      </View>
    </SafeAreaView>
  );
}

function CustomDrawerContent(props: any) {
  const [profileName, setProfileName] = useState<string>("User");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error fetching user:", userError);
        setLoading(false);
        return;
      }

      setEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (!profileError && profile?.first_name) setProfileName(profile.first_name);

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const onSignOut = async () => {
    try {
      await supabase.auth.signOut();
      props.navigation.closeDrawer?.();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.drawerSafe}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={darkColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.drawerSafe}>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.profileName}>{profileName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>

        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AuthenticatedLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: darkColors.bg }}>
      <Drawer
        screenOptions={{
          header: () => <CustomHeader />,
          drawerStyle: {
            backgroundColor: darkColors.bg,
            width: 280,
          },
          drawerActiveTintColor: darkColors.primary,
          drawerInactiveTintColor: darkColors.muted,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: "Home",
          }}
        />
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: darkColors.bg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: darkColors.bg,
    paddingTop: Platform.OS === "ios" ? 0 : 12,
  },
  headerTitle: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 24,
  },
  drawerSafe: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: darkColors.card,
    borderWidth: 2,
    borderColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: darkColors.primary,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
  },
  profileName: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  profileEmail: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: darkColors.card,
  },
  signOutText: {
    color: darkColors.text,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
