import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, push, remove, onValue, update } from "firebase/database";

const Admin = ({ goBack }) => {
  const [categories, setCategories] = useState([]); 
  const [newCatName, setNewCatName] = useState(''); 
  const [targetChapter, setTargetChapter] = useState(''); 

  const [wordList, setWordList] = useState([]);
  const [newMean, setNewMean] = useState('');
  const [newWord, setNewWord] = useState(''); 
  const [type, setType] = useState('subjective'); 
  const [options, setOptions] = useState(['', '', '', '']); 
  const [correctIndices, setCorrectIndices] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({}); // 수정 중인 데이터

  useEffect(() => {
    const catRef = ref(db, 'categories');
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, name: data[key].name }));
        setCategories(list);
        if (!targetChapter && list.length > 0) setTargetChapter(list[0].id);
      } else {
        setCategories([]);
        setTargetChapter('');
      }
    });
  }, []);

  useEffect(() => {
    if (!targetChapter) { setWordList([]); return; }
    const wordRef = ref(db, `words/${targetChapter}`);
    const unsubscribe = onValue(wordRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setWordList(list);
      } else {
        setWordList([]);
      }
    });
    return () => unsubscribe();
  }, [targetChapter]);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    push(ref(db, 'categories'), { name: newCatName.trim() });
    setNewCatName('');
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!targetChapter) { alert("카테고리를 선택해주세요."); return; }
    let finalAnswer = newWord.trim();
    if (type === 'multiple') {
      if (correctIndices.length === 0) { alert("정답을 체크해주세요."); return; }
      finalAnswer = correctIndices.map(idx => options[idx].trim()).filter(v => v !== "").sort().join(',');
    }
    if (!newMean.trim() || !finalAnswer) { alert("내용을 입력해주세요."); return; }
    const newTestData = { mean: newMean.trim(), word: finalAnswer, type: type };
    if (type === 'multiple') { newTestData.options = options; newTestData.isMultiple = correctIndices.length > 1; }
    push(ref(db, `words/${targetChapter}`), newTestData);
    setNewMean(''); setNewWord(''); setOptions(['', '', '', '']); setCorrectIndices([]); 
  };

  // ✅ 수정 시작 시 객관식 데이터를 완벽하게 불러오는 로직
  const startEdit = (item) => {
    setEditingId(item.id);
    const initialEditData = { ...item };
    
    // 객관식인 경우 기존 정답(쉼표구분)을 기반으로 체크박스(Indices) 복구
    if (item.type === 'multiple' && item.options) {
      const answers = item.word.split(',');
      const indices = item.options.map((opt, idx) => answers.includes(opt) ? idx : -1).filter(i => i !== -1);
      setEditData({ ...initialEditData, correctIndices: indices });
    } else {
      setEditData(initialEditData);
    }
  };

  // ✅ 수정 저장 로직 (객관식 정렬 포함)
  const saveEdit = () => {
    let finalData = { ...editData };
    if (finalData.type === 'multiple') {
      const sortedAns = finalData.correctIndices.map(idx => finalData.options[idx].trim()).filter(v => v !== "").sort().join(',');
      finalData.word = sortedAns;
      finalData.isMultiple = finalData.correctIndices.length > 1;
      delete finalData.correctIndices; // 임시 데이터 삭제
    }
    update(ref(db, `words/${targetChapter}/${editingId}`), finalData).then(() => setEditingId(null));
  };

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">진민T 시험 관리실</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={goBack}>로그아웃</button>
      </div>

      {/* 챕터 관리 생략 (기존과 동일) */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <h5 className="fw-bold mb-3">📁 챕터 관리</h5>
          <div className="input-group mb-3">
            <input type="text" className="form-control" placeholder="새 챕터 이름" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <button className="btn btn-dark" onClick={handleAddCategory}>추가</button>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {categories.map((ch) => (
              <div key={ch.id} className="btn-group">
                <button className={`btn btn-sm ${targetChapter === ch.id ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTargetChapter(ch.id)}>{ch.name}</button>
                <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm("삭제하시겠습니까?")) remove(ref(db, `categories/${ch.id}`)); remove(ref(db, `words/${ch.id}`)); }}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {targetChapter && (
        <>
          {/* 문제 등록 폼 (기존과 동일) */}
          <div className="card shadow-sm mb-4 border-primary">
            <div className="card-body">
              <h5 className="fw-bold mb-3 text-primary">문제 등록</h5>
              <form onSubmit={handleAddWord}>
                <select className="form-select mb-3" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="subjective">📝 주관식</option>
                  <option value="multiple">🔢 객관식</option>
                </select>
                <input type="text" className="form-control mb-3" placeholder="질문 입력" value={newMean} onChange={(e)=>setNewMean(e.target.value)} />
                {type === 'multiple' ? (
                  <div className="p-3 bg-light rounded mb-3">
                    {options.map((opt, i) => (
                      <div key={i} className="input-group mb-2">
                        <div className="input-group-text"><input type="checkbox" checked={correctIndices.includes(i)} onChange={(e) => e.target.checked ? setCorrectIndices([...correctIndices, i]) : setCorrectIndices(correctIndices.filter(idx => idx !== i))} /></div>
                        <input type="text" className="form-control" placeholder={`보기 ${i+1}`} value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
                      </div>
                    ))}
                  </div>
                ) : <input type="text" className="form-control mb-3" placeholder="정답" value={newWord} onChange={(e)=>setNewWord(e.target.value)} />}
                <button type="submit" className="btn btn-primary w-100 fw-bold">등록</button>
              </form>
            </div>
          </div>

          {/* 문제 리스트 및 수정 폼 */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold">문항 리스트</div>
            <ul className="list-group list-group-flush">
              {wordList.map((item) => (
                <li key={item.id} className="list-group-item p-3">
                  {editingId === item.id ? (
                    <div className="bg-light p-3 rounded">
                      <input type="text" className="form-control mb-2" value={editData.mean} onChange={(e)=>setEditData({...editData, mean: e.target.value})} />
                      {editData.type === 'multiple' ? (
                        <div>
                          {editData.options.map((opt, i) => (
                            <div key={i} className="input-group mb-2">
                              <div className="input-group-text">
                                <input type="checkbox" checked={editData.correctIndices.includes(i)} 
                                  onChange={(e) => {
                                    const newIdx = e.target.checked ? [...editData.correctIndices, i] : editData.correctIndices.filter(idx => idx !== i);
                                    setEditData({...editData, correctIndices: newIdx});
                                  }} />
                              </div>
                              <input type="text" className="form-control" value={opt} onChange={(e) => {
                                const newOpts = [...editData.options]; newOpts[i] = e.target.value;
                                setEditData({...editData, options: newOpts});
                              }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <input type="text" className="form-control mb-2" value={editData.word} onChange={(e)=>setEditData({...editData, word: e.target.value})} />
                      )}
                      <div className="d-flex gap-2">
                        <button className="btn btn-success btn-sm flex-fill" onClick={saveEdit}>저장</button>
                        <button className="btn btn-secondary btn-sm flex-fill" onClick={()=>setEditingId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-secondary me-2">{item.type === 'multiple' ? '객관식' : '주관식'}</span>
                        <strong className="text-primary me-2">{item.word}</strong>
                        <span>{item.mean}</span>
                      </div>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => startEdit(item)}>수정</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(ref(db, `words/${targetChapter}/${item.id}`))}>삭제</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;