import { Image } from 'react-native';

export const MEDITATIONS = [ 
  {
    id: '1',
    title: 'Paz Profunda',
    description: 'Conecte-se com a natureza e relaxe.',
    duration: '15 min',
    image: require('../assets/images/forest.png'),
    category: 'Mindfulness',
    url: 'https://cdn.pixabay.com/audio/2024/02/22/audio_f8a0029b9e.mp3',
  },
  {
    id: '2',
    title: 'Ondas de Relaxamento',
    description: 'O som do mar para acalmar a mente.',
    duration: '20 min',
    image: require('../assets/images/ocean.png'),
    category: 'Relaxamento',
    url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_92596d66e5.mp3',
  },
  {
    id: '3',
    title: 'Sono Restaurador',
    description: 'Frequências suaves para dormir melhor.',
    duration: '30 min',
    image: { uri: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1000' },
    category: 'Sono',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];
