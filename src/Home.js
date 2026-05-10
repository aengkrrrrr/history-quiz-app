import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue } from "firebase/database";

const Home = ({ startTest, goToAdmin }) => {
  const [userName, setUserName] = useState('');
  const [categories, setCategories] = useState([]); // DB에서 가져온 카테고리들
  const [selectedChapter, setSelectedChapter] = useState('');

  // 1️⃣ DB에서 카테고리 목록 가져오기
  useEffect(() => {
    const catRef = ref(db, 'categories');
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name
        }));
        setCategories(list);
      } else {
        setCategories([]);
      }
    });
  }, []);

  const handleStart = () => {
    if (!userName.trim()) {
      alert('이름을 입력해주세요!');
      return;
    }
    if (!selectedChapter) {
      alert('응시할 시험을 선택해주세요!');
      return;
    }
    // 선택한 챕터 ID를 넘겨서 시험 시작
    startTest(userName, selectedChapter);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <h1 className="fw-bold text-primary mb-2">진민T 시험장</h1>
          <p className="text-muted mb-5">오늘의 학습을 확인해봅시다!</p>

          <div className="card shadow border-0 p-4" style={{ borderRadius: '20px' }}>
            <div className="mb-4">
              <label className="form-label fw-bold">1. 이름을 입력하세요</label>
              <input
                type="text"
                className="form-control form-control-lg text-center"
                placeholder="이름"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">2. 시험장을 선택하세요</label>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`btn btn-lg px-4 ${selectedChapter === cat.id ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedChapter(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <p className="text-danger small">등록된 시험이 없습니다. 선생님에게 문의하세요.</p>
                )}
              </div>
            </div>

            <button className="btn btn-success btn-lg w-100 fw-bold py-3 shadow-sm" onClick={handleStart}>
              시험 시작하기!
            </button>
          </div>

          <button className="btn btn-link text-secondary mt-4 btn-sm" onClick={goToAdmin}>
            관리자 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;