import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useNutrition } from './context/NutritionContext';
import { Ionicons } from '@expo/vector-icons';

const MEAL_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Pre-Workout',
  'Post-Workout'
];

const BACKGROUND_COLOR = '#1c1c1e';
const TEXT_COLOR = '#fff';

export default function FoodDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addMealToDaily, saveMealToCategory } = useNutrition();
  const [mealCategory, setMealCategory] = useState('Breakfast');
  
  // Parse the food data and get initial serving details
  const { food, initialQuantity } = useMemo(() => {
    let parsedFood;
    if (typeof params.food === 'string') {
      parsedFood = JSON.parse(params.food);
    } else {
      parsedFood = params.food;
    }
    
    // Get the serving_qty from the API response
    const qty = parsedFood.serving_qty?.toString() || '1';
    
    return { food: parsedFood, initialQuantity: qty };
  }, [params.food]);

  // Initialize serving options without duplicates
  const servingOptions = useMemo(() => {
    const baseGramOption = { measure: 'g', serving_weight: 1, qty: 1 };
    
    if (!food.alt_measures) return [baseGramOption];
    
    // Filter out any 'g' or 'gram' measures from alt_measures
    const filteredMeasures = food.alt_measures.filter(
      measure => !['g', 'gram', 'grams'].includes(measure.measure.toLowerCase())
    );
    
    return [
      baseGramOption,
      ...filteredMeasures
    ];
  }, [food]);

  // Set initial quantity and measure based on API response
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedMeasure, setSelectedMeasure] = useState(() => {
    // Find the measure that matches the serving_unit from the API
    const initialMeasure = servingOptions.find(m => m.measure === food.serving_unit) || servingOptions[0];
    return initialMeasure;
  });

  // Calculate nutrition values based on serving size
  const calculateNutrition = (baseValue) => {
    const numericQuantity = parseFloat(quantity) || 0;
    const baseServing = food.serving_weight_grams || 100;
    
    if (selectedMeasure.measure === 'g') {
      return (baseValue * numericQuantity) / baseServing;
    } else {
      const servingWeight = selectedMeasure.serving_weight || baseServing;
      return (baseValue * (servingWeight / baseServing) * numericQuantity);
    }
  };

  const handleAddMeal = () => {
    const mealData = {
      food_name: food.food_name,
      serving_qty: parseFloat(quantity),
      serving_unit: selectedMeasure.measure,
      serving_weight_grams: selectedMeasure.measure === 'g' 
        ? parseFloat(quantity)
        : (selectedMeasure.serving_weight * parseFloat(quantity)),
      mealCategory,
      nf_calories: calculateNutrition(food.nf_calories),
      nf_protein: calculateNutrition(food.nf_protein),
      nf_total_carbohydrate: calculateNutrition(food.nf_total_carbohydrate),
      nf_total_fat: calculateNutrition(food.nf_total_fat),
      thumb: food.photo?.thumb
    };
    
    addMealToDaily(mealData);
    router.back();
  };

  const handleSaveToCategory = async () => {
    const mealData = {
      food_name: food.food_name,
      serving_qty: parseFloat(quantity),
      serving_unit: selectedMeasure.measure,
      serving_weight_grams: selectedMeasure.measure === 'g' 
        ? parseFloat(quantity)
        : (selectedMeasure.serving_weight * parseFloat(quantity)),
      mealCategory,
      nf_calories: calculateNutrition(food.nf_calories),
      nf_protein: calculateNutrition(food.nf_protein),
      nf_total_carbohydrate: calculateNutrition(food.nf_total_carbohydrate),
      nf_total_fat: calculateNutrition(food.nf_total_fat),
      thumb: food.photo?.thumb
    };

    const success = await saveMealToCategory(mealData, mealCategory);
    if (success) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to save meal to category');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Details</Text>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Removed food name text */}
            
            {/* Serving Size Controls */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Serving Size</Text>
              <View style={styles.servingSizeContainer}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#666"
                />
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedMeasure.measure}
                    onValueChange={(itemValue) => {
                      const measure = servingOptions.find(m => m.measure === itemValue);
                      setSelectedMeasure(measure || servingOptions[0]);
                    }}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    mode="dropdown"
                    backgroundColor="#1c1c1e"
                  >
                    {servingOptions.map((option, index) => (
                      <Picker.Item
                        key={index}
                        label={option.measure}
                        value={option.measure}
                        color="#fff"
                        style={{
                          backgroundColor: '#1c1c1e',
                          fontSize: 16,
                          height: 60,
                        }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Updated Meal Category */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Meal Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={mealCategory}
                  onValueChange={setMealCategory}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                  mode="dropdown"
                  backgroundColor="#1c1c1e"
                >
                  {MEAL_CATEGORIES.map((category, index) => (
                    <Picker.Item
                      key={index}
                      label={category}
                      value={category}
                      color="#fff"
                      style={{
                        backgroundColor: '#1c1c1e',
                        fontSize: 16,
                        height: 60,
                      }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Enhanced Nutrition Facts Panel */}
            <View style={styles.nutritionPanel}>
              <Text style={styles.nutritionTitle}>Nutrition Facts</Text>
              <View style={styles.servingInfo}>
                <Text style={styles.servingText}>
                  Serving size {quantity} {selectedMeasure.measure}
                </Text>
              </View>
              
              <View style={styles.dividerThick} />
              
              <View style={styles.calorieSection}>
                <Text style={styles.calorieTitle}>Calories</Text>
                <Text style={styles.calorieValue}>
                  {Math.round(calculateNutrition(food.nf_calories))}
                </Text>
              </View>
              
              <View style={styles.dividerThick} />
              
              {/* Daily Value % header */}
              <Text style={styles.dailyValueHeader}>% Daily Value*</Text>
              
              {/* Macronutrients with dividers */}
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientMain}>
                  <Text style={styles.nutrientText}>
                    Total Fat {Math.round(calculateNutrition(food.nf_total_fat))}g
                  </Text>
                </View>
                <Text style={styles.dailyValueText}>
                  {Math.round((calculateNutrition(food.nf_total_fat) * 100) / 65)}%
                </Text>
              </View>
              <View style={styles.dividerThin} />
              
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientMain}>
                  <Text style={styles.nutrientText}>
                    Total Carbs {Math.round(calculateNutrition(food.nf_total_carbohydrate))}g
                  </Text>
                </View>
                <Text style={styles.dailyValueText}>
                  {Math.round((calculateNutrition(food.nf_total_carbohydrate) * 100) / 300)}%
                </Text>
              </View>
              <View style={styles.dividerThin} />
              
              <View style={styles.nutrientRow}>
                <View style={styles.nutrientMain}>
                  <Text style={styles.nutrientText}>
                    Protein {Math.round(calculateNutrition(food.nf_protein))}g
                  </Text>
                </View>
                <Text style={styles.dailyValueText}>
                  {Math.round((calculateNutrition(food.nf_protein) * 100) / 50)}%
                </Text>
              </View>
              
              <View style={styles.dividerThick} />
              
              <Text style={styles.disclaimer}>
                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.categoryButton]}
                onPress={handleAddMeal}
              >
                <Text style={styles.buttonText}>Add to Daily Meals</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveToCategory}
              >
                <Text style={styles.buttonText}>Save to {mealCategory}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: Platform.OS === 'ios' ? 50 : 30, // Adjusted for better header positioning
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  servingSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  quantityInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 12,
    height: 60,
  },
  pickerContainer: {
    flex: 2,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0,
    height: 60,
  },
  picker: {
    flex: 1,
    color: '#fff',
    backgroundColor: '#1c1c1e',
    width: '100%',
    height: 60,
  },
  nutritionPanel: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  nutritionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  servingInfo: {
    marginVertical: 8,
  },
  servingText: {
    color: '#fff',
    fontSize: 14,
  },
  dividerThick: {
    height: 8,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  calorieSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calorieTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calorieValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dailyValueHeader: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  nutrientMain: {
    flex: 1,
  },
  nutrientText: {
    color: '#fff',
    fontSize: 16,
  },
  dailyValueText: {
    color: '#fff',
    fontSize: 16,
    width: 50,
    textAlign: 'right',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  categoryButton: {
    backgroundColor: '#0A84FF',
  },
  saveButton: {
    backgroundColor: '#30D158',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  centeredText: {
    textAlign: 'center',
  },
}); 