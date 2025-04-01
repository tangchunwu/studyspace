// token存储和获取工具函数

/**
 * 从localStorage获取token
 * @returns {string|null} token或null
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * 将token存储到localStorage
 * @param {string} token 要存储的JWT token
 */
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * 从localStorage中移除token
 */
export const removeToken = (): void => {
  localStorage.removeItem('token');
}; 