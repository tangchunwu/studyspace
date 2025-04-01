import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView, Picker } from '@tarojs/components'
import useAuthStore from '../../store/authStore'
import useCheckinStore, { CheckinRecord } from '../../store/checkinStore'
import { format } from 'date-fns'
import './checkins.scss'

interface CheckinsState {
  records: CheckinRecord[];
  filteredRecords: CheckinRecord[];
  searchQuery: string;
  selectedDate: string;
  selectedStatus: '' | 'normal' | 'late' | 'rejected' | 'pending';
  isLoading: boolean;
  datePickerVisible: boolean;
  statusOptions: {value: '' | 'normal' | 'late' | 'rejected' | 'pending', label: string}[];
}

export default class Checkins extends Component<{}, CheckinsState> {
  constructor(props: {}) {
    super(props);
    
    // 获取今天的日期字符串（YYYY-MM-DD格式）
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');
    
    this.state = {
      records: [],
      filteredRecords: [],
      searchQuery: '',
      selectedDate: formattedToday,
      selectedStatus: '',
      isLoading: true,
      datePickerVisible: false,
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'normal', label: '正常签到' },
        { value: 'late', label: '迟到签到' },
        { value: 'rejected', label: '拒绝签到' },
        { value: 'pending', label: '待处理' }
      ]
    };
  }

  componentDidMount() {
    // 设置页面标题
    Taro.setNavigationBarTitle({ title: '签到管理' });
    
    // 检查是否有管理员权限
    this.checkAdminPermission();
    
    // 获取签到记录
    this.fetchCheckins();
  }

  // 检查管理员权限
  checkAdminPermission() {
    const hasPermission = useAuthStore.getState().hasPermission('view_checkins');
    
    if (!hasPermission) {
      Taro.showToast({
        title: '您没有权限访问此页面',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    }
  }

  // 获取签到记录
  async fetchCheckins() {
    this.setState({ isLoading: true });
    
    try {
      await useCheckinStore.getState().fetchCheckinRecords();
      const records = useCheckinStore.getState().records;
      
      this.setState({
        records,
        filteredRecords: this.filterRecords(records, this.state.selectedDate, this.state.selectedStatus, this.state.searchQuery),
        isLoading: false
      });
    } catch (error) {
      console.error('获取签到记录失败', error);
      Taro.showToast({
        title: '获取签到记录失败',
        icon: 'none'
      });
      
      this.setState({ isLoading: false });
    }
  }

  // 处理搜索输入变化
  handleSearchChange = (e) => {
    const searchQuery = e.detail.value;
    this.setState({ searchQuery });
    
    const { records, selectedDate, selectedStatus } = this.state;
    const filteredRecords = this.filterRecords(records, selectedDate, selectedStatus, searchQuery);
    this.setState({ filteredRecords });
  }

  // 处理日期选择变化
  handleDateChange = (e) => {
    const selectedDate = e.detail.value;
    this.setState({ selectedDate });
    
    const { records, selectedStatus, searchQuery } = this.state;
    const filteredRecords = this.filterRecords(records, selectedDate, selectedStatus, searchQuery);
    this.setState({ filteredRecords });
  }

  // 处理状态选择变化
  handleStatusChange = (e) => {
    const index = e.detail.value;
    const selectedStatus = this.state.statusOptions[index].value;
    this.setState({ selectedStatus });
    
    const { records, selectedDate, searchQuery } = this.state;
    const filteredRecords = this.filterRecords(records, selectedDate, selectedStatus, searchQuery);
    this.setState({ filteredRecords });
  }

  // 筛选签到记录
  filterRecords(
    records: CheckinRecord[], 
    date: string, 
    status: '' | 'normal' | 'late' | 'rejected' | 'pending', 
    query: string
  ): CheckinRecord[] {
    let result = [...records];
    
    // 按日期筛选
    if (date) {
      result = result.filter(record => record.reservationDate === date);
    }
    
    // 按状态筛选
    if (status) {
      result = result.filter(record => record.status === status);
    }
    
    // 按搜索关键词筛选
    if (query.trim()) {
      const lowercasedQuery = query.toLowerCase();
      result = result.filter(record => 
        record.userName.toLowerCase().includes(lowercasedQuery) ||
        record.userStudentId.toLowerCase().includes(lowercasedQuery) ||
        record.roomName.toLowerCase().includes(lowercasedQuery) ||
        record.seatName.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    return result;
  }

  // 处理签到审核操作
  handleVerifyCheckin = async (record: CheckinRecord, status: 'normal' | 'late' | 'rejected') => {
    // 检查权限
    const hasPermission = useAuthStore.getState().hasPermission('manage_checkins');
    
    if (!hasPermission) {
      Taro.showToast({
        title: '您没有审核签到的权限',
        icon: 'none'
      });
      return;
    }
    
    // 只能审核状态为pending的签到
    if (record.status !== 'pending') {
      Taro.showToast({
        title: '只能审核待处理的签到',
        icon: 'none'
      });
      return;
    }
    
    this.setState({ isLoading: true });
    
    try {
      const success = await useCheckinStore.getState().verifyCheckin(record.id, status);
      
      if (success) {
        Taro.showToast({
          title: '审核签到成功',
          icon: 'success'
        });
        
        // 重新获取签到记录
        await this.fetchCheckins();
      } else {
        throw new Error('审核签到失败');
      }
    } catch (error) {
      console.error('审核签到失败', error);
      Taro.showToast({
        title: '审核签到失败',
        icon: 'none'
      });
      
      this.setState({ isLoading: false });
    }
  }

  // 格式化签到时间
  formatDateTime(dateTimeStr: string) {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      return dateTimeStr;
    }
  }

  // 渲染签到状态标签
  renderStatusTag(status: string) {
    let className = 'status-tag';
    let label = '';
    
    switch (status) {
      case 'normal':
        className += ' normal';
        label = '正常';
        break;
      case 'late':
        className += ' late';
        label = '迟到';
        break;
      case 'rejected':
        className += ' rejected';
        label = '拒绝';
        break;
      case 'pending':
        className += ' pending';
        label = '待处理';
        break;
      default:
        label = status;
        break;
    }
    
    return <Text className={className}>{label}</Text>;
  }

  render() {
    const { 
      filteredRecords, 
      isLoading, 
      selectedDate, 
      statusOptions, 
      selectedStatus 
    } = this.state;
    
    // 获取状态选项的索引
    const statusIndex = statusOptions.findIndex(option => option.value === selectedStatus);
    
    return (
      <View className='checkins-page'>
        {/* 顶部筛选条件 */}
        <View className='filter-section'>
          {/* 搜索输入 */}
          <View className='search-bar'>
            <Input
              className='search-input'
              type='text'
              placeholder='搜索用户名或学号'
              onInput={this.handleSearchChange}
            />
          </View>
          
          {/* 日期和状态筛选 */}
          <View className='filter-row'>
            <Picker
              mode='date'
              value={selectedDate}
              onChange={this.handleDateChange}
            >
              <View className='filter-item date-filter'>
                <Text className='filter-label'>日期:</Text>
                <Text className='filter-value'>{selectedDate}</Text>
              </View>
            </Picker>
            
            <Picker
              mode='selector'
              range={statusOptions.map(option => option.label)}
              value={statusIndex}
              onChange={this.handleStatusChange}
            >
              <View className='filter-item status-filter'>
                <Text className='filter-label'>状态:</Text>
                <Text className='filter-value'>
                  {statusOptions[statusIndex].label}
                </Text>
              </View>
            </Picker>
          </View>
        </View>
        
        {/* 签到记录列表 */}
        <ScrollView
          className='checkins-list'
          scrollY
          enableBackToTop
        >
          {isLoading ? (
            <View className='loading-state'>加载中...</View>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.map(record => (
              <View className='checkin-card' key={record.id}>
                <View className='checkin-header'>
                  <View className='user-info'>
                    <Text className='user-name'>{record.userName}</Text>
                    <Text className='user-id'>{record.userStudentId}</Text>
                  </View>
                  
                  {this.renderStatusTag(record.status)}
                </View>
                
                <View className='checkin-details'>
                  <View className='detail-item'>
                    <Text className='detail-label'>自习室:</Text>
                    <Text className='detail-value'>{record.roomName}</Text>
                  </View>
                  
                  <View className='detail-item'>
                    <Text className='detail-label'>座位:</Text>
                    <Text className='detail-value'>{record.seatName}</Text>
                  </View>
                  
                  <View className='detail-item'>
                    <Text className='detail-label'>预约时段:</Text>
                    <Text className='detail-value'>{record.timeSlot}</Text>
                  </View>
                  
                  <View className='detail-item'>
                    <Text className='detail-label'>签到时间:</Text>
                    <Text className='detail-value'>{this.formatDateTime(record.checkInTime)}</Text>
                  </View>
                  
                  {record.verifiedBy && (
                    <View className='detail-item'>
                      <Text className='detail-label'>审核:</Text>
                      <Text className='detail-value'>
                        {record.verifiedBy === 'system' ? '系统自动' : '管理员'}
                        {record.verifiedAt ? ` (${this.formatDateTime(record.verifiedAt)})` : ''}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* 待处理的签到记录显示审核按钮 */}
                {record.status === 'pending' && (
                  <View className='checkin-actions'>
                    <View 
                      className='action-btn approve-btn'
                      onClick={() => this.handleVerifyCheckin(record, 'normal')}
                    >
                      正常
                    </View>
                    
                    <View 
                      className='action-btn late-btn'
                      onClick={() => this.handleVerifyCheckin(record, 'late')}
                    >
                      迟到
                    </View>
                    
                    <View 
                      className='action-btn reject-btn'
                      onClick={() => this.handleVerifyCheckin(record, 'rejected')}
                    >
                      拒绝
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className='empty-state'>
              <View className='empty-icon'>🔍</View>
              <Text className='empty-text'>未找到匹配的签到记录</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
} 