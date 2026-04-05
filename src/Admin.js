import React, { useState } from 'react';

const Admin = ({ wordList, setWordList, goBack }) => {
  const [word, setWord] = useState('');
  const [mean, setMean] = useState('');
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const handleSave = () => {
    if (!word || !mean) return alert("단어와 뜻을 모두 입력하세요!");
    if (editId) {
      setWordList(wordList.map(item => item.id === editId ? { ...item, word, mean } : item));
      setEditId(null);
    } else {
      setWordList([...wordList, { id: Date.now(), word, mean }]);
    }
    setWord(''); setMean('');
  };

  const handleDelete = (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setWordList(wordList.filter(item => item.id !== id));
    }
  };

  const totalPages = Math.ceil(wordList.length / itemsPerPage);
  const currentItems = wordList.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">교사용 단어 관리</h2>
        <button className="btn btn-outline-danger btn-sm" onClick={goBack}>로그아웃</button>
      </div>

      <div className="card p-4 mb-4 shadow-sm border-primary">
        <div className="row g-2">
          <div className="col-md-5">
            <input type="text" className="form-control" placeholder="단어 (APPLE)" value={word} onChange={e => setWord(e.target.value)} />
          </div>
          <div className="col-md-5">
            <input type="text" className="form-control" placeholder="뜻 (사과)" value={mean} onChange={e => setMean(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleSave}>{editId ? "수정" : "등록"}</button>
          </div>
        </div>
      </div>

      <table className="table table-hover align-middle border">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>단어</th>
            <th>뜻</th>
            <th className="text-center">관리</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => (
            <tr key={item.id}>
              <td>{currentPage * itemsPerPage + index + 1}</td>
              <td className="fw-bold">{item.word}</td>
              <td>{item.mean}</td>
              <td className="text-center">
                <button className="btn btn-sm btn-warning me-2" onClick={() => { setEditId(item.id); setWord(item.word); setMean(item.mean); }}>수정</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-center mt-4">
        <button className="btn btn-sm btn-secondary me-2" disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)}>&lt; 이전</button>
        <span className="align-self-center mx-2">{currentPage + 1} / {totalPages || 1}</span>
        <button className="btn btn-sm btn-secondary" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)}>다음 &gt;</button>
      </div>
    </div>
  );
};

export default Admin;