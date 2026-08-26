import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  PanResponder,
  Image,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import AppText from '../components/AppText';
import AppHeader from '../components/AppHeader';
import AppScreen from '../components/AppScreen';
import CustomAlert from '../components/CustomAlert';
import { petsApi, BASE_URL } from '../services/api';
import CustomCalendar from '../components/CustomCalendar';
import PawLoader from '../components/PawLoader';
import BreedPickerModal from '../components/BreedPickerModal';

const { width } = Dimensions.get('window');

const AddPetProfileScreen = ({ navigation, route }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePet, setActivePet] = useState(null); // null means 'Add Pet'

  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [size, setSize] = useState('Medium');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [age, setAge] = useState(1);
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [temperament, setTemperament] = useState(0.5);
  const [medicalConditions, setMedicalConditions] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderWidthRef = useRef(0);
  const startTemperamentRef = useRef(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await petsApi.list();
      setPets(res || []);

      const editPet = route.params?.pet;
      if (editPet) {
        const found = res.find(p => p.id === editPet.id);
        if (found) populateForm(found);
        else if (res.length > 0) populateForm(res[0]);
      } else if (res.length > 0) {
        populateForm(res[0]);
      } else {
        clearForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (birthDate && birthDate.length === 10) {
      const parts = birthDate.split('/');
      if (parts.length === 3) {
        const bd = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(bd.getTime())) {
          const ageDiffMs = Date.now() - bd.getTime();
          const ageDate = new Date(ageDiffMs);
          const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
          if (calculatedAge !== age) {
            setAge(calculatedAge || 1);
          }
        }
      }
    }
  }, [birthDate]);

  const populateForm = (pet) => {
    setActivePet(pet);
    setPetName(pet.name || '');
    setBreed(pet.breed || '');
    setSize(pet.size || 'Medium');
    setAge(pet.age || 1);
    setBirthDate(pet.birthDate || '');
    setWeight(pet.weight || '');
    setTemperament(parseFloat(pet.temperament) || 0.5);
    setMedicalConditions(pet.medicalNotes || '');
    setImageUri(pet.photoUrl ? (pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}`) : null);
    setShowDatePicker(false);
  };

  const clearForm = () => {
    setActivePet(null);
    setPetName('');
    setBreed('');
    setSize('Medium');
    setAge(1);
    setBirthDate('');
    setWeight('');
    setTemperament(0.5);
    setMedicalConditions('');
    setImageUri(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Wide aspect ratio matching the image
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!petName.trim() || !breed.trim()) {
      setAlertConfig({ visible: true, title: 'Missing Information', message: 'Please fill out pet name and breed.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', petName);
      formData.append('breed', breed);
      formData.append('size', size);
      formData.append('age', age.toString());
      formData.append('birthDate', birthDate);
      formData.append('weight', weight);
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

      if (activePet) {
        await petsApi.update(activePet.id, formData);
      } else {
        await petsApi.create(formData);
        await AsyncStorage.setItem('isOnboarded', 'true');
      }

      setAlertConfig({
        visible: true,
        title: 'Success!',
        message: activePet ? 'Pet profile updated successfully!' : 'Pet profile created successfully!',
        iconName: 'check-circle-outline',
        type: 'success',
        onClose: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (!activePet) {
            navigation.navigate('LandingScreen');
          } else {
            fetchPets(); // Refresh list
          }
        }
      });
    } catch (error) {
      console.error('Pet profile error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to save pet profile.',
        onClose: () => setAlertConfig(prev => ({ ...prev, visible: false }))
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
        const w = sliderWidthRef.current;
        if (w > 0) {
          const newTemp = Math.max(0, Math.min(1, locationX / w));
          setTemperament(newTemp);
          startTemperamentRef.current = newTemp;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const w = sliderWidthRef.current;
        if (w > 0) {
          const newTemp = Math.max(0, Math.min(1, startTemperamentRef.current + (gestureState.dx / w)));
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
    <AppScreen padding={false} backgroundColor="#F9F9F9" safeArea>
      {/* HEADER */}
      <AppHeader title="Manage Pets" />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <PawLoader fullScreen={false} />
        </View>
      ) : (
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={100}
        >
          {/* PET SELECTION HORIZONTAL LIST */}
          {pets.length > 0 && (
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            nestedScrollEnabled={true}
            alwaysBounceHorizontal={true}
            contentContainerStyle={styles.petListScroll}
          >
            {/* ADD PET BUTTON */}
            <TouchableOpacity
              style={styles.petSelectorItem}
              onPress={clearForm}
            >
              <View style={[styles.petAvatarWrapper, styles.addPetWrapper, !activePet && styles.petAvatarActive]}>
                <Ionicons name="add" size={28} color={theme.colors.textSecondary} />
              </View>
              <AppText style={[styles.petSelectorName, !activePet && styles.petSelectorNameActive]}>Add Pet</AppText>
            </TouchableOpacity>

            {pets.map(pet => {
              const isActive = activePet?.id === pet.id;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petSelectorItem}
                  onPress={() => populateForm(pet)}
                >
                  <View style={[styles.petAvatarWrapper, isActive && styles.petAvatarActive]}>
                    {pet.photoUrl ? (
                      <Image source={{ uri: pet.photoUrl.startsWith('http') ? pet.photoUrl : `${BASE_URL}${pet.photoUrl}` }} style={styles.petAvatarImg} />
                    ) : (
                      <Ionicons name="paw" size={24} color="#C4C4C4" />
                    )}
                  </View>
                  <AppText style={[styles.petSelectorName, isActive && styles.petSelectorNameActive]}>{pet.name}</AppText>
                </TouchableOpacity>
              )
            })}

            </ScrollView>
          )}

          {/* MAIN FORM CARD */}
          <View style={styles.formContainer}>
            <AppText style={styles.sectionTitle} weight="bold">{activePet ? 'Edit Profile' : 'New Profile'}</AppText>

            <View style={styles.card}>
              {/* HERO PHOTO UPLOAD */}
              <TouchableOpacity style={styles.heroImageContainer} onPress={pickImage} activeOpacity={0.8}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#A0AEC0" />
                    <AppText style={styles.uploadText}>Upload Photo</AppText>
                  </View>
                )}
                <View style={styles.heroEditBadge}>
                  <MaterialCommunityIcons name="pencil" size={16} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.cardContent}>
                {/* NAME */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Name</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bruno"
                    placeholderTextColor="#A0AEC0"
                    value={petName}
                    onChangeText={setPetName}
                  />
                </View>

                {/* SIZE */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Size</AppText>
                  <View style={styles.sizeChipsContainer}>
                    {['Small', 'Medium', 'Large'].map((s) => {
                      const isActive = size === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[styles.sizeChip, isActive && styles.sizeChipActive]}
                          onPress={() => {
                            setSize(s);
                            setBreed(''); // Reset breed when size changes
                          }}
                          activeOpacity={0.8}
                        >
                          <AppText style={[styles.sizeChipText, isActive && styles.sizeChipTextActive]} weight={isActive ? 'bold' : 'normal'}>
                            {s}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* BREED */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Breed</AppText>
                  <TouchableOpacity
                    style={[styles.input, styles.dropdownInput]}
                    onPress={() => setShowBreedPicker(true)}
                    activeOpacity={0.8}
                  >
                    <AppText style={[styles.dropdownText, !breed && { color: '#A0AEC0' }]}>
                      {breed || 'Select a breed...'}
                    </AppText>
                    <Ionicons name="chevron-down" size={20} color="#A0AEC0" />
                  </TouchableOpacity>
                </View>

                {/* AGE STEPPER */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Age</AppText>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity onPress={() => setAge(Math.max(1, age - 1))} style={styles.stepperBtn}>
                      <Ionicons name="remove" size={24} color={theme.colors.primaryDark} />
                    </TouchableOpacity>
                    <AppText style={styles.stepperValue} weight="bold">{age}</AppText>
                    <TouchableOpacity onPress={() => setAge(age + 1)} style={styles.stepperBtn}>
                      <Ionicons name="add" size={24} color={theme.colors.primaryDark} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* BIRTHDAY */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Birthday</AppText>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                    <View pointerEvents="none">
                      <TextInput
                        style={styles.input}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#A0AEC0"
                        value={birthDate}
                        editable={false}
                      />
                    </View>
                  </TouchableOpacity>

                  <Modal visible={showDatePicker} transparent animationType="fade">
                    <View style={styles.calendarModalOverlay}>
                      <View style={styles.calendarModalContent}>
                        <CustomCalendar
                          disablePastDates={false}
                          disableFutureDates={true}
                          selectedDate={(() => {
                            if (!birthDate) return new Date();
                            const parts = birthDate.split('/');
                            if (parts.length === 3) {
                              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                              if (!isNaN(d.getTime())) return d;
                            }
                            return new Date();
                          })()}
                          onDateSelect={(dateStr) => {
                            setShowDatePicker(false);
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                              const d = String(date.getDate()).padStart(2, '0');
                              const m = String(date.getMonth() + 1).padStart(2, '0');
                              const y = date.getFullYear();
                              setBirthDate(`${d}/${m}/${y}`);
                            }
                          }}
                        />
                        <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowDatePicker(false)}>
                          <AppText style={styles.closeCalendarText} weight="bold">Close</AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </View>

                {/* WEIGHT */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Weight (kg)</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 15"
                    placeholderTextColor="#A0AEC0"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>

                {/* TEMPERAMENT */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Temperament</AppText>
                  <View style={styles.sliderWrapper}>
                    <View
                      style={styles.sliderTrack}
                      onLayout={(e) => {
                        setSliderWidth(e.nativeEvent.layout.width);
                        sliderWidthRef.current = e.nativeEvent.layout.width;
                      }}
                      {...panResponder.panHandlers}
                    >
                      <View style={[styles.sliderFill, { width: sliderWidth * temperament }]} />
                      <View
                        style={[styles.sliderThumb, { left: (sliderWidth * temperament) - 12 }]}
                      />
                    </View>
                    <View style={styles.sliderLabels}>
                      <View style={styles.sliderLabelItem}>
                        <MaterialCommunityIcons name="dog" size={20} color="#4A5568" />
                        <AppText style={styles.sliderLabelText}>Calm</AppText>
                      </View>
                      <View style={styles.sliderLabelItem}>
                        <AppText style={styles.sliderLabelText}>Aggressive</AppText>
                        <MaterialCommunityIcons name="dog-side" size={20} color="#4A5568" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* MEDICAL CONDITIONS */}
                <View style={styles.inputGroup}>
                  <AppText style={styles.label}>Medical Conditions</AppText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Skin allergies, any recent surgery, none"
                    placeholderTextColor="#A0AEC0"
                    value={medicalConditions}
                    onChangeText={setMedicalConditions}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* INFO BANNER */}
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle-outline" size={20} color="#4A5568" style={{ marginTop: 2 }} />
                  <AppText style={styles.infoText}>
                    Adding a clear photo helps our partner to recognise your pet instantly and builds trust within the community.
                  </AppText>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <AppText style={styles.saveButtonText} weight="bold">
                    {saving ? 'Saving...' : (activePet ? 'Update Details' : 'Add Pet')}
                  </AppText>
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose || (() => setAlertConfig(prev => ({ ...prev, visible: false })))}
        type={alertConfig.type}
        iconName={alertConfig.iconName}
      />
      <BreedPickerModal
        visible={showBreedPicker}
        onClose={() => setShowBreedPicker(false)}
        selectedSize={size}
        onSelect={(selectedBreed) => setBreed(selectedBreed)}
      />

    </AppScreen>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  backButton: {
    marginRight: 16,
    marginLeft: -12,
    padding: 4,
  },
  appBarTitle: {
    fontSize: 22,
    color: '#000000',
    fontFamily: theme.fonts.heading,
    marginLeft: -10,
    marginTop: 2
  },
  petListScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  petSelectorItem: {
    alignItems: 'center',
    width: 65,
  },
  petAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petAvatarActive: {
    borderColor: '#4285F4', // Blue border for active
  },
  addPetWrapper: {
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    borderStyle: 'dashed',
    shadowOpacity: 0,
    elevation: 0,
  },
  petAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  petSelectorName: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
  petSelectorNameActive: {
    color: '#2D3748',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#000000ff',
    fontFamily: theme.fonts.heading,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  heroImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#EDF2F7',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#718096',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  heroEditBadge: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    backgroundColor: '#4A5568',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  cardContent: {
    padding: 24,
  },
  inputGroup: {
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
    borderColor: theme.colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2D3748',
    fontFamily: theme.fonts.regular,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F9FA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  stepperBtn: {
    padding: 10,
  },
  stepperValue: {
    fontSize: 18,
    color: '#2D3748',
  },
  sliderWrapper: {
    marginTop: 0,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#4A5568',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabelText: {
    fontSize: 13,
    color: '#718096',
  },
  textArea: {
    height: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#4E6C48',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeCalendarBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeCalendarText: {
    color: theme.colors.primaryDark,
    fontSize: 16,
  },
  sizeChipsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeChip: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  sizeChipActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  sizeChipText: {
    color: '#718096',
    fontSize: 14,
  },
  sizeChipTextActive: {
    color: '#FFF',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: '#2D3748',
  }
});

export default AddPetProfileScreen;
