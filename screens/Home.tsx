import React, { useRef, useState } from 'react'
import { Pressable, SafeAreaView, Text, View } from 'react-native'

import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { PanGestureHandler, TextInput } from 'react-native-gesture-handler'
import { snapPoint } from 'react-native-redash'
import { Ionicons } from '@expo/vector-icons'
import { buttonWidth, deviceHeight } from '../lib/constants'
import tw from '../lib/tailwind'
import * as Haptics from 'expo-haptics'
import Swiper from 'react-native-swiper'
import { shadowStyle } from '../lib/styles'
// eslint-disable-next-line tsc/config
import { useKeyboard } from 'react-native-keyboard-height'
import { View as AnimatedView, AnimatePresence } from 'moti'

interface HomeProps {
  swiperRef: React.RefObject<Swiper>
}

const Home = ({ swiperRef }: HomeProps): JSX.Element => {
  const didShow = (keyboardHeight: any) => {
    console.log('Keyboard show. Height is ' + keyboardHeight)
    // setNoteViewHeight(deviceHeight - keyboardHeight)
  }

  const didHide = () => {
    console.log('Keyboard hide')
    // setNoteViewHeight(0)
    noteViewOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
    setNoteViewZIndex(0)
  }

  const [noteViewHeight, _setNoteViewHeight] = useState(500)
  const [noteViewZIndex, setNoteViewZIndex] = useState(0)
  const [_keyboardHeight] = useKeyboard(didShow, didHide)
  const textInputRef = useRef()

  const translateY = useSharedValue(0)
  const noteViewOpacity = useSharedValue(0)

  const springConfig = {
    mass: 1,
    stiffness: 225,
    damping: 19,
  }

  const createNewNote = () => {
    console.log('new note')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // eslint-disable-next-line tsc/config
    textInputRef?.current.focus()
    noteViewOpacity.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
    setNoteViewZIndex(2)
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

  const noteViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: noteViewOpacity.value,
    }
  })

  return (
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
              swiperRef.current?.scrollBy(1)
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

      <View
        style={[
          tw`flex flex-col w-full absolute`,
          { top: 0, zIndex: noteViewZIndex, height: noteViewHeight },
        ]}
      >
        <Animated.View
          style={[
            tw`bg-white rounded-2xl m-4 mb-32 p-5`,
            noteViewAnimatedStyle,
            shadowStyle,
            { height: '50%', top: noteViewHeight / 4 },
          ]}
        >
          <TextInput
            // eslint-disable-next-line tsc/config
            ref={textInputRef}
            style={[tw`flex-1 text-lg`]}
            multiline
          />
        </Animated.View>
      </View>

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

      <AnimatePresence>
        {noteViewZIndex > 0 && (
          <AnimatedView
            from={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{
              opacity: 0,
            }}
            style={[
              tw`absolute h-full w-full`,
              { zIndex: 1, backgroundColor: '#000' },
            ]}
          />
        )}
      </AnimatePresence>
    </View>
  )
}

export default Home
