import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  PanResponder,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import CustomAlert from '../components/CustomAlert';
import { petsApi, BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');

const AddPetProfileScreen = ({ navigation, route }) => {
  const editPet = route.params?.pet;
  const isEdit = !!editPet;

  const [petName, setPetName] = useState(editPet?.name || '');
  const [breed, setBreed] = useState(editPet?.breed || '');
  const [age, setAge] = useState(editPet?.age || '');
  const [gender, setGender] = useState(editPet?.gender || 'Male');
  const [weight, setWeight] = useState(editPet?.weight || '');
  const [size, setSize] = useState(editPet?.size || 'Medium');
  const [temperament, setTemperament] = useState(parseFloat(editPet?.temperament) || 0.5); // 0 to 1
  const [medicalConditions, setMedicalConditions] = useState(editPet?.medicalNotes || '');
  const [imageUri, setImageUri] = useState(editPet?.photoUrl ? (editPet.photoUrl.startsWith('http') ? editPet.photoUrl : `${BASE_URL}${editPet.photoUrl}`) : null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderWidthRef = useRef(0);
  const startTemperamentRef = useRef(0);

  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddPet = async () => {
    if (!petName.trim() || !breed.trim()) {
      setAlertConfig({ visible: true, title: 'Missing Information', message: 'Please fill out pet name and breed before continuing.' });
      return;
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', petName);
      formData.append('breed', breed);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('weight', weight);
      formData.append('size', size);
      formData.append('temperament', temperament.toString());
      formData.append('medicalNotes', medicalConditions);

      if (imageUri && !imageUri.startsWith('http')) {
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('photo', blob, 'pet-photo.jpg');
        } else {
          const filename = imageUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('photo', { uri: imageUri, name: filename, type });
        }
      }

      if (isEdit) {
        await petsApi.update(editPet.id, formData);
      } else {
        await petsApi.create(formData);
      }
      
      setAlertConfig({ 
        visible: true, 
        title: 'Success!', 
        message: isEdit ? 'Pet profile updated successfully!' : 'Pet profile created successfully!',
        onClose: () => {
          setAlertConfig({ ...alertConfig, visible: false });
          navigation.navigate('LandingScreen');
        }
      });
    } catch (error) {
      console.error('Pet profile error:', error);
      setAlertConfig({ 
        visible: true, 
        title: 'Error', 
        message: error.message || 'Failed to save pet profile.',
        onClose: () => setAlertConfig({ ...alertConfig, visible: false })
      });
    } finally {
      setSaving(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const { locationX } = evt.nativeEvent;
        const width = sliderWidthRef.current;
        if (width > 0) {
          const newTemp = Math.max(0, Math.min(1, locationX / width));
          setTemperament(newTemp);
          startTemperamentRef.current = newTemp;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const width = sliderWidthRef.current;
        if (width > 0) {
          const newTemp = Math.max(0, Math.min(1, startTemperamentRef.current + (gestureState.dx / width)));
          setTemperament(newTemp);
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      }
    })
  ).current;

  return (
    <AppScreen padding={false} backgroundColor={theme.colors.background}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDragging}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textBlack} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle} type="heading" weight="bold">Pet Profile</AppText>
        </View>

        {/* INTRO TEXT */}
        <View style={styles.introSection}>
          <AppText type="heading" weight="600" style={styles.mainTitle}>
            Tell us about <AppText type="heading" weight="600" style={styles.highlightText}>your dog</AppText>
          </AppText>
          <AppText style={styles.subtitle}>
            Every detail helps us find the perfect sitter for your furry companion
          </AppText>
        </View>

        {/* MAIN CARD */}
        <View style={styles.card}>

          {/* PHOTO UPLOAD */}
          <View style={styles.photoContainer}>
            <TouchableOpacity style={styles.photoUploadBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-outline" size={28} color={theme.colors.textPrimary} />
                  <AppText style={styles.uploadText}>UPLOAD PHOTO</AppText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.editIconBtn} onPress={pickImage}>
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS */}

          {/* NAME */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Name</AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bruno"
              placeholderTextColor={theme.colors.textSecondary}
              value={petName}
              onChangeText={setPetName}
            />
          </View>

          {/* BREED */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Breed</AppText>
            <TextInput
              style={styles.input}
              placeholder="Golden Retriever"
              placeholderTextColor={theme.colors.textSecondary}
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          {/* AGE */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Age (Years)</AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3"
              placeholderTextColor={theme.colors.textSecondary}
              value={age.toString()}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* GENDER */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Gender</AppText>
            <View style={styles.sizeSelectorRow}>
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.sizeBtn,
                    gender === g && styles.sizeBtnActive
                  ]}
                  onPress={() => setGender(g)}
                >
                  <AppText 
                    style={[
                      styles.sizeBtnText,
                      gender === g && styles.sizeBtnTextActive
                    ]}
                  >
                    {g}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* WEIGHT */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Weight (kg)</AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              placeholderTextColor={theme.colors.textSecondary}
              value={weight.toString()}
              onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* SIZE */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Size</AppText>
            <View style={styles.sizeSelectorRow}>
              {['Small', 'Medium', 'Large'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sizeBtn,
                    size === s && styles.sizeBtnActive
                  ]}
                  onPress={() => setSize(s)}
                >
                  <AppText 
                    style={[
                      styles.sizeBtnText,
                      size === s && styles.sizeBtnTextActive
                    ]}
                  >
                    {s}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* TEMPERAMENT */}
          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { marginBottom: -8 }]}>Temperament</AppText>
            <View
              style={styles.sliderWrapper}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setSliderWidth(w);
                sliderWidthRef.current = w;
              }}
              {...panResponder.panHandlers}
            >
              <View style={styles.sliderTrackBg}>
                <View pointerEvents="none" style={[styles.sliderTrackFill, { width: `${temperament * 100}%` }]} />
              </View>
              <View pointerEvents="none" style={[styles.sliderThumb, { left: `${temperament * 100}%` }]} />
            </View>
            <View style={styles.sliderLabels}>
              <View style={styles.sliderLabelItem}>
                <MaterialCommunityIcons name="paw" size={18} color={theme.colors.textPrimary} style={{ opacity: 0.7 }} />
                <AppText style={styles.sliderLabelText}>Calm</AppText>
              </View>
              <View style={styles.sliderLabelItem}>
                <AppText style={styles.sliderLabelText}>Aggressive</AppText>
                <MaterialCommunityIcons name="paw" size={18} color={theme.colors.textPrimary} style={{ opacity: 0.7 }} />
              </View>
            </View>
          </View>

          {/* MEDICAL CONDITIONS */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Medical Conditions</AppText>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Skin allergies, any recent surgery, none"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={medicalConditions}
              onChangeText={setMedicalConditions}
            />
          </View>

          {/* INFO BOX */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textPrimary} style={styles.infoIcon} />
            <AppText style={styles.infoText}>
              Adding a clear photo helps our partner to recognise your pet instantly and builds trust within the community.
            </AppText>
          </View>

        {/* ADD/UPDATE PET BUTTON */}
        <AppButton
          title={isEdit ? "Update Pet" : "Add Pet"}
          style={styles.addPetBtn}
          textStyle={styles.addPetBtnText}
          onPress={handleAddPet}
          loading={saving}
        />
        </View>

      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose || (() => setAlertConfig({ ...alertConfig, visible: false }))}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: theme.colors.textBlack,
    fontFamily: theme.fonts.heading,
  },
  introSection: {
    paddingHorizontal: 28,
    marginBottom: 20,
    marginTop: 10,
  },
  mainTitle: {
    fontSize: 26,
    color: theme.colors.textBlack,
    lineHeight: 32,
    marginBottom: 8,
  },
  highlightText: {
    color: theme.colors.primary,
    fontSize: 26,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    marginTop: 10,
  },
  photoUploadBox: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: theme.colors.primaryDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  editIconBtn: {
    position: 'absolute',
    bottom: -15,
    right: 20,
    backgroundColor: theme.colors.primaryDark,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  sizeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sizeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  sizeBtnText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sizeBtnTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  sliderWrapper: {
    height: 40,
    justifyContent: 'center',
    marginVertical: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  sliderTrackBg: {
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    width: '100%',
  },
  sliderTrackFill: {
    height: 4,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 11,
    top: 9,
    marginLeft: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: -8,
  },
  sliderLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    minHeight: 120,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: -2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  addPetBtn: {
    backgroundColor: theme.colors.success,
    height: 56,
    borderRadius: 12,
    marginBottom: 10,
  },
  addPetBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});

export default AddPetProfileScreen;
