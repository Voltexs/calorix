import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const router = useRouter();
  const [stats, setStats] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    goal: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue != null) {
        const userData = JSON.parse(jsonValue);
        setStats(userData);
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const handleUpdateStats = () => {
    router.push({
      pathname: '/',
      params: { isUpdate: true }
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
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
      { cancelable: true }
    );
  };

  const MenuButton = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={24} color="#0A84FF" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const StatItem = ({ label, value, unit }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={40} color="#666" />
        </View>
        <Text style={styles.nameText}>{stats.name}</Text>
        <Text style={styles.subText}>{stats.gender} • {stats.goal}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatItem label="Weight" value={stats.weight} unit="kg" />
        <StatItem label="Height" value={stats.height} unit="cm" />
        <StatItem label="Age" value={stats.age} unit="y" />
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Progress Tracking</Text>
        
        <MenuButton
          icon="stats-chart"
          title="Stats Tracker"
          subtitle="View your progress over time"
          onPress={() => console.log('Stats Tracker')}
        />
        
        <MenuButton
          icon="calendar"
          title="Progress History"
          subtitle="See your journey timeline"
          onPress={() => console.log('Progress History')}
        />
        
        <MenuButton
          icon="create"
          title="Update Stats"
          subtitle="Update your current measurements"
          onPress={handleUpdateStats}
        />
        
        <MenuButton
          icon="images"
          title="Progress Photos"
          subtitle="Track your visual progress"
          onPress={() => console.log('Progress Photos')}
        />
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <MenuButton
          icon="settings"
          title="Account Settings"
          subtitle="Manage your profile settings"
          onPress={() => console.log('Settings')}
        />

        <MenuButton
          icon="log-out"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  nameText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subText: {
    color: '#666',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statUnit: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'normal',
    marginLeft: 2,
  },
  statLabel: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    marginLeft: 5,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  menuButtonDestructive: {
    color: '#FF453A',
  },
}); 