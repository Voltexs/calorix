import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function BodyStats() {
  const router = useRouter();
  const [stats, setStats] = useState({
    bodyFat: '',
    muscleWeight: '',
    neck: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const data = JSON.parse(userData);
        setStats(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const handleSave = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const existingData = userData ? JSON.parse(userData) : {};
      
      const updatedData = {
        ...existingData,
        ...stats
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      router.back();
    } catch (e) {
      console.error('Error saving stats:', e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Body Stats</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Body Fat %</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter body fat percentage"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.bodyFat}
            onChangeText={text => setStats(prev => ({ ...prev, bodyFat: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Muscle Mass (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter muscle mass"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.muscleWeight}
            onChangeText={text => setStats(prev => ({ ...prev, muscleWeight: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Neck (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter neck circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.neck}
            onChangeText={text => setStats(prev => ({ ...prev, neck: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chest (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter chest circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.chest}
            onChangeText={text => setStats(prev => ({ ...prev, chest: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Waist (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter waist circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.waist}
            onChangeText={text => setStats(prev => ({ ...prev, waist: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hips (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter hips circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.hips}
            onChangeText={text => setStats(prev => ({ ...prev, hips: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biceps (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter biceps circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.biceps}
            onChangeText={text => setStats(prev => ({ ...prev, biceps: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thighs (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter thighs circumference"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={stats.thighs}
            onChangeText={text => setStats(prev => ({ ...prev, thighs: text }))}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Stats</Text>
        </TouchableOpacity>
      </View>
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
  form: {
    padding: 16,
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
  saveButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
}); 