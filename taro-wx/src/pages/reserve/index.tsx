import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Picker, Input, Image } from '@tarojs/components'
import './index.scss'

// 模拟数据
const mockTimeSlots = [
  { id: 1, time: '08:00-10:00', available: true },
  { id: 2, time: '10:00-12:00', available: true },
  { id: 3, time: '12:00-14:00', available: false },
  { id: 4, time: '14:00-16:00', available: true },
  { id: 5, time: '16:00-18:00', available: true },
  { id: 6, time: '18:00-20:00', available: true },
  { id: 7, time: '20:00-22:00', available: false }
]

export default class ReservePage extends Component {
  state = {
    roomDetail: {
      id: 1,
      name: '图书馆中心自习室',
      location: '图书馆3楼',
      image: require('../../assets/rooms/library_room1.jpg')
    },
    selectedDate: '',
    selectedDateIndex: 0,
    selectedTimeSlot: null,
    userName: '',
    userId: '',
    dateOptions: this.generateDateOptions(),
    isFormValid: false
  }

  componentDidMount() {
    Taro.setNavigationBarTitle({
      title: '预约自习室'
    })
    
    const params = this.$router.params
    const roomId = params.id
    const seatId = params.seatId
    
    // 初始化表单，获取用户信息
    this.initUserInfo()
    
    // 初始设置默认日期为今天
    const today = new Date()
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setState({ 
      selectedDate: formattedDate,
      // 检查表单有效性
      isFormValid: this.checkFormValidity()
    })
  }
  
  // 生成日期选项（未来14天）
  generateDateOptions() {
    const dateOptions = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
      
      const formattedDate = `${year}-${month}-${day}`
      const displayText = i === 0 ? `今天 (${month}月${day}日)` : 
                           i === 1 ? `明天 (${month}月${day}日)` : 
                           `${month}月${day}日 ${weekday}`
      
      dateOptions.push({
        date: formattedDate,
        display: displayText
      })
    }
    
    return dateOptions
  }
  
  // 从微信获取用户信息
  initUserInfo = () => {
    // 这里应该是从全局状态或存储中获取用户信息
    // 模拟
    this.setState({
      userName: '张三',
      userId: '2020302111',
      isFormValid: this.checkFormValidity()
    })
  }
  
  // 处理日期选择变化
  handleDateChange = e => {
    const selectedDateIndex = e.detail.value
    const selectedDate = this.state.dateOptions[selectedDateIndex].date
    
    this.setState({ 
      selectedDateIndex,
      selectedDate,
      selectedTimeSlot: null,
      isFormValid: this.checkFormValidity({ selectedDate })
    })
  }
  
  // 处理时间段选择
  handleTimeSlotSelect = timeSlot => {
    if (!timeSlot.available) return
    
    this.setState({ 
      selectedTimeSlot: timeSlot,
      isFormValid: this.checkFormValidity({ selectedTimeSlot: timeSlot })
    })
  }
  
  // 处理姓名输入
  handleNameChange = e => {
    this.setState({ 
      userName: e.detail.value,
      isFormValid: this.checkFormValidity({ userName: e.detail.value })
    })
  }
  
  // 处理学号输入
  handleIdChange = e => {
    this.setState({ 
      userId: e.detail.value,
      isFormValid: this.checkFormValidity({ userId: e.detail.value })
    })
  }
  
  // 检查表单是否有效
  checkFormValidity = (newValues = {}) => {
    const { 
      selectedDate = this.state.selectedDate, 
      selectedTimeSlot = this.state.selectedTimeSlot,
      userName = this.state.userName,
      userId = this.state.userId
    } = newValues
    
    return !!(selectedDate && selectedTimeSlot && userName && userId)
  }
  
  // 提交预约
  handleSubmit = () => {
    const { isFormValid, roomDetail, selectedDate, selectedTimeSlot, userName, userId } = this.state
    
    if (!isFormValid) return
    
    // 模拟提交
    Taro.showLoading({ title: '提交中...' })
    
    setTimeout(() => {
      Taro.hideLoading()
      
      // 显示预约成功弹窗
      Taro.showModal({
        title: '预约成功',
        content: `您已成功预约${roomDetail.name}，时间: ${selectedDate} ${selectedTimeSlot.time}`,
        showCancel: false,
        success: () => {
          // 跳转到预约成功页面或我的预约页面
          Taro.redirectTo({
            url: '/pages/user/bookings'
          })
        }
      })
    }, 1500)
  }
  
  render() {
    const { 
      roomDetail, 
      selectedDateIndex, 
      selectedTimeSlot, 
      dateOptions, 
      userName, 
      userId,
      isFormValid
    } = this.state
    
    return (
      <View className='reserve-page'>
        {/* 头部信息 */}
        <View className='reserve-header'>
          <Text className='title'>预约自习室</Text>
          <Text className='subtitle'>{roomDetail.name} - {roomDetail.location}</Text>
        </View>
        
        {/* 预约表单 */}
        <View className='reserve-form'>
          {/* 日期选择 */}
          <View className='form-card'>
            <View className='card-header'>
              <Image className='card-icon' src={require('../../assets/icons/svg/MdiLightAlarm.svg')} />
              <Text className='card-title'>选择日期和时间</Text>
            </View>
            <View className='card-content'>
              <View className='form-item'>
                <Text className='item-label'>日期</Text>
                <Picker
                  mode='selector'
                  range={dateOptions}
                  rangeKey='display'
                  value={selectedDateIndex}
                  onChange={this.handleDateChange}
                >
                  <View className='form-picker'>
                    {dateOptions[selectedDateIndex].display}
                  </View>
                </Picker>
              </View>
              
              <View className='form-item'>
                <Text className='item-label'>时间段</Text>
                <View className='time-slots'>
                  {mockTimeSlots.map(slot => (
                    <Text
                      key={slot.id}
                      className={`time-slot ${selectedTimeSlot && selectedTimeSlot.id === slot.id ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                      onClick={() => this.handleTimeSlotSelect(slot)}
                    >
                      {slot.time}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
          
          {/* 用户信息 */}
          <View className='form-card'>
            <View className='card-header'>
              <Image className='card-icon' src={require('../../assets/icons/svg/MdiLightClipboardCheck.svg')} />
              <Text className='card-title'>预约人信息</Text>
            </View>
            <View className='card-content'>
              <View className='form-item'>
                <Text className='item-label'>姓名</Text>
                <Input
                  className='user-name-input'
                  type='text'
                  placeholder='请输入您的姓名'
                  value={userName}
                  onInput={this.handleNameChange}
                />
              </View>
              
              <View className='form-item'>
                <Text className='item-label'>学号</Text>
                <Input
                  className='user-id-input'
                  type='text'
                  placeholder='请输入您的学号'
                  value={userId}
                  onInput={this.handleIdChange}
                />
              </View>
            </View>
          </View>
          
          {/* 预约须知 */}
          <View className='notice'>
            预约须知：
            <View>1. 请至少提前30分钟预约</View>
            <View>2. 预约成功后请按时到达，迟到30分钟视为放弃</View>
            <View>3. 如需取消预约，请至少提前1小时操作</View>
          </View>
        </View>
        
        {/* 底部提交栏 */}
        <View className='submit-bar'>
          <View className='price-info'>
            费用：<Text className='price'>免费</Text>
          </View>
          <View 
            className={`submit-button ${!isFormValid ? 'disabled' : ''}`}
            onClick={this.handleSubmit}
          >
            确认预约
          </View>
        </View>
      </View>
    )
  }
} 