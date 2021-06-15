import React, { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  Text,
  useColorScheme,
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
import { Ionicons, Feather } from '@expo/vector-icons'
import {
  buttonWidth,
  deviceHeight,
  bottomSheetSnapPoints,
} from '../lib/constants'
import tw from '../lib/tailwind'
import * as Haptics from 'expo-haptics'
import { bottomSheetShadowStyle, shadowStyle } from '../lib/styles'
import { View as AnimatedView, AnimatePresence } from 'moti'
import { Note, NoteStorage } from '../lib/types'
import uuid from 'uuid-random'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { timeAgo } from '../lib/timeAgo'

interface HomeProps {
  noteStorage: NoteStorage | null
  setNoteStorage: React.Dispatch<React.SetStateAction<NoteStorage | null>>
}

const Home = ({ noteStorage, setNoteStorage }: HomeProps): JSX.Element => {
  const [noteText, setNoteText] = useState('')
  const [noteViewHeight, _setNoteViewHeight] = useState(475)
  const [noteViewZIndex, setNoteViewZIndex] = useState(0)
  const [thoughtCapturedTextZIndex, setThoughtCapturedTextZIndex] = useState(-1)

  const [bottomSheetPresented, setBottomSheetPresented] = useState(false)

  const textInputRef = useRef()
  const notesListBottomSheetRef = useRef<BottomSheetModal>(null)
  const settingsBottomSheetRef = useRef<BottomSheetModal>(null)

  const translateY = useSharedValue(0)
  const mainTextOpacity = useSharedValue(0.4)
  const thoughtCapturedTextOpacity = useSharedValue(0)

  const noteViewOpacity = useSharedValue(0)
  const noteViewTranslateY = useSharedValue(0)

  const colorScheme = useColorScheme()

  const springConfig = {
    mass: 1,
    stiffness: 225,
    damping: 19,
  }

  const presentBottomSheet = (
    ref: React.RefObject<BottomSheetModalMethods>,
  ) => {
    ref.current?.expand()
    ref.current?.present()
    setBottomSheetPresented(true)
  }

  const handleBottomSheetChange = (
    index: number,
    ref: React.RefObject<BottomSheetModalMethods>,
  ) => {
    if (index === 0) {
      ref.current?.dismiss()
      setBottomSheetPresented(false)
      console.log('dismissed bottom sheet modal')
    }
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
    }, 1750)

    setTimeout(() => {
      noteViewTranslateY.value = 0
    }, 100)

    // actually save note
    const noteId = uuid()

    const newNote: Note = {
      id: noteId,
      body: noteText,
      date: new Date(),
    }

    if (noteStorage) {
      const newNoteStorage: NoteStorage = {
        notes: [...noteStorage.notes, newNote],
      }
      setNoteStorage(newNoteStorage)
    }

    setNoteText('')
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
    <BottomSheetModalProvider>
      <View style={[tw`flex-1`]}>
        <SafeAreaView
          style={[tw`flex flex-col w-full absolute`, { top: 0, zIndex: 1 }]}
        >
          <View style={[tw`px-6 pt-6 flex-row justify-between`]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                presentBottomSheet(settingsBottomSheetRef)
              }}
              style={({ pressed }) => [
                tw`rounded-full flex justify-center items-center`,
                colorScheme === 'light'
                  ? tw`bg-light-button-bg`
                  : tw`bg-dark-button-bg`,
                {
                  width: buttonWidth,
                  height: buttonWidth,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather
                name="settings"
                size={24}
                style={[
                  tw``,
                  colorScheme === 'light'
                    ? tw`text-light-button`
                    : tw`text-dark-button`,
                  { left: 0.1, top: 0.25 },
                ]}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                presentBottomSheet(notesListBottomSheetRef)
              }}
              style={({ pressed }) => [
                tw`rounded-full flex justify-center items-center`,
                colorScheme === 'light'
                  ? tw`bg-light-button-bg`
                  : tw`bg-dark-button-bg`,
                {
                  width: buttonWidth,
                  height: buttonWidth,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather
                name="list"
                size={24}
                style={[
                  tw``,
                  colorScheme === 'light'
                    ? tw`text-light-button`
                    : tw`text-dark-button`,
                  { top: 0.2 },
                ]}
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
                tw`rounded-2xl m-4 mb-32 p-4`,
                colorScheme === 'light' ? tw`bg-white` : tw`bg-light-dark-bg`,
                noteViewAnimatedStyle,
                shadowStyle,
                colorScheme === 'dark' && { shadowColor: '#000' },
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
                          Keyboard.dismiss()
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
                  style={[
                    tw`self-end`,
                    colorScheme === 'light'
                      ? tw`text-light-button`
                      : tw`text-dark-button`,
                  ]}
                />
              </Pressable>
              <TextInput
                value={noteText}
                onChangeText={(text) => setNoteText(text)}
                // eslint-disable-next-line tsc/config
                ref={textInputRef}
                style={[
                  tw`flex-1 text-lg px-1 mb-4`,
                  colorScheme === 'light'
                    ? tw`text-black`
                    : tw`text-dark-text-note`,
                ]}
                returnKeyType="done"
                blurOnSubmit
                multiline
              />
              <Text
                style={[
                  tw`self-end text-base`,
                  colorScheme === 'light'
                    ? tw`text-light-aux-text`
                    : tw`text-dark-aux-text`,
                ]}
              >
                {noteText.length}
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
            <Text
              style={[
                tw`text-base text-center`,
                colorScheme === 'light'
                  ? tw`text-light-text`
                  : tw`text-dark-text`,
              ]}
            >
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
          <Text
            style={[
              tw`text-base text-center`,
              colorScheme === 'light'
                ? tw`text-light-text`
                : tw`text-dark-text`,
            ]}
          >
            Thought captured.
          </Text>
        </Animated.View>

        <AnimatePresence>
          {(noteViewZIndex > 0 || bottomSheetPresented) && (
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

      <BottomSheetModal
        // eslint-disable-next-line tsc/config
        ref={notesListBottomSheetRef}
        onChange={(index: number) =>
          handleBottomSheetChange(index, notesListBottomSheetRef)
        }
        index={1}
        snapPoints={bottomSheetSnapPoints}
        // eslint-disable-next-line tsc/config
        style={[
          tw`rounded-2xl`,
          bottomSheetShadowStyle,
          colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
        ]}
        handleComponent={() => (
          <View
            style={[
              tw``,
              colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
              { height: 20, borderTopEndRadius: 15, borderTopStartRadius: 15 },
            ]}
          />
        )}
      >
        <View
          style={[
            tw`flex-1 flex-col`,
            colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
          ]}
        >
          <BottomSheetScrollView
            contentContainerStyle={[
              tw`px-4 pt-2 pb-8`,
              colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
            ]}
          >
            {noteStorage?.notes
              .map((note) => (
                <Pressable
                  key={note.id}
                  style={[
                    tw`rounded-xl p-4 mb-4`,
                    colorScheme === 'light'
                      ? tw`bg-white`
                      : tw`bg-light-dark-bg`,
                    shadowStyle,
                    colorScheme === 'dark' && { shadowColor: '#000' },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-base mb-1`,
                      colorScheme === 'light'
                        ? tw`text-light-text`
                        : tw`text-dark-text`,
                    ]}
                  >
                    {note.body}
                  </Text>

                  <Text
                    style={[
                      tw`text-sm self-end text-right`,
                      colorScheme === 'light'
                        ? tw`text-light-aux-text`
                        : tw`text-dark-aux-text`,
                    ]}
                  >
                    {timeAgo.format(new Date(note.date), 'mini-now')}
                  </Text>
                </Pressable>
              ))
              .reverse()}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        // eslint-disable-next-line tsc/config
        ref={settingsBottomSheetRef}
        onChange={(index: number) =>
          handleBottomSheetChange(index, settingsBottomSheetRef)
        }
        index={1}
        snapPoints={bottomSheetSnapPoints}
        // eslint-disable-next-line tsc/config
        style={[
          tw`bg-white rounded-2xl`,
          bottomSheetShadowStyle,
          colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
        ]}
        handleComponent={() => (
          <View
            style={[
              tw``,
              colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
              { height: 20, borderTopEndRadius: 15, borderTopStartRadius: 15 },
            ]}
          />
        )}
      >
        <View
          style={[
            tw`flex-1 flex-col`,
            colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
          ]}
        >
          <BottomSheetScrollView
            contentContainerStyle={[
              tw`px-4 pt-2 pb-8`,
              colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
            ]}
          >
            <Text
              style={[
                tw`text-4xl text-center self-center mb-1 mt-4`,
                colorScheme === 'light'
                  ? tw`text-light-text`
                  : tw`text-dark-text`,
              ]}
            >
              Capcha
            </Text>

            <Text
              style={[
                tw`text-base text-center self-center mb-6`,
                colorScheme === 'light'
                  ? tw`text-light-aux-text`
                  : tw`text-dark-aux-text`,
              ]}
            >
              v1.0.0
            </Text>

            <Pressable
              style={({ pressed }) => [
                tw`rounded-xl p-4 mb-4 flex-row items-center`,
                colorScheme === 'light' ? tw`bg-white` : tw`bg-light-dark-bg`,
                shadowStyle,
                colorScheme === 'dark' && { shadowColor: '#000' },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                Alert.alert(
                  'Privacy Policy',
                  'Everything is stored on your device :)',
                )
              }}
            >
              <Ionicons
                name="ios-exit-outline"
                size={24}
                style={[
                  tw`mr-3`,
                  colorScheme === 'light'
                    ? tw`text-light-aux-text`
                    : tw`text-dark-aux-text`,
                ]}
              />
              <Text
                style={[
                  tw`text-base`,
                  colorScheme === 'light'
                    ? tw`text-light-text`
                    : tw`text-dark-text`,
                ]}
              >
                Export
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                tw`rounded-xl p-4 mb-4 flex-row items-center`,
                colorScheme === 'light' ? tw`bg-white` : tw`bg-light-dark-bg`,
                shadowStyle,
                colorScheme === 'dark' && { shadowColor: '#000' },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                Alert.alert(
                  'Privacy Policy',
                  'Everything is stored on your device :)',
                )
              }}
            >
              <Ionicons
                name="ios-document-text-outline"
                size={24}
                style={[
                  tw`mr-3`,
                  colorScheme === 'light'
                    ? tw`text-light-aux-text`
                    : tw`text-dark-aux-text`,
                ]}
              />
              <Text
                style={[
                  tw`text-base`,
                  colorScheme === 'light'
                    ? tw`text-light-text`
                    : tw`text-dark-text`,
                ]}
              >
                Privacy Policy
              </Text>
            </Pressable>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  )
}

export default Home
