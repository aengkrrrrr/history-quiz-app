import React, { useState } from 'react';

const Test = ({ userName, wordList, goBack }) => {
  // ✅ [중요] 시험 시작 시 문제를 무작위로 섞는 로직 (Fisher-Yates Shuffle)
  const [shuffledList] = useState(() => {
    const shuffled = [...wordList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]); 
  const [results, setResults] = useState([]); 
  const [isFinished, setIsFinished] = useState(false);

  // 이제 원본 wordList 대신 섞인 shuffledList를 기준으로 진행합니다.
  const currentWord = shuffledList[currentIndex];

  const toggleOption = (opt) => {
    if (!opt || opt.trim() === "") return;
    if (selectedOptions.includes(opt)) {
      setSelectedOptions(selectedOptions.filter(item => item !== opt));
    } else {
      setSelectedOptions([...selectedOptions, opt]);
    }
  };

  const handleNext = () => {
    const userAnsString = selectedOptions.filter(s => s.trim() !== "").sort().join(',');
    const isCorrect = userAnsString.trim() === currentWord.word.trim();
    
    setResults([...results, {
      question: currentWord.mean,
      correct: currentWord.word,
      user: userAnsString,
      isCorrect: isCorrect
    }]);

    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptions([]); 
    } else {
      setIsFinished(true);
    }
  };

  // ✅ 결과 화면
  if (isFinished) {
    const score = results.filter(r => r.isCorrect).length;
    return (
      <div className="container py-4 text-center" style={{ maxWidth: '600px' }}>
        <h2 className="fw-bold mb-4">{userName}학생 시험결과</h2>
        <h3 className="text-primary fw-bold mb-4">점수: {score} / {shuffledList.length}</h3>
        
        <div className="list-group mb-4 text-start shadow-sm">
          {results.map((res, idx) => (
            <div key={idx} className={`list-group-item p-3 ${res.isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}`}>
              <div className="d-flex align-items-center">
                <span className="me-3 fs-4">{res.isCorrect ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div className="fw-bold">Q{idx + 1}. {res.question}</div>
                  <div className="small mt-1"><span className="text-muted">내 답변:</span> {res.user || '(공백)'}</div>
                  {!res.isCorrect && (
                    <div className="small fw-bold text-danger"><span className="text-muted">정답:</span> {res.correct}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary w-100 py-3 fw-bold shadow" onClick={goBack}>메인 화면으로 돌아가기</button>
      </div>
    );
  }

  if (!currentWord) return null;

  const validOptions = currentWord.options ? currentWord.options.filter(opt => opt && opt.trim() !== "") : [];

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <div className="d-flex justify-content-between mb-3 text-muted fw-bold">
        <span className="text-primary">📝 {userName}학생 응시중</span>
        <span>진행도: {currentIndex + 1} / {shuffledList.length}</span>
      </div>

      <div className="card shadow-sm p-4 mb-3 border-0" style={{borderRadius: '15px'}}>
        <div className="text-center mb-4">
          <h4 className="fw-bold text-dark">{currentWord.mean}</h4>
          {currentWord.isMultiple && <span className="badge bg-warning text-dark mt-1">복수 정답 가능</span>}
        </div>

        {currentWord.type === 'multiple' ? (
          <div className="d-grid gap-2">
            {validOptions.map((opt, i) => (
              <button key={i} className={`btn ${selectedOptions.includes(opt) ? 'btn-primary shadow' : 'btn-outline-primary'} text-start py-2 fw-bold`}
                onClick={() => toggleOption(opt)}>{i + 1}. {opt}</button>
            ))}
          </div>
        ) : (
          <input type="text" className="form-control text-center py-2 fw-bold border-2" placeholder="정답 입력" 
            value={selectedOptions[0] || ''} 
            onChange={(e) => setSelectedOptions([e.target.value])}
            onKeyPress={(e) => e.key === 'Enter' && selectedOptions.length > 0 && handleNext()} />
        )}
      </div>

      <button className="btn btn-success w-100 py-3 fw-bold shadow" onClick={handleNext} disabled={selectedOptions.length === 0}>
        {currentIndex === shuffledList.length - 1 ? '최종 제출' : '다음 문제'}
      </button>
    </div>
  );
};

export default Test;