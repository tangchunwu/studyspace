import { Component } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import useReservationStore, { Reservation } from '../../store/reservationStore'
import useAuthStore from '../../store/authStore'
import Loading from '../../components/Loading'
import './reservations.scss'

interface MyReservationsState {
  isLoading: boolean;
  reservations: Reservation[];
  activeTab: '全部' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消';
  tabs: ('全部' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消')[];
}

export default class MyReservations extends Component<{}, MyReservationsState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      isLoading: true,
      reservations: [],
      activeTab: '全部',
      tabs: ['全部', '待开始', '待签到', '已签到', '已结束', '已取消']
    }
  }

  componentDidMount() {
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 2000)
      return
    }

    this.fetchReservations()
  }

  // 获取预约列表
  async fetchReservations() {
    this.setState({ isLoading: true })
    
    try {
      await useReservationStore.getState().fetchReservations()
      
      const reservations = useReservationStore.getState().reservations
      this.setState({ 
        reservations,
        isLoading: false
      })
    } catch (error) {
      console.error('获取预约列表失败', error)
      Taro.showToast({
        title: '获取预约信息失败',
        icon: 'none'
      })
      this.setState({ isLoading: false })
    }
  }

  // 切换标签
  handleTabChange(tab: '全部' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消') {
    this.setState({ activeTab: tab })
  }

  // 过滤预约记录
  getFilteredReservations() {
    const { reservations, activeTab } = this.state
    
    if (activeTab === '全部') {
      return reservations
    }
    
    return reservations.filter(r => r.status === activeTab)
  }

  // 查看预约详情
  handleViewDetail(reservation: Reservation) {
    // 跳转到预约详情页
    Taro.navigateTo({
      url: `/pages/reservation/detail?id=${reservation.id}`
    })
  }

  // 取消预约
  async handleCancelReservation(id: number, e: any) {
    e.stopPropagation() // 阻止冒泡，以免触发查看详情
    
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await useReservationStore.getState().cancelReservation(id)
          
          if (success) {
            Taro.showToast({
              title: '预约已取消',
              icon: 'success'
            })
            
            // 更新当前列表
            const reservations = useReservationStore.getState().reservations
            this.setState({ reservations })
          } else {
            Taro.showToast({
              title: '取消失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 签到
  async handleCheckIn(id: number, e: any) {
    e.stopPropagation() // 阻止冒泡，以免触发查看详情
    
    Taro.showModal({
      title: '确认签到',
      content: '确定要签到吗？请确保您已到达自习室',
      success: async (res) => {
        if (res.confirm) {
          const success = await useReservationStore.getState().checkIn(id)
          
          if (success) {
            Taro.showToast({
              title: '签到成功',
              icon: 'success'
            })
            
            // 更新当前列表
            const reservations = useReservationStore.getState().reservations
            this.setState({ reservations })
          } else {
            Taro.showToast({
              title: '签到失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 渲染预约状态对应的操作按钮
  renderActionButton(reservation: Reservation) {
    switch (reservation.status) {
      case '待开始':
        return (
          <View 
            className='cancel-btn'
            onClick={(e) => this.handleCancelReservation(reservation.id, e)}
          >
            取消预约
          </View>
        )
      case '待签到':
        return (
          <View className='action-buttons'>
            <View 
              className='check-in-btn'
              onClick={(e) => this.handleCheckIn(reservation.id, e)}
            >
              立即签到
            </View>
            <View 
              className='cancel-btn'
              onClick={(e) => this.handleCancelReservation(reservation.id, e)}
            >
              取消预约
            </View>
          </View>
        )
      default:
        return null
    }
  }

  // 将中文状态转换为英文类名
  getStatusClassName(status: string): string {
    switch(status) {
      case '待开始': return 'waiting';
      case '待签到': return 'check-in';
      case '已签到': return 'checked';
      case '已结束': return 'completed';
      case '已取消': return 'canceled';
      default: return 'waiting';
    }
  }

  render() {
    const { isLoading, activeTab, tabs } = this.state
    const filteredReservations = this.getFilteredReservations()
    
    if (isLoading) {
      return <Loading />
    }
    
    return (
      <View className='my-reservations'>
        <View className='tab-container'>
          <ScrollView scrollX className='tabs'>
            {tabs.map(tab => (
              <View 
                key={tab}
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => this.handleTabChange(tab)}
              >
                {tab}
              </View>
            ))}
          </ScrollView>
        </View>
        
        <View className='reservations-content'>
          {filteredReservations.length > 0 ? (
            filteredReservations.map(reservation => (
              <View 
                key={reservation.id} 
                className='reservation-card'
                onClick={() => this.handleViewDetail(reservation)}
              >
                <View className='reservation-header'>
                  <Text className='room-name'>{reservation.roomName}</Text>
                  <Text className={`status ${this.getStatusClassName(reservation.status)}`}>
                    {reservation.status}
                  </Text>
                </View>
                
                <View className='reservation-details'>
                  <View className='detail-item'>
                    <Text className='label'>座位:</Text>
                    <Text className='value'>{reservation.seatName}</Text>
                  </View>
                  <View className='detail-item'>
                    <Text className='label'>日期:</Text>
                    <Text className='value'>{reservation.date}</Text>
                  </View>
                  <View className='detail-item'>
                    <Text className='label'>时间段:</Text>
                    <Text className='value'>{reservation.timeSlotText}</Text>
                  </View>
                  <View className='detail-item'>
                    <Text className='label'>预约时间:</Text>
                    <Text className='value'>{new Date(reservation.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
                
                <View className='reservation-actions'>
                  {this.renderActionButton(reservation)}
                </View>
              </View>
            ))
          ) : (
            <View className='empty-state'>
              <Image 
                className='empty-icon' 
                src={require('../../assets/icons/empty.png')} 
                mode='aspectFit'
              />
              <Text className='empty-text'>暂无{activeTab !== '全部' ? activeTab : ''}预约记录</Text>
            </View>
          )}
        </View>
      </View>
    )
  }
} 