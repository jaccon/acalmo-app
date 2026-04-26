import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AudioProvider } from '../context/AudioContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // You can add custom fonts here if needed
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (loaded && isReady) {
      const hideSplash = async () => {
        try {
          // Pequeno delay para garantir que o layout nativo está pronto
          await new Promise(resolve => setTimeout(resolve, 500));
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignora erro se já estiver escondido ou não registrado (comum no Expo Go)
        } finally {
          setIsLoading(false);
        }
      };
      hideSplash();
    }
  }, [loaded, isReady]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return (
    <AudioProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_bottom', // Efeito de subida global
        animationDuration: 400,
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="plans" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="meditation/[id]" options={{ 
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }} />
      </Stack>
    </AudioProvider>
  );
}
