import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import './index.scss'

export default class Login extends Component {
  componentDidShow() {
    // 检查是否已登录
    this.checkLoginStatus()
  }

  checkLoginStatus() {
    try {
      const token = Taro.getStorageSync('token')
      if (token) {
        // 已登录，跳转回首页
        Taro.switchTab({
          url: '/pages/index/index'
        })
      }
    } catch (e) {
      console.error('检查登录状态失败', e)
    }
  }

  // 微信登录方法
  handleWxLogin = () => {
    Taro.showLoading({ title: '登录中...' })
    
    // 获取微信登录凭证
    Taro.login({
      success: (res) => {
        if (res.code) {
          // 获取用户信息
          Taro.getUserProfile({
            desc: '用于完善用户资料',
            success: (userResult) => {
              // 模拟登录，实际项目中应调用后端API
              setTimeout(() => {
                // 模拟登录成功
                const mockUserInfo = {
                  nickName: userResult.userInfo.nickName,
                  avatarUrl: userResult.userInfo.avatarUrl,
                  studentId: 'S12345678',
                  gender: userResult.userInfo.gender,
                  role: 'student'
                }
                
                // 存储用户信息和登录状态
                Taro.setStorageSync('token', 'mock-token-' + Date.now())
                Taro.setStorageSync('userInfo', JSON.stringify(mockUserInfo))
                
                Taro.hideLoading()
                Taro.showToast({
                  title: '登录成功',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    // 登录成功，跳转到首页
                    setTimeout(() => {
                      Taro.switchTab({
                        url: '/pages/index/index'
                      })
                    }, 1500)
                  }
                })
              }, 1500)
            },
            fail: (err) => {
              console.error('获取用户信息失败', err)
              Taro.hideLoading()
              Taro.showToast({
                title: '登录失败',
                icon: 'none'
              })
            }
          })
        } else {
          console.error('微信登录失败', res)
          Taro.hideLoading()
          Taro.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('微信登录失败', err)
        Taro.hideLoading()
        Taro.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    })
  }

  handleBackToIndex = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  render() {
    return (
      <View className='login-page'>
        <View className='logo-area'>
          <Image 
            className='logo' 
            src='https://placehold.co/200/4F46E5/FFFFFF?text=自习室'
          />
          <Text className='app-name'>自习室预约</Text>
          <Text className='app-slogan'>随时随地，轻松预约自习室</Text>
        </View>
        
        <View className='login-actions'>
          <Button 
            className='login-btn wechat-login-btn' 
            onClick={this.handleWxLogin}
          >
            微信一键登录
          </Button>
          
          <Text 
            className='back-to-index'
            onClick={this.handleBackToIndex}
          >
            先随便逛逛 &gt;
          </Text>
        </View>
        
        <View className='login-terms'>
          <Text className='terms-text'>登录即表示您同意</Text>
          <Text className='terms-link'>《用户协议》</Text>
          <Text className='terms-text'>和</Text>
          <Text className='terms-link'>《隐私政策》</Text>
        </View>
      </View>
    )
  }
} 