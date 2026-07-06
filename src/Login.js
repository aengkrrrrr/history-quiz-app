import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onLoginSuccess, goBack }) => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !pw.trim()) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      onLoginSuccess();
    } catch (err) {
      setError('로그인 정보가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container vh-100 d-flex flex-column justify-content-center align-items-center">
      {process.env.REACT_APP_IS_DEMO === 'true' && (
        <div className="alert alert-warning text-center mb-4" style={{ width: '100%', maxWidth: '350px' }}>
          <strong>🔐 데모 관리자 계정</strong><br />
          아이디: <code>admin</code> &nbsp;|&nbsp; 비밀번호: <code>1234</code>
        </div>
      )}
      <div className="card p-4 shadow-sm" style={{ width: '100%', maxWidth: '350px' }}>
        <h3 className="text-center mb-4 fw-bold">관리자 로그인</h3>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <div className="mb-2">
          <input
            type="email"
            className="form-control"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="btn btn-dark w-100 mb-2 py-2 fw-bold" onClick={handleLogin} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <button className="btn btn-link btn-sm text-secondary w-100" onClick={goBack}>뒤로가기</button>
      </div>
    </div>
  );
};

export default Login;
