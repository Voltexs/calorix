import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, BlurView, SafeAreaView, Platform, Alert } from 'react-native';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNutrition } from '../context/NutritionContext';

const { width } = Dimensions.get('window');
const mainCircleSize = width * 0.4;
const smallCircleSize = width * 0.22;
const mainStrokeWidth = 8; // Thinner stroke for more modern look
const smallStrokeWidth = 6;

const NUTRITIONIX_API_KEY = 'f1ed1cabdf2b32c035a8fa2d491100d4';
const NUTRITIONIX_APP_ID = '8015f82f';

const CircularProgress = ({ color, value, goal, label, unit, size, isMain = false }) => {
  const remaining = Math.max(0, goal - value);
  const percentage = Math.min(((goal - value) / goal) * 100, 100);
  const strokeWidth = isMain ? 3 : 2;
  
  return (
    <View style={[styles.circleContainer, { width: size, height: size }]}>
      {/* Outer Glow */}
      <View style={[styles.circleGlow, { 
        width: size + 20, 
        height: size + 20,
        borderRadius: (size + 20) / 2,
        backgroundColor: color,
        opacity: 0.1
      }]} />
      
      {/* Background Circle */}
      <View style={[styles.circleBackground, { 
        width: size, 
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
      }]} />
      
      {/* Progress Circle */}
      <View style={[
        styles.progressLayer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          opacity: 0.8,
          transform: [{ rotate: '-90deg' }]
        }
      ]} />
      
      {/* Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.circleValue, isMain ? styles.mainCircleValue : styles.smallCircleValue]}>
          {Math.round(remaining)}
        </Text>
        <Text style={[styles.circleLabel, isMain ? styles.mainCircleLabel : styles.smallCircleLabel]}>
          {label}
        </Text>
        {unit && <Text style={styles.circleUnit}>{unit}</Text>}
      </View>
    </View>
  );
};

const SearchModal = ({ visible, onClose, onSearch, isLoading, searchResults, renderFoodItem }) => {
  const [query, setQuery] = useState('');
  const debounceTimeout = useRef(null);

  const handleSearch = (text) => {
    setQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onSearch(text);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>Search Food</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#0A84FF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search food"
              placeholderTextColor="#666"
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
          
          <ScrollView style={styles.resultsContainer}>
            {isLoading ? (
              <ActivityIndicator style={styles.loader} color="#0A84FF" />
            ) : (
              searchResults.map((item, index) => (
                <View key={`${item.food_name}-${index}`}>
                  {renderFoodItem(item)}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getIconForCategory = (categoryName) => {
  const name = categoryName.toLowerCase();
  
  // Common meal categories
  if (name.includes('breakfast')) return 'sunny-outline';
  if (name.includes('lunch')) return 'restaurant-outline';
  if (name.includes('dinner')) return 'moon-outline';
  if (name.includes('snack')) return 'cafe-outline';
  
  // Workout related
  if (name.includes('pre') && name.includes('workout')) return 'barbell-outline';
  if (name.includes('post') && name.includes('workout')) return 'fitness-outline';
  if (name.includes('protein')) return 'nutrition-outline';
  
  // Other common categories
  if (name.includes('drink') || name.includes('beverage')) return 'water-outline';
  if (name.includes('fruit')) return 'nutrition-outline';
  if (name.includes('vegetable') || name.includes('veggies')) return 'leaf-outline';
  if (name.includes('dessert') || name.includes('sweet')) return 'ice-cream-outline';
  if (name.includes('meat')) return 'restaurant-outline';
  if (name.includes('fish') || name.includes('seafood')) return 'fish-outline';
  
  // Default icon if no match
  return 'fast-food-outline';
};

export default function Dashboard() {
  const router = useRouter();
  const { dailyNutrition, savedMeals, deleteSavedMeal, saveMealToCategory, addMealToDaily, deleteMealCategory, renameSavedCategory, deleteSavedCategory } = useNutrition();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [newMealName, setNewMealName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const params = useLocalSearchParams();

  const formData = {
    name: params.name || 'User',
    weight: parseFloat(params.weight) || 70,
    height: parseFloat(params.height) || 170,
    age: parseFloat(params.age) || 25,
    gender: params.gender || 'Male',
    goal: params.goal || 'maintain'
  };

  // Convert kg to lbs
  const weightInLbs = formData.weight * 2.20462;

  // Calculate base calories using bodyweight x 11 (middle of 10-12 range)
  const calculateCalories = (weightLbs, goal) => {
    const baseCalories = Math.round(weightLbs * 11);
    
    switch(goal) {
      case 'cut':
        return baseCalories - 500;
      case 'bulk':
        return baseCalories + 500;
      default: // maintain
        return baseCalories;
    }
  };

  // Calculate macros based on the new formula
  const calculateMacros = (weightLbs, calories) => {
    // Protein: bodyweight x 0.9 (middle of 0.8-1 range)
    const protein = Math.round(weightLbs * 0.9);
    
    // Fat: 30% of total calories, but minimum 50g
    const fatCaloriesFromPercentage = calories * 0.3;
    const fatFromPercentage = Math.round(fatCaloriesFromPercentage / 9);
    const fat = Math.max(50, fatFromPercentage);
    
    // Calculate remaining calories for carbs
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const remainingCalories = calories - (proteinCalories + fatCalories);
    const carbs = Math.round(remainingCalories / 4);

    return {
      calories,
      protein,
      fat,
      carbs
    };
  };

  const calories = calculateCalories(weightInLbs, formData.goal);
  const macros = calculateMacros(weightInLbs, calories);

  const mealCategories = [
    {
      id: 'breakfast',
      title: 'Breakfast Meals',
      icon: 'sunny',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Breakfast')
    },
    {
      id: 'lunch',
      title: 'Lunch Meals',
      icon: 'restaurant',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Lunch')
    },
    {
      id: 'dinner',
      title: 'Dinner Meals',
      icon: 'moon',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Dinner')
    },
    {
      id: 'snacks',
      title: 'Snacks',
      icon: 'cafe',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Snack')
    },
    {
      id: 'preworkout',
      title: 'Pre-Workout',
      icon: 'barbell',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Pre-Workout')
    },
    {
      id: 'postworkout',
      title: 'Post-Workout',
      icon: 'fitness',
      meals: dailyNutrition.meals.filter(meal => meal.mealCategory === 'Post-Workout')
    }
  ];

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const MealCategory = ({ category }) => {
    const { addMealToDaily, deleteSavedMeal, renameSavedCategory, deleteSavedCategory } = useNutrition();
    const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState(category.title);
    
    // Memoize the RenameModal component to prevent unnecessary re-renders
    const RenameModal = useMemo(() => {
      return (
        <Modal
          visible={isRenameModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsRenameModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rename Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new name"
                placeholderTextColor="#666"
                value={newCategoryName}
                onChangeText={(text) => setNewCategoryName(text)}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setIsRenameModalVisible(false);
                    setNewCategoryName(category.title);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createButton, !newCategoryName.trim() && styles.disabledButton]} 
                  onPress={async () => {
                    if (newCategoryName.trim()) {
                      await renameSavedCategory(category.id, newCategoryName.trim());
                      setIsRenameModalVisible(false);
                    }
                  }}
                  disabled={!newCategoryName.trim()}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }, [isRenameModalVisible, newCategoryName, category.title]);

    const handleCategoryLongPress = useCallback(() => {
      Alert.alert(
        "Category Options",
        category.title,
        [
          {
            text: "Rename",
            onPress: () => {
              setNewCategoryName(category.title);
              setIsRenameModalVisible(true);
            }
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Delete Category",
                "Are you sure you want to delete this category and all its meals?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                      await deleteSavedCategory(category.id);
                    }
                  }
                ],
                { userInterfaceStyle: 'dark' }
              );
            }
          },
          { text: "Cancel", style: "cancel" }
        ],
        { userInterfaceStyle: 'dark' }
      );
    }, [category.title, category.id]);

    const handleMealLongPress = (meal) => {
      Alert.alert(
        "Meal Options",
        meal.food_name,
        [
          {
            text: "Edit",
            onPress: () => {
              router.push({
                pathname: "/food-detail",
                params: { food: JSON.stringify(meal), isEditing: true }
              });
            }
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Delete Meal",
                "Are you sure you want to delete this meal?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      const success = await deleteSavedMeal(category.id, meal);
                      if (success) {
                        // Refresh categories after deletion
                        loadSavedMeals();
                      }
                    }
                  }
                ],
                { userInterfaceStyle: 'dark' }
              );
            }
          },
          { text: "Cancel", style: "cancel" }
        ],
        { userInterfaceStyle: 'dark' }
      );
    };

    return (
      <View style={styles.categoryContainer}>
        {RenameModal}
        <TouchableOpacity 
          style={styles.categoryHeader} 
          onPress={() => toggleCategory(category.id)}
          onLongPress={handleCategoryLongPress}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <View style={styles.categoryTitleContainer}>
            <Ionicons 
              name={getIconForCategory(category.title)} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={styles.mealCount}>{category.meals.length}</Text>
            <Ionicons 
              name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>

        {expandedCategory === category.id && (
          <View style={styles.mealsContainer}>
            {category.meals.length > 0 ? (
              category.meals.map((meal, index) => (
                <TouchableOpacity 
                  key={`${meal.food_name}-${index}`} 
                  style={styles.mealItem}
                  onPress={() => addMealToDaily(meal, category.title)}
                  onLongPress={() => handleMealLongPress(meal)}
                  delayLongPress={500}
                  activeOpacity={0.7}
                >
                  <View style={styles.mealItemLeft}>
                    <Text style={styles.mealName}>
                      {meal.food_name} ({meal.serving_weight_grams}g)
                    </Text>
                    <Text style={styles.macros}>
                      {Math.round(meal.nf_calories)} cal • 
                      {Math.round(meal.nf_protein)}P • 
                      {Math.round(meal.nf_total_carbohydrate)}C • 
                      {Math.round(meal.nf_total_fat)}F
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No meals added yet</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const searchTimeout = useRef(null);

  const searchFood = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const quantityMatch = query.match(/(\d+)g?/);
      const requestedQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 100;
      const baseQuery = query.replace(/\d+g?\s*/g, '').trim();
      
      // Add a delay to prevent hitting API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Making instant search request for:', baseQuery);
      const instantResponse = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(baseQuery)}`, {
        method: 'GET',
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        },
      });

      if (!instantResponse.ok) {
        console.error('Instant search failed:', await instantResponse.text());
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      const instantData = await instantResponse.json();
      
      if (!instantData.common || instantData.common.length === 0) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      // Take up to 5 common food items
      const commonFoods = instantData.common.slice(0, 5);
      
      // Create basic results for all foods
      const results = commonFoods.map(food => ({
        food_name: food.food_name,
        serving_qty: requestedQuantity,
        serving_unit: 'g',
        serving_weight_grams: requestedQuantity,
        nf_calories: Math.round((requestedQuantity / 100) * (
          food.food_name.includes('breast') ? 165 :
          food.food_name.includes('thigh') ? 209 :
          food.food_name.includes('wing') ? 203 :
          food.food_name.includes('leg') ? 184 :
          185
        )),
        nf_protein: Math.round((requestedQuantity / 100) * (
          food.food_name.includes('breast') ? 31 :
          food.food_name.includes('thigh') ? 26 :
          food.food_name.includes('wing') ? 30 :
          food.food_name.includes('leg') ? 28 :
          25
        )),
        nf_total_carbohydrate: 0,
        nf_total_fat: Math.round((requestedQuantity / 100) * (
          food.food_name.includes('breast') ? 3.6 :
          food.food_name.includes('thigh') ? 11 :
          food.food_name.includes('wing') ? 8.1 :
          food.food_name.includes('leg') ? 8.5 :
          7.4
        )),
        photo: food.photo
      }));

      setSearchResults(results);
      setIsLoading(false);

    } catch (error) {
      console.error('Error in searchFood:', error);
      setSearchResults([]);
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchFood(text);
    }, 500); // Increased debounce time for better performance
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const renderFoodItem = (item) => (
    <TouchableOpacity 
      style={styles.foodItem} 
      onPress={() => handleFoodSelect(item)}
    >
      <View style={styles.foodItemContent}>
        <Text style={styles.foodName}>{item.food_name}</Text>
        <Text style={styles.foodDetails}>
          {Math.round(item.nf_calories)} cal • {item.serving_weight_grams}g
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCalendarModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isCalendarVisible}
      onRequestClose={() => setIsCalendarVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Food History</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.calendarContainer}>
            {/* Calendar content will go here */}
            <Text style={styles.monthTitle}>March 2024</Text>
            <View style={styles.daysGrid}>
              {/* Example days */}
              {[...Array(31)].map((_, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.dayItem}
                  onPress={() => console.log(`Selected day: ${i + 1}`)}
                >
                  <Text style={styles.dayText}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const handleFoodSelect = (food) => {
    // Ensure we have all the required nutrition data
    const foodWithNutrition = {
      ...food,
      nf_calories: food.nf_calories || 0,
      nf_total_fat: food.nf_total_fat || 0,
      nf_total_carbohydrate: food.nf_total_carbohydrate || 0,
      nf_protein: food.nf_protein || 0,
      serving_weight_grams: food.serving_weight_grams || 100,
      serving_qty: food.serving_qty || 1,
      serving_unit: food.serving_unit || 'g'
    };

    setIsSearchModalVisible(false);
    router.push({
      pathname: '/food-detail',
      params: { food: JSON.stringify(foodWithNutrition) }
    });
  };

  const handleDeleteMeal = async (meal) => {
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this meal?",
      [
        { 
          text: "Cancel", 
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteSavedMeal(meal.mealCategory, meal)
        }
      ],
      {
        userInterfaceStyle: 'dark'  // Force dark mode for all platforms
      }
    );
  };

  const handleEditMeal = (meal) => {
    router.push({
      pathname: '/food-detail',
      params: { food: JSON.stringify(meal), editMode: true, category: meal.mealCategory }
    });
  };

  const calculateTotals = (meals) => {
    return meals.reduce((totals, meal) => {
      return {
        calories: totals.calories + (meal.nf_calories || 0),
        protein: totals.protein + (meal.nf_protein || 0),
        carbs: totals.carbs + (meal.nf_total_carbohydrate || 0),
        fat: totals.fat + (meal.nf_total_fat || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSearchButtonPress = () => {
    console.log('Search button pressed');
    setIsSearchModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add this modal component for creating new meals
  const CreateMealModal = ({ visible, onClose }) => {
    const [newMealName, setNewMealName] = useState('');
    
    const handleCreate = () => {
      if (newMealName.trim()) {
        // Create new meal category
        saveMealToCategory([], newMealName.trim());
        setNewMealName('');
        onClose();
      }
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Meal Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter meal category name"
              placeholderTextColor="#666"
              value={newMealName}
              onChangeText={setNewMealName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.createButton, !newMealName.trim() && styles.disabledButton]} 
                onPress={handleCreate}
                disabled={!newMealName.trim()}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Get all categories from savedMeals without filtering empty ones
  const categories = useMemo(() => {
    return Object.keys(savedMeals)
      .map(key => ({
        id: key,
        title: key.charAt(0).toUpperCase() + key.slice(1),
        meals: savedMeals[key] || [],
        icon: getIconForCategory(key)
      }));
  }, [savedMeals]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Much bigger spacer */}
      <View style={styles.statusBarSpacer} />
      
      {/* Header Container */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Hi, {formData.name || 'User'}</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchButtonPress}
          >
            <Ionicons name="search" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {renderCalendarModal()}

        <View style={styles.statsContainer}>
          <View style={styles.mainCircle}>
            <CircularProgress
              color="#0A84FF"
              value={dailyNutrition.totals.calories}
              goal={dailyNutrition.goals.calories}
              label="Calories"
              unit="kcal"
              size={mainCircleSize}
              isMain={true}
            />
          </View>
          
          <View style={styles.macrosRow}>
            <CircularProgress
              color="#0A84FF"
              value={dailyNutrition.totals.protein}
              goal={dailyNutrition.goals.protein}
              label="Protein"
              size={smallCircleSize}
            />
            <CircularProgress
              color="#FF9500"
              value={dailyNutrition.totals.carbs}
              goal={dailyNutrition.goals.carbs}
              label="Carbs"
              size={smallCircleSize}
            />
            <CircularProgress
              color="#30D158"
              value={dailyNutrition.totals.fat}
              goal={dailyNutrition.goals.fat}
              label="Fat"
              size={smallCircleSize}
            />
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Meals</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setIsCreatingMeal(true)}
            >
              <Text style={styles.createButtonText}>Create Meal</Text>
            </TouchableOpacity>
          </View>

          {categories.map(category => (
            <MealCategory 
              key={category.id} 
              category={category}
            />
          ))}
        </View>
      </ScrollView>

      <SearchModal
        visible={isSearchModalVisible}
        onClose={() => setIsSearchModalVisible(false)}
        onSearch={handleSearch}
        isLoading={isLoading}
        searchResults={searchResults}
        renderFoodItem={renderFoodItem}
      />

      <CreateMealModal
        visible={isCreatingMeal}
        onClose={() => setIsCreatingMeal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 30, // Reduced height
    backgroundColor: '#000',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
    marginTop: 20, // Added margin top
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchButton: {
    padding: 10,
    marginRight: 10,
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    maxHeight: 500,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 8,
    height: 40, // Fixed height to prevent double line
  },
  cancelButton: {
    padding: 10,
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  foodItemContent: {
    flexDirection: 'column',
    gap: 4,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
  },
  foodDetails: {
    color: '#666',
    fontSize: 14,
  },
  calories: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  servingInfo: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  macroUnit: {
    color: '#666',
    fontSize: 14,
    marginLeft: 1,
  },
  macroSeparator: {
    color: '#666',
    marginHorizontal: 6,
    fontSize: 12,
  },
  statsContainer: {
    paddingTop: 10,
    paddingHorizontal: 15,
  },
  mainCircle: {
    alignItems: 'center',
    marginVertical: 15,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  categoryContainer: {
    marginBottom: 8,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1c1c1e',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  mealCount: {
    fontSize: 16,
    color: '#666',
  },
  mealsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#3c3c3e',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  mealItemLeft: {
    flex: 1,
  },
  mealItemRight: {
    flexDirection: 'row',
    gap: 12,
  },
  mealName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  macros: {
    color: '#666',
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleGlow: {
    position: 'absolute',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  circleBackground: {
    position: 'absolute',
    borderColor: '#1a1a1a', // subtle dark background
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  circleValue: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '300', // Thinner font for modern look
    letterSpacing: 1,
  },
  mainCircleValue: {
    fontSize: 48,
  },
  smallCircleValue: {
    fontSize: 28,
  },
  circleLabel: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
  },
  mainCircleLabel: {
    fontSize: 12,
  },
  smallCircleLabel: {
    fontSize: 9,
  },
  circleUnit: {
    color: '#444',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    marginBottom: 10,
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  brandName: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  foodServing: {
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    backgroundColor: '#1c1c1e',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 8,
  },
  cancelButton: {
    padding: 10,
  },
  createButton: {
    padding: 10,
  },
  buttonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 8,
  },
  calendarContainer: {
    flex: 1,
  },
  monthTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayItem: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  dayText: {
    color: '#fff',
    fontSize: 16,
  },
  instantResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  instantFoodName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  instantServingUnit: {
    color: '#666',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  macrosText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  searchModal: {
    margin: 20,
    marginTop: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  foodItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  foodQuantity: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  placeholderText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  deleteCategory: {
    padding: 8,
    marginRight: 8,
  },
  closeButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '500',
  },
  mealCategory: {
    marginBottom: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
  }
}); 