import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, ChevronRight } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import Config from '../constants/Config';
import Constants from 'expo-constants';

// Carregamento seguro do Google Sign-In (evita crash no Expo Go)
let GoogleSignin: any = null;
let statusCodes: any = {};

if (Constants.appOwnership !== 'expo') {
  try {
    const GoogleModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleModule.GoogleSignin;
    statusCodes = GoogleModule.statusCodes;
  } catch (e) {
    console.log('[Google] Módulo nativo não disponível neste ambiente.');
  }
}

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAudio();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: Config.GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      // O campo 'email' na UI é mapeado para 'username' na API (que agora aceita email)
      const data = await authService.login(email, password);
      
      // Salva o token de forma segura
      if (data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
      }
      
      // Sucesso: Salva os dados do usuário no contexto e redireciona
      setUser({
        id: data.user.id,
        name: data.user.name || data.user.username,
        avatar: data.user.avatar || null,
        plan_id: data.user.plan_id || 'free',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Falha no Login', error.message || 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Ambiente Limitado',
        'O login com Google nativo só funciona em builds reais (.ipa/.apk) ou Development Builds. No Expo Go, use o login por e-mail.'
      );
      return;
    }

    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Não foi possível obter o ID Token do Google.');
      }

      const data = await authService.googleLogin(idToken);
      
      if (data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
      }
      
      setUser({
        id: data.user.id,
        name: data.user.name || data.user.username,
        avatar: data.user.avatar || null,
        plan_id: data.user.plan_id || 'free',
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Usuário cancelou
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Já em progresso
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erro', 'Google Play Services não disponível ou desatualizado.');
      } else {
        console.error('Google Login Error:', error);
        Alert.alert('Erro no Google Login', error.message || 'Ocorreu um erro ao tentar entrar com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#820AD1', '#4C0677']}
      style={styles.container}
    >
      <ExpoImage 
        source={require('../assets/images/logo.svg')} 
        style={styles.bgLogo}
        contentFit="contain"
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <ExpoImage 
            source={require('../assets/images/logo.svg')} 
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.subtitle}>Encontre sua paz interior</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#820AD1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail ou usuário"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#820AD1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#820AD1" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <ChevronRight size={20} color="#820AD1" />
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              <FontAwesome name="google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.signupText}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLogo: {
    position: 'absolute',
    width: '150%',
    height: '100%',
    opacity: 0.02,
    alignSelf: 'center',
    top: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: '95%',
    height: 130,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 0,
    fontWeight: '400',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF', // Cards brancos Nubank
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#820AD1',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  signupText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
