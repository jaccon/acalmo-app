import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import { getProgress, getUniqueCompletionsCount, addMinutes as addMinutesDb } from '../services/db';
import Config from '../constants/Config';

type Track = {
  id: string;
  title: string;
  url: string;
  image: string;
};

type UserData = {
  id: number;
  name: string;
  avatar: string | null;
  plan_id: string;
};

type AudioContextType = {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track) => void;
  user: UserData | null;
  setUser: (user: UserData) => void;
  points: number;
  stars: number;
  totalMinutes: number;
  rewardClaimed: boolean;
  uniqueCount: number;
  skipCount: number;
  flags: any;
  refreshProgress: () => Promise<void>;
  refreshFlags: () => Promise<void>;
  refreshUser: () => Promise<void>;
  incrementSkipCount: () => void;
  resetSkipCount: () => void;
  logout: () => Promise<void>;
  addMinutes: (amount: number) => Promise<void>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [flags, setFlags] = useState({ showUpgradeAd: false });

  const logout = async () => {
    try {
      console.log('[Auth] Executando logout...');
      let SStore = SecureStore;
      
      // Fallback robusto para casos onde o import estático falha no bundle
      if (!SStore || typeof SStore.deleteItemAsync !== 'function') {
        try {
          SStore = require('expo-secure-store');
        } catch (e) {
          console.warn('[Auth] Falha ao carregar SecureStore via require');
        }
      }

      if (SStore && typeof SStore.deleteItemAsync === 'function') {
        await SStore.deleteItemAsync('userToken');
      } else {
        console.warn('[Auth] SecureStore não disponível, limpando apenas estado local');
      }
      
      setUser(null);
      console.log('[Auth] Logout concluído.');
    } catch (e) {
      console.error('[Logout] Erro crítico:', e);
    }
  };

  const incrementSkipCount = () => setSkipCount(prev => prev + 1);
  const resetSkipCount = () => setSkipCount(0);

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${Config.API_URL}/api/users/${user.id}`);
      const data = await response.json();
      if (data.id) {
        setUser({
          id: data.id,
          name: data.name || data.username,
          avatar: data.avatar || null,
          plan_id: data.plan_id || 'free'
        });
      }
    } catch (error) {
      console.warn('[User] Erro ao atualizar dados do usuário:', error);
    }
  };

  const refreshFlags = async () => {
    try {
      const response = await fetch(`${Config.API_URL}/api/v1/flags`);
      const data = await response.json();
      setFlags(data);
    } catch (error) {
      console.warn('[Flags] Erro ao buscar feature flags:', error);
    }
  };

  const addMinutes = async (amount: number) => {
    try {
      await addMinutesDb(amount);
      setTotalMinutes(prev => prev + amount);
    } catch (e) {
      console.warn('[Progress] Erro ao adicionar minutos:', e);
    }
  };

  const refreshProgress = async () => {
    try {
      const data = await getProgress();
      const count = await getUniqueCompletionsCount();
      setPoints(data?.points || 0);
      setStars(data?.stars || 0);
      setTotalMinutes(data?.total_minutes || 0);
      setUniqueCount(count || 0);
      setRewardClaimed(data?.reward_claimed === 1);
    } catch (e) {
      console.warn("DB refresh error:", e);
    }
  };

  useEffect(() => {
    refreshProgress();
    
    // Configura o áudio globalmente para garantir som mesmo no silencioso (iOS)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  return (
    <AudioContext.Provider value={{ 
      currentTrack, 
      setCurrentTrack, 
      user,
      setUser,
      points, 
      stars, 
      totalMinutes,
      uniqueCount,
      skipCount,
      rewardClaimed, 
      flags,
      refreshProgress,
      refreshFlags,
      refreshUser,
      incrementSkipCount,
      resetSkipCount,
      logout,
      addMinutes
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
