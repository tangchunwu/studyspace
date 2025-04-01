import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import useAuthStore from '../../store/authStore'
import useUserStore, { User } from '../../store/userStore'
import './users.scss'

interface UsersState {
  users: User[];
  filteredUsers: User[];
  searchQuery: string;
  isLoading: boolean;
  showDeleteConfirm: boolean;
  userToDelete: string | null;
}

export default class Users extends Component<{}, UsersState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      users: [],
      filteredUsers: [],
      searchQuery: '',
      isLoading: true,
      showDeleteConfirm: false,
      userToDelete: null
    };
  }

  componentDidMount() {
    // 设置页面标题
    Taro.setNavigationBarTitle({ title: '用户管理' });
    
    // 检查是否有管理员权限
    this.checkAdminPermission();
    
    // 获取用户列表
    this.fetchUsers();
  }

  // 检查管理员权限
  checkAdminPermission() {
    const hasPermission = useAuthStore.getState().hasPermission('view_users');
    
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

  // 获取用户列表
  async fetchUsers() {
    this.setState({ isLoading: true });
    
    try {
      await useUserStore.getState().fetchUsers();
      const users = useUserStore.getState().users;
      
      this.setState({
        users,
        filteredUsers: users,
        isLoading: false
      });
    } catch (error) {
      console.error('获取用户列表失败', error);
      Taro.showToast({
        title: '获取用户列表失败',
        icon: 'none'
      });
      
      this.setState({ isLoading: false });
    }
  }

  // 处理搜索输入变化
  handleSearchChange = (e) => {
    const searchQuery = e.detail.value;
    this.setState({ searchQuery });
    
    this.filterUsers(searchQuery);
  }

  // 筛选用户
  filterUsers(query: string) {
    if (!query.trim()) {
      this.setState({ filteredUsers: this.state.users });
      return;
    }
    
    const lowercasedQuery = query.toLowerCase();
    const filteredUsers = this.state.users.filter(user => 
      user.nickName.toLowerCase().includes(lowercasedQuery) ||
      user.studentId.toLowerCase().includes(lowercasedQuery)
    );
    
    this.setState({ filteredUsers });
  }

  // 显示删除确认对话框
  showDeleteConfirmDialog = (userId: string) => {
    // 检查是否有管理用户权限
    const hasPermission = useAuthStore.getState().hasPermission('manage_users');
    
    if (!hasPermission) {
      Taro.showToast({
        title: '您没有删除用户的权限',
        icon: 'none'
      });
      return;
    }
    
    this.setState({
      showDeleteConfirm: true,
      userToDelete: userId
    });
  }

  // 取消删除操作
  cancelDelete = () => {
    this.setState({
      showDeleteConfirm: false,
      userToDelete: null
    });
  }

  // 确认删除用户
  confirmDelete = async () => {
    const { userToDelete } = this.state;
    
    if (!userToDelete) return;
    
    this.setState({ isLoading: true });
    
    try {
      const success = await useUserStore.getState().deleteUser(userToDelete);
      
      if (success) {
        // 更新本地状态
        const users = this.state.users.filter(user => user.id !== userToDelete);
        
        this.setState({
          users,
          filteredUsers: users,
          showDeleteConfirm: false,
          userToDelete: null,
          isLoading: false
        });
        
        Taro.showToast({
          title: '删除用户成功',
          icon: 'success'
        });
      } else {
        throw new Error('删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败', error);
      Taro.showToast({
        title: '删除用户失败',
        icon: 'none'
      });
      
      this.setState({
        showDeleteConfirm: false,
        userToDelete: null,
        isLoading: false
      });
    }
  }

  // 更新用户状态（启用/禁用）
  toggleUserStatus = async (user: User) => {
    // 检查是否有管理用户权限
    const hasPermission = useAuthStore.getState().hasPermission('manage_users');
    
    if (!hasPermission) {
      Taro.showToast({
        title: '您没有管理用户状态的权限',
        icon: 'none'
      });
      return;
    }
    
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    
    this.setState({ isLoading: true });
    
    try {
      const success = await useUserStore.getState().updateUserStatus(user.id, newStatus);
      
      if (success) {
        // 更新本地状态
        const users = this.state.users.map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        );
        
        this.setState({
          users,
          filteredUsers: this.filterUsersWithCurrentQuery(users),
          isLoading: false
        });
        
        Taro.showToast({
          title: `${newStatus === 'active' ? '启用' : '禁用'}用户成功`,
          icon: 'success'
        });
      } else {
        throw new Error('更新用户状态失败');
      }
    } catch (error) {
      console.error('更新用户状态失败', error);
      Taro.showToast({
        title: '更新用户状态失败',
        icon: 'none'
      });
      
      this.setState({ isLoading: false });
    }
  }

  // 使用当前搜索查询筛选用户
  filterUsersWithCurrentQuery(users: User[]) {
    const { searchQuery } = this.state;
    
    if (!searchQuery.trim()) {
      return users;
    }
    
    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(user => 
      user.nickName.toLowerCase().includes(lowercasedQuery) ||
      user.studentId.toLowerCase().includes(lowercasedQuery)
    );
  }

  // 渲染用户角色标签
  renderRoleTag(role: string) {
    let className = 'role-tag';
    
    switch (role) {
      case 'admin':
        className += ' admin';
        break;
      case 'manager':
        className += ' manager';
        break;
      default:
        className += ' student';
        break;
    }
    
    return (
      <Text className={className}>
        {role === 'admin' ? '管理员' : role === 'manager' ? '管理者' : '学生'}
      </Text>
    );
  }

  // 渲染用户状态标签
  renderStatusTag(status: string) {
    const className = `status-tag ${status === 'active' ? 'active' : 'disabled'}`;
    
    return (
      <Text className={className}>
        {status === 'active' ? '正常' : '已禁用'}
      </Text>
    );
  }

  render() {
    const { filteredUsers, isLoading, showDeleteConfirm } = this.state;
    
    return (
      <View className='users-page'>
        {/* 搜索栏 */}
        <View className='search-bar'>
          <Input
            className='search-input'
            type='text'
            placeholder='搜索用户名或学号'
            onInput={this.handleSearchChange}
          />
        </View>
        
        {/* 用户列表 */}
        <ScrollView
          className='users-list'
          scrollY
          enableBackToTop
        >
          {isLoading ? (
            <View className='loading-state'>加载中...</View>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <View className='user-card' key={user.id}>
                <View className='user-info'>
                  <Image 
                    className='user-avatar' 
                    src={user.avatarUrl || 'https://placehold.co/100'}
                  />
                  <View className='user-details'>
                    <View className='user-name'>{user.nickName}</View>
                    <View className='user-id'>{user.studentId}</View>
                    <View className='user-tags'>
                      {this.renderRoleTag(user.role)}
                      {this.renderStatusTag(user.status)}
                    </View>
                  </View>
                </View>
                
                <View className='user-actions'>
                  <View 
                    className={`action-btn ${user.status === 'active' ? 'disable-btn' : 'enable-btn'}`}
                    onClick={() => this.toggleUserStatus(user)}
                  >
                    {user.status === 'active' ? '禁用' : '启用'}
                  </View>
                  
                  <View 
                    className='action-btn delete-btn'
                    onClick={() => this.showDeleteConfirmDialog(user.id)}
                  >
                    删除
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className='empty-state'>
              <View className='empty-icon'>🔍</View>
              <Text className='empty-text'>未找到匹配的用户</Text>
            </View>
          )}
        </ScrollView>
        
        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <View className='confirm-dialog'>
            <View className='dialog-content'>
              <View className='dialog-title'>确认删除用户</View>
              <View className='dialog-message'>此操作不可撤销，确定要删除该用户吗？</View>
              <View className='dialog-buttons'>
                <View className='dialog-btn cancel-btn' onClick={this.cancelDelete}>取消</View>
                <View className='dialog-btn confirm-btn' onClick={this.confirmDelete}>确认删除</View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
} 