import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, ShieldCheck, Zap } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudio } from '../context/AudioContext';

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAudio();
  const [loading, setLoading] = React.useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      price: '19.90',
      period: '/mês',
      features: ['Acesso a todas as meditações', 'Downloads offline', 'Qualidade de áudio HD', 'Sem anúncios'],
      highlight: false,
    },
    {
      id: 'annual',
      name: 'Plano Anual',
      price: '149.90',
      period: '/ano',
      features: ['Tudo do plano mensal', '2 meses grátis', 'Suporte prioritário', 'Conteúdo exclusivo'],
      highlight: true,
      badge: 'MELHOR VALOR',
    }
  ];

  const handleUpgrade = (plan: any) => {
    router.push({
      pathname: `/checkout/${plan.id}`,
      params: {
        name: plan.name,
        price: plan.price
      }
    });
  };

  return (
    <LinearGradient colors={['#820AD1', '#4C0677']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#FFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escolha seu plano</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Zap size={48} color="#FFD700" fill="#FFD700" />
            <Text style={styles.heroTitle}>Desbloqueie o Premium</Text>
            <Text style={styles.heroSubtitle}>Sua jornada para a paz mental sem limites.</Text>
          </View>

          {plans.map((plan) => (
            <View key={plan.id} style={[styles.card, plan.highlight && styles.highlightCard]}>
              {plan.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>R$</Text>
                <Text style={styles.price}>{plan.price.split('.')[0]}</Text>
                <Text style={styles.priceCents}>,{plan.price.split('.')[1]}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, plan.highlight ? styles.highlightButton : styles.outlineButton]}
                onPress={() => handleUpgrade(plan)}
                disabled={loading !== null}
              >
                {loading === plan.id ? (
                  <ActivityIndicator color={plan.highlight ? "#820AD1" : "#FFF"} />
                ) : (
                  <Text style={[styles.buttonText, plan.highlight ? styles.highlightButtonText : styles.outlineButtonText]}>
                    Assinar Agora
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.footer}>
            <ShieldCheck size={16} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.footerText}>Pagamento seguro via Mercado Pago</Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 15,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 30,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  highlightCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#820AD1',
    fontSize: 12,
    fontWeight: '900',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 25,
  },
  currency: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginRight: 2,
  },
  price: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
  },
  priceCents: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 5,
  },
  features: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    marginLeft: 10,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  highlightButton: {
    backgroundColor: '#FFD700',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  highlightButtonText: {
    color: '#820AD1',
  },
  outlineButtonText: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginLeft: 8,
  },
});
