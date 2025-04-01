import { Component } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import useReservationStore, { Reservation } from '../../store/reservationStore'
import useRoomStore from '../../store/roomStore'
import Loading from '../../components/Loading'
import './detail.scss'

interface ReservationDetailState {
  id: number | null;
  reservation: Reservation | null;
  isLoading: boolean;
  showQrCode: boolean;
}

export default class ReservationDetail extends Component<{}, ReservationDetailState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      id: null,
      reservation: null,
      isLoading: true,
      showQrCode: false
    }
  }

  componentDidMount() {
    const router = getCurrentInstance().router
    const id = router?.params?.id ? parseInt(router.params.id) : null

    if (!id) {
      Taro.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      return
    }

    this.setState({ id }, () => {
      this.fetchReservationDetail(id)
    })
  }

  // 获取预约详情
  async fetchReservationDetail(id: number) {
    this.setState({ isLoading: true })
    
    try {
      // 先加载预约列表以确保数据存在
      await useReservationStore.getState().fetchReservations()
      
      // 从 store 中获取预约详情
      const reservation = useReservationStore.getState().getReservationById(id)
      
      if (!reservation) {
        Taro.showToast({
          title: '预约不存在',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
        return
      }
      
      this.setState({ 
        reservation,
        isLoading: false
      })
    } catch (error) {
      console.error('获取预约详情失败', error)
      Taro.showToast({
        title: '获取预约信息失败',
        icon: 'none'
      })
      this.setState({ isLoading: false })
    }
  }

  // 切换二维码显示状态
  toggleQrCode = () => {
    this.setState(prevState => ({
      showQrCode: !prevState.showQrCode
    }))
  }

  // 取消预约
  handleCancelReservation = async () => {
    const { id } = this.state
    
    if (!id) return
    
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await useReservationStore.getState().cancelReservation(id)
          
          if (success) {
            // 重新获取详情
            this.fetchReservationDetail(id)
            
            Taro.showToast({
              title: '预约已取消',
              icon: 'success'
            })
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
  handleCheckIn = async () => {
    const { id } = this.state
    
    if (!id) return
    
    Taro.showModal({
      title: '确认签到',
      content: '确定要签到吗？请确保您已到达自习室',
      success: async (res) => {
        if (res.confirm) {
          const success = await useReservationStore.getState().checkIn(id)
          
          if (success) {
            // 重新获取详情
            this.fetchReservationDetail(id)
            
            Taro.showToast({
              title: '签到成功',
              icon: 'success'
            })
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

  // 渲染预约状态信息
  renderStatusInfo() {
    const { reservation } = this.state;
    
    if (!reservation) return null;
    
    let statusIcon = '';
    let statusText = '';
    let statusDesc = '';
    let statusColor = '';
    
    switch (reservation.status) {
      case '待开始':
        statusIcon = '🕒';
        statusText = '待开始';
        statusDesc = '预约已确认，请按时前往自习室';
        statusColor = '#1890ff';
        break;
      case '待签到':
        statusIcon = '📝';
        statusText = '待签到';
        statusDesc = '请在规定时间内前往自习室签到';
        statusColor = '#fa8c16';
        break;
      case '已签到':
        statusIcon = '✅';
        statusText = '已签到';
        statusDesc = '您已成功签到，祝您学习愉快！';
        statusColor = '#52c41a';
        break;
      case '已签到(迟到)':
        statusIcon = '⚠️';
        statusText = '已签到(迟到)';
        statusDesc = '您已迟到签到，请下次注意时间';
        statusColor = '#faad14';
        break;
      case '已结束':
        statusIcon = '🏁';
        statusText = '已结束';
        statusDesc = '预约已完成，感谢您的使用';
        statusColor = '#8c8c8c';
        break;
      case '已取消':
        statusIcon = '❌';
        statusText = '已取消';
        statusDesc = '此预约已取消';
        statusColor = '#f5222d';
        break;
      default:
        statusIcon = '❓';
        statusText = reservation.status;
        statusDesc = '未知状态';
        statusColor = '#8c8c8c';
    }
    
    let timeInfo = '';
    if (reservation.status === '已签到' || reservation.status === '已签到(迟到)') {
      const checkInTime = reservation.checkInTime 
        ? new Date(reservation.checkInTime).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '未知时间';
      timeInfo = `签到时间: ${checkInTime}`;
    }
    
    const startTime = reservation.timeSlot === 1 ? '08:00' : 
                      reservation.timeSlot === 2 ? '13:00' : '18:00';
    const endTime = reservation.timeSlot === 1 ? '12:00' : 
                    reservation.timeSlot === 2 ? '17:00' : '22:00';
    
    return (
      <View className='status-info'>
        <View className='status-header' style={{ backgroundColor: statusColor }}>
          <Text className='status-icon'>{statusIcon}</Text>
          <Text className='status-text'>{statusText}</Text>
        </View>
        <View className='status-content'>
          <Text className='status-desc'>{statusDesc}</Text>
          <Text className='time-info'>{reservation.date} {startTime}-{endTime}</Text>
          {timeInfo && <Text className='check-in-time'>{timeInfo}</Text>}
        </View>
      </View>
    );
  }
  
  // 渲染地图
  renderMap() {
    const { reservation } = this.state;
    
    if (!reservation) return null;
    
    // 这里使用模拟数据，实际项目中应从服务器获取自习室坐标
    const roomLocation = {
      latitude: 30.531987, // 华中师范大学坐标
      longitude: 114.360734,
      name: reservation.roomName,
      address: '华中师范大学'
    };
    
    return (
      <View className='map-container'>
        <View className='section-title'>位置信息</View>
        <View className='map-box'>
          {/* 小程序map组件，如果使用，需要在app.json中配置位置权限 */}
          <View className='location-info'>
            <View className='location-name'>{roomLocation.name}</View>
            <View className='location-address'>{roomLocation.address}</View>
            <View 
              className='navigation-btn'
              onClick={() => {
                Taro.openLocation({
                  latitude: roomLocation.latitude,
                  longitude: roomLocation.longitude,
                  name: roomLocation.name,
                  address: roomLocation.address
                })
              }}
            >
              导航前往
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 渲染操作按钮
  renderActionButtons() {
    const { reservation } = this.state
    
    if (!reservation) return null
    
    switch (reservation.status) {
      case '待开始':
        return (
          <View className='action-buttons'>
            <Button className='cancel-btn' onClick={this.handleCancelReservation}>
              取消预约
            </Button>
          </View>
        )
      case '待签到':
        return (
          <View className='action-buttons'>
            <Button className='check-in-btn' onClick={this.toggleQrCode}>
              {this.state.showQrCode ? '隐藏二维码' : '显示签到二维码'}
            </Button>
            <Button className='manual-btn' onClick={this.handleCheckIn}>
              手动签到
            </Button>
            <Button className='cancel-btn' onClick={this.handleCancelReservation}>
              取消预约
            </Button>
          </View>
        )
      default:
        return null
    }
  }

  // 渲染二维码
  renderQrCode() {
    const { showQrCode, reservation } = this.state
    
    if (!showQrCode || !reservation) return null
    
    return (
      <View className='qr-code-container'>
        <View className='qr-code-wrapper'>
          <Image
            className='qr-code'
            src={require('../../assets/icons/qr-placeholder.png')}
            mode='aspectFit'
          />
          <Text className='qr-hint'>请出示此二维码给工作人员扫描签到</Text>
        </View>
      </View>
    )
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
    const { isLoading, reservation } = this.state
    
    if (isLoading) {
      return <Loading />
    }
    
    if (!reservation) {
      return (
        <View className='error-container'>
          <Text>预约信息不存在</Text>
        </View>
      )
    }
    
    return (
      <View className='reservation-detail'>
        <View className='detail-card'>
          <View className='card-header'>
            <View className='title-section'>
              <Text className='title'>预约详情</Text>
              <Text className={`status ${this.getStatusClassName(reservation.status)}`}>
                {reservation.status}
              </Text>
            </View>
            <View className='room-info'>
              <Text className='room-name'>{reservation.roomName}</Text>
            </View>
          </View>
          
          {this.renderStatusInfo()}
          
          <View className='detail-content'>
            <View className='detail-section'>
              <View className='detail-item'>
                <Text className='label'>座位号</Text>
                <Text className='value'>{reservation.seatName}</Text>
              </View>
              <View className='detail-item'>
                <Text className='label'>日期</Text>
                <Text className='value'>{reservation.date}</Text>
              </View>
              <View className='detail-item'>
                <Text className='label'>时间段</Text>
                <Text className='value'>{reservation.timeSlotText}</Text>
              </View>
            </View>
            
            <View className='detail-section'>
              <View className='detail-item'>
                <Text className='label'>预约编号</Text>
                <Text className='value'>#{reservation.id}</Text>
              </View>
              <View className='detail-item'>
                <Text className='label'>预约时间</Text>
                <Text className='value'>{new Date(reservation.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          </View>
          
          <View className='note-section'>
            <Text className='note-title'>预约须知</Text>
            <View className='note-item'>
              <Text className='dot'>•</Text>
              <Text className='text'>请在预约时间开始前15分钟完成签到</Text>
            </View>
            <View className='note-item'>
              <Text className='dot'>•</Text>
              <Text className='text'>未按时签到将被视为违约，影响后续预约权限</Text>
            </View>
            <View className='note-item'>
              <Text className='dot'>•</Text>
              <Text className='text'>如需取消预约，请提前操作，以便其他用户使用</Text>
            </View>
          </View>
        </View>
        
        {this.renderQrCode()}
        
        <View className='action-section'>
          {this.renderActionButtons()}
        </View>
        
        <View className='help-section'>
          <Text className='help-text'>如有问题，请联系管理员</Text>
        </View>
        
        {this.renderMap()}
      </View>
    )
  }
} 