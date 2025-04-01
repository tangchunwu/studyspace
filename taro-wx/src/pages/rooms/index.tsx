import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import './index.scss'

const mockData = {
  roomTypes: ['全部', '安静自习', '小组讨论', '电脑室', '多媒体室'],
  roomList: [
    {
      id: 1,
      name: '图书馆中心自习室',
      status: '可预约',
      location: '图书馆3楼',
      image: require('../../assets/rooms/library_room1.jpg'),
      capacity: { total: 120, used: 45 }
    },
    {
      id: 2,
      name: '工学院研讨室',
      status: '可预约',
      location: '工学院A栋2楼',
      image: require('../../assets/rooms/engineering_room.jpg'),
      capacity: { total: 60, used: 20 }
    },
    {
      id: 3,
      name: '计算机学院机房',
      status: '已满',
      location: '计算机学院B栋1楼',
      image: require('../../assets/rooms/library_room1.jpg'),
      capacity: { total: 80, used: 80 }
    },
    {
      id: 4,
      name: '文学院讨论室',
      status: '可预约',
      location: '文学院C栋4楼',
      image: require('../../assets/rooms/engineering_room.jpg'),
      capacity: { total: 40, used: 25 }
    }
  ]
}

export default class RoomList extends Component {
  state = {
    selectedType: '全部',
    searchValue: '',
    loading: false
  }

  componentDidMount() {
    Taro.setNavigationBarTitle({
      title: '自习室列表'
    })
    
    // 模拟加载数据
    this.setState({ loading: true })
    setTimeout(() => {
      this.setState({ loading: false })
    }, 500)
  }

  // 处理类型标签点击
  handleTypeClick = (type) => {
    this.setState({ selectedType: type })
  }

  // 处理搜索输入变化
  handleSearchChange = (e) => {
    this.setState({ searchValue: e.detail.value })
  }

  // 处理自习室卡片点击
  handleRoomClick = (roomId) => {
    Taro.navigateTo({
      url: `/pages/rooms/detail?id=${roomId}`
    })
  }

  // 计算状态对应的类名
  getStatusClassName = (status) => {
    return status === '可预约' ? 'status-available' : 'status-full'
  }

  render() {
    const { selectedType, searchValue, loading } = this.state
    const { roomTypes, roomList } = mockData

    // 根据选择的类型和搜索值过滤自习室列表
    const filteredRooms = roomList.filter(room => {
      const typeMatch = selectedType === '全部' || room.name.includes(selectedType)
      const searchMatch = !searchValue || room.name.includes(searchValue) || room.location.includes(searchValue)
      return typeMatch && searchMatch
    })

    return (
      <View className='room-list-page'>
        {/* 搜索框 */}
        <View className='search-bar'>
          <Input
            className='search-input'
            type='text'
            placeholder='搜索自习室名称或位置'
            value={searchValue}
            onInput={this.handleSearchChange}
          />
        </View>

        {/* 筛选标签 */}
        <View className='filter-tags'>
          {roomTypes.map(type => (
            <Text
              key={type}
              className={`filter-tag ${selectedType === type ? 'active' : ''}`}
              onClick={() => this.handleTypeClick(type)}
            >
              {type}
            </Text>
          ))}
        </View>

        {/* 自习室列表 */}
        <ScrollView
          className='room-list-scroll'
          scrollY
        >
          {loading ? (
            <View className='loading'>正在加载自习室数据...</View>
          ) : filteredRooms.length > 0 ? (
            <View className='room-list'>
              {filteredRooms.map(room => (
                <View 
                  key={room.id} 
                  className='room-card'
                  onClick={() => this.handleRoomClick(room.id)}
                >
                  <Image 
                    className='room-image' 
                    src={room.image} 
                    mode='aspectFill' 
                  />
                  <View className='room-content'>
                    <View className='room-header'>
                      <Text className='room-name'>{room.name}</Text>
                      <Text className={`room-status ${this.getStatusClassName(room.status)}`}>
                        {room.status}
                      </Text>
                    </View>
                    <Text className='room-location'>{room.location}</Text>
                    <View className='room-capacity'>
                      <View className='capacity-bar'>
                        <View 
                          className='capacity-progress' 
                          style={{ width: `${(room.capacity.used / room.capacity.total) * 100}%` }}
                        />
                      </View>
                      <Text className='capacity-text'>
                        剩余座位: {room.capacity.total - room.capacity.used}/{room.capacity.total}
                      </Text>
                    </View>
                    <View className='reserve-btn'>预约座位</View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='empty-list'>
              <View className='empty-icon'>😢</View>
              <Text>没有找到符合条件的自习室</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
} 