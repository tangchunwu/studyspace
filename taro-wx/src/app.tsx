import { Component } from 'react'
import useAuthStore from './store/authStore'
import './app.scss'

class App extends Component {
  componentDidMount() {
    // 初始化认证状态
    useAuthStore.getState().initAuth()
    
    console.log('应用初始化完成')
  }

  componentDidShow() {
    // 应用显示时触发
  }

  componentDidHide() {
    // 应用隐藏时触发
  }

  render() {
    // 注意：在微信小程序中，这个render会作为一个用于覆盖所有页面的全局模板
    return this.props.children
  }
}

export default App 