import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Switch } from '@tarojs/components'
import './index.scss'

export default class Reservation extends Component {
  state = {
    roomId: 0,
    seatId: 0,
    date: '',
    timeSlot: 0,
    room: null,
    seat: null,
    isLoading: true,
    agreementChecked: false,
    bookingSuccess: false,
    timeSlotMap: {
      1: '08:00 - 12:00',
      2: '13:00 - 17:00',
      3: '18:00 - 22:00'
    }
  }

  componentDidMount() {
    // 获取路由参数
    const router = Taro.getCurrentInstance().router
    const { roomId, seatId, date, timeSlot } = router?.params || {}

    if (roomId && seatId && date && timeSlot) {
      this.setState({
        roomId: Number(roomId),
        seatId: Number(seatId),
        date,
        timeSlot: Number(timeSlot)
      }, this.fetchDetails)
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

  // 获取预约详情信息
  fetchDetails = () => {
    const { roomId, seatId } = this.state
    
    // 模拟请求
    setTimeout(() => {
      // 模拟自习室数据
      const mockRoom = {
        id: roomId,
        name: roomId === 1 ? '中心图书馆自习室' : '工学院自习室',
        location: roomId === 1 ? '图书馆一楼' : '工学院三号楼'
      }
      
      // 模拟座位数据
      const mockSeat = {
        id: seatId,
        name: `A${seatId}`,
        position: '靠窗'
      }
      
      this.setState({
        room: mockRoom,
        seat: mockSeat,
        isLoading: false
      })
    }, 1000)
  }

  // 切换协议同意状态
  toggleAgreement = () => {
    this.setState({ agreementChecked: !this.state.agreementChecked })
  }

  // 提交预约
  submitReservation = () => {
    const { agreementChecked } = this.state
    
    if (!agreementChecked) {
      return Taro.showToast({
        title: '请先同意预约协议',
        icon: 'none'
      })
    }
    
    // 检查登录状态
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showModal({
        title: '提示',
        content: '预约需要先登录，是否前往登录？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    
    Taro.showLoading({ title: '提交中...' })
    
    // 模拟预约提交
    setTimeout(() => {
      Taro.hideLoading()
      this.setState({ bookingSuccess: true })
    }, 1500)
  }

  // 返回首页
  navigateToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  // 前往我的预约
  navigateToProfile = () => {
    Taro.switchTab({ url: '/pages/profile/index' })
  }

  render() {
    const { 
      room, seat, date, timeSlot, timeSlotMap, isLoading, 
      agreementChecked, bookingSuccess 
    } = this.state
    
    if (bookingSuccess) {
      // 预约成功页面
      return (
        <View className='reservation-success'>
          <View className='success-icon'>✓</View>
          <Text className='success-title'>预约成功</Text>
          <Text className='success-desc'>您已成功预约座位</Text>
          
          <View className='success-info'>
            <View className='info-item'>
              <Text className='info-label'>自习室:</Text>
              <Text className='info-value'>{room?.name}</Text>
            </View>
            <View className='info-item'>
              <Text className='info-label'>座位号:</Text>
              <Text className='info-value'>{seat?.name}</Text>
            </View>
            <View className='info-item'>
              <Text className='info-label'>日期:</Text>
              <Text className='info-value'>{date}</Text>
            </View>
            <View className='info-item'>
              <Text className='info-label'>时间段:</Text>
              <Text className='info-value'>{timeSlotMap[timeSlot]}</Text>
            </View>
          </View>
          
          <View className='success-tips'>
            <Text className='tips-title'>温馨提示</Text>
            <Text className='tips-text'>1. 请在预约时间开始后15分钟内签到</Text>
            <Text className='tips-text'>2. 超时未签到将被视为违约</Text>
            <Text className='tips-text'>3. 如需取消请提前30分钟操作</Text>
          </View>
          
          <View className='success-actions'>
            <Button className='action-btn primary-btn' onClick={this.navigateToProfile}>
              查看我的预约
            </Button>
            <Button className='action-btn secondary-btn' onClick={this.navigateToHome}>
              返回首页
            </Button>
          </View>
        </View>
      )
    }
    
    return (
      <View className='reservation-page'>
        {isLoading ? (
          <View className='loading'>加载中...</View>
        ) : (
          <View className='reservation-content'>
            <View className='reservation-header'>
              <Text className='header-title'>确认预约信息</Text>
            </View>
            
            <View className='reservation-info'>
              <View className='info-item'>
                <Text className='info-label'>自习室</Text>
                <Text className='info-value'>{room?.name}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>位置</Text>
                <Text className='info-value'>{room?.location}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>座位号</Text>
                <Text className='info-value'>{seat?.name}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>座位位置</Text>
                <Text className='info-value'>{seat?.position}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>日期</Text>
                <Text className='info-value'>{date}</Text>
              </View>
              <View className='info-item'>
                <Text className='info-label'>时间段</Text>
                <Text className='info-value'>{timeSlotMap[timeSlot]}</Text>
              </View>
            </View>
            
            <View className='reservation-rules'>
              <Text className='rules-title'>预约规则</Text>
              <Text className='rule-item'>1. 请在预约时间开始后15分钟内签到，否则系统将自动取消预约。</Text>
              <Text className='rule-item'>2. 预约成功后，如需取消，请提前30分钟操作。</Text>
              <Text className='rule-item'>3. 一天内最多可预约3个时间段。</Text>
              <Text className='rule-item'>4. 一周内累计3次未签到，将被限制预约功能3天。</Text>
            </View>
            
            <View className='agreement-section'>
              <Switch 
                checked={agreementChecked} 
                onChange={this.toggleAgreement} 
                color='#4F46E5'
                className='agreement-switch'
              />
              <Text className='agreement-text'>
                我已阅读并同意《自习室预约规则》
              </Text>
            </View>
            
            <View className='submit-section'>
              <Button 
                className='submit-btn' 
                onClick={this.submitReservation}
                disabled={!agreementChecked}
              >
                确认预约
              </Button>
              <Button 
                className='cancel-btn' 
                onClick={() => Taro.navigateBack()}
              >
                返回修改
              </Button>
            </View>
          </View>
        )}
      </View>
    )
  }
} 