import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppScreen from './AppScreen';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

/**
 * PawLoader
 *
 * Creates a diagonal dog-walking footprint animation:
 *
 *
 *                         🐾
 *                    🐾
 *               🐾
 *          🐾
 *      🐾
 *   🐾
 *
 * Starts from middle-left
 * and walks towards top-right.
 *
 * Props:
 *   fullScreen {boolean} – wrap in AppScreen (default: true)
 *   size       {number}  – paw size (default: 32)
 *   color      {string}  – paw color
 */

const PawLoader = ({
  fullScreen = true,
  size = 32,
  color = theme.colors.success,
}) => {

  /*
   * Number of footprints visible in the path.
   *
   * More paws make it feel like a real dog
   * walking rather than four icons simply appearing.
   */
  const NUM_PAWS = 8;

  /*
   * Animation values.
   *
   * Every paw has its own animation.
   */
  const anims = useRef(
    Array.from(
      { length: NUM_PAWS },
      () => new Animated.Value(0)
    )
  ).current;


  /*
   * ---------------------------------------------------------
   * WALKING PATH
   * ---------------------------------------------------------
   *
   * Start:
   *      middle-left
   *
   * End:
   *      top-right
   *
   */

  const START_X = SCREEN_WIDTH * 0.10;
  const START_Y = SCREEN_HEIGHT * 0.55;

  const END_X = SCREEN_WIDTH * 0.88;
  const END_Y = SCREEN_HEIGHT * 0.18;


  /*
   * Direction of walking.
   */
  const dx = END_X - START_X;
  const dy = END_Y - START_Y;

  const distance = Math.sqrt(
    dx * dx + dy * dy
  );


  /*
   * Perpendicular vector.
   *
   * This lets us place the left and right paws
   * on opposite sides of the dog's body.
   */
  const perpendicularX = dy / distance;
  const perpendicularY = -dx / distance;


  /*
   * How far the paws are separated from
   * the dog's centre line.
   */
  const LATERAL_DISTANCE = 14;


  /*
   * Direction of the dog's walk.
   */
  const WALK_ROTATION =
    -Math.atan2(dy, dx) *
    (180 / Math.PI);


  /*
   * ---------------------------------------------------------
   * PAW POSITIONS
   * ---------------------------------------------------------
   *
   * Every paw is placed at a different point
   * along the diagonal.
   *
   * Left / right paws alternate.
   */
  const pawPositions = Array.from(
    { length: NUM_PAWS },
    (_, index) => {

      /*
       * Position along the walking path.
       *
       * 0 = beginning
       * 1 = end
       */
      const progress =
        index / (NUM_PAWS - 1);


      /*
       * Centre point of this footprint.
       */
      const centerX =
        START_X +
        dx * progress;

      const centerY =
        START_Y +
        dy * progress;


      /*
       * Alternate left and right feet.
       */
      const isLeft =
        index % 2 === 0;


      const side =
        isLeft ? -1 : 1;


      /*
       * Move the paw slightly away from
       * the centre walking line.
       */
      const left =
        centerX +
        side *
        LATERAL_DISTANCE *
        perpendicularX -
        size / 2;

      const top =
        centerY +
        side *
        LATERAL_DISTANCE *
        perpendicularY -
        size / 2;


      /*
       * Give the two feet slightly different
       * rotations.
       */
      const rotation =
        WALK_ROTATION +
        (isLeft ? 12 : -12);


      return {
        left,
        top,
        rotation,
      };
    }
  );


  /*
   * ---------------------------------------------------------
   * ANIMATION
   * ---------------------------------------------------------
   */

  useEffect(() => {

    /*
     * Time between paw steps.
     */
    const STEP_DELAY = 220;


    /*
     * Paw landing animation.
     */
    const LAND_DURATION = 180;


    /*
     * How long the paw remains visible.
     */
    const HOLD_DURATION = 650;


    /*
     * How long the paw takes to disappear.
     */
    const FADE_DURATION = 300;


    /*
     * Create animation for every paw.
     */
    const animations = anims.map(
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
             * Paw lands.
             *
             * 0 -> 1
             */
            Animated.timing(anim, {
              toValue: 1,
              duration: LAND_DURATION,
              easing: Easing.out(
                Easing.quad
              ),
              useNativeDriver: true,
            }),


            /*
             * Paw stays on the ground.
             */
            Animated.delay(
              HOLD_DURATION
            ),


            /*
             * Paw slowly disappears.
             *
             * 1 -> 0
             */
            Animated.timing(anim, {
              toValue: 0,
              duration: FADE_DURATION,
              easing: Easing.in(
                Easing.quad
              ),
              useNativeDriver: true,
            }),


            /*
             * Wait before this paw participates
             * in the next complete walking cycle.
             */
            Animated.delay(
              STEP_DELAY * NUM_PAWS
            ),
          ])
        );
      }
    );


    /*
     * Start all paw animations together.
     *
     * Their individual delays make them appear
     * one after another.
     */
    Animated.parallel(
      animations
    ).start();


    /*
     * Cleanup when component unmounts.
     */
    return () => {
      animations.forEach(
        animation => animation.stop()
      );
    };

  }, [anims]);


  /*
   * ---------------------------------------------------------
   * PAW UI
   * ---------------------------------------------------------
   */

  const inner = (
    <View
      style={styles.container}
      pointerEvents="none"
    >

      {pawPositions.map(
        (paw, index) => {

          const anim =
            anims[index];


          /*
           * Paw moves slightly upward while
           * it is being placed.
           */
          const translateY =
            anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                -8,
                2,
                0,
              ],
            });


          /*
           * Paw starts faint,
           * becomes fully visible,
           * then fades.
           */
          const opacity =
            anim.interpolate({
              inputRange: [
                0,
                0.2,
                0.7,
                1,
              ],
              outputRange: [
                0,
                1,
                1,
                0.25,
              ],
            });


          /*
           * Paw gets slightly bigger
           * when it lands.
           */
          const scale =
            anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                0.65,
                1.12,
                1,
              ],
            });


          return (
            <Animated.View
              key={index}
              style={[
                styles.paw,

                {
                  left: paw.left,
                  top: paw.top,

                  opacity,

                  transform: [
                    {
                      translateY,
                    },
                    {
                      scale,
                    },
                    {
                      rotate: `${paw.rotation}deg`,
                    },
                  ],
                },
              ]}
            >

              <MaterialCommunityIcons
                name="paw"
                size={size}
                color={color}
              />

            </Animated.View>
          );
        }
      )}

    </View>
  );


  /*
   * ---------------------------------------------------------
   * FULL SCREEN / INLINE
   * ---------------------------------------------------------
   */

  if (!fullScreen) {
    return (
      <Modal transparent animationType="fade" visible={true}>
        <View style={[{ flex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }]}>
          {inner}
        </View>
      </Modal>
    );
  }


  return (
    <AppScreen
      backgroundColor={
        theme.colors.background
      }
    >
      {inner}
    </AppScreen>
  );
};


const styles = StyleSheet.create({

  container: {
    flex: 1,
    position: 'relative',
  },

  paw: {
    position: 'absolute',

    justifyContent: 'center',
    alignItems: 'center',
  },

});


export default PawLoader;