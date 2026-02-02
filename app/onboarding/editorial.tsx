import "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";

import Onboarding from "@/src/screens/onboarding/Onboarding";

const Stack = createNativeStackNavigator();

export default function EditorialOnboardingRoute() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
  });

  if (!loaded) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={Onboarding} />
    </Stack.Navigator>
  );
}
