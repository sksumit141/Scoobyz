import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Animated,
  StyleSheet,
  Modal,
  Dimensions,
  Easing,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const LoadingContext = createContext({
  showLoader: () => { },
  hideLoader: () => { },
});

export const useLoader = () => useContext(LoadingContext);

const { width: SW, height: SH } = Dimensions.get('window');

const PAW_COLOR = theme.colors.success;
const PAW_SIZE = 28;

/*
|--------------------------------------------------------------------------
| WALKING PATH
|--------------------------------------------------------------------------
|
| Start around middle-left
|             ↓
|        🐾
|          🐾
|            🐾
|              🐾
|                🐾
|                  🐾
|                    🐾
|                      🐾
|                            → top-right
|
*/

const START_X = SW * 0.08;
const START_Y = SH * 0.55;

const END_X = SW * 0.90;
const END_Y = SH * 0.15;


/*
|--------------------------------------------------------------------------
| DOG WALKING SETTINGS
|--------------------------------------------------------------------------
*/

const PAW_COUNT = 8;

// Distance between left/right feet
const LATERAL = 16;

// How quickly each new paw appears
const STEP_DELAY = 260;

// Paw appearing animation
const FADE_IN = 180;

// How long a paw remains visible
const HOLD_TIME = 900;

// Walking direction
const dx = END_X - START_X;
const dy = END_Y - START_Y;

const PATH_LENGTH = Math.sqrt(dx * dx + dy * dy);

// Direction perpendicular to walking path
const perpX = dy / PATH_LENGTH;
const perpY = -dx / PATH_LENGTH;

// Rotation of paw according to walking direction
const WALK_ANGLE =
  -Math.atan2(dy, dx) * (180 / Math.PI);


/*
|--------------------------------------------------------------------------
| FOOT PATTERN
|--------------------------------------------------------------------------
|
| Instead of simply:
|
| Left Right Left Right
|
| we stagger the feet to make it look more like
| a dog walking.
|
|  L   R
|    L   R
|  L   R
|    L   R
|
*/

const PAW_SEQUENCE = Array.from(
  { length: PAW_COUNT },
  (_, i) => {

    const isLeft = i % 2 === 0;

    return {
      isLeft,

      // Slightly different rotation for each foot
      rotation: `${WALK_ANGLE +
        (isLeft ? 12 : -12)
        }deg`,
    };
  }
);


/*
|--------------------------------------------------------------------------
| GET PAW POSITION
|--------------------------------------------------------------------------
*/

function getPawPosition(stepIndex, isLeft) {

  // Position along the diagonal
  const t = stepIndex / (PAW_COUNT - 1);

  const centerX =
    START_X +
    (END_X - START_X) * t;

  const centerY =
    START_Y +
    (END_Y - START_Y) * t;


  /*
   * Move the paw slightly to one side of
   * the dog's walking direction.
   */

  const side = isLeft ? -1 : 1;

  const x =
    centerX +
    side * LATERAL * perpX -
    PAW_SIZE / 2;

  const y =
    centerY +
    side * LATERAL * perpY -
    PAW_SIZE / 2;


  return {
    left: x,
    top: y,
  };
}


/*
|--------------------------------------------------------------------------
| PAW ANIMATION
|--------------------------------------------------------------------------
*/

function PawAnimation() {

  const animations = useRef(
    PAW_SEQUENCE.map(
      () => new Animated.Value(0)
    )
  ).current;


  useEffect(() => {

    const animationLoops = animations.map(
      (anim, index) => {

        return Animated.loop(

          Animated.sequence([

            /*
             * Wait for this paw's turn.
             */
            Animated.delay(
              index * STEP_DELAY
            ),


            /*
             * Paw touches the ground.
             */
            Animated.parallel([

              Animated.timing(anim, {
                toValue: 1,
                duration: FADE_IN,
                easing: Easing.out(
                  Easing.quad
                ),
                useNativeDriver: true,
              }),

            ]),


            /*
             * Paw stays on the ground.
             */
            Animated.delay(HOLD_TIME),


            /*
             * Old footprint disappears.
             */
            Animated.timing(anim, {
              toValue: 0,
              duration: 350,
              easing: Easing.in(
                Easing.quad
              ),
              useNativeDriver: true,
            }),


            /*
             * Wait before this paw participates
             * in the next walking cycle.
             */
            Animated.delay(
              STEP_DELAY * PAW_COUNT
            ),

          ])
        );
      }
    );


    Animated.parallel(animationLoops).start();


    return () => {
      animationLoops.forEach(
        animation => animation.stop()
      );
    };

  }, [animations]);


  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >

      {PAW_SEQUENCE.map(
        ({ isLeft, rotation }, index) => {

          const position =
            getPawPosition(
              index,
              isLeft
            );

          const animation =
            animations[index];


          /*
           * Paw starts slightly smaller,
           * then lands at normal size.
           */
          const scale =
            animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.45, 1],
            });


          /*
           * Small vertical movement makes
           * the paw feel like it is touching
           * the ground rather than simply appearing.
           */
          const translateY =
            animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [-8, 2, 0],
            });


          return (
            <Animated.View
              key={index}
              style={[
                styles.paw,

                {
                  left: position.left,
                  top: position.top,

                  opacity: animation,

                  transform: [
                    {
                      translateY,
                    },
                    {
                      scale,
                    },
                    {
                      rotate: rotation,
                    },
                  ],
                },
              ]}
            >

              <MaterialCommunityIcons
                name="paw"
                size={PAW_SIZE}
                color={PAW_COLOR}
              />

            </Animated.View>
          );
        }
      )}

    </View>
  );
}


/*
|--------------------------------------------------------------------------
| LOADING PROVIDER
|--------------------------------------------------------------------------
*/

export function LoadingProvider({
  children,
}) {

  const [visible, setVisible] =
    useState(false);


  const showLoader = () =>
    setVisible(true);

  const hideLoader = () =>
    setVisible(false);


  return (
    <LoadingContext.Provider
      value={{
        showLoader,
        hideLoader,
      }}
    >

      {children}

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >

        <View style={styles.overlay}>

          <PawAnimation />

        </View>

      </Modal>

    </LoadingContext.Provider>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  overlay: {
    flex: 1,

    backgroundColor:
      'rgba(247, 246, 242, 0.95)',
  },

  paw: {
    position: 'absolute',

    width: PAW_SIZE,
    height: PAW_SIZE,

    justifyContent: 'center',
    alignItems: 'center',
  },

});