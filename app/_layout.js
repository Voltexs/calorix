import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import NutritionProvider from './context/NutritionContext';

export default function RootLayout() {
  return (
    <NutritionProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="food-detail" 
          options={{
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#000',
            },
            headerTintColor: '#fff',
            headerTitle: 'Food Details',
            contentStyle: {
              backgroundColor: '#000',
            },
            animation: 'slide_from_bottom',
            statusBarStyle: 'light',
            statusBarColor: '#000',
          }}
        />
      </Stack>
    </NutritionProvider>
  );
} 