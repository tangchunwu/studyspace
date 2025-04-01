require('dotenv').config();
const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3002/api';

// 测试用户登录和个人资料更新
async function testProfileUpdate() {
  try {
    console.log('开始测试用户资料更新流程...');
    
    // 第一步：登录用户
    console.log('\n1. 用户登录测试...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'test123'
    });
    
    if (!loginResponse.data || !loginResponse.data.token) {
      throw new Error('登录失败，无法获取token');
    }
    
    console.log('✅ 用户登录成功');
    const token = loginResponse.data.token;
    console.log(`获取到token: ${token.substring(0, 20)}...`);
    
    // 第二步：获取当前用户信息
    console.log('\n2. 获取用户信息...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!profileResponse.data) {
      throw new Error('获取用户信息失败');
    }
    
    console.log('✅ 获取用户信息成功');
    console.log('当前用户信息:');
    console.log(`- 名称: ${profileResponse.data.name}`);
    console.log(`- 邮箱: ${profileResponse.data.email}`);
    console.log(`- 学号: ${profileResponse.data.student_id}`);
    console.log(`- 专业: ${profileResponse.data.major || '未设置'}`);
    console.log(`- 年级: ${profileResponse.data.grade || '未设置'}`);
    console.log(`- 手机: ${profileResponse.data.phone_number || '未设置'}`);
    
    // 第三步：更新用户资料
    console.log('\n3. 更新用户资料...');
    const updateData = {
      name: profileResponse.data.name, // 保持姓名不变
      phone_number: '13800138000',
      major: '计算机科学与技术',
      grade: '2025级',
      bio: '这是一条测试简介。这是通过API测试更新的个人资料。'
    };
    
    console.log('发送更新数据:');
    console.log(updateData);
    
    const updateResponse = await axios.put(`${API_BASE_URL}/auth/profile`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!updateResponse.data) {
      throw new Error('更新用户资料失败');
    }
    
    console.log('✅ 更新用户资料成功');
    console.log('更新后的用户信息:');
    console.log(`- 名称: ${updateResponse.data.name}`);
    console.log(`- 邮箱: ${updateResponse.data.email}`);
    console.log(`- 学号: ${updateResponse.data.student_id}`);
    console.log(`- 专业: ${updateResponse.data.major || '未设置'}`);
    console.log(`- 年级: ${updateResponse.data.grade || '未设置'}`);
    console.log(`- 手机: ${updateResponse.data.phone_number || '未设置'}`);
    console.log(`- 简介: ${updateResponse.data.bio || '未设置'}`);
    
    console.log('\n测试完成: 用户资料更新功能正常工作! ✨');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('HTTP错误状态:', error.response.status);
      console.error('错误详情:', error.response.data);
    } else if (error.request) {
      console.error('请求错误:', error.request);
    }
  }
}

testProfileUpdate(); 