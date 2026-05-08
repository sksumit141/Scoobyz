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

  const autoFillFromLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is needed to auto-fill your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (place) {
        setFormData((prev) => ({
          ...prev,
          areaLocality: [place.district, place.subregion].filter(Boolean).join(', ') || prev.areaLocality,
          city: place.city || place.subregion || prev.city,
          state: place.region || prev.state,
          pincode: place.postalCode || prev.pincode,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
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
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <AppText type="heading" weight="bold" style={styles.headerTitle}>Address Book</AppText>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={20} color="#4A6B4B" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && addresses.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={80} color="#DDD" />
              <AppText style={styles.emptyText}>No addresses saved yet.</AppText>
            </View>
          ) : (
            addresses.map((item) => (
              <View key={item.id} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.labelRow}>
                    <MaterialCommunityIcons
                      name={item.label.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'}
                      size={20}
                      color={theme.colors.primaryDark}
                    />
                    <AppText weight="bold" style={styles.labelText}>{item.label}</AppText>
                  </View>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <AppText style={styles.defaultText}>DEFAULT</AppText>
                    </View>
                  )}
                </View>

                <AppText style={styles.addressText}>{item.fullAddress}</AppText>
                {(item.areaLocality || item.landmark) && (
                  <AppText style={styles.localityText}>
                    {item.areaLocality}{item.areaLocality && item.landmark ? ', ' : ''}
                    {item.landmark ? `Near ${item.landmark}` : ''}
                  </AppText>
                )}
                <AppText style={styles.cityText}>{item.city}{item.state ? `, ${item.state}` : ''} {item.pincode ? ` - ${item.pincode}` : ''}</AppText>

                <View style={styles.cardActions}>
                  {!item.isDefault && (
                    <TouchableOpacity onPress={() => setDefault(item.id)} style={styles.actionBtn}>
                      <AppText style={styles.actionText}>Set as Default</AppText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#E74C3C" />
                    <AppText style={[styles.actionText, { color: '#E74C3C' }]}>Remove</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setFormData({ label: 'Home', fullAddress: '', areaLocality: '', landmark: '', city: '', state: '', pincode: '', isDefault: true });
          setModalVisible(true);
          setTimeout(() => autoFillFromLocation(), 400);
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={30} color="white" />
      </TouchableOpacity>

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
                  placeholder="e.g. Flat 101, Sunshine Apartments"
                  value={formData.fullAddress}
                  onChangeText={(val) => setFormData({ ...formData, fullAddress: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Area / Locality</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sector 42, Green Park"
                  value={formData.areaLocality}
                  onChangeText={(val) => setFormData({ ...formData, areaLocality: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Landmark (Optional)</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Behind HDFC Bank"
                  value={formData.landmark}
                  onChangeText={(val) => setFormData({ ...formData, landmark: val })}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <AppText style={styles.inputLabel}>City</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={formData.city}
                    onChangeText={(val) => setFormData({ ...formData, city: val })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <AppText style={styles.inputLabel}>State</AppText>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    value={formData.state}
                    onChangeText={(val) => setFormData({ ...formData, state: val })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>Pincode</AppText>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
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
    backgroundColor: '#526D82',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: theme.colors.white,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  addressCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    color: theme.colors.textBlack,
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: 'rgba(78, 108, 72, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    color: theme.colors.primaryDark,
    fontWeight: '800',
  },
  addressText: {
    fontSize: 15,
    color: theme.colors.textBlack,
    lineHeight: 22,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  localityText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    marginLeft: 4,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: 'auto',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    backgroundColor: theme.colors.primaryDark,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
    backgroundColor: '#F5F5F5',
  },
  activeChip: {
    backgroundColor: theme.colors.primaryDark,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.textBlack,
  },
  activeChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textBlack,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.textBlack,
  },
  saveBtn: {
    borderRadius: 16,
    height: 56,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 18,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  locationBannerText: {
    color: theme.colors.white,
    fontSize: 14,
    flex: 1,
  },
});

export default AddressBookScreen;
