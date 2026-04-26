import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Platform, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CreditCard, Calendar, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAudio } from '../../context/AudioContext';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const router = useRouter();
  const { id, name, price } = useLocalSearchParams();
  const { user, refreshFlags, refreshProgress, refreshUser } = useAudio();
  
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const response = await fetch(`${Config.API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon })
      });
      const data = await response.json();
      if (data.valid) {
        setDiscount(data.discount_percent);
        Alert.alert('Cupom Aplicado', `Você ganhou ${data.discount_percent}% de desconto!`);
      } else {
        Alert.alert('Erro', 'Cupom inválido ou expirado.');
      }
    } catch (error) {
      console.error('ERRO AO VALIDAR CUPOM:', error);
      Alert.alert('Erro', 'Falha ao validar cupom.');
    }
  };

  const finalPrice = discount === 100 ? 0 : Number(price) * (1 - discount / 100);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handlePayment = async () => {
    // Se for 100% de desconto, pula o cartão
    if (discount === 100) {
      setLoading(true);
      try {
        // Simplesmente atualiza o plano no servidor sem passar pelo Mercado Pago
        await fetch(`${Config.API_URL}/api/users/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, plan_id: 'premium' })
        });
        setSuccess(true);
        await refreshFlags();
        await refreshProgress();
        await refreshUser();
      } catch (error) {
        Alert.alert('Erro', 'Falha ao ativar plano.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!cardNumber || !cardName || !expiry || !cvv) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos do cartão.');
      return;
    }

    setLoading(true);
    try {
      // Simulação de geração de Token do Mercado Pago
      // Em produção, você chamaria: https://api.mercadopago.com/v1/card_tokens?public_key=...
      const mockToken = 'bt_' + Math.random().toString(36).substr(2, 9);

      const response = await fetch(`${Config.API_URL}/api/payments/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planId: id,
          price: price,
          token: mockToken,
          email: user?.email || 'cliente@email.com',
          payment_method_id: 'master', // Simplificado para o exemplo
          installments: 1
        })
      });

      const result = await response.json();

      if (result.status === 'approved') {
        setSuccess(true);
        await refreshFlags();
        await refreshProgress();
        await refreshUser();
      } else {
        Alert.alert('Pagamento Recusado', 'Verifique os dados do cartão ou tente outro método.');
      }
    } catch (error) {
      console.error('[Checkout] Erro:', error);
      Alert.alert('Erro', 'Falha ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleMPCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${Config.API_URL}/api/payments/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planId: id,
          planName: name,
          price: price,
          email: user?.email
        })
      });

      const data = await response.json();
      if (data.init_point) {
        await WebBrowser.openBrowserAsync(data.init_point);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar o checkout do Mercado Pago.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <LinearGradient colors={['#820AD1', '#4C0677']} style={styles.container}>
        <SafeAreaView style={styles.successContent}>
          <CheckCircle2 size={100} color="#10B981" />
          <Text style={styles.successTitle}>Assinatura Ativa!</Text>
          <Text style={styles.successSubtitle}>Parabéns! Agora você tem acesso total a todas as meditações e recursos offline.</Text>
          <TouchableOpacity style={styles.successButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.successButtonText}>Começar a Meditar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#820AD1', '#4C0677']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pagamento Seguro</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.planSummary}>
            <Text style={styles.summaryLabel}>Plano Selecionado</Text>
            <Text style={styles.summaryValue}>{name}</Text>
            <Text style={styles.summaryPrice}>
              {discount > 0 ? (
                <>
                  <Text style={{ textDecorationLine: 'line-through', opacity: 0.5 }}>R$ {price}</Text>
                  <Text> R$ {finalPrice.toFixed(2)}</Text>
                </>
              ) : (
                `R$ ${price}/mês`
              )}
            </Text>
          </View>

          {/* Seção de Cupom */}
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="CUPOM DE DESCONTO"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="characters"
              value={coupon}
              onChangeText={setCoupon}
            />
            <TouchableOpacity style={styles.applyButton} onPress={applyCoupon}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>

          {/* Cartão Virtual (Só mostra se não for 100% off) */}
          {discount < 100 && (
            <LinearGradient 
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} 
              style={styles.virtualCard}
            >
            <View style={styles.cardHeader}>
              <CreditCard size={32} color="#FFF" />
              <Text style={styles.bankName}>ACALMO PREMIUM</Text>
            </View>
            <Text style={styles.cardNumberDisplay}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>TITULAR</Text>
                <Text style={styles.cardValue}>{cardName.toUpperCase() || 'NOME NO CARTÃO'}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>VALIDADE</Text>
                <Text style={styles.cardValue}>{expiry || 'MM/AA'}</Text>
              </View>
            </View>
          </LinearGradient>
          )}

          {/* Formulário (Só mostra se não for 100% off) */}
          {discount < 100 ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número do Cartão</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do Titular</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="COMO ESTÁ NO CARTÃO"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="characters"
                    value={cardName}
                    onChangeText={setCardName}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Validade</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="MM/AA"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      maxLength={5}
                      value={expiry}
                      onChangeText={(t) => setExpiry(formatExpiry(t))}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      value={cvv}
                      onChangeText={setCvv}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.payButton, loading && styles.buttonDisabled]} 
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#820AD1" />
                ) : (
                  <Text style={styles.payButtonText}>Finalizar Assinatura</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.mpButton, loading && styles.buttonDisabled]} 
                onPress={handleMPCheckout}
                disabled={loading}
              >
                <Text style={styles.mpButtonText}>Pagar com Mercado Pago</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.payButton, loading && styles.buttonDisabled]} 
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#820AD1" />
              ) : (
                <Text style={styles.payButtonText}>Ativar Plano Grátis</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.securityNote}>
            <ShieldCheck size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.securityText}>Seus dados estão protegidos e criptografados.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  planSummary: {
    alignItems: 'center',
    marginBottom: 30,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryPrice: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  virtualCard: {
    height: 200,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
  cardNumberDisplay: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginVertical: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 2,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 55,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  payButton: {
    backgroundColor: '#FFF',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#820AD1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mpButton: {
    marginTop: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  mpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  couponContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  couponInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 50,
    paddingHorizontal: 15,
    color: '#FFF',
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#820AD1',
    fontWeight: 'bold',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  securityText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 6,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 40,
  },
  successButtonText: {
    color: '#820AD1',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
