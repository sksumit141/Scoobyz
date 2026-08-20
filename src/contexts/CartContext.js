import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

const CART_STORAGE_KEY = '@scooobys_cart';
const EXPIRY_HOURS = 12;

export const CartProvider = ({ children }) => {
  const [cartItem, setCartItem] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Check if expired
        if (now - parsed.timestamp > EXPIRY_HOURS * 60 * 60 * 1000) {
          await AsyncStorage.removeItem(CART_STORAGE_KEY);
          setCartItem(null);
        } else {
          setCartItem(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveToCart = async (params, screen, serviceName, amount) => {
    try {
      const item = {
        params,
        screen,
        serviceName,
        amount,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(item));
      setCartItem(item);
    } catch (error) {
      console.error('Error saving to cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      setCartItem(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cartItem, saveToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
