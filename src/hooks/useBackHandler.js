import { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * useBackHandler — industry-level back navigation hook
 *
 * Handles:
 *  - Android hardware back button
 *  - Custom back press logic
 *  - Safe canGoBack guard (avoids crashing on empty stack)
 *
 * @param {object} options
 * @param {Function} [options.onBack] - Custom handler. Return `true` to mark as handled and block default back.
 * @param {string}  [options.fallbackScreen] - If stack can't go back, navigate here instead.
 * @param {object}  [options.fallbackParams] - Params for fallbackScreen.
 */
export function useBackHandler({ onBack, fallbackScreen, fallbackParams } = {}) {
  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    // 1. Run custom logic first — if it returns true, it's fully handled.
    if (onBack) {
      const handled = onBack();
      if (handled === true) return true;
    }

    // 2. If there is something to go back to in the stack, do it.
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    // 3. No history — navigate to a fallback screen if provided.
    if (fallbackScreen) {
      navigation.navigate(fallbackScreen, fallbackParams);
      return true;
    }

    // 4. Let the OS handle it (exits the app on Android).
    return false;
  }, [navigation, onBack, fallbackScreen, fallbackParams]);

  // Wire up the Android hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  return { handleBack };
}

/**
 * safeGoBack — standalone helper for one-off back presses (e.g. inline onPress callbacks).
 * Works without the hook for simple use-cases.
 *
 * @param {object} navigation - React Navigation navigation object
 * @param {string} [fallbackScreen] - Screen to navigate to if stack is empty
 * @param {object} [fallbackParams] - Params for fallback screen
 */
export function safeGoBack(navigation, fallbackScreen, fallbackParams) {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (fallbackScreen) {
    navigation.navigate(fallbackScreen, fallbackParams);
  }
}
