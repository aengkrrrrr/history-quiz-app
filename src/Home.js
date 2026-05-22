import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue } from "firebase/database";

const Home = ({ startTest, goToAdmin }) => {
  const [userName, setUserName] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedChapterData, setSelectedChapterData] = useState(null);

  useEffect(() => {
    const schoolRef = ref(db, 'schools');
    onValue(schoolRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, name: data[key].name }));
        setSchools(list);
      } else {
        setSchools([]);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSchool) { setCategories([]); setSelectedChapter(''); setSelectedChapterData(null); return; }
    const catRef = ref(db, `categories/${selectedSchool}`);
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setCategories(list);
      } else {
        setCategories([]);
      }
      setSelectedChapter('');
      setSelectedChapterData(null);
    });
  }, [selectedSchool]);

  const handleSelectChapter = (cat) => {
    setSelectedChapter(cat.id);
    setSelectedChapterData(cat);
  };

  const handleStart = () => {
    if (!userName.trim()) { alert('이름을 입력해주세요!'); return; }
    if (!selectedSchool) { alert('학교를 선택해주세요!'); return; }
    if (!selectedChapter) { alert('응시할 시험을 선택해주세요!'); return; }
    const timeLimitSeconds = (selectedChapterData?.timeLimit || 10) * 60;
    startTest(userName, selectedChapter, timeLimitSeconds, selectedChapterData?.name);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <h1 className="fw-bold text-primary mb-2">진민T 시험장</h1>
          <p className="text-muted mb-4">오늘의 학습을 확인해봅시다!</p>

          <div className="card shadow border-0 p-4" style={{ borderRadius: '20px' }}>

            {/* 1. 이름 입력 */}
            <div className="mb-4 text-start">
              <label className="form-label fw-bold">1. 이름을 입력하세요</label>
              <input
                type="text"
                className="form-control form-control-lg text-center"
                placeholder="이름"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            {/* 2. 학교 선택 */}
            <div className="mb-4 text-start">
              <label className="form-label fw-bold">2. 학교를 선택하세요</label>
              <div className="d-flex flex-wrap gap-2">
                {schools.length > 0 ? (
                  schools.map((school) => (
                    <button
                      key={school.id}
                      className={`btn btn-lg px-4 ${selectedSchool === school.id ? 'btn-dark' : 'btn-outline-dark'}`}
                      onClick={() => setSelectedSchool(school.id)}
                    >
                      🏫 {school.name}
                    </button>
                  ))
                ) : (
                  <p className="text-danger small">등록된 학교가 없습니다. 선생님에게 문의하세요.</p>
                )}
              </div>
            </div>

            {/* 3. 챕터 선택 */}
            {selectedSchool && (
              <div className="mb-4 text-start">
                <label className="form-label fw-bold">3. 시험장을 선택하세요</label>
                <div className="d-flex flex-wrap gap-2">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`btn btn-lg px-4 ${selectedChapter === cat.id ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleSelectChapter(cat)}
                      >
                        {cat.name}
                        {cat.timeLimit && (
                          <span className="badge bg-light text-primary ms-2 small">⏱ {cat.timeLimit}분</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-danger small">이 학교에 등록된 시험이 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* 선택된 챕터 시간 안내 */}
            {selectedChapterData && (
              <div className="alert alert-info py-2 mb-3 text-start">
                ⏱ 제한 시간: <strong>{selectedChapterData.timeLimit || 10}분</strong>
              </div>
            )}

            <button className="btn btn-success btn-lg w-100 fw-bold py-3 shadow-sm" onClick={handleStart}>
              시험 시작하기! 🚀
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