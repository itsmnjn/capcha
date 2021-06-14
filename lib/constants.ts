import { Dimensions } from 'react-native'

export const buttonWidth = 40

const dimensions = Dimensions.get('window')

export const deviceWidth = dimensions.width
export const deviceHeight = dimensions.height

export const noteStorageKey = 'note-storage-key'

export const bottomSheetSnapPoints = [0, '90%']
