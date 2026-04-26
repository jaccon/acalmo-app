import React from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Clock, CheckCircle2, XCircle, Trophy, TrendingUp, Hash } from 'lucide-react-native';
import { getHistory, getRanking, initDb } from '../../services/db';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryScreen() {
  const [history, setHistory] = React.useState<any[]>([]);
  const [ranking, setRanking] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await initDb();
      
      const histData = await getHistory();
      setHistory(histData || []);
      
      try {
        const rankData = await getRanking();
        setRanking(rankData || []);
      } catch (e) {
        console.warn('[History] Erro ao carregar ranking:', e);
        setRanking([]);
      }
    } catch (error) {
      console.error('[History] Erro fatal ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRankingItem = (item: any, index: number) => (
    <View key={index} style={styles.rankCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankTitle} numberOfLines={1}>{item.title || 'Meditação'}</Text>
        <Text style={styles.rankCount}>{item.count || 0} {item.count === 1 ? 'execução' : 'execuções'}</Text>
      </View>
      {index === 0 && <Trophy size={22} color="#FFD700" fill="#FFD700" />}
      {index === 1 && <Trophy size={18} color="#C0C0C0" fill="#C0C0C0" />}
      {index === 2 && <Trophy size={16} color="#CD7F32" fill="#CD7F32" />}
    </View>
  );

  const renderHistoryItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.completed ? (
          <CheckCircle2 size={20} color="#10B981" />
        ) : (
          <XCircle size={20} color="#EF4444" />
        )}
      </View>
      <View style={styles.cardFooter}>
        <Clock size={14} color="rgba(255, 255, 255, 0.6)" />
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={[styles.statusText, { color: item.completed ? '#10B981' : '#EF4444' }]}>
          {item.completed ? 'Concluída' : 'Interrompida'}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#820AD1', '#4C0677']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {loading && history.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.headerContent}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Histórico</Text>
                  <Text style={styles.headerSubtitle}>Sua jornada em números</Text>
                </View>

                {ranking.length > 0 ? (
                  <View style={styles.rankingSection}>
                    <View style={styles.sectionHeader}>
                      <TrendingUp size={20} color="#FFF" />
                      <Text style={styles.sectionTitle}>Ranking: Top 5</Text>
                    </View>
                    <View style={styles.rankingContainer}>
                      {ranking.map((item, index) => renderRankingItem(item, index))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.rankingSection}>
                    <View style={styles.sectionHeader}>
                      <TrendingUp size={20} color="#FFF" />
                      <Text style={styles.sectionTitle}>Ranking: Top 5</Text>
                    </View>
                    <View style={styles.rankingContainer}>
                      <Text style={styles.emptyRankingText}>O ranking aparecerá conforme você meditar.</Text>
                    </View>
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <Clock size={20} color="#FFF" />
                  <Text style={styles.sectionTitle}>Sessões Recentes</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma meditação realizada ainda.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingBottom: 10,
  },
  header: {
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
  rankingSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  rankingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankBadge: {
    width: 38,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#820AD1',
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rankCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  emptyRankingText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  listContainer: {
    paddingBottom: 120,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
  },
});
