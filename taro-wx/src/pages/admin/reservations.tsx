import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button, Picker, ScrollView, Checkbox, CheckboxGroup } from '@tarojs/components'
import { format } from 'date-fns'
import useAuthStore from '../../store/authStore'
import useReservationStore, { Reservation } from '../../store/reservationStore'
import './reservations.scss'

interface ReservationsState {
  reservations: Reservation[];
  filteredReservations: Reservation[];
  searchQuery: string;
  selectedDate: string;
  selectedStatus: '' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消';
  isLoading: boolean;
  statusOptions: {value: '' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消', label: string}[];
  selectedItems: number[];
  showBatchActions: boolean;
  showDetailModal: boolean;
  currentReservation: Reservation | null;
}

export default class AdminReservations extends Component<{}, ReservationsState> {
  constructor(props: {}) {
    super(props);
    
    const today = new Date();
    
    this.state = {
      reservations: [],
      filteredReservations: [],
      searchQuery: '',
      selectedDate: format(today, 'yyyy-MM-dd'),
      selectedStatus: '',
      isLoading: true,
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: '待开始', label: '待开始' },
        { value: '待签到', label: '待签到' },
        { value: '已签到', label: '已签到' },
        { value: '已结束', label: '已结束' },
        { value: '已取消', label: '已取消' }
      ],
      selectedItems: [],
      showBatchActions: false,
      showDetailModal: false,
      currentReservation: null
    };
  }

  componentDidMount() {
    // 设置页面标题
    Taro.setNavigationBarTitle({ title: '预约管理' });
    
    // 检查是否有管理员权限
    this.checkAdminPermission();
    
    // 获取预约数据
    this.fetchReservations();
  }

  // 检查管理员权限
  checkAdminPermission() {
    const hasPermission = useAuthStore.getState().hasPermission('view_reservations');
    
    if (!hasPermission) {
      Taro.showToast({
        title: '您没有权限访问此页面',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟跳转回首页
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    }
  }

  // 获取预约数据
  async fetchReservations() {
    this.setState({ isLoading: true });
    
    try {
      // 调用store方法获取数据
      await useReservationStore.getState().fetchReservations();
      const reservations = useReservationStore.getState().reservations;
      
      // 更新状态
      this.setState({ 
        reservations,
        filteredReservations: this.filterReservations(
          reservations, 
          this.state.selectedDate, 
          this.state.selectedStatus, 
          this.state.searchQuery
        ),
        isLoading: false
      });
    } catch (error) {
      console.error('获取预约数据失败', error);
      Taro.showToast({
        title: '获取预约数据失败',
        icon: 'none'
      });
      this.setState({ isLoading: false });
    }
  }

  // 处理搜索输入
  handleSearchChange = (e) => {
    const searchQuery = e.detail.value;
    this.setState({ 
      searchQuery,
      filteredReservations: this.filterReservations(
        this.state.reservations,
        this.state.selectedDate,
        this.state.selectedStatus,
        searchQuery
      )
    });
  }

  // 处理日期选择
  handleDateChange = (e) => {
    const selectedDate = e.detail.value;
    this.setState({ 
      selectedDate,
      filteredReservations: this.filterReservations(
        this.state.reservations,
        selectedDate,
        this.state.selectedStatus,
        this.state.searchQuery
      )
    });
  }

  // 处理状态选择
  handleStatusChange = (e) => {
    const index = e.detail.value;
    const selectedStatus = this.state.statusOptions[index].value;
    this.setState({ 
      selectedStatus,
      filteredReservations: this.filterReservations(
        this.state.reservations,
        this.state.selectedDate,
        selectedStatus,
        this.state.searchQuery
      )
    });
  }

  // 筛选预约数据
  filterReservations(
    reservations: Reservation[], 
    date: string, 
    status: '' | '待开始' | '待签到' | '已签到' | '已结束' | '已取消', 
    query: string
  ): Reservation[] {
    return reservations.filter(reservation => {
      // 日期筛选
      const dateMatch = date ? reservation.date === date : true;
      
      // 状态筛选
      const statusMatch = status ? reservation.status === status : true;
      
      // 搜索筛选（房间名称、座位名称、ID等）
      const searchMatch = query 
        ? reservation.roomName.includes(query) || 
          reservation.seatName.includes(query) ||
          String(reservation.id).includes(query)
        : true;
      
      return dateMatch && statusMatch && searchMatch;
    });
  }

  // 处理取消预约
  handleCancelReservation = async (id: number) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消此预约吗？取消后将不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          this.setState({ isLoading: true });
          
          try {
            // 调用store方法取消预约
            const success = await useReservationStore.getState().cancelReservation(id);
            
            if (success) {
              Taro.showToast({
                title: '已取消预约',
                icon: 'success'
              });
              
              // 刷新数据
              const updatedReservations = this.state.reservations.map(reservation => 
                reservation.id === id
                  ? { ...reservation, status: '已取消' }
                  : reservation
              );
              
              this.setState({ 
                reservations: updatedReservations,
                filteredReservations: this.filterReservations(
                  updatedReservations,
                  this.state.selectedDate,
                  this.state.selectedStatus,
                  this.state.searchQuery
                ),
                isLoading: false
              });
            } else {
              throw new Error('取消预约失败');
            }
          } catch (error) {
            console.error('取消预约失败', error);
            Taro.showToast({
              title: '取消预约失败',
              icon: 'none'
            });
            this.setState({ isLoading: false });
          }
        }
      }
    });
  }

  // 处理确认签到
  handleConfirmCheckIn = async (id: number) => {
    Taro.showModal({
      title: '确认签到',
      content: '确定要为此预约手动签到吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setState({ isLoading: true });
          
          try {
            // 调用store方法进行签到
            const success = await useReservationStore.getState().checkIn(id);
            
            if (success) {
              Taro.showToast({
                title: '签到成功',
                icon: 'success'
              });
              
              // 刷新数据
              const updatedReservations = this.state.reservations.map(reservation => 
                reservation.id === id
                  ? { ...reservation, status: '已签到', checkInTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
                  : reservation
              );
              
              this.setState({ 
                reservations: updatedReservations,
                filteredReservations: this.filterReservations(
                  updatedReservations,
                  this.state.selectedDate,
                  this.state.selectedStatus,
                  this.state.searchQuery
                ),
                isLoading: false
              });
            } else {
              throw new Error('签到失败');
            }
          } catch (error) {
            console.error('签到失败', error);
            Taro.showToast({
              title: '签到失败',
              icon: 'none'
            });
            this.setState({ isLoading: false });
          }
        }
      }
    });
  }

  // 查看预约详情
  handleViewReservationDetail = (reservation: Reservation) => {
    this.setState({
      currentReservation: reservation,
      showDetailModal: true
    });
  }

  // 关闭预约详情模态框
  closeDetailModal = () => {
    this.setState({
      showDetailModal: false,
      currentReservation: null
    });
  }

  // 处理项目选择变化
  handleItemSelect = (e) => {
    const values = e.detail.value.map(id => parseInt(id, 10));
    this.setState({
      selectedItems: values,
      showBatchActions: values.length > 0
    });
  }

  // 批量取消预约
  handleBatchCancel = () => {
    const { selectedItems } = this.state;
    if (selectedItems.length === 0) return;

    Taro.showModal({
      title: '批量取消预约',
      content: `确定要取消所选的 ${selectedItems.length} 个预约吗？此操作不可恢复。`,
      success: async (res) => {
        if (res.confirm) {
          this.setState({ isLoading: true });
          
          try {
            let successCount = 0;
            // 逐个取消预约
            for (const id of selectedItems) {
              const success = await useReservationStore.getState().cancelReservation(id);
              if (success) successCount++;
            }
            
            Taro.showToast({
              title: `成功取消 ${successCount} 项预约`,
              icon: 'success'
            });
            
            // 重新获取数据
            this.fetchReservations();
            
            // 清空选择
            this.setState({ 
              selectedItems: [],
              showBatchActions: false
            });
          } catch (error) {
            console.error('批量取消预约失败', error);
            Taro.showToast({
              title: '操作失败',
              icon: 'none'
            });
            this.setState({ isLoading: false });
          }
        }
      }
    });
  }

  // 渲染状态标签
  renderStatusTag(status: string) {
    switch (status) {
      case '待开始':
        return <Text className='status-tag waiting'>{status}</Text>;
      case '待签到':
        return <Text className='status-tag check-in'>{status}</Text>;
      case '已签到':
        return <Text className='status-tag checked'>{status}</Text>;
      case '已结束':
        return <Text className='status-tag completed'>{status}</Text>;
      case '已取消':
        return <Text className='status-tag canceled'>{status}</Text>;
      default:
        return <Text className='status-tag'>{status}</Text>;
    }
  }

  render() {
    const { 
      filteredReservations, 
      searchQuery, 
      selectedDate, 
      statusOptions, 
      isLoading, 
      selectedItems,
      showBatchActions,
      showDetailModal,
      currentReservation
    } = this.state;
    
    // 找到当前选中的状态选项的索引
    const statusIndex = statusOptions.findIndex(option => option.value === this.state.selectedStatus);
    
    return (
      <View className='reservations-page'>
        {/* 过滤区域 */}
        <View className='filter-section'>
          <View className='search-bar'>
            <Input
              className='search-input'
              type='text'
              placeholder='搜索房间、座位或预约ID'
              value={searchQuery}
              onInput={this.handleSearchChange}
            />
          </View>
          
          <View className='filter-options'>
            <View className='filter-option'>
              <Text className='option-label'>日期:</Text>
              <Picker
                mode='date'
                value={selectedDate}
                onChange={this.handleDateChange}
              >
                <View className='picker-value'>{selectedDate || '全部日期'}</View>
              </Picker>
            </View>
            
            <View className='filter-option'>
              <Text className='option-label'>状态:</Text>
              <Picker
                mode='selector'
                range={statusOptions}
                rangeKey='label'
                value={statusIndex !== -1 ? statusIndex : 0}
                onChange={this.handleStatusChange}
              >
                <View className='picker-value'>{statusOptions[statusIndex !== -1 ? statusIndex : 0].label}</View>
              </Picker>
            </View>
          </View>
        </View>
        
        {/* 批量操作区域 */}
        {showBatchActions && (
          <View className='batch-actions'>
            <Text className='selected-count'>已选择 {selectedItems.length} 项</Text>
            <View className='action-buttons'>
              <Button className='batch-button cancel' onClick={this.handleBatchCancel}>批量取消</Button>
            </View>
          </View>
        )}
        
        {/* 预约列表 */}
        <ScrollView
          className='reservations-list'
          scrollY
          enableBackToTop
        >
          {isLoading ? (
            <View className='loading-state'>加载中...</View>
          ) : filteredReservations.length > 0 ? (
            <CheckboxGroup onChange={this.handleItemSelect}>
              {filteredReservations.map(reservation => (
                <View key={reservation.id} className='reservation-card'>
                  <View className='reservation-check'>
                    <Checkbox value={String(reservation.id)} checked={selectedItems.includes(reservation.id)} />
                  </View>
                  
                  <View className='reservation-content' onClick={() => this.handleViewReservationDetail(reservation)}>
                    <View className='reservation-header'>
                      <Text className='reservation-title'>
                        {reservation.roomName} - {reservation.seatName}
                      </Text>
                      {this.renderStatusTag(reservation.status)}
                    </View>
                    
                    <View className='reservation-details'>
                      <View className='detail-item'>
                        <Text className='detail-label'>预约ID:</Text>
                        <Text className='detail-value'>{reservation.id}</Text>
                      </View>
                      
                      <View className='detail-item'>
                        <Text className='detail-label'>时间:</Text>
                        <Text className='detail-value'>{reservation.date} {reservation.timeSlotText}</Text>
                      </View>
                      
                      <View className='detail-item'>
                        <Text className='detail-label'>创建时间:</Text>
                        <Text className='detail-value'>{reservation.createdAt}</Text>
                      </View>
                    </View>
                    
                    <View className='reservation-actions'>
                      {reservation.status === '待开始' || reservation.status === '待签到' ? (
                        <View className='action-buttons'>
                          <Text className='action-btn detail' onClick={(e) => {
                            e.stopPropagation();
                            this.handleViewReservationDetail(reservation);
                          }}>详情</Text>
                          <Text className='action-btn checkin' onClick={(e) => {
                            e.stopPropagation();
                            this.handleConfirmCheckIn(reservation.id);
                          }}>签到</Text>
                          <Text className='action-btn cancel' onClick={(e) => {
                            e.stopPropagation();
                            this.handleCancelReservation(reservation.id);
                          }}>取消</Text>
                        </View>
                      ) : (
                        <View className='action-buttons'>
                          <Text className='action-btn detail' onClick={(e) => {
                            e.stopPropagation();
                            this.handleViewReservationDetail(reservation);
                          }}>详情</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </CheckboxGroup>
          ) : (
            <View className='empty-state'>
              <Text>没有找到符合条件的预约记录</Text>
            </View>
          )}
        </ScrollView>
        
        {/* 预约详情模态框 */}
        {showDetailModal && currentReservation && (
          <View className='detail-modal'>
            <View className='modal-content'>
              <View className='modal-header'>
                <Text className='modal-title'>预约详情</Text>
                <Text className='close-btn' onClick={this.closeDetailModal}>✕</Text>
              </View>
              
              <View className='modal-body'>
                <View className='detail-row'>
                  <Text className='detail-label'>预约编号:</Text>
                  <Text className='detail-value'>{currentReservation.id}</Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>自习室:</Text>
                  <Text className='detail-value'>{currentReservation.roomName}</Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>座位:</Text>
                  <Text className='detail-value'>{currentReservation.seatName}</Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>日期:</Text>
                  <Text className='detail-value'>{currentReservation.date}</Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>时间段:</Text>
                  <Text className='detail-value'>{currentReservation.timeSlotText}</Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>状态:</Text>
                  <Text className='detail-value'>
                    {this.renderStatusTag(currentReservation.status)}
                  </Text>
                </View>
                
                <View className='detail-row'>
                  <Text className='detail-label'>创建时间:</Text>
                  <Text className='detail-value'>{currentReservation.createdAt}</Text>
                </View>
                
                {currentReservation.checkInTime && (
                  <View className='detail-row'>
                    <Text className='detail-label'>签到时间:</Text>
                    <Text className='detail-value'>{currentReservation.checkInTime}</Text>
                  </View>
                )}
              </View>
              
              <View className='modal-footer'>
                <Button className='modal-btn close' onClick={this.closeDetailModal}>关闭</Button>
                
                {(currentReservation.status === '待开始' || currentReservation.status === '待签到') && (
                  <>
                    <Button className='modal-btn checkin' onClick={() => {
                      this.closeDetailModal();
                      this.handleConfirmCheckIn(currentReservation.id);
                    }}>签到</Button>
                    
                    <Button className='modal-btn cancel' onClick={() => {
                      this.closeDetailModal();
                      this.handleCancelReservation(currentReservation.id);
                    }}>取消预约</Button>
                  </>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
} 