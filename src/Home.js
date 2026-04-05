import React, { useState } from 'react';

const Home = ({ onStartTest, goToAdmin }) => {
  const [userName, setUserName] = useState('');

  const handleStart = () => {
    if (!userName.trim()) {
      alert("이름을 입력해주세요!");
      return;
    }
    // App.js에서 넘겨받은 함수를 실행하며 이름을 전달합니다.
    onStartTest(userName); 
  };

  return (
    <div className="container vh-100 d-flex flex-column justify-content-center align-items-center position-relative">
      
      {/* 메인 타이틀 */}
      <h1 className="mb-5 fw-bold text-primary">단어 암기 프로그램</h1>

      {/* 학생 이름 입력 영역 (부트스트랩 카드 스타일) */}
      <div className="card p-4 shadow-sm border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>
        <div className="mb-3">
          <label htmlFor="studentName" className="form-label fw-bold text-secondary">학생 이름을 입력하세요</label>
          <input
            type="text"
            className="form-control form-control-lg border-2"
            id="studentName"
            placeholder="예: 홍길동"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary btn-lg w-100 fw-bold shadow-sm" 
          onClick={handleStart}
        >
          START
        </button>
      </div>

      {/* 우측 하단 관리자 이동 버튼 (작고 심플하게) */}
      <button 
        className="btn btn-link btn-sm text-decoration-none text-secondary position-absolute" 
        style={{ bottom: '20px', right: '20px' }}
        onClick={goToAdmin}
      >
        ⚙️ 교사용 페이지 이동
      </button>

    </div>
  );
};

export default Home;