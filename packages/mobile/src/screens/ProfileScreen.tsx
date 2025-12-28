import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  User,
  Settings,
  Bell,
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react-native';
import { useChatContext } from '../contexts/ChatContext';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useChatContext();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Account Deletion', 'Feature coming soon');
          },
        },
      ]
    );
  };

  const ProfileHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <User size={48} color="#fff" />
        </View>
        {user?.isGuest && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>Guest</Text>
          </View>
        )}
      </View>
      <Text style={styles.username}>{user?.username || 'Unknown User'}</Text>
      {!user?.isGuest && (
        <Text style={styles.memberSince}>
          Member since {new Date().toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }> = ({ icon, title, subtitle, onPress, rightElement, showChevron = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight size={20} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        {!user?.isGuest && (
          <SettingSection title="Account Information">
            <SettingItem
              icon={<Mail size={20} color="#007AFF" />}
              title="Email"
              subtitle="Not set"
              onPress={() => Alert.alert('Email', 'Feature coming soon')}
            />
            <SettingItem
              icon={<Phone size={20} color="#007AFF" />}
              title="Phone Number"
              subtitle={user?.phoneNumber || 'Not set'}
              onPress={() => Alert.alert('Phone', 'Feature coming soon')}
            />
            <SettingItem
              icon={<Calendar size={20} color="#007AFF" />}
              title="Account Type"
              subtitle={user?.accountType || 'Viewer'}
              onPress={() => Alert.alert('Upgrade', 'Feature coming soon')}
            />
          </SettingSection>
        )}

        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell size={20} color="#007AFF" />}
            title="Push Notifications"
            subtitle="Get notified about new messages"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Moon size={20} color="#007AFF" />}
            title="Dark Mode"
            subtitle="Enable dark theme"
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
              />
            }
            showChevron={false}
          />
        </SettingSection>

        <SettingSection title="Support">
          <SettingItem
            icon={<HelpCircle size={20} color="#007AFF" />}
            title="Help & Support"
            onPress={() => Alert.alert('Help', 'Contact support@chatroom.com')}
          />
          <SettingItem
            icon={<Shield size={20} color="#007AFF" />}
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Feature coming soon')}
          />
          <SettingItem
            icon={<Settings size={20} color="#007AFF" />}
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Feature coming soon')}
          />
        </SettingSection>

        <SettingSection title="Account Actions">
          <SettingItem
            icon={<LogOut size={20} color="#FF3B30" />}
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
          />
          {!user?.isGuest && (
            <SettingItem
              icon={<Shield size={20} color="#FF3B30" />}
              title="Delete Account"
              onPress={handleDeleteAccount}
              showChevron={false}
            />
          )}
        </SettingSection>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 The Chatroom</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  guestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  version: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 13,
    color: '#999',
  },
});

export default ProfileScreen;
