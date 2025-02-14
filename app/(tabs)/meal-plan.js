import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useNutrition } from '../context/NutritionContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CALENDAR_PADDING = 20; // Horizontal padding of calendar
const GRID_PADDING = 10; // Calendar internal padding
const DAYS_IN_WEEK = 7;
const DAY_SIZE = (width - (CALENDAR_PADDING * 2) - (GRID_PADDING * 2)) / DAYS_IN_WEEK;

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Starting with Monday

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Breakfast':
      return 'sunny';
    case 'Lunch':
      return 'restaurant';
    case 'Dinner':
      return 'moon';
    case 'Snack':
      return 'cafe';
    case 'Pre-Workout':
      return 'barbell';
    case 'Post-Workout':
      return 'fitness';
    default:
      return 'nutrition';
  }
};

export default function MealPlan() {
  const { dailyNutrition, loadHistoricalNutrition } = useNutrition();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDayMeals, setSelectedDayMeals] = useState(dailyNutrition);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadDayMeals(selectedDate);
  }, [selectedDate]);

  const loadDayMeals = async (date) => {
    const meals = await loadHistoricalNutrition(date);
    setSelectedDayMeals(meals);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(month, year);
    let firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust firstDay to handle Monday as start of week
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, and shift others back by 1
    
    const days = [];
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add empty spaces after the last day to complete the grid
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingDays; i++) {
      days.push(null);
    }
    
    return days;
  };

  const renderDay = (date) => {
    if (!date) return <View style={styles.emptyDay} />;
    
    const dateString = date.toISOString().split('T')[0];
    const isSelected = dateString === selectedDate;
    const isToday = dateString === new Date().toISOString().split('T')[0];
    
    return (
      <TouchableOpacity 
        style={[
          styles.dayCircle,
          isSelected && styles.selectedDay,
          isToday && styles.today
        ]}
        onPress={() => setSelectedDate(dateString)}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText
        ]}>
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMealCategory = (category, meals) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryLeft}>
          <Ionicons 
            name={getCategoryIcon(category)} 
            size={24} 
            color="#0A84FF" 
          />
          <Text style={styles.categoryTitle}>{category}</Text>
        </View>
        <Text style={styles.mealCount}>
          {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
        </Text>
      </View>
      
      {meals.map((meal, index) => (
        <View key={index} style={styles.mealItem}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.food_name}</Text>
            <Text style={styles.mealMacros}>
              {Math.round(meal.nf_calories)} cal • {Math.round(meal.nf_protein)}g protein
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthYear}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.monthControls}>
            <TouchableOpacity 
              style={styles.monthButton}
              onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.monthButton}
              onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            >
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayContainer}>
                <Text style={styles.weekdayLabel}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {generateCalendarDays().map((date, index) => (
              <View key={index} style={styles.dayContainer}>
                {renderDay(date)}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.dailyStats}>
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedDayMeals.totals.calories)}</Text>
            <Text style={styles.macroLabel}>calories</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedDayMeals.totals.protein)}g</Text>
            <Text style={styles.macroLabel}>protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedDayMeals.totals.carbs)}g</Text>
            <Text style={styles.macroLabel}>carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedDayMeals.totals.fat)}g</Text>
            <Text style={styles.macroLabel}>fat</Text>
          </View>
        </View>
      </View>

      <View style={styles.mealsContainer}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'].map(category => {
          const categoryMeals = selectedDayMeals.meals.filter(
            meal => meal.mealCategory === category
          );
          if (categoryMeals.length > 0) {
            return renderMealCategory(category, categoryMeals);
          }
          return null;
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  calendarContainer: {
    marginTop: 60,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthYear: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthControls: {
    flexDirection: 'row',
    gap: 10,
  },
  monthButton: {
    padding: 5,
  },
  calendar: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: CALENDAR_PADDING,
    borderRadius: 15,
    padding: GRID_PADDING,
    paddingTop: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekdayContainer: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  weekdayLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 0,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 0,
  },
  dayContainer: {
    width: DAY_SIZE,
    aspectRatio: 1,
    padding: 0.5,
  },
  dayCircle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DAY_SIZE / 2,
    backgroundColor: '#2a2a2a',
  },
  selectedDay: {
    backgroundColor: '#0A84FF',
  },
  today: {
    borderColor: '#0A84FF',
    borderWidth: 1,
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  emptyDay: {
    flex: 1,
    aspectRatio: 1,
  },
  dailyStats: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  mealsContainer: {
    padding: 20,
  },
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mealCount: {
    color: '#666',
    fontSize: 12,
  },
  mealItem: {
    marginBottom: 10,
  },
  mealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealMacros: {
    color: '#666',
    fontSize: 12,
  },
}); 