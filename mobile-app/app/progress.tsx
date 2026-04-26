import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Clock, BarChart2, Star, TrendingUp, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getProgress, getFeelingStats } from '../services/db';
import { useAudio } from '../context/AudioContext';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const router = useRouter();
  const { points, stars, totalMinutes } = useAudio();
  const [feelingStats, setFeelingStats] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getFeelingStats();
      setFeelingStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const getWeeklySummary = () => {
    if (feelingStats.length === 0) return "Inicie sua jornada hoje para ver seu panorama semanal.";
    const topFeeling = feelingStats[0].feeling;
    return `Nesta semana, você buscou mais acolhimento para ${topFeeling}. Continue praticando para manter o equilíbrio.`;
  };

  return (
    <LinearGradient colors={['#820AD1', '#4C0677']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Progresso</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Trophy size={24} color="#FFD700" fill="#FFD700" />
              <Text style={styles.statValue}>{points}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statCard}>
              <Star size={24} color="#FFD700" fill="#FFD700" />
              <Text style={styles.statValue}>{stars}</Text>
              <Text style={styles.statLabel}>Estrelas</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={24} color="#FFF" />
              <Text style={styles.statValue}>{totalMinutes}</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
          </View>

          {/* Weekly Analysis */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#86EFAC" />
              <Text style={styles.sectionTitle}>ANÁLISE DA SEMANA</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{getWeeklySummary()}</Text>
            </View>
          </View>

          {/* Panorama Mental */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart2 size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>PANORAMA MENTAL</Text>
            </View>
            <View style={styles.panoramaCard}>
              {feelingStats.length > 0 ? (
                feelingStats.slice(0, 5).map((stat, index) => {
                  const maxCount = feelingStats[0].count;
                  const widthPercent = (stat.count / maxCount) * 100;
                  return (
                    <View key={index} style={styles.statRow}>
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabelText}>{stat.feeling}</Text>
                        <Text style={styles.statCountText}>{stat.count}x</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${widthPercent}%` }]} />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Sem dados suficientes para análise.</Text>
              )}
            </View>
          </View>

          {/* Suggestion Card */}
          <TouchableOpacity style={styles.suggestionCard} onPress={() => router.push('/')}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.suggestionGradient}
            >
              <Calendar size={24} color="#FFF" />
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>Mantenha a Constância</Text>
                <Text style={styles.suggestionDesc}>Praticar apenas 5 minutos por dia melhora seu panorama mental.</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    width: (width - 60) / 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(134, 239, 172, 0.1)',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.2)',
  },
  summaryText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  panoramaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRow: {
    marginBottom: 15,
  },
  statInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabelText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statCountText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingVertical: 10,
  },
  suggestionCard: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  suggestionContent: {
    marginLeft: 15,
    flex: 1,
  },
  suggestionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 2,
  },
});
