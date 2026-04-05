import React, { useState } from 'react';

const Test = ({ userName, wordList, goBack }) => {
  const [userAnswers, setUserAnswers] = useState({}); // 학생이 입력한 답변들
  const [isFinished, setIsFinished] = useState(false); // 시험 종료 여부
  const [currentPage, setCurrentPage] = useState(0);   // 현재 페이지 (5개씩)
  const itemsPerPage = 5;

  // 1. 답변 입력 처리
  const handleInputChange = (id, value) => {
    setUserAnswers({ ...userAnswers, [id]: value });
  };

  // 2. 시험 제출
  const handleSubmit = () => {
    if (window.confirm("시험을 종료하시겠습니까?")) {
      setIsFinished(true);
    }
  };

  // 3. 결과 계산 (정답 개수)
  const correctCount = wordList.filter(item => 
    item.word.toLowerCase().trim() === (userAnswers[item.id] || "").toLowerCase().trim()
  ).length;

  // 4. 페이지네이션 데이터
  const totalPages = Math.ceil(wordList.length / itemsPerPage);
  const currentItems = wordList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // --- 결과 화면 (시험 종료 후) ---
  if (isFinished) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-4">시험 결과: {userName} 학생</h2>
        <div className="display-4 mb-5 text-primary fw-bold">
          {correctCount} / {wordList.length}
        </div>

        <div className="list-group text-start shadow-sm mb-4">
          {wordList.map((item, index) => {
            const userAnswer = userAnswers[item.id] || "(미기입)";
            const isCorrect = item.word.toLowerCase().trim() === userAnswer.toLowerCase().trim();
            return (
              <div key={item.id} className="list-group-item p-3">
                <div className="fw-bold">
                  {index + 1}. {item.mean} 
                  <span className={`ms-3 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                    {isCorrect ? '● 정답' : 'X 오답'}
                  </span>
                </div>
                <div className={isCorrect ? 'text-success' : 'text-danger'}>
                  제출 답변: {userAnswer} {!isCorrect && `(정답: ${item.word})`}
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn btn-dark btn-lg px-5" onClick={goBack}>홈으로 돌아가기</button>
      </div>
    );
  }

  // --- 시험 진행 화면 ---
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>학생: <span className="text-primary">{userName}</span></h4>
        <button className="btn btn-danger btn-sm" onClick={goBack}>시험 중단</button>
      </div>

      <div className="card p-4 shadow-sm mb-4">
        {currentItems.map((item, index) => (
          <div key={item.id} className="mb-4">
            <h5 className="fw-bold text-secondary">
              {currentPage * itemsPerPage + index + 1}. {item.mean}
            </h5>
            <input
              type="text"
              className="form-control form-control-lg border-2"
              placeholder="영어 단어를 입력하세요"
              value={userAnswers[item.id] || ""}
              onChange={(e) => handleInputChange(item.id, e.target.value)}
            />
          </div>
        ))}

        {/* 페이지네이션 및 제출 버튼 */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div>
            <button 
              className="btn btn-outline-secondary me-2" 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              &lt; 이전
            </button>
            <button 
              className="btn btn-outline-secondary" 
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              다음 &gt;
            </button>
          </div>
          {currentPage === totalPages - 1 && (
            <button className="btn btn-success btn-lg px-4 fw-bold" onClick={handleSubmit}>
              제출 및 채점
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Test;