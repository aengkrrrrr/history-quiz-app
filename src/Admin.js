import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, push, remove, onValue, update } from "firebase/database";

const Admin = ({ goBack }) => {
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'results'

  // 학교/챕터/문제 상태
  const [schools, setSchools] = useState([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatTime, setNewCatTime] = useState(10);
  const [targetChapter, setTargetChapter] = useState('');
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingChapterData, setEditingChapterData] = useState({});
  const [wordList, setWordList] = useState([]);
  const [newMean, setNewMean] = useState('');
  const [newWord, setNewWord] = useState('');
  const [type, setType] = useState('subjective');
  const [options, setOptions] = useState(['', '', '', '', '']);
  const [correctIndices, setCorrectIndices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // 결과 관련 상태
  const [allResults, setAllResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [filterChapter, setFilterChapter] = useState('');

  // 학교 로드
  useEffect(() => {
    const schoolRef = ref(db, 'schools');
    onValue(schoolRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, name: data[key].name }));
        setSchools(list);
        if (!targetSchool && list.length > 0) setTargetSchool(list[0].id);
      } else { setSchools([]); setTargetSchool(''); }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 챕터 로드
  useEffect(() => {
    if (!targetSchool) { setCategories([]); setTargetChapter(''); return; }
    const catRef = ref(db, `categories/${targetSchool}`);
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setCategories(list);
        if (!targetChapter && list.length > 0) setTargetChapter(list[0].id);
      } else { setCategories([]); setTargetChapter(''); }
    });
  }, [targetSchool]); // eslint-disable-line react-hooks/exhaustive-deps

  // 문제 로드
  useEffect(() => {
    if (!targetChapter) { setWordList([]); return; }
    const wordRef = ref(db, `words/${targetChapter}`);
    const unsubscribe = onValue(wordRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setWordList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setWordList([]);
    });
    return () => unsubscribe();
  }, [targetChapter]);

  // 결과 로드
  useEffect(() => {
    if (activeTab !== 'results') return;
    const resultsRef = ref(db, 'results');
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        list.sort((a, b) => b.timestamp - a.timestamp);
        setAllResults(list);
      } else setAllResults([]);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handleAddSchool = () => {
    if (!newSchoolName.trim()) return;
    push(ref(db, 'schools'), { name: newSchoolName.trim() });
    setNewSchoolName('');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim() || !targetSchool) return;
    push(ref(db, `categories/${targetSchool}`), { name: newCatName.trim(), timeLimit: newCatTime });
    setNewCatName(''); setNewCatTime(10);
  };

  const saveChapterEdit = () => {
    update(ref(db, `categories/${targetSchool}/${editingChapterId}`), {
      name: editingChapterData.name, timeLimit: editingChapterData.timeLimit,
    }).then(() => setEditingChapterId(null));
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!targetChapter) { alert("챕터를 선택해주세요."); return; }
    let finalAnswer = newWord.trim();
    if (type === 'multiple') {
      if (correctIndices.length === 0) { alert("정답을 체크해주세요."); return; }
      finalAnswer = correctIndices.map(idx => options[idx].trim()).filter(v => v !== "").sort().join(',');
    }
    if (!newMean.trim() || !finalAnswer) { alert("내용을 입력해주세요."); return; }
    const newTestData = { mean: newMean.trim(), word: finalAnswer, type };
    if (type === 'multiple') { newTestData.options = options; newTestData.isMultiple = correctIndices.length > 1; }
    push(ref(db, `words/${targetChapter}`), newTestData);
    setNewMean(''); setNewWord(''); setOptions(['', '', '', '', '']); setCorrectIndices([]);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    if (item.type === 'multiple' && item.options) {
      const opts = [...(item.options || [])];
      while (opts.length < 5) opts.push('');
      const answers = item.word.split(',');
      const indices = opts.map((opt, idx) => answers.includes(opt) ? idx : -1).filter(i => i !== -1);
      setEditData({ ...item, options: opts, correctIndices: indices });
    } else setEditData({ ...item });
  };

  const saveEdit = () => {
    let finalData = { ...editData };
    if (finalData.type === 'multiple') {
      finalData.word = finalData.correctIndices.map(idx => finalData.options[idx].trim()).filter(v => v !== "").sort().join(',');
      finalData.isMultiple = finalData.correctIndices.length > 1;
      delete finalData.correctIndices;
    }
    update(ref(db, `words/${targetChapter}/${editingId}`), finalData).then(() => setEditingId(null));
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const filteredResults = filterChapter
    ? allResults.filter(r => r.chapterId === filterChapter)
    : allResults;

  const allChapterIds = [...new Set(allResults.map(r => r.chapterId).filter(Boolean))];

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">진민T 시험 관리실</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={goBack}>로그아웃</button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link fw-bold ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
            📝 문제 관리
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            📊 학생 결과
            {allResults.length > 0 && <span className="badge bg-danger ms-2">{allResults.length}</span>}
          </button>
        </li>
      </ul>

      {activeTab === 'manage' && (
        <>
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
              <h5 className="fw-bold mb-3">🏫 학교 관리</h5>
              <div className="input-group mb-3">
                <input type="text" className="form-control" placeholder="새 학교 이름 (예: 영동고)"
                  value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} />
                <button className="btn btn-dark" onClick={handleAddSchool}>추가</button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {schools.map((school) => (
                  <div key={school.id} className="btn-group">
                    <button className={`btn btn-sm ${targetSchool === school.id ? 'btn-dark' : 'btn-outline-dark'}`}
                      onClick={() => { setTargetSchool(school.id); setTargetChapter(''); }}>
                      {school.name}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      if (window.confirm(`"${school.name}" 학교를 삭제하시겠습니까?`)) {
                        remove(ref(db, `schools/${school.id}`));
                        remove(ref(db, `categories/${school.id}`));
                      }
                    }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {targetSchool && (
            <div className="card shadow-sm mb-4 border-0">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  📁 챕터 관리
                  <span className="text-muted fs-6 ms-2">({schools.find(s => s.id === targetSchool)?.name})</span>
                </h5>
                <div className="row g-2 mb-3 align-items-end">
                  <div className="col">
                    <input type="text" className="form-control" placeholder="새 챕터 이름"
                      value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                  </div>
                  <div className="col-auto d-flex align-items-center gap-2">
                    <span className="text-muted small text-nowrap">⏱ 제한시간</span>
                    <input type="number" className="form-control" style={{ width: '75px' }}
                      min="1" max="120" value={newCatTime}
                      onChange={(e) => setNewCatTime(Number(e.target.value))} />
                    <span className="text-muted small">분</span>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-dark" onClick={handleAddCategory}>추가</button>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {categories.map((ch) => (
                    <div key={ch.id}>
                      {editingChapterId === ch.id ? (
                        <div className="card p-2 border-primary" style={{ minWidth: '220px' }}>
                          <input type="text" className="form-control form-control-sm mb-1"
                            value={editingChapterData.name}
                            onChange={(e) => setEditingChapterData({ ...editingChapterData, name: e.target.value })} />
                          <div className="d-flex align-items-center gap-1 mb-1">
                            <span className="small text-muted">⏱</span>
                            <input type="number" className="form-control form-control-sm" style={{ width: '65px' }}
                              min="1" max="120" value={editingChapterData.timeLimit}
                              onChange={(e) => setEditingChapterData({ ...editingChapterData, timeLimit: Number(e.target.value) })} />
                            <span className="small text-muted">분</span>
                          </div>
                          <div className="d-flex gap-1">
                            <button className="btn btn-success btn-sm flex-fill" onClick={saveChapterEdit}>저장</button>
                            <button className="btn btn-secondary btn-sm flex-fill" onClick={() => setEditingChapterId(null)}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <div className="btn-group">
                          <button className={`btn btn-sm ${targetChapter === ch.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setTargetChapter(ch.id)}>
                            {ch.name}
                            <span className="badge bg-light text-primary ms-1">⏱ {ch.timeLimit || 10}분</span>
                          </button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => {
                            setEditingChapterId(ch.id);
                            setEditingChapterData({ name: ch.name, timeLimit: ch.timeLimit || 10 });
                          }}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={() => {
                            if (window.confirm("챕터와 문제 전체를 삭제하시겠습니까?")) {
                              remove(ref(db, `categories/${targetSchool}/${ch.id}`));
                              remove(ref(db, `words/${ch.id}`));
                            }
                          }}>×</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {targetChapter && (
            <>
              <div className="card shadow-sm mb-4 border-primary">
                <div className="card-body">
                  <h5 className="fw-bold mb-1 text-primary">문제 등록</h5>
                  <p className="text-muted small mb-3">💡 사료 형식: <code>&lt;사료&gt; 내용 -&gt; 질문</code></p>
                  <form onSubmit={handleAddWord}>
                    <select className="form-select mb-3" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="subjective">📝 주관식</option>
                      <option value="multiple">🔢 객관식</option>
                    </select>
                    <textarea className="form-control mb-3" rows={3} placeholder="질문 입력"
                      value={newMean} onChange={(e) => setNewMean(e.target.value)} />
                    {type === 'multiple' ? (
                      <div className="p-3 bg-light rounded mb-3">
                        <small className="text-muted d-block mb-2">✅ 체크박스로 정답 선택 (5개 보기)</small>
                        {options.map((opt, i) => (
                          <div key={i} className="input-group mb-2">
                            <div className="input-group-text">
                              <input type="checkbox" checked={correctIndices.includes(i)}
                                onChange={(e) => e.target.checked
                                  ? setCorrectIndices([...correctIndices, i])
                                  : setCorrectIndices(correctIndices.filter(idx => idx !== i))} />
                            </div>
                            <input type="text" className="form-control" placeholder={`보기 ${i + 1}`} value={opt}
                              onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <input type="text" className="form-control mb-3" placeholder="정답"
                        value={newWord} onChange={(e) => setNewWord(e.target.value)} />
                    )}
                    <button type="submit" className="btn btn-primary w-100 fw-bold">등록</button>
                  </form>
                </div>
              </div>

              <div className="card shadow-sm border-0">
                <div className="card-header bg-white fw-bold">문항 리스트 ({wordList.length}개)</div>
                <ul className="list-group list-group-flush">
                  {wordList.map((item, listIdx) => (
                    <li key={item.id} className="list-group-item p-3">
                      {editingId === item.id ? (
                        <div className="bg-light p-3 rounded">
                          <textarea className="form-control mb-2" rows={3} value={editData.mean}
                            onChange={(e) => setEditData({ ...editData, mean: e.target.value })} />
                          {editData.type === 'multiple' ? (
                            <div>
                              {(editData.options || ['','','','','']).map((opt, i) => (
                                <div key={i} className="input-group mb-2">
                                  <div className="input-group-text">
                                    <input type="checkbox" checked={(editData.correctIndices || []).includes(i)}
                                      onChange={(e) => {
                                        const newIdx = e.target.checked
                                          ? [...(editData.correctIndices || []), i]
                                          : (editData.correctIndices || []).filter(idx => idx !== i);
                                        setEditData({ ...editData, correctIndices: newIdx });
                                      }} />
                                  </div>
                                  <input type="text" className="form-control" value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(editData.options || [])];
                                      newOpts[i] = e.target.value;
                                      setEditData({ ...editData, options: newOpts });
                                    }} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <input type="text" className="form-control mb-2" value={editData.word}
                              onChange={(e) => setEditData({ ...editData, word: e.target.value })} />
                          )}
                          <div className="d-flex gap-2">
                            <button className="btn btn-success btn-sm flex-fill" onClick={saveEdit}>저장</button>
                            <button className="btn btn-secondary btn-sm flex-fill" onClick={() => setEditingId(null)}>취소</button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ flex: 1 }}>
                            <span className="badge bg-secondary me-1">{item.type === 'multiple' ? '객관식' : '주관식'}</span>
                            <span className="badge bg-light text-dark border me-2">#{listIdx + 1}</span>
                            <strong className="text-primary me-2">{item.word}</strong>
                            <span className="text-muted small">{item.mean?.substring(0, 40)}{item.mean?.length > 40 ? '...' : ''}</span>
                          </div>
                          <div className="d-flex gap-1 ms-2">
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
        </>
      )}

      {activeTab === 'results' && (
        <>
          {selectedResult ? (
            <div>
              <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => setSelectedResult(null)}>
                ← 목록으로
              </button>
              <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                  <h5 className="fw-bold">{selectedResult.userName} 학생</h5>
                  <div className="text-muted small mb-2">{formatDate(selectedResult.timestamp)} · {selectedResult.chapterName || selectedResult.chapterId}</div>
                  <h4 className="text-primary fw-bold">
                    {selectedResult.score} / {selectedResult.total}점
                    <span className="ms-2 text-muted fs-6">
                      ({Math.round((selectedResult.score / selectedResult.total) * 100)}%)
                    </span>
                  </h4>
                </div>
              </div>
              <div className="list-group shadow-sm">
                {(selectedResult.details || []).map((d, idx) => (
                  <div key={idx} className={`list-group-item p-3 ${d.isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                    <div className="d-flex align-items-start">
                      <span className="me-3 fs-5">{d.isCorrect ? '✅' : '❌'}</span>
                      <div>
                        <div className="fw-bold small">Q{idx + 1}. {d.question}</div>
                        <div className="small mt-1">
                          <span className="text-muted">내 답변: </span>{d.user || '(공백)'}
                        </div>
                        {!d.isCorrect && (
                          <div className="small fw-bold text-danger">
                            <span className="text-muted">정답: </span>{d.correct}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline-danger btn-sm mt-3 w-100" onClick={() => {
                if (window.confirm("이 결과를 삭제하시겠습니까?")) {
                  remove(ref(db, `results/${selectedResult.id}`));
                  setSelectedResult(null);
                }
              }}>🗑 이 결과 삭제</button>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">📊 응시 결과 목록</h5>
                <select className="form-select form-select-sm w-auto"
                  value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)}>
                  <option value="">전체 챕터</option>
                  {allChapterIds.map(cid => {
                    const r = allResults.find(x => x.chapterId === cid);
                    return <option key={cid} value={cid}>{r?.chapterName || cid}</option>;
                  })}
                </select>
              </div>
              {filteredResults.length === 0 ? (
                <div className="text-center text-muted py-5">아직 응시 결과가 없습니다.</div>
              ) : (
                <div className="list-group shadow-sm">
                  {filteredResults.map((result) => {
                    const pct = Math.round((result.score / result.total) * 100);
                    const badgeColor = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger';
                    return (
                      <button key={result.id}
                        className="list-group-item list-group-item-action p-3"
                        onClick={() => setSelectedResult(result)}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{result.userName}</strong>
                            <span className="text-muted ms-2 small">{result.chapterName || result.chapterId}</span>
                            <div className="text-muted small">{formatDate(result.timestamp)}</div>
                          </div>
                          <div className="text-end">
                            <span className={`badge bg-${badgeColor} fs-6`}>
                              {result.score}/{result.total}
                            </span>
                            <div className="text-muted small">{pct}%</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;