import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNutrition } from '../context/NutritionContext';
import DateTimePicker from '@react-native-community/datetimepicker';

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
      onPress: showDatePicker 
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

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const handleDateChange = async (event, date) => {
    setDatePickerVisible(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      const nutritionData = await loadHistoricalNutrition(formattedDate);
      showNutritionReport(nutritionData, formattedDate);
    }
  };

  const showNutritionReport = (data, date) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const report = `
Daily Report for ${formattedDate}

Total Macros:
• Calories: ${Math.round(data.totals.calories)} kcal
• Protein: ${Math.round(data.totals.protein)}g
• Carbs: ${Math.round(data.totals.carbs)}g
• Fat: ${Math.round(data.totals.fat)}g

Meals:
${data.meals.map(meal => 
  `${meal.mealCategory}: ${meal.food_name} (${meal.serving_weight_grams}g)
   ${Math.round(meal.nf_calories)} cal • ${Math.round(meal.nf_protein)}P • ${Math.round(meal.nf_total_carbohydrate)}C • ${Math.round(meal.nf_total_fat)}F`
).join('\n\n')}
    `;

    Alert.alert(
      'Nutrition Report',
      report,
      [{ text: 'Close' }],
      { userInterfaceStyle: 'dark' }
    );
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
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={60} color="#666" />
        </View>
        <Text style={styles.userName}>{stats.name || 'User'}</Text>
        <Text style={styles.userGoal}>{stats.goal || 'Maintain Weight'}</Text>
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
          onChange={handleDateChange}
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
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userGoal: {
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