import React, { createContext, useContext, useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  accountType: 'guest' | 'registered' | 'creator' | 'viewer';
}

interface ChatContextType {
  user: User | null;
  socket: Socket | null;
  isConnected: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createGuestSession: (username: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3002';
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Load saved user
    AsyncStorage.getItem('user').then((data) => {
      if (data) {
        setUser(JSON.parse(data));
      }
    });

    // Initialize socket
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: username, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      const userData = {
        id: data.user.id,
        username: data.user.phoneNumber,
        accountType: data.user.accountType,
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const createGuestSession = async (username: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageCategory: '_18PLUS' }),
      });

      if (!response.ok) throw new Error('Guest session creation failed');

      const data = await response.json();
      const userData = {
        id: data.guestId,
        username,
        accountType: 'guest' as const,
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Guest session error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    socket?.disconnect();
  };

  return (
    <ChatContext.Provider value={{ user, socket, isConnected, login, logout, createGuestSession }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
