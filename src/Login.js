import React, { useState } from 'react';

const Login = ({ onLoginSuccess, goBack }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleLogin = () => {
    if (id === 'admin' && pw === '1234') {
      onLoginSuccess();
    } else {
      alert("로그인 정보가 올바르지 않습니다.");
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
        <h3 className="text-center mb-4 fw-bold">관리자 확인</h3>
        <div className="mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
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
        <button className="btn btn-dark w-100 mb-2 py-2" onClick={handleLogin}>로그인</button>
        <button className="btn btn-link btn-sm text-secondary w-100" onClick={goBack}>뒤로가기</button>
      </div>
    </div>
  );
};

export default Login;