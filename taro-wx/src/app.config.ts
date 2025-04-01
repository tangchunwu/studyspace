export default {
  pages: [
    'pages/index/index',
    'pages/rooms/index',
    'pages/rooms/detail',
    'pages/reserve/index',
    'pages/reservation/index',
    'pages/reservation/detail',
    'pages/profile/index',
    'pages/profile/reservations',
    'pages/login/index',
    'pages/admin/index',
    'pages/admin/users',
    'pages/admin/reservations',
    'pages/admin/checkins'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '自习室预约',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: "#8e8e93",
    selectedColor: "#007aff",
    backgroundColor: "#fff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "assets/icons/home.png",
        selectedIconPath: "assets/icons/home-active.png"
      },
      {
        pagePath: "pages/rooms/index",
        text: "自习室",
        iconPath: "assets/icons/room.png",
        selectedIconPath: "assets/icons/room-active.png"
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
        iconPath: "assets/icons/profile.png",
        selectedIconPath: "assets/icons/profile-active.png"
      }
    ]
  }
} 