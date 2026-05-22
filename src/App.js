import React, { useState } from 'react';
import { db } from './firebase';
import { ref, get } from "firebase/database";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import Login from './Login';
import Admin from './Admin';
import Test from './Test';

export default function App() {
  const [view, setView] = useState('home');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wordList, setWordList] = useState([]);
  const [totalTime, setTotalTime] = useState(600);
  const [chapterId, setChapterId] = useState('');
  const [chapterName, setChapterName] = useState('');

  const startTest = async (name, chapId, timeLimitSeconds, chapName) => {
    try {
      setUserName(name);
      setTotalTime(timeLimitSeconds);
      setChapterId(chapId);
      setChapterName(chapName || '');
      const wordRef = ref(db, `words/${chapId}`);
      const snapshot = await get(wordRef);
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setWordList(list);
        setView('test');
      } else {
        alert("이 챕터에는 등록된 문제가 없습니다!");
      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
      alert("문제를 불러오지 못했습니다.");
    }
  };

  // 오답 재시험: wrongWords가 있으면 해당 문제만, null이면 홈으로
  const handleTestBack = (wrongWords) => {
    if (wrongWords && wrongWords.length > 0) {
      // view를 잠깐 'reset'으로 바꿔서 Test 컴포넌트를 완전히 언마운트 후 재마운트
      setView('reset');
      setWordList(wrongWords);
      setTimeout(() => setView('test'), 0);
    } else {
      setUserName('');
      setWordList([]);
      setChapterId('');
      setChapterName('');
      setView('home');
    }
  };

  return (
    <div className="bg-light min-vh-100">
      {process.env.REACT_APP_IS_DEMO === 'true' && (
      <div style={{
        background: '#f59e0b',
        color: 'white',
        textAlign: 'center',
        padding: '10px',
        fontWeight: 'bold',
        fontSize: '14px',
        position: 'sticky',
        top: 0,
        zIndex: 9999
      }}>
      ⚠️ 포트폴리오 데모 버전입니다 — 실제 시험과 무관한 샘플 데이터입니다
    </div>
    )}

      {view === 'home' && (
        <Home
          startTest={startTest}
          goToAdmin={() => isLoggedIn ? setView('admin') : setView('login')}
        />
      )}
      {view === 'test' && (
        <Test
          userName={userName}
          wordList={wordList}
          totalTime={totalTime}
          chapterId={chapterId}
          chapterName={chapterName}
          goBack={handleTestBack}
        />
      )}
      {view === 'login' && (
        <Login
          onLoginSuccess={() => { setIsLoggedIn(true); setView('admin'); }}
          goBack={() => setView('home')}
        />
      )}
      {view === 'admin' && (
        <Admin goBack={() => { setIsLoggedIn(false); setView('home'); }} />
      )}
    </div>
  );
}