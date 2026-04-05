import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';   
import Login from './Login';
import Admin from './Admin';
import Test from './Test'; 

export default function App() {
  const [view, setView] = useState('home');
  const [userName, setUserName] = useState(''); // 학생 이름 저장용
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wordList, setWordList] = useState([]); // 교사가 입력한 단어들

  return (
    <div className="bg-light min-vh-100">
      {view === 'home' && (
        <Home 
          onStartTest={(name) => { setUserName(name); setView('test'); }} 
          goToAdmin={() => isLoggedIn ? setView('admin') : setView('login')} 
        />
      )}

      {view === 'test' && (
        <Test 
          userName={userName} 
          wordList={wordList} 
          goBack={() => setView('home')} 
        />
      )}

      {/* Login, Admin 뷰는 기존과 동일 */}
      {view === 'login' && <Login onLoginSuccess={() => { setIsLoggedIn(true); setView('admin'); }} goBack={() => setView('home')} />}
      {view === 'admin' && <Admin wordList={wordList} setWordList={setWordList} goBack={() => { setIsLoggedIn(false); setView('home'); }} />}
    </div>
  );
}