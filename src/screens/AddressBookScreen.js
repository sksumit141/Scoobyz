import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppScreen from '../components/AppScreen';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import { theme } from '../styles/theme';
import { addressApi } from '../services/api';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const AddressBookScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets ? useSafeAreaInsets() : { top: 40 };
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });
  const [locating, setLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    label: 'Home',
    fullAddress: '',
    areaLocality: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    fetchAddresses();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation(loc.coords);
      }
    } catch (e) {
      console.log('Error getting current location for distance', e);
    }
  };

  const calculateDistance = (lat, lon) => {
    if (!currentLocation || !lat || !lon) return null;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat - currentLocation.latitude);
    const dLon = toRad(lon - currentLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(currentLocation.latitude)) *
        Math.cos(toRad(lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    if (d < 1) return `${Math.round(d * 1000)} m`;
    return `${d.toFixed(1)} km`;
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressApi.list();
      setAddresses(data);
    } catch (error) {
      console.error('Fetch addresses error:', error);
      showAlert('Error', 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };


  const reverseGeocodeWeb = async (lat, lng) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) throw new Error('Maps API key missing');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        
        const getComp = (type) => components.find(c => c.types.includes(type))?.long_name || '';
        
        return {
          name: getComp('premise') || getComp('sublocality_level_1'),
          streetNumber: getComp('street_number'),
          street: getComp('route'),
          district: getComp('sublocality_level_2') || getComp('sublocality'),
          subregion: getComp('locality'),
          city: getComp('administrative_area_level_2') || getComp('locality'),
          region: getComp('administrative_area_level_1'),
          postalCode: getComp('postal_code'),
        };
      }
      return null;
    } catch (error) {
      console.error('Web reverse geocode error:', error);
      return null;
    }
  };

  const autoFillFromLocation = async (openModal = true) => {
    try {
      setLocating(true);
      
      let status;
      if (Platform.OS === 'web') {
        // Simple permission check for web if needed, but getCurrentPosition handles it
        status = 'granted';
      } else {
        const { status: nativeStatus } = await Location.requestForegroundPermissionsAsync();
        status = nativeStatus;
      }

      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is needed to auto-fill your address.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.BestForNavigation 
      });

      let place;
      if (Platform.OS === 'web') {
        place = await reverseGeocodeWeb(loc.coords.latitude, loc.coords.longitude);
      } else {
        const [nativePlace] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        place = nativePlace;
      }

      if (place) {
        console.log('Reverse Geocode Result:', place);
        const houseInfo = [place.name, place.streetNumber, place.street].filter(Boolean).join(', ');
        const areaInfo = [place.district, place.subregion, place.city].filter(Boolean).join(', ');
        
        setFormData({
          label: 'Home',
          fullAddress: houseInfo,
          areaLocality: areaInfo,
          city: place.city || place.subregion || '',
          state: place.region || '',
          pincode: place.postalCode || '',
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          isDefault: true,
        });

        if (openModal) {
          setModalVisible(true);
        }
      }
    } catch (err) {
      console.error('Location error:', err);
      showAlert('Location Error', 'Could not fetch your location. Please fill in manually.');
    } finally {
      setLocating(false);
    }
  };




  const showAlert = (title, message) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handleSave = async () => {
    if (!formData.fullAddress.trim()) {
      showAlert('Required', 'Please enter your full address.');
      return;
    }
    try {
      setLoading(true);
      await addressApi.create(formData);
      setModalVisible(false);
      setFormData({ label: 'Home', fullAddress: '', areaLocality: '', landmark: '', city: '', state: '', pincode: '', isDefault: false });
      await fetchAddresses();
    } catch (error) {
      console.error('Save address error:', error);
      showAlert('Error', 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await addressApi.delete(id);
      await fetchAddresses();
    } catch (error) {
      console.error('Delete address error:', error);
      showAlert('Error', 'Failed to delete address.');
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (id) => {
    try {
      setLoading(true);
      await addressApi.update(id, { isDefault: true });
      await fetchAddresses();
    } catch (error) {
      console.error('Set default error:', error);
      showAlert('Error', 'Failed to set default address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen safeArea={false} padding={false} backgroundColor={theme.colors.background}>
      <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerTitleRow}>
          <Ionicons name="chevron-down" size={28} color={theme.colors.textBlack} />
          <AppText weight="bold" style={styles.headerTitle}>Select a location</AppText>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search for area, street name..."
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Options */}
        <View style={styles.quickOptions}>
          <TouchableOpacity style={styles.quickOptionRow} onPress={autoFillFromLocation}>
            <View style={styles.quickIconCircle}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.quickOptionTitle} weight="bold">Use current location</AppText>
              <AppText style={styles.quickOptionSubtitle} numberOfLines={1}>
                {locating ? 'Detecting...' : formData.areaLocality || 'Enable location for better precision'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.quickOptionRow} 
            onPress={() => {
              setFormData({ label: 'Home', fullAddress: '', areaLocality: '', landmark: '', city: '', state: '', pincode: '', isDefault: true });
              setModalVisible(true);
            }}
          >

            <View style={styles.quickIconCircle}>
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.success} />
            </View>
            <AppText style={styles.quickOptionTitle} weight="bold">Add Address</AppText>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>


        {/* Saved Addresses Section */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} weight="900">SAVED ADDRESSES</AppText>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.error} style={{ marginTop: 20 }} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppText style={styles.emptyText}>No saved addresses found</AppText>
          </View>
        ) : (
          addresses.map((item, index) => (
            <TouchableOpacity key={`${item.id}-${index}`} style={styles.addressCard}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrapper}>
                   <MaterialCommunityIcons 
                    name={item.label.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'} 
                    size={24} 
                    color={theme.colors.primaryDark} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.cardTitleRow}>
                    <AppText style={styles.cardLabel} weight="bold">{item.label}</AppText>
                    {currentLocation && (
                       <AppText style={styles.distanceText}>{calculateDistance(item.latitude, item.longitude)}</AppText>
                    )}
                  </View>
                  <AppText style={styles.cardAddress} numberOfLines={2}>
                    {item.fullAddress}, {item.areaLocality}, {item.city}
                  </AppText>
                  <AppText style={styles.cardPhone}>Phone number: +91-8116870514</AppText>
                  
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity style={styles.miniActionBtn}>
                      <MaterialCommunityIcons name="dots-horizontal" size={16} color={theme.colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniActionBtn}>
                      <MaterialCommunityIcons name="share-variant" size={16} color={theme.colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniActionBtn} onPress={() => handleDelete(item.id)}>
                      <MaterialCommunityIcons name="delete-outline" size={16} color={theme.colors.success} />
                    </TouchableOpacity>
                  </View>

                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>





      {/* Add Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText type="heading" weight="bold">Add New Address</AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textBlack} />
              </TouchableOpacity>
            </View>

            {/* Auto-fill banner */}
            <TouchableOpacity
              style={styles.locationBanner}
              onPress={autoFillFromLocation}
              disabled={locating}
              activeOpacity={0.8}
            >
              {locating ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.colors.white} />
              )}
              <AppText style={styles.locationBannerText} weight="bold">
                {locating ? 'Detecting your location...' : 'Auto-fill from current location'}
              </AppText>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Label (e.g. Home, Work)</AppText>
                <View style={styles.labelChips}>
                  {['Home', 'Work', 'Other'].map((l) => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setFormData({ ...formData, label: l })}
                      style={[styles.chip, formData.label === l && styles.activeChip]}
                    >
                      <AppText style={[styles.chipText, formData.label === l && styles.activeChipText]}>{l}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>House / Flat / Building</AppText>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={formData.fullAddress}
                  onChangeText={(val) => setFormData({ ...formData, fullAddress: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Area / Locality</AppText>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={formData.areaLocality}
                  onChangeText={(val) => setFormData({ ...formData, areaLocality: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Landmark (Optional)</AppText>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={formData.landmark}
                  onChangeText={(val) => setFormData({ ...formData, landmark: val })}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <AppText style={styles.inputLabel}>City</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    value={formData.city}
                    onChangeText={(val) => setFormData({ ...formData, city: val })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <AppText style={styles.inputLabel}>State</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    value={formData.state}
                    onChangeText={(val) => setFormData({ ...formData, state: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Pincode</AppText>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  keyboardType="number-pad"
                  maxLength={6}
                  value={formData.pincode}
                  onChangeText={(val) => setFormData({ ...formData, pincode: val })}
                />
              </View>


              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <MaterialCommunityIcons
                  name={formData.isDefault ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={formData.isDefault ? theme.colors.primaryDark : '#CCC'}
                />
                <AppText style={styles.checkboxLabel}>Set as default address</AppText>
              </TouchableOpacity>

              <AppButton
                onPress={handleSave}
                style={styles.saveBtn}
                loading={loading}
              >
                <AppText style={styles.saveBtnText} weight="bold">Save Address</AppText>
              </AppButton>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.textBlack,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textBlack,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  quickOptions: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows?.small,
  },
  quickOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(78, 108, 72, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickOptionTitle: {
    fontSize: 16,
    color: theme.colors.success,
  },

  quickOptionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    letterSpacing: 1.5,
  },
  addressCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows?.small,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(73, 94, 113, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 16,
    color: theme.colors.textBlack,
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardAddress: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardPhone: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(78, 108, 72, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  labelChips: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  activeChip: {
    backgroundColor: theme.colors.success,
  },

  chipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textBlack,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: theme.colors.success,
    borderRadius: 16,
    height: 56,
  },

  saveBtnText: {
    color: 'white',
    fontSize: 18,
  },
});


export default AddressBookScreen;
