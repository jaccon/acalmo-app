import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { X, Cast, Speaker, Tv, Laptop, Bluetooth } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

type CastModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CastModal({ visible, onClose }: CastModalProps) {
  const [searching, setSearching] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSearching(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Simula busca por 2 segundos
      const timer = setTimeout(() => {
        setSearching(false);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const devices = [
    { id: '1', name: 'Google Nest (Cozinha)', type: 'speaker', brand: 'Google' },
    { id: '2', name: 'Chromecast Sala', type: 'tv', brand: 'Google' },
    { id: '3', name: 'Alexa Echo Dot', type: 'speaker', brand: 'Amazon' },
    { id: '4', name: 'MacBook Pro', type: 'laptop', brand: 'Apple' },
    { id: '5', name: 'Fone Bluetooth', type: 'bluetooth', brand: 'Generic' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'tv': return <Tv size={20} color="#FFF" />;
      case 'speaker': return <Speaker size={20} color="#FFF" />;
      case 'laptop': return <Laptop size={20} color="#FFF" />;
      default: return <Bluetooth size={20} color="#FFF" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }]}>
          <View style={styles.header}>
            <Cast size={24} color="#820AD1" />
            <Text style={styles.title}>Transmitir para dispositivo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          </View>

          {searching ? (
            <View style={styles.searchingArea}>
              <ActivityIndicator size="large" color="#820AD1" />
              <Text style={styles.searchingText}>Procurando dispositivos na rede...</Text>
            </View>
          ) : (
            <View style={styles.deviceList}>
              <Text style={styles.subtitle}>Dispositivos encontrados:</Text>
              {devices.map((device) => (
                <TouchableOpacity 
                  key={device.id} 
                  style={styles.deviceItem}
                  onPress={() => {
                    alert(`Conectando ao ${device.name}...`);
                    onClose();
                  }}
                >
                  <View style={styles.deviceIcon}>
                    {getIcon(device.type)}
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceBrand}>{device.brand}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Certifique-se de que o dispositivo está na mesma rede Wi-Fi que este celular.</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  closeBtn: {
    padding: 5,
  },
  searchingArea: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 20,
    fontSize: 14,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  deviceList: {
    gap: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#820AD1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceBrand: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
