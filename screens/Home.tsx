import React, { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native'

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
  const didShow = (keyboardHeight: number) => {
    console.log('Keyboard show. Height is ' + keyboardHeight)
    // setNoteViewHeight(deviceHeight - keyboardHeight)
  }

  const didHide = () => {
    console.log('Keyboard hide')
    // setNoteViewHeight(0)
    // noteViewOpacity.value = withTiming(0, {
    //   duration: 250,
    //   easing: Easing.out(Easing.cubic),
    // })
    // setNoteViewZIndex(0)
  }

  const [noteText, setNoteText] = useState('')
  const [noteViewHeight, _setNoteViewHeight] = useState(475)
  const [noteViewZIndex, setNoteViewZIndex] = useState(0)
  const [thoughtCapturedTextZIndex, setThoughtCapturedTextZIndex] = useState(-1)

  const [_keyboardHeight] = useKeyboard(didShow, didHide)
  const textInputRef = useRef()

  const translateY = useSharedValue(0)
  const mainTextOpacity = useSharedValue(0.4)
  const thoughtCapturedTextOpacity = useSharedValue(0)

  const noteViewOpacity = useSharedValue(0)
  const noteViewTranslateY = useSharedValue(0)

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

  const saveNewNote = () => {
    Keyboard.dismiss()
    noteViewOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
    setNoteViewZIndex(0)
    setNoteText('')

    mainTextOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
    thoughtCapturedTextOpacity.value = withTiming(0.4, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    setThoughtCapturedTextZIndex(0)

    setTimeout(() => {
      mainTextOpacity.value = withTiming(0.4, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      })
      thoughtCapturedTextOpacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      })

      setThoughtCapturedTextZIndex(-1)
    }, 2500)

    setTimeout(() => {
      noteViewTranslateY.value = 0
    }, 100)
  }

  // eslint-disable-next-line tsc/config
  const onGestureEvent = useAnimatedGestureHandler<{ y: number }>({
    onStart: (_, ctx) => {
      ctx.y = translateY.value
    },
    onActive: ({ translationY }, ctx) => {
      translateY.value = translationY + ctx.y
      mainTextOpacity.value = interpolate(
        translationY + ctx.y,
        [0, 200],
        [0.4, 1],
        Extrapolate.CLAMP,
      )
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

      mainTextOpacity.value = withSpring(
        0.4,
        {
          overshootClamping: destY === 0 ? false : true,
          restSpeedThreshold: destY === 0 ? 0.01 : 100,
          restDisplacementThreshold: destY === 0 ? 0.01 : 100,
          ...springConfig,
        },
        () => console.log('opacity 0.4'),
      )

      if (translateY.value > 150) {
        runOnJS(createNewNote)()
      }
    },
  })

  // eslint-disable-next-line tsc/config
  const onNoteViewGestureEvent = useAnimatedGestureHandler<{ y: number }>({
    onStart: (_, ctx) => {
      ctx.y = noteViewTranslateY.value
    },
    onActive: ({ translationY }, ctx) => {
      noteViewTranslateY.value = translationY + ctx.y
    },
    onEnd: ({ velocityY }) => {
      const destY = snapPoint(noteViewTranslateY.value, velocityY * 1.5, [
        0,
        -(deviceHeight + 75),
      ])

      noteViewTranslateY.value = withSpring(
        destY,
        {
          overshootClamping: destY === 0 ? false : true,
          restSpeedThreshold: destY === 0 ? 0.01 : 100,
          restDisplacementThreshold: destY === 0 ? 0.01 : 100,
          ...springConfig,
        },
        () => destY !== 0 && runOnJS(saveNewNote)(),
      )
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
      opacity: mainTextOpacity.value,
    }
  })

  const thoughtCapturedTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: thoughtCapturedTextOpacity.value,
    }
  })

  const noteViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: noteViewTranslateY.value,
        },
      ],
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
        {/* eslint-disable-next-line tsc/config */}
        <PanGestureHandler onGestureEvent={onNoteViewGestureEvent}>
          <Animated.View
            style={[
              tw`bg-white rounded-2xl m-4 mb-32 p-4`,
              noteViewAnimatedStyle,
              shadowStyle,
              { height: '50%', top: noteViewHeight / 4 },
            ]}
          >
            <Pressable
              style={({ pressed }) => [tw``, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                Alert.alert(
                  'Warning',
                  'Are you sure you want to cancel this thought?',
                  [
                    {
                      text: 'No',
                      style: 'cancel',
                    },
                    {
                      text: 'Yes',
                      style: 'destructive',
                      onPress: () => {
                        noteViewOpacity.value = withTiming(0, {
                          duration: 250,
                          easing: Easing.out(Easing.cubic),
                        })
                        setNoteViewZIndex(0)
                        setNoteText('')
                      },
                    },
                  ],
                )
              }}
            >
              <Ionicons
                name="ios-close"
                size={24}
                style={[tw`text-light-button self-end`]}
              />
            </Pressable>
            <TextInput
              value={noteText}
              onChangeText={(text) => setNoteText(text)}
              // eslint-disable-next-line tsc/config
              ref={textInputRef}
              style={[tw`flex-1 text-lg px-1 mb-4`]}
              maxLength={140}
              returnKeyType="done"
              blurOnSubmit
              multiline
            />
            <Text style={[tw`self-end text-light-aux-text text-base`]}>
              {noteText.length}/140
            </Text>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* eslint-disable-next-line tsc/config */}
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View
          style={[
            tw`flex items-center justify-center flex-1`,
            textAnimatedStyle,
          ]}
        >
          <Text style={[tw`text-base text-center text-light-text`]}>
            Swipe down to capture a thought.
          </Text>
        </Animated.View>
      </PanGestureHandler>

      <Animated.View
        style={[
          tw`absolute h-full w-full flex items-center justify-center`,
          thoughtCapturedTextAnimatedStyle,
          { top: 0, zIndex: thoughtCapturedTextZIndex },
        ]}
      >
        <Text style={[tw`text-base text-center text-light-text`]}>
          Thought captured.
        </Text>
      </Animated.View>

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
