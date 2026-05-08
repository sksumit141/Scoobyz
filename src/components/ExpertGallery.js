import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { theme } from '../styles/theme';

const galleryImages = {
  left: [
    { id: '1', uri: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop', height: 180 },
    { id: '2', uri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop', height: 220 },
    { id: '3', uri: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=400&auto=format&fit=crop', height: 160 },
  ],
  right: [
    { id: '4', uri: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400&auto=format&fit=crop', height: 240 },
    { id: '5', uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400&auto=format&fit=crop', height: 180 },
    { id: '6', uri: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400&auto=format&fit=crop', height: 160 },
  ]
};

export default function ExpertGallery() {
  return (
    <View style={styles.galleryContainer}>
      <View style={styles.galleryColumn}>
        {galleryImages.left.map((img) => (
          <Image key={img.id} source={{ uri: img.uri }} style={[styles.galleryImage, { height: img.height }]} />
        ))}
      </View>
      <View style={styles.galleryColumn}>
        {galleryImages.right.map((img) => (
          <Image key={img.id} source={{ uri: img.uri }} style={[styles.galleryImage, { height: img.height }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  galleryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryColumn: {
    flex: 1,
    gap: 12,
  },
  galleryImage: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
});
