import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
    goals: {}
  });

  const [savedMeals, setSavedMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
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
      const stored = await AsyncStorage.getItem('savedMeals');
      if (stored) {
        setSavedMeals(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved meals:', error);
    }
  };

  const deleteMealCategory = async (category) => {
    try {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '');
      const newSavedMeals = { ...savedMeals };
      delete newSavedMeals[categoryKey];
      
      setSavedMeals(newSavedMeals);
      await AsyncStorage.setItem('savedMeals', JSON.stringify(newSavedMeals));
      return true;
    } catch (error) {
      console.error('Error deleting meal category:', error);
      return false;
    }
  };

  const saveMealToCategory = async (meal, category) => {
    try {
      const categoryKey = category.toLowerCase().replace(/\s+/g, '');
      
      // If we're just creating a category (no meal data)
      if (!meal) {
        const newMeals = {
          ...savedMeals,
          [categoryKey]: []
        };
        
        await AsyncStorage.setItem('savedMeals', JSON.stringify(newMeals));
        setSavedMeals(newMeals);
        return true;
      }

      // Check if category already exists
      if (savedMeals[categoryKey]) {
        // Check if meal already exists in category
        const mealExists = savedMeals[categoryKey].some(
          existingMeal => 
            existingMeal.food_name === meal.food_name && 
            existingMeal.serving_qty === meal.serving_qty
        );

        if (mealExists) {
          Alert.alert('Already Exists', 'This meal already exists in this category');
          return false;
        }
      }

      const newMeals = {
        ...savedMeals,
        [categoryKey]: [
          ...(savedMeals[categoryKey] || []),
          {
            ...meal,
            id: `${Date.now()}-${Math.random()}`,
            dateAdded: new Date().toISOString()
          }
        ]
      };
      
      await AsyncStorage.setItem('savedMeals', JSON.stringify(newMeals));
      setSavedMeals(newMeals);
      return true;
    } catch (error) {
      console.error('Error in saveMealToCategory:', error);
      return false;
    }
  };

  const calculateTotals = (meals) => {
    return meals.reduce((totals, meal) => {
      return {
        calories: totals.calories + (meal.nf_calories || 0),
        protein: totals.protein + (meal.nf_protein || 0),
        carbs: totals.carbs + (meal.nf_total_carbohydrate || 0),
        fat: totals.fat + (meal.nf_total_fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Add this function to notify subscribers of changes
  const notifyNutritionChange = async (date) => {
    const stored = await AsyncStorage.getItem(`nutrition_${date}`);
    if (stored) {
      const data = JSON.parse(stored);
      setDailyNutrition(data);
    }
  };

  const addMealToDaily = async (meal, mealCategory) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current daily nutrition with the correct key format
      const currentDaily = await AsyncStorage.getItem(`nutrition_${today}`);
      const dailyData = currentDaily ? JSON.parse(currentDaily) : {
        date: today,
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      };

      // Add the meal with the correct category
      const mealWithCategory = {
        ...meal,
        id: `${meal.food_name}-${Date.now()}`,
        mealCategory: meal.mealCategory || mealCategory || 'Breakfast', // Prioritize existing category
        timestamp: new Date().toISOString()
      };
      
      // Update meals and totals
      dailyData.meals.push(mealWithCategory);
      dailyData.totals = calculateTotals(dailyData.meals);

      // Save with the correct key format
      await AsyncStorage.setItem(`nutrition_${today}`, JSON.stringify(dailyData));
      setDailyNutrition(dailyData);

      return true;
    } catch (error) {
      console.error('Error adding meal to daily:', error);
      return false;
    }
  };

  const removeMeal = async (mealToRemove) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentDaily = await AsyncStorage.getItem(`nutrition_${today}`);
      const dailyData = currentDaily ? JSON.parse(currentDaily) : {};
      
      const updatedMeals = dailyData.meals.filter(meal => meal.id !== mealToRemove.id);
      const updatedTotals = calculateTotals(updatedMeals);
      
      const newNutrition = {
        ...dailyData,
        meals: updatedMeals,
        totals: updatedTotals
      };

      await AsyncStorage.setItem(`nutrition_${today}`, JSON.stringify(newNutrition));
      setDailyNutrition(newNutrition);
      return true;
    } catch (error) {
      console.error('Error removing meal:', error);
      return false;
    }
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
        goals: {}
      });
    } catch (error) {
      console.error('Error clearing nutrition goals:', error);
    }
  };

  const deleteSavedMeal = async (categoryId, mealToDelete) => {
    try {
      const updatedMeals = {
        ...savedMeals,
        [categoryId]: savedMeals[categoryId].filter(
          meal => meal.id !== mealToDelete.id
        )
      };
      
      await AsyncStorage.setItem('savedMeals', JSON.stringify(updatedMeals));
      setSavedMeals(updatedMeals);
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

  const renameSavedCategory = async (categoryId, newName) => {
    try {
      // Create new category ID from the new name
      const newCategoryId = newName.toLowerCase().replace(/\s+/g, '');
      const updatedMeals = { ...savedMeals };
      
      // Keep the same meals but under the new category name
      updatedMeals[newCategoryId] = savedMeals[categoryId];
      
      // Remove the old category if the name changed
      if (categoryId !== newCategoryId) {
        delete updatedMeals[categoryId];
      }

      await AsyncStorage.setItem('savedMeals', JSON.stringify(updatedMeals));
      setSavedMeals(updatedMeals);
      
      // Show success message
      Alert.alert('Success', 'Category renamed successfully');
      return true;
    } catch (error) {
      console.error('Error renaming category:', error);
      Alert.alert('Error', 'Failed to rename category');
      return false;
    }
  };

  const deleteSavedCategory = async (categoryId) => {
    try {
      const updatedMeals = { ...savedMeals };
      delete updatedMeals[categoryId];
      
      await AsyncStorage.setItem('savedMeals', JSON.stringify(updatedMeals));
      setSavedMeals(updatedMeals);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  return (
    <NutritionContext.Provider value={{
      dailyNutrition,
      savedMeals,
      setDailyNutrition,
      addMealToDaily,
      removeMeal,
      saveMealToCategory,
      loadDailyNutrition,
      loadHistoricalNutrition,
      loadSavedMeals,
      clearNutritionGoals,
      deleteSavedMeal,
      deleteMealCategory,
      renameSavedCategory,
      deleteSavedCategory
    }}>
      {children}
    </NutritionContext.Provider>
  );
}

export const useNutrition = () => useContext(NutritionContext);

// Add default export for the provider
export default NutritionProvider; 