import React from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions, Platform, Animated, Modal, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Clock, Star, Circle, X, Trophy, User as UserIcon, ChevronRight, Zap, Download, CheckCircle, Bell, Wind, ShieldAlert, CloudRain, Lightbulb, Compass, Smile, Eye, Sparkles } from 'lucide-react-native';
import { useAudio } from '../../context/AudioContext';
import { claimReward, logFeelingClick } from '../../services/db';
import Config from '../../constants/Config';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Lista estática removida, agora usamos dados da API

const FEELS = [
  { id: 'todas', label: 'Todas', icon: Star, color: '#FFF' },
  { id: 'relax', label: 'Ansiedade', icon: Wind, color: '#A5F3FC' },
  { id: 'foco', label: 'Controle', icon: Compass, color: '#86EFAC' },
  { id: 'motivacional', label: 'Motivacional', icon: Zap, color: '#FDBA74' },
  { id: 'inspiracao', label: 'Inspiração', icon: Lightbulb, color: '#FDE047' },
  { id: 'depressao', label: 'Depressão', icon: CloudRain, color: '#93C5FD' },
  { id: 'autoestima', label: 'Auto Estima', icon: Smile, color: '#F9A8D4' },
  { id: 'medo', label: 'Medo', icon: ShieldAlert, color: '#FDA4AF' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, points, stars, totalMinutes, uniqueCount, rewardClaimed, refreshProgress, flags, refreshFlags, refreshUser } = useAudio();
  const [showReward, setShowReward] = React.useState(false);
  const [musics, setMusics] = React.useState<any[]>([]);
  const [filteredMusics, setFilteredMusics] = React.useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedFeelingTag, setSelectedFeelingTag] = React.useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = React.useState<string[]>([]);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const borderPulse = React.useRef(new Animated.Value(0)).current;

  const handleDownload = async (item: any) => {
    // 1. Verificar se a feature flag está ativa (já verificado na renderização, mas bom reforçar)
    if (!flags?.showUpgradeAd) return;

    // 2. Verificar se o usuário é Premium
    const isPremium = user?.plan_id?.toLowerCase() === 'premium';
    
    if (!isPremium) {
      Alert.alert(
        'Recurso Premium 🔒',
        'O download offline é um recurso exclusivo para assinantes Premium. Leve suas meditações para qualquer lugar!',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Ver Planos ✨', onPress: () => router.push('/plans') }
        ]
      );
      return;
    }

    // 3. Lógica de Download para Premium
    try {
      setDownloadingIds(prev => [...prev, item.id.toString()]);
      const filename = `${item.id}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadRes = await FileSystem.downloadAsync(item.content, fileUri);
      
      if (downloadRes.status === 200) {
        Alert.alert('Sucesso', `"${item.title}" baixada para ouvir offline!`);
      }
    } catch (error) {
      console.error('[Download] Erro:', error);
      Alert.alert('Erro', 'Não foi possível baixar a meditação.');
    } finally {
      setDownloadingIds(prev => prev.filter(id => id !== item.id.toString()));
    }
  };

  const fetchMusics = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${Config.API_URL}/api/musics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        // Sanitiza as URLs que podem estar com IP local no banco de dados de produção
        const sanitizedData = data.map((m: any) => ({
          ...m,
          content: m.content?.replace('http://172.16.0.105:8712', Config.API_URL),
          thumbnail: m.thumbnail?.replace('http://172.16.0.105:8712', Config.API_URL)
        }));
        setMusics(sanitizedData);
      }
    } catch (error) {
      console.error('[Home] Erro ao buscar músicas:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFeelingPress = async (feeling: any) => {
    if (feeling.id === 'todas') {
      setSelectedFeelingTag(null);
    } else if (selectedFeelingTag === feeling.id) {
      setSelectedFeelingTag(null);
    } else {
      setSelectedFeelingTag(feeling.id);
      await logFeelingClick(feeling.label);
    }
  };

  const onRefresh = React.useCallback(() => {
    refreshProgress();
    refreshFlags();
    refreshUser();
    fetchMusics();
  }, []);

  React.useEffect(() => {
    console.log('[Filter] Aplicando filtro:', selectedFeelingTag, 'Total Musics:', musics.length);
    if (selectedFeelingTag && selectedFeelingTag !== 'todas') {
      const filtered = musics.filter((m: any) => String(m.category_id) === String(selectedFeelingTag));
      console.log('[Filter] Itens encontrados:', filtered.length);
      setFilteredMusics(filtered);
    } else {
      setFilteredMusics(musics);
    }
  }, [musics, selectedFeelingTag]);

  useFocusEffect(
    React.useCallback(() => {
      refreshProgress();
      refreshFlags();
      if (user?.id) {
        refreshUser();
      }
      fetchMusics(true); // Silencioso ao focar
    }, [user?.id])
  );

  React.useEffect(() => {
    if (!rewardClaimed) {
      setShowReward(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }

    // Animação de borda pulsante para o card de progresso
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [rewardClaimed]);

  const handleClaim = async () => {
    await claimReward();
    await refreshProgress();
    setShowReward(false);
  };

  const [selectedFeeling, setSelectedFeeling] = React.useState<number | null>(null);
  const [moodSaved, setMoodSaved] = React.useState(false);

  const getPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    return 'Noite';
  };

  const handleMoodSelection = async (index: number) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Você precisa estar logado para salvar seu humor.');
      return;
    }

    const feelings = ['Muito Triste', 'Triste', 'Neutro', 'Feliz', 'Muito Feliz'];
    const period = getPeriod();
    const token = await SecureStore.getItemAsync('userToken');

    try {
      const response = await fetch(`${Config.API_URL}/api/feelings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          feeling: feelings[index],
          period: period
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMoodSaved(true);
        setSelectedFeeling(index);
        Alert.alert('Sucesso', `Seu humor de ${period} foi registrado!`);
      } else {
        Alert.alert('Aviso', data.error || 'Erro ao salvar humor.');
      }
    } catch (error) {
      console.error('[Mood] Erro:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
  };
  // renderItem agora é inline no FlatList abaixo

  const HeroHeader = React.useMemo(() => () => {
    const isPremium = user?.plan_id?.toLowerCase() === 'premium';
    
    return (
      <View style={styles.heroContainer}>
        <View style={styles.header}>
          <View style={styles.userSection}>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.8}
              style={styles.avatarWrapper}
            >
              <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=820AD1&color=fff` }} 
                style={[styles.avatar, isPremium && styles.premiumAvatar]} 
              />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Olá,</Text>
              <Text style={styles.username}>{user?.name || 'Visitante'}</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.planBadge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
              <Text 
                style={[styles.planText, isPremium ? styles.premiumPlanText : styles.freePlanText]}
                numberOfLines={1}
              >
                {isPremium ? 'PREMIUM' : 'FREE'}
              </Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell color="#FFF" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.progressCard, 
            { 
              borderColor: borderPulse.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 215, 0, 0.6)']
              }),
              borderWidth: 1.5
            }
          ]}
        >
          <Text style={styles.featuredTag}>MEU PROGRESSO</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <View style={styles.progressIconCircle}>
                <Trophy size={18} color="#FFD700" fill="#FFD700" />
              </View>
              <View>
                <Text style={styles.progressValue}>{points}</Text>
                <Text style={styles.progressLabel}>Pontos</Text>
              </View>
            </View>
            
            <View style={styles.progressDivider} />
            
            <View style={styles.progressItem}>
              <View style={[styles.progressIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Clock size={18} color="#FFF" />
              </View>
              <View>
                <Text style={styles.progressValue}>{totalMinutes}</Text>
                <Text style={styles.progressLabel}>Minutos</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.historyLink} 
            onPress={() => router.push('/progress')}
          >
            <Text style={styles.historyLinkText}>Visualizar meu progresso</Text>
            <ChevronRight size={16} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* VR Experience Banner */}
        <TouchableOpacity 
          style={styles.vrBanner}
          onPress={() => router.push('/vr-player')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#820AD1', '#9D4EDD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vrGradient}
          >
            <View style={styles.vrContent}>
              <View style={styles.vrTextContainer}>
                <View style={styles.betaBadge}>
                  <Sparkles size={10} color="#86EFAC" />
                  <Text style={styles.betaText}>EXPERIMENTAL</Text>
                </View>
                <Text style={styles.vrTitle}>ACALMO VR Mode</Text>
                <Text style={styles.vrSubtitle}>Explore meditações em 360°</Text>
              </View>
              <View style={styles.vrIconContainer}>
                <Eye size={32} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.moodSection}>
          <Text style={styles.featuredTag}>COMO ESTOU ME SENTINDO AGORA?</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.feelsScroll}
          >
            {FEELS.map((feel) => (
              <TouchableOpacity
                key={feel.id}
                style={[
                  styles.feelItem,
                  selectedFeelingTag === feel.id && { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: feel.color }
                ]}
                onPress={() => handleFeelingPress(feel)}
              >
                <View style={[styles.feelIconCircle, { backgroundColor: feel.color + '20' }]}>
                  <feel.icon size={24} color={feel.color} />
                </View>
                <Text style={styles.feelLabel}>{feel.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meditações para você</Text>
        </View>
      </View>
    );
  }, [user, points, totalMinutes, selectedFeeling, flags]);

  const isPremium = user?.plan_id?.toLowerCase() === 'premium';
  const totalPoints = (stars || 0) * 100 + (points || 0);
  const unlockedCount = isPremium ? musics.length : Math.min(10, 1 + Math.floor(totalPoints / 50));

  return (
    <LinearGradient
      colors={['#820AD1', '#4C0677']}
      style={styles.container}
    >
      <ExpoImage 
        source={require('../../assets/images/logo.svg')} 
        style={styles.bgLogo}
        contentFit="contain"
      />
      <FlatList
        data={filteredMusics}
        renderItem={({ item, index }) => {
          const isLocked = !isPremium && index >= unlockedCount;
          
          return (
            <>
              <TouchableOpacity 
                style={[styles.card, isLocked && styles.cardLocked]}
                activeOpacity={isLocked ? 1 : 0.7}
                onPress={() => {
                  if (isLocked) {
                    Alert.alert(
                      'Meditação Bloqueada',
                      `Ganhe mais ${(index * 50) - totalPoints} pontos para desbloquear esta meditação!\n\nVocê desbloqueia uma nova meditação a cada 50 pontos, ou pode desbloquear tudo IMEDIATAMENTE clicando em Upgrade.`,
                      [
                        { text: 'Depois', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => router.push('/plans') }
                      ]
                    );
                    return;
                  }
                  router.push({
                    pathname: `/meditation/${item.id}`,
                    params: { 
                      title: item.title, 
                      url: item.content, 
                      image: item.thumbnail || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
                    }
                  });
                }}
              >
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800' }} style={styles.cardImage} />
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <Star size={32} color="#FFD700" fill="#FFD700" />
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.category}>
                      {FEELS.find(f => f.id === item.category_id)?.label || 'Meditação'}
                    </Text>
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <Text style={styles.lockBadgeText}>{(index * 50)} pts</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardInfo}>
                      <Clock size={14} color="#FFF" />
                      <Text style={styles.infoText}>{item.duration || '5 min'}</Text>
                    </View>
                    
                    {!isLocked && flags?.showUpgradeAd && (
                      <TouchableOpacity 
                        style={styles.downloadButton} 
                        onPress={() => handleDownload(item)}
                        disabled={downloadingIds.includes(item.id.toString())}
                      >
                        {downloadingIds.includes(item.id.toString()) ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          isPremium ? (
                            <Download size={20} color="#FFF" />
                          ) : (
                            <View style={styles.lockedDownload}>
                              <Download size={16} color="rgba(255, 255, 255, 0.4)" />
                              <Star size={10} color="#FFD700" fill="#FFD700" style={styles.miniLock} />
                            </View>
                          )
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

            {(index + 1) % 6 === 0 && flags?.showUpgradeAd && user?.plan_id?.toLowerCase() !== 'premium' && (
              <LinearGradient
                colors={['#820AD1', '#E91E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, styles.adCardGradient]}
              >
                <View style={styles.adContent}>
                  <View style={styles.adHeader}>
                    <View style={styles.adBadge}>
                      <Zap size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.adBadgeText}>OFERTA LIMITADA</Text>
                    </View>
                    <Text style={styles.adPrice}>R$ 14,90/mês</Text>
                  </View>
                  
                  <Text style={styles.adMainTitle}>Tenha noites de sono inesquecíveis</Text>
                  <Text style={styles.adSubTitle}>Desbloqueie downloads offline, meditações exclusivas e remova todos os anúncios.</Text>
                  
                  <TouchableOpacity 
                    style={styles.adCTA}
                    onPress={() => router.push('/plans')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.adCTAText}>QUERO SER PREMIUM</Text>
                    <ChevronRight size={18} color="#820AD1" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}
          </>
        );
      }}
      keyExtractor={item => item.id.toString()}
        ListHeaderComponent={HeroHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <CloudRain size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyListText}>Ainda não temos meditações para este sentimento.</Text>
            <TouchableOpacity style={styles.emptyListButton} onPress={() => setSelectedFeelingTag(null)}>
              <Text style={styles.emptyListButtonText}>Ver todas as meditações</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="#FFF"
            colors={['#820AD1']} // Android
          />
        }
      />
      <Modal
        visible={showReward}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.rewardCard, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#7C3AED', '#4C1D95']}
              style={styles.rewardGradient}
            >
              <Star size={80} color="#FFD700" fill="#FFD700" />
              <Text style={styles.rewardTitle}>Boas-vindas!</Text>
              <Text style={styles.rewardText}>Você ganhou 10 pontos de presente por começar sua jornada.</Text>
              <TouchableOpacity style={styles.claimButton} onPress={handleClaim}>
                <Text style={styles.claimButtonText}>Imersão Total</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLogo: {
    position: 'absolute',
    width: '160%',
    height: '100%',
    opacity: 0.02,
    alignSelf: 'center',
    top: 100,
  },
  listContainer: {
    paddingBottom: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  heroContainer: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 35,
    marginTop: Platform.OS === 'ios' ? 15 : 30,
    paddingHorizontal: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  profileButton: {
    elevation: 4,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  profilePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 30,
    marginBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumAvatar: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 75,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  freeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    borderColor: '#FFF',
  },
  planText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  freePlanText: {
    color: '#FFF',
  },
  premiumPlanText: {
    color: '#820AD1',
  },
  welcome: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginTop: -2,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  vrBanner: {
    margin: 20,
    marginTop: 10,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#820AD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  vrGradient: {
    padding: 20,
  },
  vrContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vrTextContainer: {
    flex: 1,
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 5,
  },
  betaText: {
    color: '#86EFAC',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  vrTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vrSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  vrIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
  },
  notificationBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  flatList: {
    flex: 1,
  },
  historyLinkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 5,
  },
  carousel: {
    marginBottom: 10,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 20,
    width: CARD_WIDTH,
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 160,
    justifyContent: 'center',
  },
  featuredTag: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  moodSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  adCardGradient: {
    padding: 0,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 8,
    shadowColor: '#820AD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  adContent: {
    padding: 20,
  },
  adBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
  },
  adPrice: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  adMainTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    lineHeight: 28,
  },
  adSubTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  adCTA: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adCTAText: {
    color: '#820AD1',
    fontWeight: '900',
    fontSize: 15,
    marginRight: 6,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  emojiButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emojiSelected: {
    backgroundColor: '#820AD1',
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 32,
  },
  feelsScroll: {
    paddingRight: 20,
    marginTop: 10,
  },
  feelItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    width: 90,
  },
  feelIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  feelLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  adButtonText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 16,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 25,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardImageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 18,
    marginRight: 15,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  lockBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  category: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#FFF',
    fontSize: 13,
    marginLeft: 5,
    fontWeight: '600',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockedDownload: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miniLock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    padding: 1,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCard: {
    width: width * 0.85,
    borderRadius: 30,
    overflow: 'hidden',
  },
  rewardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  rewardTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  rewardText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  claimButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  claimButtonText: {
    color: '#820AD1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyListContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyListButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyListButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
