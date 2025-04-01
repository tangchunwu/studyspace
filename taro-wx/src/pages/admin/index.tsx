import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import useAuthStore from '../../store/authStore'
import './index.scss'

interface AdminHomeState {
  statistics: {
    totalUsers: number;
    totalReservations: number;
    totalCheckins: number;
    pendingCheckins: number;
    weeklyReservations: number;
    utilization: number;
  };
  isLoading: boolean;
}

export default class AdminHome extends Component<{}, AdminHomeState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      statistics: {
        totalUsers: 0,
        totalReservations: 0,
        totalCheckins: 0,
        pendingCheckins: 0,
        weeklyReservations: 0,
        utilization: 0
      },
      isLoading: true
    };
  }

  componentDidMount() {
    // 设置页面标题
    Taro.setNavigationBarTitle({ title: '管理员控制台' });
    
    // 检查是否有管理员权限
    this.checkAdminPermission();
    
    // 获取统计数据
    this.fetchStatistics();
  }

  // 检查管理员权限
  checkAdminPermission() {
    const isAdmin = useAuthStore.getState().isAdmin();
    
    if (!isAdmin) {
      Taro.showToast({
        title: '您没有管理员权限',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟跳转回首页
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/index/index'
        });
      }, 2000);
    }
  }

  // 获取统计数据（模拟）
  fetchStatistics() {
    this.setState({ isLoading: true });
    
    // 模拟异步请求
    setTimeout(() => {
      this.setState({
        statistics: {
          totalUsers: 150,
          totalReservations: 320,
          totalCheckins: 280,
          pendingCheckins: 5,
          weeklyReservations: 42,
          utilization: 78
        },
        isLoading: false
      });
    }, 1000);
  }

  // 导航到用户管理页面
  navigateToUsers = () => {
    Taro.navigateTo({
      url: '/pages/admin/users'
    });
  }

  // 导航到预约管理页面
  navigateToReservations = () => {
    Taro.navigateTo({
      url: '/pages/admin/reservations'
    });
  }

  // 导航到签到管理页面
  navigateToCheckins = () => {
    Taro.navigateTo({
      url: '/pages/admin/checkins'
    });
  }

  // 导航到数据分析页面
  navigateToAnalytics = () => {
    Taro.showToast({
      title: '数据分析功能开发中',
      icon: 'none'
    });
  }

  // 导航到系统设置页面
  navigateToSettings = () => {
    Taro.showToast({
      title: '系统设置功能开发中',
      icon: 'none'
    });
  }

  render() {
    const { statistics, isLoading } = this.state;
    
    return (
      <View className='admin-home'>
        {/* 顶部标题 */}
        <View className='admin-header'>
          <View className='admin-title'>管理员控制台</View>
          <View className='admin-subtitle'>查看和管理学生预约和签到数据</View>
        </View>
        
        {/* 统计数据卡片 */}
        <View className='stats-section'>
          <View className='section-title'>数据统计</View>
          
          <View className='stats-grid'>
            <View className='stat-card'>
              <View className='stat-number'>{isLoading ? '-' : statistics.totalUsers}</View>
              <View className='stat-label'>总用户数</View>
            </View>
            
            <View className='stat-card'>
              <View className='stat-number'>{isLoading ? '-' : statistics.totalReservations}</View>
              <View className='stat-label'>总预约数</View>
            </View>
            
            <View className='stat-card'>
              <View className='stat-number'>{isLoading ? '-' : statistics.totalCheckins}</View>
              <View className='stat-label'>总签到数</View>
            </View>
            
            <View className='stat-card highlight'>
              <View className='stat-number'>{isLoading ? '-' : statistics.pendingCheckins}</View>
              <View className='stat-label'>待处理签到</View>
            </View>

            <View className='stat-card'>
              <View className='stat-number'>{isLoading ? '-' : statistics.weeklyReservations}</View>
              <View className='stat-label'>本周预约</View>
            </View>
            
            <View className='stat-card'>
              <View className='stat-number'>{isLoading ? '-' : statistics.utilization}%</View>
              <View className='stat-label'>座位利用率</View>
            </View>
          </View>
        </View>
        
        {/* 管理功能模块 */}
        <View className='management-section'>
          <View className='section-title'>管理功能</View>
          
          <View className='management-menu'>
            <View className='menu-item' onClick={this.navigateToUsers}>
              <View className='menu-icon user-icon'></View>
              <View className='menu-label'>用户管理</View>
              <View className='menu-desc'>查看、编辑用户信息和权限</View>
            </View>
            
            <View className='menu-item' onClick={this.navigateToReservations}>
              <View className='menu-icon reservation-icon'></View>
              <View className='menu-label'>预约管理</View>
              <View className='menu-desc'>查看、编辑预约记录</View>
            </View>
            
            <View className='menu-item' onClick={this.navigateToCheckins}>
              <View className='menu-icon checkin-icon'></View>
              <View className='menu-label'>签到管理</View>
              <View className='menu-desc'>查看、验证签到记录</View>
            </View>

            <View className='menu-item' onClick={this.navigateToAnalytics}>
              <View className='menu-icon analytics-icon'></View>
              <View className='menu-label'>数据分析</View>
              <View className='menu-desc'>查看使用率、预约趋势分析</View>
            </View>
            
            <View className='menu-item' onClick={this.navigateToSettings}>
              <View className='menu-icon settings-icon'></View>
              <View className='menu-label'>系统设置</View>
              <View className='menu-desc'>调整预约规则和系统参数</View>
            </View>
          </View>
        </View>
      </View>
    );
  }
} 