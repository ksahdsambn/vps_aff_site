import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired } from '../api';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  // 不仅检查 token 是否存在，还要在渲染受保护页面前校验是否已过期/损坏。
  // 否则过期 token 会让管理页先挂载、每个 API 都 401 后才被 axios 拦截器硬跳转，
  // 造成 UI 闪烁（见 Bug #10）。
  if (!token || isTokenExpired(token)) {
    // 清理无效 token，避免反复命中此分支。
    if (token) {
      localStorage.removeItem('token');
    }
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location, reason: 'expired' }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
