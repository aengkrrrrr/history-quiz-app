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

  // 🚀 핵심: Home.js에서 호출할 함수 (이름: startTest)
  const startTest = async (name, chapterId) => {
    try {
      // 1. 이름과 문제 리스트 초기화/설정
      setUserName(name);
      const wordRef = ref(db, `words/${chapterId}`);
      const snapshot = await get(wordRef);
      const data = snapshot.val();

      if (data) {
        // 객체를 배열로 변환
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key 
        }));
        setWordList(list);
        setView('test'); // 2. 시험 화면으로 이동
      } else {
        alert("이 챕터에는 등록된 문제가 없습니다!");
      }
    } catch (error) {
      console.error("데이터 로드 에러:", error);
      alert("문제를 불러오지 못했습니다.");
    }
  };

  return (
    <div className="bg-light min-vh-100">
      {view === 'home' && (
        <Home 
          // 👈 Home.js에서 쓰는 이름(startTest)과 여기서 넘겨주는 이름이 같아야 함!
          startTest={startTest} 
          goToAdmin={() => isLoggedIn ? setView('admin') : setView('login')} 
        />
      )}

      {view === 'test' && (
        <Test 
          userName={userName} 
          wordList={wordList} 
          goBack={() => {
            setUserName('');
            setWordList([]);
            setView('home');
          }} 
        />
      )}

      {view === 'login' && (
        <Login 
          onLoginSuccess={() => { setIsLoggedIn(true); setView('admin'); }} 
          goBack={() => setView('home')} 
        />
      )}
      
      {view === 'admin' && (
        <Admin 
          goBack={() => { setIsLoggedIn(false); setView('home'); }} 
        />
      )}
    </div>
  );
}