import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
import './index.scss'

export default class Index extends Component {
  state = {
    banners: [
      { 
        id: 1, 
        image: require('../../assets/banners/campus.jpg'), 
        title: '自习室预约系统' 
      },
      { 
        id: 2, 
        image: require('../../assets/rooms/library_room1.jpg'), 
        title: '安静学习环境' 
      },
      { 
        id: 3, 
        image: require('../../assets/rooms/engineering_room.jpg'), 
        title: '便捷预约服务' 
      }
    ],
    featureCards: [
      { 
        id: 1, 
        title: '快速预约', 
        icon: require('../../assets/icons/svg/MdiLightAlarm.svg'),
        desc: '选择座位，一键预约' 
      },
      { 
        id: 2, 
        title: '座位状态', 
        icon: require('../../assets/icons/svg/MdiLightContentSaveAll.svg'),
        desc: '实时查看座位可用情况' 
      },
      { 
        id: 3, 
        title: '我的预约', 
        icon: require('../../assets/icons/svg/MdiLightClipboardCheck.svg'),
        desc: '管理个人预约记录' 
      },
      { 
        id: 4, 
        title: '签到服务', 
        icon: require('../../assets/icons/svg/MdiLightAlarm.svg'),
        desc: '便捷的预约签到服务' 
      }
    ],
    recentRooms: [
      { id: 1, name: '中心图书馆自习室', available: 35, total: 50, status: '可预约', image: require('../../assets/rooms/library_room1.jpg') },
      { id: 2, name: '工学院自习室', available: 12, total: 40, status: '可预约', image: require('../../assets/rooms/engineering_room.jpg') },
      { id: 3, name: '文学院自习室', available: 0, total: 30, status: '已满', image: require('../../assets/rooms/library_room1.jpg') }
    ]
  }

  componentDidMount() {
    // 检查登录状态
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) {
        // 未登录状态下可以继续浏览，但某些功能会受限
        console.log('用户未登录')
      }
    } catch (e) {
      console.error('获取登录状态失败', e)
    }
  }

  navigateToRooms = () => {
    Taro.switchTab({
      url: '/pages/rooms/index'
    })
  }

  navigateToRoomDetail = (id) => {
    Taro.navigateTo({
      url: `/pages/rooms/detail?id=${id}`
    })
  }

  navigateToProfile = () => {
    Taro.switchTab({
      url: '/pages/profile/index'
    })
  }

  render() {
    const { banners, featureCards, recentRooms } = this.state

    return (
      <View className='index'>
        {/* 顶部轮播图 */}
        <Swiper
          className='banner-swiper fade-in'
          indicatorColor='rgba(255, 255, 255, 0.6)'
          indicatorActiveColor='#ffffff'
          circular
          indicatorDots
          autoplay
        >
          {banners.map(banner => (
            <SwiperItem key={banner.id}>
              <Image src={banner.image} className='banner-image' mode='aspectFill' />
              <View className='banner-title'>{banner.title}</View>
            </SwiperItem>
          ))}
        </Swiper>

        {/* 功能导航区 */}
        <View className='feature-cards slide-up'>
          {featureCards.map(card => (
            <View className='feature-card' key={card.id} onClick={this.navigateToRooms}>
              <Image src={card.icon} className='feature-icon' />
              <Text className='feature-title'>{card.title}</Text>
              <Text className='feature-desc'>{card.desc}</Text>
            </View>
          ))}
        </View>

        {/* 近期热门自习室 */}
        <View className='section slide-up'>
          <View className='section-header'>
            <Text className='section-title'>热门自习室</Text>
            <Text className='section-more' onClick={this.navigateToRooms}>查看更多</Text>
          </View>
          <View className='room-list'>
            {recentRooms.map(room => (
              <View 
                className='room-card' 
                key={room.id}
                onClick={() => this.navigateToRoomDetail(room.id)}
              >
                <View className='room-info'>
                  <Text className='room-name'>{room.name}</Text>
                  <Text className={`room-status ${room.status === '可预约' ? 'status-available' : 'status-full'}`}>
                    {room.status}
                  </Text>
                </View>
                <View className='room-capacity'>
                  <View className='capacity-bar'>
                    <View 
                      className='capacity-progress' 
                      style={{ width: `${(room.available / room.total) * 100}%` }}
                    />
                  </View>
                  <Text className='capacity-text'>{room.available} / {room.total} 个座位可用</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 我的预约快捷入口 */}
        <View className='my-bookings slide-up' onClick={this.navigateToProfile}>
          <Text className='my-bookings-title'>我的预约</Text>
          <Text className='my-bookings-arrow'>></Text>
        </View>
      </View>
    )
  }
} 