import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions
} from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const AppScreen = ({ 
  children, 
  style, 
  scrollable = false, 
  padding = true,
  safeArea = true,
  backgroundColor = theme.colors.background
}) => {
  const Container = safeArea ? SafeAreaView : View;
  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <Container style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ContentWrapper 
          style={[styles.contentWrapper]}
          contentContainerStyle={[
            scrollable ? styles.scrollContent : styles.fixedContent,
            padding && styles.padded,
            style
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ContentWrapper>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedContent: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: Math.min(24, width * 0.06),
  },
});

export default AppScreen;
