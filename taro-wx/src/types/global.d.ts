declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
  
  // 自定义全局变量
  var reminderTimers: NodeJS.Timeout[];
}

export {}; 