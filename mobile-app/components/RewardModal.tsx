import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Trophy, Star, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
  points: number;
  milestone?: number;
  title: string;
  currentPoints: number;
  currentStars: number;
}

const { width } = Dimensions.get('window');

export default function RewardModal({ 
  visible, 
  onClose, 
  points, 
  milestone, 
  title,
  currentPoints,
  currentStars
}: RewardModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#820AD1', '#4C0677']}
            style={styles.card}
          >
            <View style={styles.iconContainer}>
              <Trophy size={60} color="#FFD700" />
              <View style={styles.starBadge}>
                <Star size={20} color="#FFD700" fill="#FFD700" />
              </View>
            </View>

            <Text style={styles.congratsText}>Parabéns!</Text>
            <Text style={styles.titleText}>{title}</Text>
            
            {milestone && (
              <View style={styles.milestoneBadge}>
                <Award size={18} color="#FFF" />
                <Text style={styles.milestoneText}>{milestone === 1 ? 'Primeira Meditação!' : `${milestone} Meditações Completas`}</Text>
              </View>
            )}

            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>Você ganhou</Text>
              <Text style={styles.pointsValue}>+{points} pontos</Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.statusText}>{currentStars} Estrelas</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statusItem}>
                <Award size={16} color="#FFF" />
                <Text style={styles.statusText}>{currentPoints} Pontos</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Incrível!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  card: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  starBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#820AD1',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  congratsText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  titleText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  milestoneText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  pointsValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#820AD1',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
