import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, CreditCard, MapPin, ChevronLeft } from 'lucide-react-native';
import { authService } from '../services/api';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const formatCpf = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !cpf) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios (Nome, E-mail, Senha e CPF).');
      return;
    }

    setLoading(true);
    try {
      await fetch(`${Config.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email,
          name,
          email,
          password,
          cpf,
          address,
          city,
          state,
          zip_code: zip
        })
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para começar.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#820AD1', '#4C0677']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#FFF" size={28} />
            </TouchableOpacity>
            <Text style={styles.title}>Criar Conta</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo *</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail *</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF *</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={14}
                    value={cpf}
                    onChangeText={(t) => setCpf(formatCpf(t))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha *</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Endereço</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rua e Número</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Av. Paulista, 1000"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Cidade</Text>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="Cidade"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={[styles.inputGroup, { width: 80 }]}>
                  <Text style={styles.label}>Estado</Text>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    placeholder="UF"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={2}
                    autoCapitalize="characters"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#820AD1" /> : <Text style={styles.buttonText}>Finalizar Cadastro</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  label: { color: '#FFF', fontSize: 14, marginBottom: 5, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 50,
    paddingHorizontal: 15,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  sectionTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 15 },
  row: { flexDirection: 'row' },
  smallInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 50,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: '#FFF',
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#820AD1', fontSize: 18, fontWeight: 'bold' }
});

import { SafeAreaView } from 'react-native-safe-area-context';
