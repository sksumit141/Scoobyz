import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';
import { useDiscount } from '../contexts/DiscountContext';

const PriceDisplay = ({ originalPrice, serviceName, style, valueStyle, strikeStyle, showLabel = true }) => {
  const { getDiscount, calculateDiscountedPrice } = useDiscount();
  
  const discountPercent = getDiscount(serviceName);
  const numericPrice = Number(originalPrice);
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return (
      <AppText style={style || styles.priceText} weight="bold">
        {showLabel ? '₹ ' : ''}{originalPrice}
      </AppText>
    );
  }

  if (discountPercent > 0) {
    const percentDiscountedPrice = numericPrice - (numericPrice * (discountPercent / 100));
    const finalPromotionalPrice = calculateDiscountedPrice(numericPrice, serviceName);
    
    return (
      <View style={[styles.container, { flexWrap: 'wrap' }]}>
        <AppText style={[styles.strikeText, strikeStyle]}>
          {showLabel ? '₹ ' : ''}{numericPrice}
        </AppText>
        <AppText style={[styles.strikeText, strikeStyle]}>
          {showLabel ? '₹ ' : ''}{percentDiscountedPrice}
        </AppText>
        <AppText style={[styles.discountedText, valueStyle]} weight="bold">
          {showLabel ? '₹ ' : ''}{finalPromotionalPrice}
        </AppText>
      </View>
    );
  }

  // If no global discount, just apply the 500 off promotional hack
  const finalPromotionalPrice = calculateDiscountedPrice(numericPrice, serviceName);

  return (
    <View style={[styles.container, { flexWrap: 'wrap' }]}>
      <AppText style={[styles.strikeText, strikeStyle]}>
        {showLabel ? '₹ ' : ''}{numericPrice}
      </AppText>
      <AppText style={[styles.discountedText, valueStyle]} weight="bold">
        {showLabel ? '₹ ' : ''}{finalPromotionalPrice}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    color: '#333',
  },
  strikeText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountedText: {
    fontSize: 16,
    color: '#4CAF50', // A nice green to indicate discount
  }
});

export default PriceDisplay;
