import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChat } from '../contexts/ChatContext';

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export default function ChatScreen({ route }: any) {
  const { lounge } = route.params as { lounge: { id: string; name: string } };
  const { user, socket, isConnected } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (socket && lounge) {
      // Join the lounge
      socket.emit('join-room', lounge.id);

      // Listen for messages
      socket.on('chat message', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      return () => {
        socket.emit('leave-room', lounge.id);
        socket.off('chat message');
      };
    }
  }, [socket, lounge]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: inputText.trim(),
      timestamp: new Date(),
    };

    socket.emit('chat message', message);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        {!isOwn && <Text style={styles.username}>{item.username}</Text>}
        <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.loungeTitle}>{lounge.name}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isConnected && styles.connectedDot]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  loungeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#28a745',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  username: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    maxWidth: '75%',
  },
  ownMessageBubble: {
    backgroundColor: '#667eea',
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
