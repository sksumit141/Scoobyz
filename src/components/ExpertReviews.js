import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReviewCard from './ReviewCard';

const DUMMY_REVIEWS = [
  {
    id: '1',
    userName: 'Jackson Reige',
    userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=256&auto=format&fit=crop',
    date: 'March 22, 2026',
    rating: 5,
    text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Exercitation veniam consequat sunt nostrud amet.'
  },
  {
    id: '2',
    userName: 'Jackson Reige',
    userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=256&auto=format&fit=crop',
    date: 'March 22, 2026',
    rating: 5,
    text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Exercitation veniam consequat sunt nostrud amet.'
  },
  {
    id: '3',
    userName: 'Jackson Reige',
    userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=256&auto=format&fit=crop',
    date: 'March 22, 2026',
    rating: 5,
    text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Exercitation veniam consequat sunt nostrud amet.'
  },
  {
    id: '4',
    userName: 'Jackson Reige',
    userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=256&auto=format&fit=crop',
    date: 'March 22, 2026',
    rating: 5,
    text: 'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Exercitation veniam consequat sunt nostrud amet.'
  }
];

export default function ExpertReviews() {
  return (
    <View style={styles.container}>
      {DUMMY_REVIEWS.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  }
});
