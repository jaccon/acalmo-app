import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, Dimensions, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Heart, Repeat, Shuffle, Cast } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudio } from '../../context/AudioContext';
import { addPoints, saveHistory, toggleFavorite, isFavorite as checkFavorite } from '../../services/db';
import { processMeditationCompletion, RewardResult } from '../../services/rewardService';
import { trackMinutes, syncWithServer } from '../../services/statsService';
import { getRandomQuote } from '../../services/db';
import RewardModal from '../../components/RewardModal';
import { Animated } from 'react-native';
import CastModal from '../../components/CastModal';

const { width, height } = Dimensions.get('window');

export default function MeditationPlayer() {
  const params = useLocalSearchParams();
  const { id, title, url, image, duration: initialDuration } = params;
  
  const { setCurrentTrack, refreshProgress, user, skipCount, incrementSkipCount, resetSkipCount, addMinutes } = useAudio();
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const quoteFade = React.useRef(new Animated.Value(0)).current;
  const imageScale = React.useRef(new Animated.Value(1)).current;
  
  const cycleQuote = async () => {
    // Fade out
    Animated.timing(quoteFade, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(async () => {
      const nextQuote = await getRandomQuote();
      setCurrentQuote(nextQuote);
      // Fade in
      Animated.timing(quoteFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    cycleQuote();
    const interval = setInterval(cycleQuote, 30000);

    // Ken Burns Effect (Ritmo de Respiração - 5s cada fase)
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageScale, {
          toValue: 1.1, // Zoom leve para "inspirar"
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1, // Volta ao normal para "expirar"
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);
  
  const progressRef = React.useRef({ max: 0, duration: 0, lastMinuteTracked: 0, processed: false });

  useEffect(() => {
    loadAudio();
    checkIfFavorite();

    if (id && title && url) {
      setCurrentTrack({
        id: id as string,
        title: title as string,
        url: url as string,
        image: image as string,
      });
    }

    // Lógica de Detecção de Ansiedade (Pular mais de 5 músicas)
    incrementSkipCount();
    if (skipCount >= 5) {
      resetSkipCount(); // Zera o contador após mostrar a mensagem
      Alert.alert(
        'Fique calmo, relaxe...',
        'Deixe a ansiedade de lado. Tente ouvir esta meditação por pelo menos um minuto para sentir os benefícios.',
        [{ text: 'Vou tentar', onPress: () => {} }]
      );
    }

    return () => {
      const { max, duration, processed } = progressRef.current;
      if (max > 0 && duration > 0 && !processed) {
        const progressRatio = max / duration;
        const isCompleted = progressRatio > 0.95;
        
        if (isCompleted) {
          processMeditationCompletion(id as string, title as string).then(result => {
            if (result && result.pointsEarned > 0) {
              refreshProgress();
            }
          });
        } else {
          saveHistory(id as string, title as string, false).catch(console.error);
        }

        // Força sincronização ao sair do player
        if (user?.id) {
          syncWithServer(user.id);
        }
      }
      
      // Cleanup definitivo do som
      if (soundRef.current) {
        const s = soundRef.current;
        soundRef.current = null;
        console.log('[Player] Unmount: Finalizando áudio.');
        s.stopAsync().then(() => s.unloadAsync()).catch(e => console.warn('Erro unmount:', e));
      }
    };
  }, [url]);

  // Bloqueio de Navegação: Para o som assim que a tela perde o foco
  useFocusEffect(
    useCallback(() => {
      // Quando a tela ganha foco, não faz nada (o useEffect já carrega o áudio)
      return () => {
        if (soundRef.current) {
          const s = soundRef.current;
          soundRef.current = null; // Limpa a ref imediatamente
          console.log('[Player] Parando áudio e limpando recursos.');
          s.stopAsync().then(() => s.unloadAsync()).catch(e => console.warn('Erro ao limpar som:', e));
        }
      };
    }, [])
  );

  const checkIfFavorite = async () => {
    if (id) {
      const fav = await checkFavorite(id as string);
      setIsFavorite(fav);
    }
  };

  const handleToggleFavorite = async () => {
    const newState = await toggleFavorite({
      id, title, url, image, duration: initialDuration
    });
    setIsFavorite(newState);
  };

  const handleCast = () => {
    setShowCastModal(true);
  };

  async function loadAudio() {
    try {
      console.log('[Player] Carregando URL:', url);
      setIsLoading(true);
      
      if (soundRef.current) {
        const s = soundRef.current;
        soundRef.current = null;
        await s.stopAsync().catch(() => {});
        await s.unloadAsync().catch(() => {});
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url as string },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = newSound;
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('[Player] Erro ao carregar som:', error);
      setIsLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar o áudio desta meditação.');
    }
  }

   const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish && !progressRef.current.processed) {
        progressRef.current.processed = true;
        handleCompletion();
      }

      const currentMinute = Math.floor(status.positionMillis / 60000);
      if (currentMinute > progressRef.current.lastMinuteTracked) {
        const minutesToAdd = currentMinute - progressRef.current.lastMinuteTracked;
        console.log(`[Player] Adicionando ${minutesToAdd} minuto(s) ao progresso.`);
        addMinutes(minutesToAdd);
        
        // Sincronização em lote com o servidor
        if (user?.id) {
          trackMinutes(user.id, minutesToAdd);
        }
        
        progressRef.current.lastMinuteTracked = currentMinute;
      }

      if (status.positionMillis > progressRef.current.max) {
        progressRef.current.max = status.positionMillis;
      }
      if (status.durationMillis) {
        progressRef.current.duration = status.durationMillis;
      }

      // Se ouviu mais de 20 segundos, resetamos o contador de "pulos" de ansiedade
      if (status.positionMillis > 20000 && skipCount > 0) {
        resetSkipCount();
      }
    }
  };

  const handleCompletion = async () => {
    const result = await processMeditationCompletion(id as string, title as string);
    if (result && result.pointsEarned > 0) {
      setReward(result);
      setShowRewardModal(true);
      refreshProgress();
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Animated.Image 
          source={{ uri: image as string }} 
          resizeMode="cover"
          style={[styles.backgroundImage, { transform: [{ scale: imageScale }] }]} 
        />
      </View>
      
      <LinearGradient
        colors={['transparent', 'rgba(130, 10, 209, 0.4)', '#820AD1']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <ChevronLeft size={28} color="#FFF" />
              </TouchableOpacity>
              
              <View style={styles.headerRightControls}>
                <TouchableOpacity onPress={handleCast} style={[styles.headerButton, { marginRight: 10 }]}>
                  <Cast size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
                  <Heart size={24} color={isFavorite ? '#FF4B4B' : '#FFF'} fill={isFavorite ? '#FF4B4B' : 'transparent'} />
                </TouchableOpacity>
              </View>
            </View>
 
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.author}>Acalmo Originals</Text>
              <Animated.View style={[styles.quoteContainer, { opacity: quoteFade }]}>
                <Text style={styles.quoteText}>{currentQuote}</Text>
              </Animated.View>
            </View>
 
            <View style={styles.controlsContainer}>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>
 
              <View style={styles.mainControls}>
                <TouchableOpacity>
                  <Shuffle size={24} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()}>
                  <SkipBack size={36} color="#FFF" fill="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                  {isLoading ? (
                    <ActivityIndicator color="#820AD1" />
                  ) : (
                    isPlaying ? <Pause size={40} color="#820AD1" fill="#820AD1" /> : <Play size={40} color="#820AD1" fill="#820AD1" />
                  )}
                </TouchableOpacity>
 
                <TouchableOpacity onPress={() => router.back()}>
                  <SkipForward size={36} color="#FFF" fill="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Repeat size={24} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
      </LinearGradient>

      {reward && (
        <RewardModal
          visible={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          points={reward.pointsEarned}
          milestone={reward.milestoneValue}
          title={title as string}
          currentPoints={reward.currentPoints}
          currentStars={reward.currentStars}
        />
      )}

      <CastModal 
        visible={showCastModal} 
        onClose={() => setShowCastModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#820AD1',
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden', // Importante para não vazar o zoom
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: height * 0.1, // Move text higher up
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  author: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    marginTop: 15,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  quoteContainer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  quoteText: {
    fontSize: 22,
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '300',
    lineHeight: 30,
    opacity: 0.9,
  },
  controlsContainer: {
    paddingBottom: 40, // Reduced bottom padding to stay closer to footer
    paddingHorizontal: 10,
    justifyContent: 'flex-end',
  },
  progressBarWrapper: {
    marginBottom: 30,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 10,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginLeft: 10,
  },
});
