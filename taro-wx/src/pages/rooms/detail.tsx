import { Component } from 'react'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components'
import useRoomStore from '../../store/roomStore'
import useAuthStore from '../../store/authStore'
import Loading from '../../components/Loading'
import './detail.scss'

// 模拟数据
const mockDateOptions = [
  { day: '今天', date: '15', fullDate: '2023-04-15' },
  { day: '明天', date: '16', fullDate: '2023-04-16' },
  { day: '周一', date: '17', fullDate: '2023-04-17' },
  { day: '周二', date: '18', fullDate: '2023-04-18' },
  { day: '周三', date: '19', fullDate: '2023-04-19' },
  { day: '周四', date: '20', fullDate: '2023-04-20' },
  { day: '周五', date: '21', fullDate: '2023-04-21' }
]

const mockTimeSlots = [
  { id: 1, time: '08:00-10:00', available: true },
  { id: 2, time: '10:00-12:00', available: true },
  { id: 3, time: '12:00-14:00', available: false },
  { id: 4, time: '14:00-16:00', available: true },
  { id: 5, time: '16:00-18:00', available: true },
  { id: 6, time: '18:00-20:00', available: true },
  { id: 7, time: '20:00-22:00', available: false }
]

// 座位数据生成函数 - 使用更少的占用座位使大部分可选
const generateSeats = (rows, cols) => {
  const seats = []
  
  // 固定的座位状态数据 - 只有几个座位被占用
  const occupiedSeats = ['A5', 'B3', 'C8', 'E2']
  const emptySpaces = ['A1', 'C1'] // 减少空座位数量
  
  for (let i = 0; i < rows; i++) {
    const row = []
    const rowLetter = String.fromCharCode(65 + i) // A, B, C, D, E...
    
    for (let j = 0; j < cols; j++) {
      const seatCol = j + 1
      const seatName = `${rowLetter}${seatCol}`
      
      // 检查这个座位是否在占用列表或空位列表中
      const isOccupied = occupiedSeats.includes(seatName)
      const isEmpty = emptySpaces.includes(seatName)
      
      row.push({
        id: `${i+1}-${j+1}`,
        row: i + 1,
        col: j + 1,
        name: seatName,
        status: isEmpty ? 'empty' : (isOccupied ? 'occupied' : 'available')
      })
    }
    seats.push(row)
  }
  
  return seats
}

export default class RoomDetail extends Component {
  state = {
    id: 0,
    room: null,
    date: '',
    dateText: '',
    timeSlot: 1,
    timeSlots: [
      { id: 1, text: '08:00 - 12:00' },
      { id: 2, text: '13:00 - 17:00' },
      { id: 3, text: '18:00 - 22:00' }
    ],
    selectedSeat: null,
    seatMap: [],
    dateOptions: [],
    isLoading: true
  }

  componentDidMount() {
    // 获取路由参数
    const router = getCurrentInstance().router
    const roomId = router?.params?.id ? parseInt(router.params.id) : 0
    
    if (roomId) {
      this.setState({ id: roomId }, () => {
        this.fetchRoomDetail()
      })
      
      // 初始化日期选择器
      this.initDateOptions()
    } else {
      Taro.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    }
  }

  // 初始化可选日期（今天和未来6天）
  initDateOptions = () => {
    const dates = []
    const dateTexts = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const dateValue = `${year}-${month}-${day}`
      
      // 日期展示文本
      let dayText = ''
      if (i === 0) dayText = '今天'
      else if (i === 1) dayText = '明天'
      else if (i === 2) dayText = '后天'
      else {
        const weekDay = date.getDay()
        const weekDayText = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekDay]
        dayText = weekDayText
      }
      
