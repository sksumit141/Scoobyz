import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { roundMoney } from '../utils/money';

const DiscountContext = createContext();

export const useDiscount = () => useContext(DiscountContext);

export const DiscountProvider = ({ children }) => {
  const [discounts, setDiscounts] = useState({});

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await api.get('/api/public/config');
        setDiscounts(response.serviceDiscounts || {});
      } catch (err) {
        console.warn('Failed to fetch service discounts', err);
      }
    };
    fetchDiscounts();
  }, []);

  const getDiscount = (serviceName) => {
    if (!serviceName) return 0;
    
    // Exact match first
    if (discounts[serviceName] !== undefined) {
      return Number(discounts[serviceName]) || 0;
    }
    
    // Fuzzy matching
    const normalized = serviceName.toLowerCase();
    for (const [key, value] of Object.entries(discounts)) {
      if (normalized.includes(key.toLowerCase())) {
        return Number(value) || 0;
      }
    }
    return 0;
  };

  const calculateDiscountedPrice = (price, serviceName) => {
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) return numericPrice;
    
    const discountPercent = getDiscount(serviceName);
    let finalPrice = numericPrice;

    if (discountPercent > 0) {
      const discountAmount = numericPrice * (discountPercent / 100);
      finalPrice = numericPrice - discountAmount;
    }
    
    return roundMoney(Math.max(0, finalPrice));
  };

  return (
    <DiscountContext.Provider value={{ discounts, getDiscount, calculateDiscountedPrice }}>
      {children}
    </DiscountContext.Provider>
  );
};
