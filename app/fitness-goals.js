import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FitnessGoals() {
  const router = useRouter();
  const [goals, setGoals] = useState({
    targetWeight: '',
    weeklyGoal: '0.5',
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const data = JSON.parse(userData);
        setGoals(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (e) {
      console.error('Error loading goals:', e);
    }
  };

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { id: 'light', label: 'Light', description: '1-3 days/week' },
    { id: 'moderate', label: 'Moderate', description: '3-5 days/week' },
    { id: 'active', label: 'Active', description: '6-7 days/week' },
    { id: 'very', label: 'Very Active', description: 'Athletic training' }
  ];

  const weightGoals = [
    { id: 'lose', label: 'Lose Weight', icon: 'trending-down' },
    { id: 'maintain', label: 'Maintain Weight', icon: 'remove' },
    { id: 'gain', label: 'Gain Weight', icon: 'trending-up' }
  ];

  const handleSave = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const existingData = userData ? JSON.parse(userData) : {};
      
      const updatedData = {
        ...existingData,
        ...goals
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      router.back();
    } catch (e) {
      console.error('Error saving goals:', e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fitness Goals</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Goal</Text>
        <View style={styles.goalButtons}>
          {weightGoals.map(weightGoal => (
            <TouchableOpacity
              key={weightGoal.id}
              style={[
                styles.goalButton,
                goals.goal === weightGoal.id && styles.selectedGoal
              ]}
              onPress={() => setGoals(prev => ({ ...prev, goal: weightGoal.id }))}
            >
              <Ionicons 
                name={weightGoal.icon} 
                size={24} 
                color={goals.goal === weightGoal.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.goalButtonText,
                goals.goal === weightGoal.id && styles.selectedGoalText
              ]}>
                {weightGoal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter target weight"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={goals.targetWeight}
            onChangeText={text => setGoals(prev => ({ ...prev, targetWeight: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weekly Goal (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Weight change per week"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={goals.weeklyGoal}
            onChangeText={text => setGoals(prev => ({ ...prev, weeklyGoal: text }))}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Level</Text>
        {activityLevels.map(level => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.activityItem,
              goals.activityLevel === level.id && styles.selectedActivity
            ]}
            onPress={() => setGoals(prev => ({ ...prev, activityLevel: level.id }))}
          >
            <View>
              <Text style={styles.activityTitle}>{level.label}</Text>
              <Text style={styles.activityDescription}>{level.description}</Text>
            </View>
            {goals.activityLevel === level.id && (
              <Ionicons name="checkmark" size={24} color="#0A84FF" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Goals</Text>
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
  goalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  goalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedGoal: {
    backgroundColor: '#0A84FF',
  },
  goalButtonText: {
    color: '#666',
    marginTop: 8,
  },
  selectedGoalText: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedActivity: {
    backgroundColor: '#1c1c1e',
    borderColor: '#0A84FF',
    borderWidth: 1,
  },
  activityTitle: {
    color: '#fff',
    fontSize: 17,
    marginBottom: 4,
  },
  activityDescription: {
    color: '#666',
    fontSize: 13,
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