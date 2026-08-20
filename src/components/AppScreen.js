import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const AppScreen = ({
  children,
  header,               // pass <Header /> here instead of putting it inside children
  footer,                // pass sticky bottom CTA here
  style,
  scrollable = false,
  padding = true,
  safeAreaTop = true,
  safeAreaBottom = true, // NEW: apply bottom inset when there's no footer eating it
  backgroundColor = theme.colors.background,
  statusBarStyle = 'dark-content',
}) => {
  const insets = useSafeAreaInsets();
  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: safeAreaTop ? insets.top : 0,
        },
      ]}
    >
      <StatusBar barStyle={statusBarStyle} />

      {header ? <View style={styles.headerSlot}>{header}</View> : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={styles.keyboardView}
      >
        <ContentWrapper
          style={styles.contentWrapper}
          contentContainerStyle={[
            scrollable ? styles.scrollContent : styles.fixedContent,
            padding && styles.padded,
            // only pad bottom here if there's no sticky footer (footer handles its own inset)
            !footer && safeAreaBottom && { paddingBottom: insets.bottom + theme.spacing.md },
            style,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ContentWrapper>
      </KeyboardAvoidingView>

      {footer ? (
        <View style={[styles.footerSlot, { paddingBottom: insets.bottom || theme.spacing.md }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSlot: {
    paddingHorizontal: Math.min(24, width * 0.06),
    paddingBottom: theme.spacing.sm,
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
  footerSlot: {
    paddingHorizontal: Math.min(24, width * 0.06),
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});

export default AppScreen;
