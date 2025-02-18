import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MacroGoals() {
  const router = useRouter();
  const [macros, setMacros] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    distribution: 'custom' // custom, balanced, lowCarb, highProtein
  });

  useEffect(() => {
    loadMacros();
  }, []);

  const loadMacros = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const data = JSON.parse(userData);
        if (data.macros) {
          setMacros(data.macros);
        }
      }
    } catch (e) {
      console.error('Error loading macros:', e);
    }
  };

  const presetDistributions = [
    {
      id: 'balanced',
      label: 'Balanced',
      description: '30P/40C/30F',
      split: { protein: 30, carbs: 40, fat: 30 }
    },
    {
      id: 'lowCarb',
      label: 'Low Carb',
      description: '35P/25C/40F',
      split: { protein: 35, carbs: 25, fat: 40 }
    },
    {
      id: 'highProtein',
      label: 'High Protein',
      description: '40P/40C/20F',
      split: { protein: 40, carbs: 40, fat: 20 }
    }
  ];

  const applyDistribution = (split) => {
    const calories = parseFloat(macros.calories) || 2000;
    const protein = Math.round((calories * (split.protein / 100)) / 4);
    const carbs = Math.round((calories * (split.carbs / 100)) / 4);
    const fat = Math.round((calories * (split.fat / 100)) / 9);

    setMacros(prev => ({
      ...prev,
      protein: protein.toString(),
      carbs: carbs.toString(),
      fat: fat.toString()
    }));
  };

  const calculatePercentages = () => {
    const protein = parseFloat(macros.protein) || 0;
    const carbs = parseFloat(macros.carbs) || 0;
    const fat = parseFloat(macros.fat) || 0;
    
    const totalCalories = (protein * 4) + (carbs * 4) + (fat * 9);
    
    return {
      protein: Math.round((protein * 4 / totalCalories) * 100),
      carbs: Math.round((carbs * 4 / totalCalories) * 100),
      fat: Math.round((fat * 9 / totalCalories) * 100)
    };
  };

  const handleSave = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const existingData = userData ? JSON.parse(userData) : {};
      
      const updatedData = {
        ...existingData,
        macros: macros
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      router.back();
    } catch (e) {
      console.error('Error saving macros:', e);
    }
  };

  const percentages = calculatePercentages();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Macro Goals</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Calories</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Enter daily calorie goal"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={macros.calories}
            onChangeText={text => setMacros(prev => ({ ...prev, calories: text }))}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preset Distributions</Text>
        <View style={styles.presetContainer}>
          {presetDistributions.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                macros.distribution === preset.id && styles.selectedPreset
              ]}
              onPress={() => {
                setMacros(prev => ({ ...prev, distribution: preset.id }));
                applyDistribution(preset.split);
              }}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetDescription}>{preset.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Macros</Text>
        <View style={styles.macroInputs}>
          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={macros.protein}
              onChangeText={text => {
                setMacros(prev => ({ ...prev, protein: text, distribution: 'custom' }));
              }}
            />
            <Text style={styles.percentage}>{percentages.protein}%</Text>
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={macros.carbs}
              onChangeText={text => {
                setMacros(prev => ({ ...prev, carbs: text, distribution: 'custom' }));
              }}
            />
            <Text style={styles.percentage}>{percentages.carbs}%</Text>
          </View>

          <View style={styles.macroInput}>
            <Text style={styles.macroLabel}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={macros.fat}
              onChangeText={text => {
                setMacros(prev => ({ ...prev, fat: text, distribution: 'custom' }));
              }}
            />
            <Text style={styles.percentage}>{percentages.fat}%</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Macro Goals</Text>
      </TouchableOpacity>
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
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  presetButton: {
    width: '48%',
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectedPreset: {
    backgroundColor: '#1c1c1e',
    borderColor: '#0A84FF',
    borderWidth: 1,
  },
  presetLabel: {
    color: '#fff',
    fontSize: 17,
    marginBottom: 4,
  },
  presetDescription: {
    color: '#666',
    fontSize: 13,
  },
  macroInputs: {
    marginTop: 8,
  },
  macroInput: {
    marginBottom: 16,
  },
  macroLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  percentage: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
}); 