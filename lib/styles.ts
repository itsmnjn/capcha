import { ViewStyle } from 'react-native'

export const shadowStyle: ViewStyle = {
  shadowColor: '#444',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
}

export const largeShadowStyle: ViewStyle = {
  shadowColor: '#444',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
}

export const extraLargeShadowStyle: ViewStyle = {
  shadowColor: '#444',
  shadowOpacity: 0.2,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 12,
}

export const bottomSheetShadowStyle: ViewStyle = {
  shadowColor: '#222',
  shadowOpacity: 0.2,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: -5 },
  elevation: 16,
}
