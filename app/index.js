import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('maintain');
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    if (!params.isUpdate) {
      checkExistingData();
    } else {
      setIsUpdate(true);
      loadExistingData();
    }
  }, []);

  const loadExistingData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const data = JSON.parse(userData);
        setName(data.name?.toString() || '');
        setAge(data.age?.toString() || '');
        setGender(data.gender || 'Male');
        setWeight(data.weight?.toString() || '');
        setHeight(data.height?.toString() || '');
        setGoal(data.goal || 'maintain');
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const checkExistingData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData !== null && !params.isUpdate) {
        router.replace({
          pathname: '/(tabs)/dashboard',
          params: JSON.parse(userData)
        });
      }
    } catch (e) {
      console.log('Error reading data:', e);
    }
  };

  const handleSubmit = async () => {
    const weightValue = parseFloat(weight.trim());
    
    if (!weightValue || weightValue <= 0 || weightValue > 300) {
      alert('Please enter a valid weight in kg (1-300)');
      return;
    }

    const formData = {
      name: name.trim(),
      age: parseInt(age.trim()) || 0,
      gender,
      weight: weightValue,
      height: parseFloat(height.trim()) || 0,
      goal
    };

    console.log('Saving user data:', formData);

    try {
      // Clear all existing data
      await AsyncStorage.multiRemove([
        'userData',
        'nutritionGoals',
        'dailyNutrition'
      ]);
      
      // Save new data
      await AsyncStorage.setItem('userData', JSON.stringify(formData));
      
      // Force reload app
      router.replace({
        pathname: '/(tabs)/dashboard',
        params: { ...formData, timestamp: Date.now() } // Force refresh
      });
    } catch (e) {
      console.error('Error saving data:', e);
      alert('Error saving data. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const SelectButton = ({ selected, onPress, children }) => (
    <TouchableOpacity 
      style={[
        styles.selectButton,
        selected && styles.selectButtonActive
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.selectButtonText,
        selected && styles.selectButtonTextActive
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {isUpdate && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="always">
        <Text style={[styles.title, isUpdate && styles.updateTitle]}>
          {isUpdate ? 'Update Stats' : 'Welcome to Calorix'}
        </Text>
        {!isUpdate && (
          <Text style={styles.subtitle}>Let's get started with your profile</Text>
        )}

        <View style={[styles.form, isUpdate && styles.updateForm]}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={text => setName(text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Your age"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={age}
              onChangeText={text => setAge(text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.buttonGroup}>
              <SelectButton 
                selected={gender === 'Male'} 
                onPress={() => setGender('Male')}
              >
                Male
              </SelectButton>
              <SelectButton 
                selected={gender === 'Female'} 
                onPress={() => setGender('Female')}
              >
                Female
              </SelectButton>
              <SelectButton 
                selected={gender === 'Other'} 
                onPress={() => setGender('Other')}
              >
                Other
              </SelectButton>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your weight"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={weight}
              onChangeText={text => setWeight(text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Your height"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={height}
              onChangeText={text => setHeight(text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.buttonGroup}>
              <SelectButton 
                selected={goal === 'cut'} 
                onPress={() => setGoal('cut')}
              >
                Cut
              </SelectButton>
              <SelectButton 
                selected={goal === 'maintain'} 
                onPress={() => setGoal('maintain')}
              >
                Maintain
              </SelectButton>
              <SelectButton 
                selected={goal === 'bulk'} 
                onPress={() => setGoal('bulk')}
              >
                Bulk
              </SelectButton>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, isUpdate && styles.updateButton]} 
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>
              {isUpdate ? 'Save Changes' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  updateTitle: {
    marginTop: 0,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  form: {
    padding: 20,
  },
  updateForm: {
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  selectButtonActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  selectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#0A84FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  updateButton: {
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 