import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
// The container has 24 padding on both sides
const ITEM_WIDTH = width - 48;

export default function AutoScrollBanners({ children, autoScrollTime = 3000 }) {
    const listRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out null/undefined children (like if activeBooking is null)
    const validChildren = React.Children.toArray(children).filter(Boolean);

    useEffect(() => {
        if (validChildren.length <= 1) return;

        const intervalId = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= validChildren.length) {
                nextIndex = 0;
            }
            
            listRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        }, autoScrollTime);

        return () => clearInterval(intervalId);
    }, [currentIndex, validChildren.length, autoScrollTime]);

    const handleMomentumScrollEnd = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
        setCurrentIndex(index);
    };

    if (validChildren.length === 0) return null;

    const getItemLayout = (data, index) => ({
        length: ITEM_WIDTH,
        offset: ITEM_WIDTH * index,
        index,
    });

    return (
        <View style={styles.container}>
            <FlatList
                ref={listRef}
                data={validChildren}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => `banner-${index}`}
                renderItem={({ item }) => (
                    <View style={{ width: ITEM_WIDTH }}>
                        {item}
                    </View>
                )}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                // Small trick to ensure FlatList snaps perfectly without getting stuck on margins
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                getItemLayout={getItemLayout}
            />
            
            {validChildren.length > 1 && (
                <View style={styles.pagination}>
                    {validChildren.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index ? styles.activeDot : styles.inactiveDot
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    activeDot: {
        width: 16,
        backgroundColor: '#4E6C48', // Primary Dark Theme Color
    },
    inactiveDot: {
        width: 6,
        backgroundColor: '#D1D5DB', // Light Gray
    }
});
