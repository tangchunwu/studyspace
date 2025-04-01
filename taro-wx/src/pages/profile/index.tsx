import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import useAuthStore from '../../store/authStore'
import useReservationStore, { Reservation } from '../../store/reservationStore'
import Loading from '../../components/Loading'
import './index.scss'

export default class Profile extends Component {
  state = {
    isLoggedIn: false,
    userInfo: null,
    isAdmin: false,
    isLoading: true,
    recentReservations: []
  }

  componentDidMount() {
    // 初始化认证状态
    useAuthStore.getState().initAuth()
    this.checkLoginStatus()
    
    // 监听登录状态变化
    this.unsubscribeAuth = useAuthStore.subscribe(
      (state) => {
        this.setState({
          isLoggedIn: state.isAuthenticated,
          userInfo: state.userInfo,
          isAdmin: state.userInfo?.role === 'admin',
          isLoading: state.loading
        })
        
        if (state.isAuthenticated) {
          this.fetchRecentReservations()
        }
      }
    )
  }

  componentWillUnmount() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth()
    }
  }

  checkLoginStatus() {
    const auth = useAuthStore.getState()
    
    this.setState({
      isLoggedIn: auth.isAuthenticated,
      userInfo: auth.userInfo,
      isAdmin: auth.userInfo?.role === 'admin',
      isLoading: auth.loading
    })
    
    if (auth.isAuthenticated) {
      this.fetchRecentReservations()
    } else {
      this.setState({ isLoading: false })
    }
  }

  // 获取最近预约
  fetchRecentReservations = async () => {
    this.setState({ isLoading: true })
    
    try {
      await useReservationStore.getState().fetchReservations()
      
      const allReservations = useReservationStore.getState().reservations
      // 只显示最近3个预约
      const recentReservations = allReservations
        .filter(r => r.status !== '已取消')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
      
      this.setState({ 
        recentReservations,
        isLoading: false
      })
    } catch (error) {
      console.error('获取预约列表失败', error)
      this.setState({ isLoading: false })
    }
  }

  handleLogin = () => {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
  }

  handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          useAuthStore.getState().logout()
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          this.setState({
            isLoggedIn: false,
            userInfo: null,
            isAdmin: false,
            recentReservations: []
          })
        }
      }
    })
  }

  // 转到我的预约页面
  navigateToMyReservations = () => {
    if (!this.state.isLoggedIn) {
      return Taro.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
    }
    
    Taro.navigateTo({
      url: '/pages/profile/reservations'
    })
  }

  // 管理员页面导航
  navigateToAdmin = () => {
    // 检查是否有管理员权限
    const isAdmin = useAuthStore.getState().isAdmin();
    
    if (!isAdmin) {
      Taro.showToast({
        title: '您没有管理员权限',
        icon: 'none'
      });
      return;
    }
    
    Taro.navigateTo({
      url: '/pages/admin/index'
    });
  }

  // 查看预约详情
  navigateToReservation = (id) => {
    Taro.navigateTo({
      url: `/pages/reservation/detail?id=${id}`
    })
  }

  // 前往自习室页面
  navigateToRooms = () => {
    Taro.switchTab({
      url: '/pages/rooms/index'
    })
  }

  // 签到
  handleCheckIn = (id) => {
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
            
            // 刷新预约列表
            this.fetchRecentReservations()
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

  // 取消预约
  handleCancel = (id) => {
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
            
            // 刷新预约列表
            this.fetchRecentReservations()
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

  renderReservationStatus(status) {
    let className = ''
    switch(status) {
      case '待开始': className = 'status-upcoming'; break
      case '待签到': className = 'status-checkin'; break
      case '已签到': className = 'status-completed'; break
      default: className = 'status-default'
    }
    return <Text className={`reservation-status ${className}`}>{status}</Text>
  }

  render() {
    const { isLoggedIn, userInfo, isAdmin, isLoading, recentReservations } = this.state
    
    if (isLoading) {
      return <Loading />
    }
    
    return (
      <View className='profile-page'>
        {/* 用户信息区域 */}
        <View className='user-info-section'>
          {isLoggedIn ? (
            <View className='user-info'>
              <Image 
                className='avatar' 
                src={userInfo?.avatarUrl || require('../../assets/icons/default-avatar.png')} 
              />
              <View className='user-details'>
                <Text className='nickname'>{userInfo?.nickName || '用户'}</Text>
                <Text className='user-id'>学号: {userInfo?.studentId || 'S00000000'}</Text>
                {isAdmin && <Text className='admin-badge'>管理员</Text>}
              </View>
            </View>
          ) : (
            <View className='login-section'>
              <Image 
                className='default-avatar' 
                src={require('../../assets/icons/default-avatar.png')} 
              />
              <Text className='login-prompt'>请登录以使用所有功能</Text>
              <Text className='login-btn' onClick={this.handleLogin}>登录/注册</Text>
            </View>
          )}
        </View>
        
        {/* 我的预约区域 */}
        <View className='my-reservations'>
          <View className='section-header'>
            <Text className='section-title'>我的预约</Text>
            <Text className='section-more' onClick={this.navigateToMyReservations}>全部 &gt;</Text>
          </View>
          
          <View className='reservation-list'>
            {isLoggedIn ? (
              recentReservations.length > 0 ? (
                recentReservations.map(reservation => (
                  <View 
                    className='reservation-card' 
                    key={reservation.id}
                    onClick={() => this.navigateToReservation(reservation.id)}
                  >
                    <View className='reservation-header'>
                      <Text className='room-name'>{reservation.roomName}</Text>
                      {this.renderReservationStatus(reservation.status)}
                    </View>
                    
                    <View className='reservation-info'>
                      <Text className='info-item'>座位: {reservation.seatName}</Text>
                      <Text className='info-item'>日期: {reservation.date}</Text>
                      <Text className='info-item'>时间: {reservation.timeSlotText}</Text>
                    </View>
                    
                    <View className='reservation-actions'>
                      {reservation.status === '待签到' && (
                        <View 
                          className='action-btn checkin-btn'
                          onClick={(e) => {
                            e.stopPropagation()
                            this.handleCheckIn(reservation.id)
                          }}
                        >
                          立即签到
                        </View>
                      )}
                      
                      {(reservation.status === '待开始' || reservation.status === '待签到') && (
                        <View 
                          className='action-btn cancel-btn'
                          onClick={(e) => {
                            e.stopPropagation()
                            this.handleCancel(reservation.id)
                          }}
                        >
                          取消预约
                        </View>
                      )}
                      
                      <View className='action-btn detail-btn'>详情</View>
                    </View>
                  </View>
                ))
              ) : (
                <View className='empty-reservations'>
                  <Text>暂无预约记录</Text>
                  <View className='to-reserve-btn' onClick={this.navigateToRooms}>去预约</View>
                </View>
              )
            ) : (
              <View className='login-required'>
                <Text>登录后查看您的预约</Text>
                <View className='to-reserve-btn' onClick={this.handleLogin}>去登录</View>
              </View>
            )}
          </View>
        </View>
        
        {/* 设置区域 */}
        <View className='settings-section'>
          {isAdmin && (
            <View className='setting-item' onClick={this.navigateToAdmin}>
              <Text className='setting-name admin-setting'>管理员控制台</Text>
              <Text className='setting-arrow'>&gt;</Text>
            </View>
          )}
          
          <View className='setting-item' onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
            <Text className='setting-name'>通知设置</Text>
            <Text className='setting-arrow'>&gt;</Text>
          </View>
          
          <View className='setting-item' onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
            <Text className='setting-name'>帮助与反馈</Text>
            <Text className='setting-arrow'>&gt;</Text>
          </View>
          
          <View className='setting-item' onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}>
            <Text className='setting-name'>关于我们</Text>
            <Text className='setting-arrow'>&gt;</Text>
          </View>
          
          {isLoggedIn && (
            <View className='setting-item' onClick={this.handleLogout}>
              <Text className='setting-name logout'>退出登录</Text>
            </View>
          )}
        </View>
      </View>
    )
  }
} 