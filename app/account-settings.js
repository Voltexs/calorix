import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountSettings() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  };

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
            try {
              await AsyncStorage.clear();
              router.replace('/');
            } catch (e) {
              console.error('Error during logout:', e);
            }
          }
        }
      ],
      { userInterfaceStyle: 'dark' }
    );
  };

  const settingsSections = [
    {
      title: 'Profile',
      items: [
        {
          icon: 'person-outline',
          title: 'Update Profile',
          subtitle: 'Name, age, gender',
          onPress: () => router.push({
            pathname: '/',
            params: { isUpdate: true }
          })
        },
        {
          icon: 'barbell-outline',
          title: 'Fitness Goals',
          subtitle: 'Weight goals, activity level',
          onPress: () => router.push('/fitness-goals')
        }
      ]
    },
    {
      title: 'Nutrition',
      items: [
        {
          icon: 'calculator-outline',
          title: 'Macro Goals',
          subtitle: 'Customize your macro splits',
          onPress: () => router.push('/macro-goals')
        },
        {
          icon: 'refresh-outline',
          title: 'Reset Progress',
          subtitle: 'Clear all nutrition data',
          onPress: () => handleResetProgress(),
          destructive: true
        }
      ]
    },
    {
      title: 'App',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          onPress: handleLogout,
          destructive: true
        }
      ]
    }
  ];

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will clear all your nutrition data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const nutritionKeys = keys.filter(key => key.startsWith('nutrition_'));
              await AsyncStorage.multiRemove(nutritionKeys);
              Alert.alert('Success', 'All nutrition data has been reset');
            } catch (e) {
              console.error('Error resetting progress:', e);
              Alert.alert('Error', 'Failed to reset progress');
            }
          }
        }
      ],
      { userInterfaceStyle: 'dark' }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      {settingsSections.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.menuItem, item.destructive && styles.destructiveItem]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons 
                  name={item.icon} 
                  size={24} 
                  color={item.destructive ? '#FF453A' : '#0A84FF'} 
                />
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, item.destructive && styles.destructiveText]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginBottom: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 12,
  },
  menuItemTitle: {
    color: '#fff',
    fontSize: 17,
  },
  menuItemSubtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  destructiveItem: {
    backgroundColor: '#1c1c1e',
  },
  destructiveText: {
    color: '#FF453A',
  },
}); 