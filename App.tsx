import { StatusBar } from 'expo-status-bar'
import React, { useRef } from 'react'
import { Pressable, SafeAreaView, Text, View } from 'react-native'

import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'
import { snapPoint } from 'react-native-redash'
import { Ionicons } from '@expo/vector-icons'
import { buttonWidth, deviceHeight } from './lib/constants'
import tw from './lib/tailwind'
import Swiper from 'react-native-swiper'
import * as Haptics from 'expo-haptics'

const App = (): JSX.Element => {
  const swiperRef = useRef<Swiper>(null)
  const translateY = useSharedValue(0)
  const springConfig = {
    mass: 1,
    stiffness: 300,
    damping: 19,
  }

  const createNewNote = () => {
    console.log('new note')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  // eslint-disable-next-line tsc/config
  const onGestureEvent = useAnimatedGestureHandler<{ y: number }>({
    onStart: (_, ctx) => {
      ctx.y = translateY.value
    },
    onActive: ({ translationY }, ctx) => {
      translateY.value = translationY + ctx.y
    },
    onEnd: ({ velocityY }) => {
      const destY = snapPoint(translateY.value, velocityY, [0])

      translateY.value = withSpring(
        destY,
        {
          overshootClamping: destY === 0 ? false : true,
          restSpeedThreshold: destY === 0 ? 0.01 : 100,
          restDisplacementThreshold: destY === 0 ? 0.01 : 100,
          ...springConfig,
        },
        () => console.log('end swipe'),
      )

      if (translateY.value > 150) {
        runOnJS(createNewNote)()
      }
    },
  })

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            translateY.value,
            [0, deviceHeight],
            [0, 200],
            Extrapolate.EXTEND,
          ),
        },
      ],
      opacity: interpolate(
        translateY.value,
        [0, 200],
        [0.4, 1],
        Extrapolate.CLAMP,
      ),
    }
  })

  return (
    <View style={[tw`w-full h-full bg-white`]}>
      <Swiper
        loop={false}
        index={0}
        ref={swiperRef}
        showsPagination={false}
        bounces={true}
      >
        <View style={[tw`flex-1`]}>
          <SafeAreaView
            style={[tw`flex flex-col w-full absolute`, { top: 0, zIndex: 1 }]}
          >
            <View style={[tw`px-6 pt-6 flex-row justify-between`]}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
                style={({ pressed }) => [
                  tw`bg-light-button-bg rounded-full flex justify-center items-center`,
                  {
                    width: buttonWidth,
                    height: buttonWidth,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="ios-settings-outline"
                  size={24}
                  style={[tw`text-light-button`]}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
                style={({ pressed }) => [
                  tw`bg-light-button-bg rounded-full flex justify-center items-center`,
                  {
                    width: buttonWidth,
                    height: buttonWidth,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="ios-list"
                  size={24}
                  style={[tw`text-light-button`, { left: 1 }]}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* eslint-disable-next-line tsc/config */}
          <PanGestureHandler onGestureEvent={onGestureEvent}>
            <Animated.View
              style={[
                tw`flex items-center justify-center flex-1`,
                textAnimatedStyle,
              ]}
            >
              <Text style={[tw`text-base text-light-text`]}>
                Swipe down to capture a note.
              </Text>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </Swiper>

      <StatusBar style="auto" />
    </View>
  )
}

export default App