      const dateText = `${month}月${day}日 (${dayText})`
      dates.push(dateValue)
      dateTexts.push(dateText)
    }
    
    this.setState({ 
      dateOptions: dates,
      date: dates[0],
      dateText: dateTexts[0]
    }, () => {
      // 获取座位图
      if (this.state.id) {
        this.initSeatMap()
      }
    })
  }

  // 获取自习室详情
  fetchRoomDetail = async () => {
    this.setState({ isLoading: true })
    
    try {
      await useRoomStore.getState().fetchRoomDetail(this.state.id)
      
      const room = useRoomStore.getState().currentRoom
      
      this.setState({ 
        room,
        isLoading: false
      })
    } catch (error) {
      console.error('获取自习室详情失败', error)
      this.setState({ isLoading: false })
      Taro.showToast({
        title: '获取自习室信息失败',
        icon: 'none'
      })
    }
  }

  // 初始化座位图
  initSeatMap = async () => {
    this.setState({ isLoading: true, selectedSeat: null })
    
    try {
      // 使用固定数据的座位图生成函数
      const seatMap = generateSeats(5, 10)
      
      this.setState({ 
        seatMap,
        isLoading: false
      })
    } catch (error) {
      console.error('获取座位图失败', error)
      this.setState({ isLoading: false })
      Taro.showToast({
        title: '获取座位信息失败',
        icon: 'none'
      })
    }
  }

  // 日期选择
  handleDateChange = (e) => {
    const index = Number(e.detail.value)
    const date = this.state.dateOptions[index]
    const dateTexts = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const thisDate = new Date(today)
      thisDate.setDate(today.getDate() + i)
      
      const month = (thisDate.getMonth() + 1).toString().padStart(2, '0')
      const day = thisDate.getDate().toString().padStart(2, '0')
      
      // 日期展示文本
      let dayText = ''
      if (i === 0) dayText = '今天'
      else if (i === 1) dayText = '明天'
      else if (i === 2) dayText = '后天'
      else {
        const weekDay = thisDate.getDay()
        const weekDayText = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekDay]
        dayText = weekDayText
      }
      
      const dateText = `${month}月${day}日 (${dayText})`
      dateTexts.push(dateText)
    }
    
    this.setState({ 
      date,
      dateText: dateTexts[index],
      selectedSeat: null
    }, this.initSeatMap)
  }

  // 时间段选择
  handleTimeSlotSelect = (id) => {
    this.setState({ 
      timeSlot: id,
      selectedSeat: null
    }, this.initSeatMap)
  }

  // 座位选择
  handleSeatSelect = (seat) => {
    console.log('选择座位', seat.name, seat.status)
    
    // 空座位不可选
    if (seat.status === 'empty') {
      Taro.showToast({
        title: '此处无座位',
        icon: 'none',
        duration: 1000
      })
      return
    }
    
    // 已占用座位不可选
    if (seat.status === 'occupied') {
      Taro.showToast({
        title: '该座位已被占用',
        icon: 'error',
        duration: 1500
      })
      return
    }
    
    // 如果已选中该座位，则取消选中
    if (this.state.selectedSeat && this.state.selectedSeat.id === seat.id) {
      this.setState({ selectedSeat: null })
      
      Taro.showToast({
        title: '已取消选择',
        icon: 'none',
        duration: 1000
      })
      return
    }
    
    // 选择新座位
    this.setState({ selectedSeat: seat })
    
    Taro.showToast({
      title: `已选择${seat.name}号座位`,
      icon: 'success',
      duration: 1500
    })
  }

  // 前往预约确认页
  navigateToReservation = () => {
    const { id, room, date, timeSlot, timeSlots, selectedSeat } = this.state
    
    if (!selectedSeat) {
      return Taro.showToast({
        title: '请选择座位',
        icon: 'none'
      })
    }
    
    // 检查登录状态
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) {
      return Taro.showModal({
        title: '提示',
        content: '您需要登录后才能预约',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    }
    
    // 跳转到预约确认页
    const selectedTimeSlot = timeSlots.find(ts => ts.id === timeSlot)
    
    Taro.navigateTo({
      url: `/pages/reserve/index?roomId=${id}&roomName=${room.name}&seatId=${selectedSeat.id}&seatName=${selectedSeat.name}&date=${date}&timeSlot=${timeSlot}&timeSlotText=${selectedTimeSlot.text}`
    })
  }

  // 获取状态对应的类名
  getStatusClassName = (status) => {
    return status === 'available' ? 'status-available' : 'status-full'
  }

  render() {
    const { 
      room, seatMap, isLoading, dateText,
      timeSlot, timeSlots, selectedSeat 
    } = this.state
    
    if (isLoading) {
      return <Loading />
    }
    
    if (!room) {
      return (
        <View className='detail-page'>
          <Text className='loading'>找不到自习室信息</Text>
        </View>
      )
    }
    
    // 使用require获取默认图片，避免一些图片加载问题
    const defaultImage = require('../../assets/rooms/library_room1.jpg')
    
    return (
      <View className='detail-page'>
        {/* 自习室图片 */}
        <Image 
          mode='aspectFill' 
          className='room-image' 
          src={room.imageUrl || defaultImage} 
        />
        
        {/* 自习室基本信息 */}
        <View className='room-card'>
          <View className='room-header'>
            <Text className='room-name'>{room.name}</Text>
            <Text className={`room-status ${this.getStatusClassName(room.status)}`}>
              {room.status || (room.available > 0 ? '可预约' : '已满')}
            </Text>
          </View>
          <Text className='room-location'>{room.location}</Text>
          <View className='room-capacity'>
            <View className='capacity-bar'>
              <View 
                className='capacity-progress' 
                style={{ width: `${(room.available / room.total) * 100}%` }}
              />
            </View>
            <Text className='capacity-text'>
              剩余座位: {room.available}/{room.total}
            </Text>
          </View>
          <Text className='room-desc'>{room.description || '自习室环境安静，配有空调和充电插座，是学习的理想场所。'}</Text>
        </View>
        
        {/* 选择器区域 */}
        <View className='selectors'>
          {/* 日期选择器 */}
          <View className='date-selector'>
            <Text className='selector-title'>选择日期</Text>
            <Picker 
              mode='selector' 
              range={[dateText]} 
              onChange={this.handleDateChange}
            >
              <View className='form-picker'>
                {dateText}
              </View>
            </Picker>
          </View>
          
          {/* 时间段选择器 */}
          <View className='time-selector'>
            <Text className='selector-title'>选择时间段</Text>
            <View className='time-slots'>
              {timeSlots.map(slot => (
                <Text
                  key={slot.id}
                  className={`time-slot ${timeSlot === slot.id ? 'selected' : ''}`}
                  onClick={() => this.handleTimeSlotSelect(slot.id)}
                >
                  {slot.text}
                </Text>
              ))}
            </View>
          </View>
        </View>
        
        {/* 座位图 */}
        <View className='seat-map-container'>
          <View className='seat-map-title'>
            <Text>座位选择</Text>
            <View className='seat-legend'>
              <View className='legend-item'>
                <View className='legend-color legend-available'></View>
                <Text>可选座位</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color legend-selected'></View>
                <Text>已选座位</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color legend-occupied'></View>
                <Text>已占座位</Text>
              </View>
            </View>
          </View>
          
          <View className='front-indicator'>前方 (屏幕方向)</View>
          
          <ScrollView scrollX scrollWithAnimation className='seat-container'>
            {seatMap.map((row, rowIndex) => (
              <View key={rowIndex} className='seat-row'>
                <View className='row-label'>{String.fromCharCode(65 + rowIndex)}</View>
                {row.map(seat => (
                  <View 
                    key={seat.id}
                    className={`seat ${seat.status} ${selectedSeat && selectedSeat.id === seat.id ? 'selected' : ''}`}
                    onClick={() => this.handleSeatSelect(seat)}
                  >
                    {seat.col}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* 底部操作栏 */}
        <View className='action-bar'>
          <View className='selected-info'>
            {selectedSeat ? (
              <Text>已选择: <Text className='seat-name'>{selectedSeat.name}</Text></Text>
            ) : (
              <Text>请选择一个座位</Text>
            )}
          </View>
          <View 
            className={`reserve-button ${!selectedSeat ? 'disabled' : ''}`}
            onClick={this.navigateToReservation}
          >
            立即预约
          </View>
        </View>
      </View>
    )
  }
} 