import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import { theme } from '../styles/theme';
import { customerApi, BASE_URL } from '../services/api';
import PawLoader from '../components/PawLoader';

const { width } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profileData = await customerApi.getProfile();
      setUser({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        avatar: (profileData.image && profileData.image !== 'null') ? (profileData.image.startsWith('http') ? profileData.image : `${BASE_URL}${profileData.image}`) : null,
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Please grant camera roll permissions to change your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        const selectedImage = result.assets[0];

        const formData = new FormData();
        if (Platform.OS === 'web') {
          const response = await fetch(selectedImage.uri);
          const blob = await response.blob();
          formData.append('photo', blob, 'profile_photo.jpg');
        } else {
          const filename = selectedImage.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('photo', { uri: selectedImage.uri, name: filename, type });
        }

        const uploadRes = await customerApi.uploadPhoto(formData);
        if (uploadRes.success) {
          await fetchProfile();
        }
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      alert('Failed to update profile photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customerApi.updateProfile({
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !saving && !user.name) {
    return (
      <AppScreen backgroundColor={theme.colors.background}>
        <PawLoader fullScreen={false} />
      </AppScreen>
    );
  }

  return (
    <AppScreen safeAreaTop={true} padding={false} backgroundColor="#FFFFFF">
      {/* Header */}
      <AppHeader title="Edit Profile" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Success Banner */}
          {showSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#4B6B54" />
              <AppText style={styles.successText}>Profile saved successfully</AppText>
            </View>
          )}

          <View style={styles.container}>
            {/* Avatar Section */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handleEditAvatar} style={styles.avatarWrapper}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color="#C4C4C4" />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <AppText style={styles.label}>Full Name</AppText>
              <TextInput
                style={styles.input}
                value={user.name}
                onChangeText={(text) => setUser({ ...user, name: text })}
                placeholder="Enter full name"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.formGroup}>
              <AppText style={styles.label}>Email</AppText>
              <TextInput
                style={styles.input}
                value={user.email}
                onChangeText={(text) => setUser({ ...user, email: text })}
                placeholder="Enter email address"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <AppText style={styles.label}>Phone Number</AppText>
              <TextInput
                style={styles.input}
                value={user.phone}
                onChangeText={(text) => setUser({ ...user, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <AppText style={styles.saveButtonText} weight="bold">Save</AppText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  appBarTitle: {
    fontSize: 22,
    color: '#000000ff',
    fontFamily: theme.fonts.heading,
    fontWeight: '600',
    marginLeft: 4,
    marginTop: 4, // Nudged down slightly
  },
  backButton: {
    marginLeft: -12,
    padding: 4,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
  },
  successBanner: {
    backgroundColor: '#FFFBEB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  successText: {
    marginLeft: 10,
    color: '#2d3748',
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A5568',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#000000ff',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 14,
    color: '#2D3748',
    fontFamily: theme.fonts.regular,
  },
  saveButton: {
    backgroundColor: '#4B6B54',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  }
});

export default EditProfileScreen;
