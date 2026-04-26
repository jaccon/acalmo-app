import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { DeviceMotion } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAudio } from '../context/AudioContext';
import Config from '../constants/Config';

const { width, height } = Dimensions.get('window');

// Componente para um "Olho" do VR
const VREye = ({ videoUrl, translateX, translateY, onVideoLoad }: any) => (
  <View style={styles.eyeContainer}>
    <Animated.View style={[
      styles.videoWrapper,
      {
        transform: [
          { translateX: translateX },
          { translateY: translateY },
          { scale: 0.7 } // GRANDE ANGULAR: Visão muito mais distante e espaçosa
        ]
      }
    ]}>
      <Video
        source={{ uri: videoUrl }}
        rate={0.7}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
        onLoad={onVideoLoad}
        style={styles.video}
      />
    </Animated.View>
    <View style={styles.eyeUI}>
      <View style={styles.vrBadgeMini}>
        <Text style={styles.vrBadgeText}>ACALMO VR</Text>
      </View>
    </View>
  </View>
);

export default function VRPlayerScreen() {
  const router = useRouter();
  const { addMinutes } = useAudio();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [vrVideoUrl, setVrVideoUrl] = useState(`${Config.API_URL}/uploads/videos/vr01.mp4`);
  const [meditationAudioUrl, setMeditationAudioUrl] = useState<string | null>(null);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startVR = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        
        // Sensores
        DeviceMotion.setUpdateInterval(16);
        const sub = DeviceMotion.addListener((data) => {
          if (data.rotation && isMounted) {
            const { gamma, beta } = data.rotation;
            translateX.setValue(beta * (width * 0.45));
            translateY.setValue((gamma + 1) * (height * 0.45));
          }
        });

        // Buscar Áudio da API
        const response = await fetch(`${Config.API_URL}/api/musics`).catch(() => null);
        if (response && isMounted) {
          const data = await response.json();
          const musicList = Array.isArray(data) ? data : (data.musics || []);
          const meditations = musicList.filter((m: any) => m.category_id !== 'vr');
          
          if (meditations.length > 0) {
            const randomMusic = meditations[Math.floor(Math.random() * meditations.length)];
            console.log('[VR] Áudio selecionado:', randomMusic.content);
            setMeditationAudioUrl(randomMusic.content);
          } else {
            // Backup se não houver meditações
            setMeditationAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
          }
        }

        return () => sub.remove();
      } catch (e) {
        console.error('VR Error:', e);
      }
    };

    startVR();

    return () => {
      isMounted = false;
      ScreenOrientation.unlockAsync();
      DeviceMotion.removeAllListeners();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Iniciar timer de progresso quando o vídeo carregar
  useEffect(() => {
    if (isVideoReady && !timerRef.current) {
      timerRef.current = setInterval(() => addMinutes(1), 60000);
      setIsLoading(false);
    }
  }, [isVideoReady]);

  return (
    <View style={styles.container}>
      <View style={styles.vrLayout}>
        <VREye 
          videoUrl={vrVideoUrl} 
          translateX={translateX} 
          translateY={translateY} 
          onVideoLoad={() => setIsVideoReady(true)} 
        />
        <View style={styles.divider} />
        <VREye 
          videoUrl={vrVideoUrl} 
          translateX={translateX} 
          translateY={translateY} 
          onVideoLoad={() => setIsVideoReady(true)} 
        />
      </View>

      {/* PLAYER DE ÁUDIO OCULTO (Nuclear Option): Usamos um componente de vídeo para o som */}
      {meditationAudioUrl && isVideoReady && (
        <Video
          source={{ uri: meditationAudioUrl }}
          shouldPlay
          isLooping
          volume={1.0}
          style={{ width: 0, height: 0, position: 'absolute' }}
        />
      )}

      <View style={styles.overlay}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#820AD1" />
          <Text style={styles.loaderText}>Sincronizando imersão VR...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  vrLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  eyeContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 2,
    backgroundColor: '#000',
    height: '100%',
  },
  videoWrapper: {
    position: 'absolute',
    width: '180%',
    height: '180%',
  },
  video: {
    flex: 1,
  },
  eyeUI: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  vrBadgeMini: {
    backgroundColor: 'rgba(130, 10, 209, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  vrBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderText: {
    color: '#FFF',
    marginTop: 20,
    fontWeight: '600',
  }
});
