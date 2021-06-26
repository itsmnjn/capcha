import React, { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  Linking,
  Platform,
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
import BottomSheet, {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { timeAgo } from '../lib/timeAgo'
import Constants from 'expo-constants'

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
  const notesListBottomSheetRef = useRef<BottomSheet>(null)
  const settingsBottomSheetRef = useRef<BottomSheetModal>(null)

  const translateY = useSharedValue(0)
  const mainTextOpacity = useSharedValue(0.4)
  const thoughtCapturedTextOpacity = useSharedValue(0)

  const noteViewOpacity = useSharedValue(0)
  const noteViewTranslateY = useSharedValue(0)

  const colorScheme = useColorScheme()

  const springConfig = {
    mass: 1,
    stiffness: 200,
    damping: 20,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setNoteViewZIndex(2)
    setTimeout(() => {
      // eslint-disable-next-line tsc/config
      textInputRef?.current.focus()
    }, 250)
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

      translateY.value = withSpring(destY, {
        overshootClamping: destY === 0 ? false : true,
        restSpeedThreshold: destY === 0 ? 0.01 : 100,
        restDisplacementThreshold: destY === 0 ? 0.01 : 100,
        ...springConfig,
      })

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
        noteViewOpacity.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        })
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
            [0, 150],
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
        {/* header */}
        <SafeAreaView
          style={[
            tw`flex flex-col w-full absolute`,
            { top: 0, zIndex: 1, elevation: -1 },
          ]}
        >
          <View
            style={[
              tw`px-6 pt-6 flex-row justify-between`,
              Platform.OS === 'android' && tw`pt-12`,
            ]}
          >
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
          </View>
        </SafeAreaView>

        {/* notes view */}
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
                  { textAlignVertical: 'top' },
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

        {/* swipe down to capture */}
        {/* eslint-disable-next-line tsc/config */}
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <Animated.View style={[tw`flex items-center justify-center flex-1`]}>
            <Animated.Text
              style={[
                tw`text-base text-center`,
                colorScheme === 'light'
                  ? tw`text-light-text`
                  : tw`text-dark-text`,
                textAnimatedStyle,
              ]}
            >
              Swipe down to capture a thought.
            </Animated.Text>
          </Animated.View>
        </PanGestureHandler>

        {/* thought captured */}
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

        {Platform.OS === 'ios' && (
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
                  { backgroundColor: '#000', zIndex: 1 },
                ]}
              />
            )}
          </AnimatePresence>
        )}
      </View>

      <BottomSheet
        // eslint-disable-next-line tsc/config
        ref={notesListBottomSheetRef}
        index={0}
        snapPoints={['10%', '90%']}
        // eslint-disable-next-line tsc/config
        style={[bottomSheetShadowStyle]}
        handleComponent={() => (
          <View
            style={[
              tw`flex-row justify-center items-center`,
              colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
              colorScheme === 'light' && {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              },
              {
                height: 20,
                opacity: 0.96,
              },
            ]}
          >
            <View
              style={[
                tw`rounded-2xl`,
                colorScheme === 'light' ? tw`bg-dark-bg` : tw`bg-white`,
                { opacity: 0.4, height: 4, width: 24 },
              ]}
            />
          </View>
        )}
      >
        <View style={[tw`flex-1 flex-col bg-dark-bg`, { opacity: 0.96 }]}>
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
      </BottomSheet>

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
              {`v${Constants.manifest.version}`}
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
                  'Coming Soon',
                  'Export features are in the works! Follow me on Twitter @itsmnjn for updates :D',
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
                Export Notes
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
                Linking.openURL(
                  'mailto:eric@itsmnjn.com?subject=Capcha Support',
                )
              }}
            >
              <Ionicons
                name="ios-help-circle"
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
                Support
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

      {Platform.OS === 'android' && (
        <AnimatePresence>
          {(noteViewZIndex > 0 || bottomSheetPresented) && (
            <AnimatedView
              from={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{
                opacity: 0,
              }}
              style={[tw`absolute h-full w-full`, { backgroundColor: '#000' }]}
            />
          )}
        </AnimatePresence>
      )}
    </BottomSheetModalProvider>
  )
}

export default Home
