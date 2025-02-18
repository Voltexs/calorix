import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProgressPhotos() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    loadPhotos();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to use this feature.');
    }
  };

  const loadPhotos = async () => {
    try {
      const savedPhotos = await AsyncStorage.getItem('progressPhotos');
      if (savedPhotos) {
        setPhotos(JSON.parse(savedPhotos));
      }
    } catch (e) {
      console.error('Error loading photos:', e);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          date: new Date().toISOString(),
        };

        const updatedPhotos = [...photos, newPhoto];
        await AsyncStorage.setItem('progressPhotos', JSON.stringify(updatedPhotos));
        setPhotos(updatedPhotos);
      }
    } catch (e) {
      console.error('Error taking photo:', e);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const deletePhoto = async (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = photos.filter(photo => photo.id !== photoId);
            await AsyncStorage.setItem('progressPhotos', JSON.stringify(updatedPhotos));
            setPhotos(updatedPhotos);
          }
        }
      ],
      { userInterfaceStyle: 'dark' }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Progress Photos</Text>
      </View>

      <ScrollView style={styles.photosContainer}>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <TouchableOpacity 
              key={photo.id} 
              style={styles.photoItem}
              onLongPress={() => deletePhoto(photo.id)}
            >
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <Text style={styles.photoDate}>
                {new Date(photo.date).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={takePhoto}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Take Progress Photo</Text>
      </TouchableOpacity>
    </View>
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
  photosContainer: {
    flex: 1,
    padding: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoDate: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 