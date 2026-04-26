import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User, Bell, Shield, CircleHelp, ChevronRight, Trophy, Star, Zap, Glasses } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudio } from '../../context/AudioContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, flags } = useAudio();
  const isPremium = user?.plan_id?.toLowerCase() === 'premium';

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => router.replace('/login') 
        }
      ]
    );
  };

  const SettingItem = ({ icon: Icon, title, value, onPress }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Icon size={18} color="#FFF" />
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        <ChevronRight size={18} color="rgba(255, 255, 255, 0.4)" />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#820AD1', '#4C0677']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <Text style={styles.headerSubtitle}>Configure sua experiência</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <View style={styles.card}>
              <SettingItem 
                icon={User} 
                title="Perfil" 
                value={user?.name || 'Visitante'} 
              />
              <SettingItem 
                icon={Shield} 
                title="Meu Plano" 
                value={isPremium ? 'PREMIUM' : 'FREE'} 
                onPress={() => !isPremium && router.push('/plans')}
              />
              
              {flags?.showUpgradeAd && (
                <SettingItem 
                  icon={Zap} 
                  title="Planos & Assinatura" 
                  onPress={() => router.push('/plans')}
                />
              )}

              <SettingItem icon={Bell} title="Notificações" value="Ativadas" />
              
              <SettingItem 
                icon={Star} 
                title="Meu Progresso" 
                onPress={() => router.push('/progress')} 
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.betaHeader}>
              <Text style={styles.sectionTitle}>BETA EXPERIMENTAL</Text>
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>NOVO</Text>
              </View>
            </View>
            <View style={[styles.card, styles.betaCard]}>
              <SettingItem 
                icon={Glasses} 
                title="Meditação VR" 
                value="Explorar"
                onPress={() => Alert.alert(
                  'Acalmo VR (Beta)', 
                  'Esta funcionalidade exige o Acalmo VR Box ou um dispositivo compatível (Vision Pro/Quest) para meditação em 360° imersiva.',
                  [
                    { text: 'Depois', style: 'cancel' },
                    { text: 'Testar Agora', onPress: () => router.push('/vr-player') }
                  ]
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suporte</Text>
            <View style={styles.card}>
              <SettingItem icon={CircleHelp} title="Ajuda & FAQ" />
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FF4B4B" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
          
          <Text style={styles.version}>Acalmo v1.0.0</Text>
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
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  betaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 5,
  },
  betaBadge: {
    backgroundColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  betaBadgeText: {
    color: '#064E3B',
    fontSize: 9,
    fontWeight: '900',
  },
  betaCard: {
    borderColor: 'rgba(134, 239, 172, 0.3)',
    backgroundColor: 'rgba(134, 239, 172, 0.05)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    padding: 18,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.2)',
  },
  logoutText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginTop: 30,
  },
});
