import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NutritionContext = createContext();

export function NutritionProvider({ children }) {
  const [dailyNutrition, setDailyNutrition] = useState({
    date: new Date().toISOString().split('T')[0],
    meals: [],
    totals: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    goals: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });

  const [savedMeals, setSavedMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    preworkout: [],
    postworkout: []
  });

  // Force reload when mounted
  useEffect(() => {
    const init = async () => {
      // Clear all existing nutrition data
      await AsyncStorage.multiRemove([
        'nutritionGoals',
        'dailyNutrition',
      ]);
      await loadUserGoals();
      await loadDailyNutrition();
      await loadSavedMeals();
    };
    init();
  }, []);

  const loadUserGoals = async () => {
    try {
      const userStats = await AsyncStorage.getItem('userData');
      console.log('Raw user stats:', userStats);
      
      if (!userStats) {
        console.error('No user data found');
        return;
      }

      const stats = JSON.parse(userStats);
      const weightKg = parseFloat(stats.weight);
      const weightLbs = weightKg * 2.20462; // Convert kg to lbs
      
      console.log('Weight in lbs:', weightLbs);
      
      if (!weightKg || weightKg <= 0) {
        console.error('Invalid weight:', weightKg);
        return;
      }

      // Base calories: bodyweight (lbs) x 11 (middle of 10-12 range)
      let calories = Math.round(weightLbs * 11);
      
      // Adjust calories based on goal
      switch(stats.goal) {
        case 'cut':
          calories = calories - 500; // 500 calorie deficit
          break;
        case 'bulk':
          calories = calories + 500; // 500 calorie surplus
          break;
        // maintain stays at base calories
      }

      // Protein: bodyweight (lbs) x 0.9 (middle of 0.8-1 range)
      const protein = Math.round(weightLbs * 0.9);

      // Fat: 50g minimum per day
      const fat = Math.max(50, Math.round((calories * 0.25) / 9));

      // Carbs: remaining calories
      const proteinCals = protein * 4;
      const fatCals = fat * 9;
      const carbs = Math.round((calories - proteinCals - fatCals) / 4);

      const newGoals = {
        calories,
        protein,
        carbs,
        fat
      };

      console.log('Setting new goals:', newGoals);

      setDailyNutrition(prev => ({
        ...prev,
        goals: newGoals
      }));

    } catch (error) {
      console.error('Error in loadUserGoals:', error);
    }
  };

  const loadDailyNutrition = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(`nutrition_${today}`);
      if (stored) {
        setDailyNutrition(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  const loadSavedMeals = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedMeals');
      if (saved) {
        setSavedMeals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved meals:', error);
    }
  };

  const saveMealToCategory = async (meal, category) => {
    try {
      console.log('Saving meal to category:', category, meal);
      const categoryKey = category.toLowerCase().replace(/\s+/g, '');
      
      const newSavedMeals = {
        ...savedMeals,
        [categoryKey]: [...(savedMeals[categoryKey] || []), meal]
      };
      
      console.log('Updated saved meals:', newSavedMeals);
      setSavedMeals(newSavedMeals);
      await AsyncStorage.setItem('savedMeals', JSON.stringify(newSavedMeals));
      return true;
    } catch (error) {
      console.error('Error saving meal to category:', error);
      return false;
    }
  };

  const addMealToDaily = async (meal) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const newMeals = [...(dailyNutrition.meals || []), meal];
      const newTotals = calculateTotals(newMeals);
      
      const newDailyNutrition = {
        date: today,
        meals: newMeals,
        totals: newTotals,
        goals: dailyNutrition.goals || {}
      };

      // Update state
      setDailyNutrition(newDailyNutrition);

      // Save to AsyncStorage
      await AsyncStorage.setItem(`nutrition_${today}`, JSON.stringify(newDailyNutrition));
      
      return true;
    } catch (error) {
      console.error('Error adding meal to daily:', error);
      return false;
    }
  };

  const removeMeal = async (index) => {
    const today = new Date().toISOString().split('T')[0];
    
    setDailyNutrition(prev => {
      const removedMeal = prev.meals[index];
      const newNutrition = {
        ...prev,
        meals: prev.meals.filter((_, i) => i !== index),
        totals: {
          calories: prev.totals.calories - removedMeal.nf_calories,
          protein: prev.totals.protein - removedMeal.nf_protein,
          carbs: prev.totals.carbs - removedMeal.nf_total_carbohydrate,
          fat: prev.totals.fat - removedMeal.nf_total_fat
        }
      };
      
      // Save to AsyncStorage
      AsyncStorage.setItem(`nutrition_${today}`, JSON.stringify(newNutrition));
      return newNutrition;
    });
  };

  // Add this function to clear the nutrition goals
  const clearNutritionGoals = async () => {
    try {
      await AsyncStorage.removeItem('nutritionGoals');
      setDailyNutrition({
        date: new Date().toISOString().split('T')[0],
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        },
        goals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      });
    } catch (error) {
      console.error('Error clearing nutrition goals:', error);
    }
  };

  const deleteSavedMeal = async (category, index) => {
    try {
      const categoryKey = category.toLowerCase();
      const newMeals = [...(savedMeals[categoryKey] || [])];
      newMeals.splice(index, 1);
      
      const newSavedMeals = {
        ...savedMeals,
        [categoryKey]: newMeals
      };
      
      setSavedMeals(newSavedMeals);
      await AsyncStorage.setItem('savedMeals', JSON.stringify(newSavedMeals));
      return true;
    } catch (error) {
      console.error('Error deleting saved meal:', error);
      return false;
    }
  };

  const loadHistoricalNutrition = async (date) => {
    try {
      const stored = await AsyncStorage.getItem(`nutrition_${date}`);
      return stored ? JSON.parse(stored) : {
        date,
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      };
    } catch (error) {
      console.error('Error loading historical nutrition:', error);
      return null;
    }
  };

  return (
    <NutritionContext.Provider value={{ 
      dailyNutrition,
      savedMeals,
      addMealToDaily,
      saveMealToCategory,
      loadUserGoals,
      removeMeal,
      clearNutritionGoals,
      loadSavedMeals,
      deleteSavedMeal,
      loadHistoricalNutrition
    }}>
      {children}
    </NutritionContext.Provider>
  );
}

export const useNutrition = () => useContext(NutritionContext);

// Add default export for the provider
export default NutritionProvider; 