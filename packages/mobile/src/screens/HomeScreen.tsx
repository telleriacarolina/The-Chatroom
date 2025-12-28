import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface Language {
  id: string;
  name: string;
  flag: string;
  members: number;
}

const languages: Language[] = [
  { id: 'english', name: 'English', flag: '🇬🇧', members: 342 },
  { id: 'spanish', name: 'Español', flag: '🇪🇸', members: 198 },
  { id: 'french', name: 'Français', flag: '🇫🇷', members: 156 },
  { id: 'german', name: 'Deutsch', flag: '🇩🇪', members: 124 },
  { id: 'japanese', name: '日本語', flag: '🇯🇵', members: 203 },
  { id: 'chinese', name: '中文', flag: '🇨🇳', members: 287 },
  { id: 'portuguese', name: 'Português', flag: '🇵🇹', members: 145 },
  { id: 'arabic', name: 'العربية', flag: '🇸🇦', members: 167 },
];

export default function HomeScreen({ navigation }: any) {
  const renderLanguageCard = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Lounges', { language: item })}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.languageName}>{item.name}</Text>
      <View style={styles.membersContainer}>
        <Text style={styles.members}>👥 {item.members} online</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Language</Text>
        <Text style={styles.headerSubtitle}>Select a language to start chatting</Text>
      </View>

      <FlatList
        data={languages}
        renderItem={renderLanguageCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  flag: {
    fontSize: 48,
    marginBottom: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  membersContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  members: {
    fontSize: 12,
    color: '#666',
  },
});
