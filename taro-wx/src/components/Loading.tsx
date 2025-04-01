import { View } from '@tarojs/components'
import './Loading.scss'

export default function Loading({ text = '加载中...' }) {
  return (
    <View className='loading-container'>
      <View className='loading-spinner'></View>
      <View className='loading-text'>{text}</View>
    </View>
  )
} 