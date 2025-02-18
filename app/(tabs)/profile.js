import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Share } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNutrition } from '../context/NutritionContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const router = useRouter();
  const { loadHistoricalNutrition } = useNutrition();
  const [stats, setStats] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    goal: '',
    bodyFat: '',
    muscleWeight: ''
  });
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const data = JSON.parse(userData);
          setStats(data);
          if (data.profileImage) {
            setProfileImage(data.profileImage);
          }
        }
      } catch (e) {
        console.error('Error loading data:', e);
      }
    };
    loadData();
  }, []);

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

  const menuItems = [
    { 
      icon: 'camera-outline', 
      title: 'Progress Photos', 
      subtitle: 'Track your body transformation',
      onPress: () => router.push('/progress-photos')
    },
    { 
      icon: 'stats-chart-outline', 
      title: 'Body Stats', 
      subtitle: `BF: ${stats.bodyFat || '--'}% • Muscle: ${stats.muscleWeight || '--'}kg`,
      onPress: () => router.push('/body-stats')
    },
    { 
      icon: 'document-text-outline', 
      title: 'Daily Report', 
      subtitle: 'View your nutrition history',
      onPress: () => setDatePickerVisible(true)
    },
    { 
      icon: 'settings-outline', 
      title: 'Account Settings', 
      subtitle: 'Update profile, goals & preferences',
      onPress: () => router.push('/account-settings')
    },
    { 
      icon: 'log-out-outline', 
      title: 'Logout', 
      subtitle: 'Sign out of your account',
      onPress: handleLogout 
    }
  ];

  const handleProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Need photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const userData = await AsyncStorage.getItem('userData');
        const existingData = userData ? JSON.parse(userData) : {};
        const updatedData = { ...existingData, profileImage: result.assets[0].uri };
        
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
        setProfileImage(result.assets[0].uri);
        Alert.alert('Success', 'Profile picture updated!');
      } catch (e) {
        Alert.alert('Error', 'Failed to save profile picture');
      }
    }
  };

  const handleDatePick = async (event, date) => {
    setDatePickerVisible(false);
    if (date) {
      try {
        const formattedDate = date.toISOString().split('T')[0];
        const data = await loadHistoricalNutrition(formattedDate);
        
        if (data?.meals?.length > 0) {
          showNutritionReport(data, formattedDate);
        } else {
          Alert.alert('No Data', `No entries for ${formattedDate}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load nutrition data');
      }
    }
  };

  const showNutritionReport = (data, date) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    // Calculate percentages of goals
    const goalPercentages = {
      calories: Math.round((data.totals.calories / (data.goals?.calories || 1)) * 100),
      protein: Math.round((data.totals.protein / (data.goals?.protein || 1)) * 100),
      carbs: Math.round((data.totals.carbs / (data.goals?.carbs || 1)) * 100),
      fat: Math.round((data.totals.fat / (data.goals?.fat || 1)) * 100)
    };

    const report = `
Daily Report for ${formattedDate}

Total Macros (Goal %):
• Calories: ${Math.round(data.totals.calories)} kcal (${goalPercentages.calories}%)
• Protein: ${Math.round(data.totals.protein)}g (${goalPercentages.protein}%)
• Carbs: ${Math.round(data.totals.carbs)}g (${goalPercentages.carbs}%)
• Fat: ${Math.round(data.totals.fat)}g (${goalPercentages.fat}%)

Goals:
• Calories: ${Math.round(data.goals?.calories || 0)} kcal
• Protein: ${Math.round(data.goals?.protein || 0)}g
• Carbs: ${Math.round(data.goals?.carbs || 0)}g
• Fat: ${Math.round(data.goals?.fat || 0)}g

Meals:
${data.meals.map(meal => 
  `${meal.mealCategory}: ${meal.food_name} (${meal.serving_weight_grams}g)
   ${Math.round(meal.nf_calories)} cal • ${Math.round(meal.nf_protein)}P • ${Math.round(meal.nf_total_carbohydrate)}C • ${Math.round(meal.nf_total_fat)}F`
).join('\n\n')}
    `;

    Alert.alert(
      'Nutrition Report',
      report,
      [
        { 
          text: 'Share', 
          onPress: () => shareReport(report) 
        },
        { text: 'Close' }
      ],
      { userInterfaceStyle: 'dark' }
    );
  };

  const shareReport = async (report) => {
    try {
      await Share.share({
        message: report,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const handleExport = () => {
    // To be implemented: Export functionality
    Alert.alert('Coming Soon', 'Export functionality will be available in the next update');
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
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleProfileImage}
          activeOpacity={0.7}
        >
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#666" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.userName}>{stats.name || 'User'}</Text>
        <Text style={styles.userGoal}>{stats.goal || 'Set your goal'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatItem label="Weight" value={stats.weight} unit="kg" />
        <StatItem label="Height" value={stats.height} unit="cm" />
        <StatItem label="Age" value={stats.age} unit="y" />
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <MenuButton
            key={index}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            onPress={item.onPress}
          />
        ))}
      </View>

      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleDatePick}
          maximumDate={new Date()}
          themeVariant="dark"
        />
      )}
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
    padding: 20,
    paddingTop: 60,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userGoal: {
    color: '#666',
    fontSize: 16,
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
    activeOpacity: 0.7,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginBottom: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 12,
  },
}); 