// 默认 admin 登录态（仅占位，单人使用，无真实鉴权）

import { db } from './db';

const KEY = 'auth';

const DEFAULT_USER = { username: 'admin', password: 'admin' };

export function login(username, password) {
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    db.write(KEY, { username, loginAt: Date.now() });
    return { ok: true };
  }
  return { ok: false, message: '账号或密码错误（默认 admin / admin）' };
}

export function logout() {
  localStorage.removeItem(db.PREFIX + KEY);
}

export function isLoggedIn() {
  return !!db.read(KEY, null);
}

export function currentUser() {
  return db.read(KEY, null);
}
