import { StatusBar } from 'expo-status-bar'
import React, { useRef } from 'react'
import { View, useColorScheme } from 'react-native'
import tw from './lib/tailwind'
import Swiper from 'react-native-swiper'
import Home from './screens/Home'

const App = (): JSX.Element => {
  const swiperRef = useRef<Swiper>(null)

  const colorScheme = useColorScheme()

  return (
    <View
      style={[
        tw`w-full h-full`,
        colorScheme === 'light' ? tw`bg-white` : tw`bg-dark-bg`,
      ]}
    >
      <Swiper
        loop={false}
        index={0}
        ref={swiperRef}
        showsPagination={false}
        bounces={false}
        scrollEnabled={false}
      >
        <Home swiperRef={swiperRef} />
      </Swiper>

      <StatusBar style="auto" />
    </View>
  )
}

export default App
