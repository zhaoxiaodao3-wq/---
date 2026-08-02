// 登录服务（对接后端 JWT）
import api from './apiClient';

export async function login(username, password) {
  return api.login(username, password);
}

export function logout() {
  api.setAuth({});
}

export function isLoggedIn() {
  try {
    return !!JSON.parse(localStorage.getItem('sl_auth') || '{}').token;
  } catch {
    return false;
  }
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('sl_auth') || '{}');
  } catch {
    return null;
  }
}
