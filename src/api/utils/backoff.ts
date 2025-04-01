/**
 * 退避算法工具，用于API请求重试
 * 
 * 使用指数退避策略，在失败后以递增的时间间隔重试请求
 */

interface BackOffOptions {
  maxAttempts: number;       // 最大尝试次数
  startingDelay: number;     // 初始延迟时间(毫秒)
  timeMultiple: number;      // 延迟时间倍数
  maxDelay?: number;         // 最大延迟时间(毫秒)
  shouldRetry?: (error: any) => boolean; // 决定是否重试的函数
  onRetry?: (attempt: number, delay: number) => void; // 重试时的回调
}

const DEFAULT_OPTIONS: BackOffOptions = {
  maxAttempts: 3,
  startingDelay: 1000,   // 1秒
  timeMultiple: 2,       // 每次重试延迟翻倍
  maxDelay: 30000,       // 最大30秒
  shouldRetry: () => true,
  onRetry: (attempt, delay) => console.log(`重试第 ${attempt} 次，等待 ${delay}ms...`)
};

/**
 * 使用退避算法重试异步操作
 * 
 * @param operation 要执行的异步操作
 * @param options 退避配置选项
 * @returns 操作的结果
 */
export async function backOff<T>(
  operation: () => Promise<T>,
  options?: Partial<BackOffOptions>
): Promise<T> {
  // 合并选项与默认值
  const config: BackOffOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  // 执行重试循环
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 判断是否还有重试机会且应该重试
      const shouldRetry = attempt < config.maxAttempts && 
                         (config.shouldRetry ? config.shouldRetry(error) : true);
      
      if (!shouldRetry) {
        throw error;
      }
      
      // 计算下一次重试的延迟时间
      const delay = Math.min(
        config.startingDelay * Math.pow(config.timeMultiple, attempt - 1),
        config.maxDelay || Number.MAX_SAFE_INTEGER
      );
      
      // 可选的重试回调
      if (config.onRetry) {
        config.onRetry(attempt, delay);
      }
      
      // 等待指定的时间
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // 如果所有重试都失败，抛出最后一个错误
  throw lastError;
}

/**
 * 带随机抖动的退避实现，避免多个客户端同时重试
 */
export async function backOffWithJitter<T>(
  operation: () => Promise<T>,
  options?: Partial<BackOffOptions>
): Promise<T> {
  return backOff(operation, {
    ...options,
    startingDelay: applyJitter(options?.startingDelay || DEFAULT_OPTIONS.startingDelay)
  });
}

/**
 * 应用随机抖动到延迟时间，以避免雪崩重试
 */
function applyJitter(delay: number): number {
  // 添加±15%的随机变化
  const jitterFactor = 0.85 + Math.random() * 0.3; // 0.85 到 1.15
  return Math.floor(delay * jitterFactor);
} 