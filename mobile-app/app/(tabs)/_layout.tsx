import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, useRouter, Redirect, useFocusEffect } from 'expo-router';
import { Home, Heart, Settings, Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAudio } from '../../context/AudioContext';
import apiRequest from '../../services/api';

export default function TabLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();
  const { logout } = useAudio();

  const checkAuth = async (isInitial = false) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        setHasToken(false);
        if (!isInitial) router.replace('/login');
        return;
      }

      // Validação real com o servidor usando o helper que já envia x-client-id
      await apiRequest('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setHasToken(true);
    } catch (error) {
      console.warn('[AuthGuard] Sessão inválida:', error);
      await logout();
      setHasToken(false);
      router.replace('/login');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth(true);
  }, []);

  // Valida a cada vez que qualquer aba ganha foco
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        checkAuth();
      }
    }, [isLoading])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#820AD1', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 0 }]}>
            {/* Camada de Cor Roxa Nubank */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#820AD1', opacity: 0.65 }]} />
            {/* Camada de Blur */}
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 50}
              tint="default"
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
