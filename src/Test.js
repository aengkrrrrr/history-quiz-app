import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { ref, push } from "firebase/database";

const parseQuestion = (text) => {
  if (!text) return { source: null, question: text };
  const sourceMatch = text.match(/^(<\s*사료\s*>[\s\S]*?)(->|→)\s*(.*)/);
  if (sourceMatch) {
    return { source: sourceMatch[1].trim(), question: sourceMatch[3].trim() };
  }
  return { source: null, question: text };
};

const Test = ({ userName, wordList, totalTime, goBack, chapterId, chapterName }) => {
  const [shuffledList] = useState(() => {
    const shuffled = [...wordList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(wordList.length).fill(null).map(() => []));
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // 결과 Firebase 저장
  const saveResults = useCallback((res) => {
    const score = res.filter(r => r.isCorrect).length;
    const resultData = {
      userName,
      chapterId: chapterId || '',
      chapterName: chapterName || '',
      score,
      total: shuffledList.length,
      timestamp: Date.now(),
      details: res.map(r => ({
        question: r.question,
        correct: r.correct,
        user: r.user,
        isCorrect: r.isCorrect,
        wordId: r.wordId || '',
      })),
    };
    push(ref(db, 'results'), resultData);
  }, [userName, chapterId, chapterName, shuffledList.length]);

  const finishTest = useCallback((currentAnswers) => {
    const res = shuffledList.map((word, idx) => {
      const userAns = (currentAnswers[idx] || []).filter(s => s.trim() !== '').sort().join(',');
      const isCorrect = userAns.trim() === word.word.trim();
      return {
        question: word.mean,
        correct: word.word,
        user: userAns,
        isCorrect,
        wordId: word.id,
      };
    });
    setResults(res);
    setIsFinished(true);
    saveResults(res);
  }, [shuffledList, saveResults]);

  useEffect(() => {
    if (isFinished) return;
    if (timeLeft <= 0) { setIsTimeUp(true); finishTest(answers); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, finishTest, answers]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerColor = timeLeft <= 30 ? 'danger' : timeLeft <= 60 ? 'warning' : 'primary';

  const currentWord = shuffledList[currentIndex];
  const currentAnswers = answers[currentIndex] || [];

  const setCurrentAnswers = (newAns) => {
    const updated = [...answers];
    updated[currentIndex] = newAns;
    setAnswers(updated);
  };

  const toggleOption = (opt) => {
    if (!opt || opt.trim() === '') return;
    if (currentAnswers.includes(opt)) {
      setCurrentAnswers(currentAnswers.filter(item => item !== opt));
    } else {
      setCurrentAnswers([...currentAnswers, opt]);
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishTest(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // 오답만 재시험 - shuffledList 기준으로 틀린 문제 추출
  const handleRetryWrong = () => {
    const wrongWords = shuffledList.filter((word, idx) => {
      const r = results[idx];
      return r && !r.isCorrect;
    });
    if (wrongWords.length === 0) { alert("틀린 문제가 없습니다! 🎉"); return; }
    goBack(wrongWords);
  };

  if (isFinished) {
    const score = results.filter(r => r.isCorrect).length;
    return (
      <div className="container py-4 text-center" style={{ maxWidth: '600px' }}>
        <h2 className="fw-bold mb-2">{userName}학생 시험결과</h2>
        {isTimeUp && <div className="alert alert-warning fw-bold">⏰ 시간이 초과되었습니다!</div>}
        <h3 className="text-primary fw-bold mb-4">점수: {score} / {shuffledList.length}</h3>

        <div className="list-group mb-4 text-start shadow-sm">
          {results.map((res, idx) => {
            const parsed = parseQuestion(res.question);
            return (
              <div key={idx} className={`list-group-item p-3 ${res.isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                <div className="d-flex align-items-start">
                  <span className="me-3 fs-4">{res.isCorrect ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    {parsed.source && (
                      <div className="p-2 mb-1 rounded small" style={{ background: 'rgba(0,0,0,0.07)', fontStyle: 'italic' }}>
                        {parsed.source}
                      </div>
                    )}
                    <div className="fw-bold">Q{idx + 1}. {parsed.question || res.question}</div>
                    <div className="small mt-1"><span className="text-muted">내 답변:</span> {res.user || '(공백)'}</div>
                    {!res.isCorrect && (
                      <div className="small fw-bold text-danger"><span className="text-muted">정답:</span> {res.correct}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="d-grid gap-2">
          {results.some(r => !r.isCorrect) && (
            <button className="btn btn-warning fw-bold py-3 shadow" onClick={handleRetryWrong}>
              ❌ 틀린 문제만 다시 풀기 ({results.filter(r => !r.isCorrect).length}문제)
            </button>
          )}
          <button className="btn btn-primary w-100 py-3 fw-bold shadow" onClick={() => goBack(null)}>
            메인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;
  const validOptions = currentWord.options ? currentWord.options.filter(opt => opt && opt.trim() !== '') : [];
  const parsed = parseQuestion(currentWord.mean);

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-primary fw-bold">📝 {userName}학생 응시중</span>
        <span className={`badge bg-${timerColor} fs-6 px-3 py-2`}>⏱ {formatTime(timeLeft)}</span>
      </div>
      <div className="d-flex align-items-center mb-3 gap-2">
        <small className="text-muted text-nowrap">진행도: {currentIndex + 1} / {shuffledList.length}</small>
        <div className="flex-fill">
          <div className="progress" style={{ height: '8px' }}>
            <div className="progress-bar bg-primary" style={{ width: `${((currentIndex + 1) / shuffledList.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-4 mb-3 border-0" style={{ borderRadius: '15px' }}>
        {parsed.source && (
          <div className="p-3 mb-3 rounded" style={{
            background: '#f8f4e8', border: '1px solid #d4c5a9',
            borderLeft: '4px solid #8b6914', fontStyle: 'italic',
            fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap',
          }}>
            {parsed.source}
          </div>
        )}
        <div className="text-center mb-4">
          <h4 className="fw-bold text-dark">{parsed.question || currentWord.mean}</h4>
          {currentWord.isMultiple && <span className="badge bg-warning text-dark mt-1">복수 정답 가능</span>}
        </div>

        {currentWord.type === 'multiple' ? (
          <div className="d-grid gap-2">
            {validOptions.map((opt, i) => (
              <button key={i}
                className={`btn ${currentAnswers.includes(opt) ? 'btn-primary shadow' : 'btn-outline-primary'} text-start py-2 fw-bold`}
                onClick={() => toggleOption(opt)}>
                {i + 1}. {opt}
              </button>
            ))}
          </div>
        ) : (
          <input type="text" className="form-control text-center py-2 fw-bold border-2"
            placeholder="정답 입력"
            value={currentAnswers[0] || ''}
            onChange={(e) => setCurrentAnswers([e.target.value])}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && currentAnswers[0]?.trim()) handleNext();
            }} />
        )}
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary py-3 fw-bold" style={{ flex: 1 }}
          onClick={handlePrev} disabled={currentIndex === 0}>
          ◀ 이전
        </button>
        <button className="btn btn-success py-3 fw-bold shadow" style={{ flex: 2 }}
          onClick={handleNext}
          disabled={!currentAnswers[0]?.trim() && currentWord.type !== 'multiple'}>
          {currentIndex === shuffledList.length - 1 ? '최종 제출 ✅' : '다음 문제 ▶'}
        </button>
      </div>
    </div>
  );
};

export default Test;