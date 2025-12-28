import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Users, MessageSquare, TrendingUp } from 'lucide-react-native';

type Language = {
  id: string;
  name: string;
  flag: string;
  members: number;
};

type Props = NativeStackScreenProps<any, any>;

interface Lounge {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  activeNow: number;
  isPopular?: boolean;
}

const LoungeSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { language } = route.params as { language: Language };
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLounges = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const resp = await fetch(`${API_URL}/api/lounges?language=${language.id}`);
      if (!resp.ok) throw new Error(`Failed to load lounges: ${resp.status}`);
      const data = await resp.json();
      setLounges(data.lounges || []);
    } catch (error) {
      console.error('Error fetching lounges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLounges();
  }, [language]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLounges();
    setRefreshing(false);
  };

  const handleLoungePress = (lounge: Lounge) => {
    navigation.navigate('Chat', {
      lounge: { id: lounge.id, name: lounge.name },
    });
  };

  const renderLounge = ({ item }: { item: Lounge }) => (
    <TouchableOpacity
      style={styles.loungeCard}
      onPress={() => handleLoungePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.loungeHeader}>
        <View style={styles.loungeNameContainer}>
          <Text style={styles.loungeName}>{item.name}</Text>
          {item.isPopular && (
            <View style={styles.popularBadge}>
              <TrendingUp size={12} color="#fff" />
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        <Text style={styles.loungeDescription}>{item.description}</Text>
      </View>

      <View style={styles.loungeFooter}>
        <View style={styles.statItem}>
          <Users size={16} color="#666" />
          <Text style={styles.statText}>{item.memberCount} members</Text>
        </View>
        <View style={styles.statItem}>
          <MessageSquare size={16} color="#4CAF50" />
          <Text style={[styles.statText, styles.activeText]}>
            {item.activeNow} active now
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading lounges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.languageTitle}>
          {language.flag} {language.name} Lounges
        </Text>
        <Text style={styles.subtitle}>
          Choose a lounge to start chatting
        </Text>
      </View>

      <FlatList
        data={lounges}
        renderItem={renderLounge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  loungeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loungeHeader: {
    marginBottom: 12,
  },
  loungeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  loungeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  loungeDescription: {
    fontSize: 14,
    color: '#666',
  },
  loungeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  activeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default LoungeSelectionScreen;
