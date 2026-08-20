import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { theme } from '../styles/theme';
import { BREED_SIZE_MAP } from '../data/breeds';

const { height } = Dimensions.get('window');

const BreedPickerModal = ({ visible, onClose, onSelect, selectedSize }) => {
  const breedsForSize = BREED_SIZE_MAP[selectedSize] || [];

  const renderBreedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.breedItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.breedItemContent}>
        <AppText style={styles.breedName}>{item}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
    </TouchableOpacity>
  );


  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerRow}>
              <AppText style={styles.modalTitle} type="heading" weight="bold">Select Breed</AppText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                <Ionicons name="close" size={24} color={theme.colors.textBlack} />
              </TouchableOpacity>
            </View>
            <AppText style={styles.modalSubtitle}>Showing breeds for {selectedSize} dogs</AppText>
          </View>

          {/* Breed List */}
          <FlatList
            data={breedsForSize}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={renderBreedItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.6,
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: theme.colors.textBlack,
  },
  closeBtn: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  customBreedContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  customBreedLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  customBreedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customBreedInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    fontSize: 15,
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
    borderRadius: 12,
  },
  addBtnActive: {
    backgroundColor: theme.colors.primaryDark,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 15,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  breedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  breedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breedName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  }
});

export default BreedPickerModal;
