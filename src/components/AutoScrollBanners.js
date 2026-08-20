import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
// The container has 24 padding on both sides
const ITEM_WIDTH = width - 48;
const SPACING = 16;

export default function AutoScrollBanners({ children, autoScrollTime = 3000 }) {
    const listRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 48);

    // Filter out null/undefined children
    const validChildren = React.Children.toArray(children).filter(Boolean);

    useEffect(() => {
        if (validChildren.length <= 1 || containerWidth <= 0) return;

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
    }, [currentIndex, validChildren.length, autoScrollTime, containerWidth]);

    const handleMomentumScrollEnd = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / containerWidth);
        setCurrentIndex(index);
    };

    if (validChildren.length === 0) return null;

    const getItemLayout = (data, index) => ({
        length: containerWidth,
        offset: containerWidth * index,
        index,
    });

    return (
        <View 
            style={styles.container}
            onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                if (width > 0) setContainerWidth(width);
            }}
        >
            <FlatList
                ref={listRef}
                data={validChildren}
                horizontal
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => `banner-${index}`}
                renderItem={({ item }) => {
                    return (
                        <View style={{
                            width: containerWidth,
                            paddingHorizontal: 4
                        }}>
                            {item}
                        </View>
                    );
                }}
                onMomentumScrollEnd={handleMomentumScrollEnd}
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
