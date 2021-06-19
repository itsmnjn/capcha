import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { View, useColorScheme } from 'react-native'
import tw from './lib/tailwind'
import Home from './screens/Home'
import { noteStorageKey } from './lib/constants'
import { useState } from 'react'
import { useEffect } from 'react'
import { NoteStorage } from './lib/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AnimatedAppLoader from './components/AnimatedAppLoader'
import Constants from 'expo-constants'

const App = (): JSX.Element => {
  const colorScheme = useColorScheme()

  const emptyNoteStorage: NoteStorage = {
    notes: [],
  }

  const [noteStorage, setNoteStorage] = useState<NoteStorage | null>(null)

  const retrieveFromStorage = async () => {
    if (!noteStorage) {
      const stringifiedSavedNoteStorage = await AsyncStorage.getItem(
        noteStorageKey,
      )

      if (stringifiedSavedNoteStorage) {
        const savedNoteStorage = JSON.parse(
          stringifiedSavedNoteStorage,
        ) as NoteStorage
        setNoteStorage(savedNoteStorage)
      } else {
        setNoteStorage(emptyNoteStorage)
      }
    }
  }

  const saveToStorage = async () => {
    if (noteStorage) {
      await AsyncStorage.setItem(noteStorageKey, JSON.stringify(noteStorage))
    }
  }

  useEffect(() => {
    retrieveFromStorage()
  }, [])

  useEffect(() => {
    saveToStorage()
  }, [noteStorage])

  return (
    // eslint-disable-next-line tsc/config
    <AnimatedAppLoader image={{ uri: Constants.manifest.splash.image }}>
      <View
        style={[
          tw`w-full h-full`,
          colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
        ]}
      >
        <Home noteStorage={noteStorage} setNoteStorage={setNoteStorage} />

        <StatusBar style="auto" />
      </View>
    </AnimatedAppLoader>
  )
}

export default App
