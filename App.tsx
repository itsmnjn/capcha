import { StatusBar } from 'expo-status-bar'
import React, { useRef } from 'react'
import { View } from 'react-native'
import tw from './lib/tailwind'
import Swiper from 'react-native-swiper'
import Home from './screens/Home'

const App = (): JSX.Element => {
  const swiperRef = useRef<Swiper>(null)

  return (
    <View style={[tw`w-full h-full bg-white`]}>
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
