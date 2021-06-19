import AppLoading from 'expo-app-loading'
import { Asset } from 'expo-asset'
import Constants from 'expo-constants'
import * as SplashScreen from 'expo-splash-screen'
import React from 'react'
import { Easing } from 'react-native'
import { ImageURISource } from 'react-native'
import { Animated, StyleSheet, View } from 'react-native'

interface AnimatedAppLoaderProps {
  image: ImageURISource
}

const AnimatedAppLoader: React.FC<AnimatedAppLoaderProps> = ({
  children,
  image,
}) => {
  const [isSplashReady, setSplashReady] = React.useState(false)

  const startAsync = React.useMemo(
    // If you use a local image with require(...), use `Asset.fromModule`
    () => () => Asset.fromURI(image as string).downloadAsync(),
    [image],
  )

  const onFinish = React.useMemo(() => setSplashReady(true), [])

  if (!isSplashReady) {
    return (
      // eslint-disable-next-line tsc/config
      <AppLoading
        // Instruct SplashScreen not to hide yet, we want to do this manually
        autoHideSplash={false}
        startAsync={startAsync}
        onError={console.error}
        onFinish={onFinish}
      />
    )
  }

  return <AnimatedSplashScreen image={image}>{children}</AnimatedSplashScreen>
}

interface AnimatedSplashScreenProps {
  image: ImageURISource
}

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  children,
  image,
}) => {
  const animation = React.useMemo(() => new Animated.Value(1), [])
  const [isAppReady, setAppReady] = React.useState(false)
  const [isSplashAnimationComplete, setAnimationComplete] =
    React.useState(false)

  React.useEffect(() => {
    if (isAppReady) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => setAnimationComplete(true))
    }
  }, [isAppReady])

  const onImageLoaded = React.useMemo(
    () => async () => {
      try {
        await SplashScreen.hideAsync()
        // Load stuff
        await Promise.all([])
      } catch (e) {
        // handle errors
      } finally {
        setAppReady(true)
      }
    },
    undefined,
  )

  return (
    <View style={{ flex: 1 }}>
      {isAppReady && children}
      {!isSplashAnimationComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              // eslint-disable-next-line tsc/config
              backgroundColor: Constants.manifest.splash.backgroundColor,
              opacity: animation,
            },
          ]}
        >
          <Animated.Image
            style={{
              width: '100%',
              height: '100%',
              // eslint-disable-next-line tsc/config
              resizeMode: Constants.manifest.splash.resizeMode || 'contain',
              transform: [
                {
                  scale: animation,
                },
              ],
            }}
            source={image}
            onLoadEnd={onImageLoaded}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </View>
  )
}

export default AnimatedAppLoader
