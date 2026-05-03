import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, CheckCircle, AlertCircle, Play, 
  Send, ChevronRight, Home, X
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const renderMath = (text) => {
  if (!text) return { __html: '' };
  const html = text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  return { __html: html };
};

export default function App() {
  const [allExams, setAllExams] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 

  const [appState, setAppState] = useState('menu');
  const [selectedExam, setSelectedExam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState({ correct: 0, total: 0, scale10: 0 });
  const [studentName, setStudentName] = useState('');
  
  // Trạng thái bật/tắt bảng xác nhận nộp bài
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    fetch('/exam_db.json?v=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setAllExams(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải đề thi:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let timer;
    if (appState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [appState, timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setAppState('intro');
  };

  const handleStart = () => {
    setAppState('playing');
    setTimeLeft(selectedExam.duration);
    setAnswers({}); 
    setShowSubmitConfirm(false);
  };

  const handleAnswerChange = (questionId, value, type = 'single') => {
    if (type === 'multiple') {
      setAnswers(prev => {
        const current = prev[questionId] || [];
        return current.includes(value)
          ? { ...prev, [questionId]: current.filter(v => v !== value).sort() }
          : { ...prev, [questionId]: [...current, value].sort() };
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmit = () => {
    if (appState !== 'playing') return;
    setShowSubmitConfirm(false); // Ẩn modal nếu đang mở

    let correctCount = 0;
    const data = selectedExam.questions;

    data.part1A.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    data.part1B.forEach(q => {
      if (JSON.stringify(answers[q.id] || []) === JSON.stringify(q.correct)) correctCount++;
    });
    if (data.part2 && data.part2.questions) {
      data.part2.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    }
    data.part3.forEach(q => {
      const userAns = answers[q.id]?.toString().replace(',', '.').trim() || '';
      const correctAns = q.correct.toString().replace(',', '.').trim();
      if (userAns === correctAns) correctCount++;
    });

    const total = data.part1A.length + data.part1B.length + (data.part2?.questions?.length || 0) + data.part3.length;
    const finalScale10 = ((correctCount / total) * 10).toFixed(1);

    fetch('https://script.google.com/macros/s/AKfycbyqsL94snNjcUAe4MbtCHcZp0rM2KKy2WoY6UrpqsUMXYQ3q4H5jMX78CRWt6jAGkYFxA/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: studentName, 
        class: "Chưa xác định",
        examTitle: selectedExam.title,
        score: finalScale10
      }),
    }).catch(err => console.log("Lỗi gửi Sheet:", err));

    setScore({ correct: correctCount, total, scale10: finalScale10 });
    setAppState('result');
  };

  // Hàm chuyển tất cả câu hỏi thành 1 mảng dẹt để làm bảng Tiến độ
  const getFlatQuestions = () => {
    if (!selectedExam) return [];
    const q = selectedExam.questions;
    const flat = [];
    if (q.part1A) flat.push(...q.part1A.map(item => ({ ...item, type: '1A' })));
    if (q.part1B) flat.push(...q.part1B.map(item => ({ ...item, type: '1B' })));
    if (q.part2?.questions) flat.push(...q.part2.questions.map(item => ({ ...item, type: '2' })));
    if (q.part3) flat.push(...q.part3.map(item => ({ ...item, type: '3' })));
    return flat;
  };

  const flatQuestions = getFlatQuestions();

  // Kiểm tra xem 1 câu đã làm hay chưa
  const isAnswered = (qId, type) => {
    const ans = answers[qId];
    if (type === '1B') return Array.isArray(ans) && ans.length > 0;
    if (type === '3') return ans !== undefined && ans.toString().trim() !== '';
    return ans !== undefined;
  };

  // Kiểm tra đúng/sai cho Bảng điểm
  const checkCorrect = (q) => {
    const ans = answers[q.id];
    if (q.type === '1A' || q.type === '2') return ans === q.correct;
    if (q.type === '1B') return JSON.stringify(ans || []) === JSON.stringify(q.correct);
    if (q.type === '3') {
      const userAnsFormatted = (ans || '').toString().replace(',', '.').trim();
      const correctAnsFormatted = q.correct.toString().replace(',', '.').trim();
      return userAnsFormatted !== '' && userAnsFormatted === correctAnsFormatted;
    }
    return false;
  };

  // Hàm cuộn trang mượt mà tới câu hỏi
  const scrollToQuestion = (id) => {
    if (appState === 'result') {
      setAppState('review'); // Nếu đang ở bảng điểm thì chuyển sang chế độ xem lại
    }
    setTimeout(() => {
      const el = document.getElementById(`question-${id}`);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 100; // Trừ đi chiều cao của Header
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };


  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Hệ thống đang tải dữ liệu đề thi...</div>;
  }

  if (appState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><FileText size={32} /></div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Hệ thống Thi thử Vật lí</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allExams.map(exam => (
              <button key={exam.id} onClick={() => handleSelectExam(exam)} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all text-left group">
                <div className="text-blue-600 font-bold text-sm mb-2 uppercase">{exam.subject}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 group-hover:text-blue-700">{exam.title}</h3>
                <div className="flex items-center text-slate-500 text-sm"><Clock size={16} className="mr-1" /> {exam.duration / 60} phút <ChevronRight size={16} className="ml-auto" /></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2 uppercase">{selectedExam.title}</h1>
            <p className="opacity-90">Thời gian làm bài: {selectedExam.duration / 60} phút</p>
          </div>
          <div className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Họ và Tên thí sinh:</label>
              <input type="text" placeholder="Nhập tên của bạn..." className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <h2 className="font-bold text-slate-800 mb-4 flex items-center"><AlertCircle className="mr-2 text-blue-600" /> Lưu ý:</h2>
            <ul className="space-y-3 text-slate-600 mb-8 text-sm">
              <li className="flex gap-2"><CheckCircle className="text-green-500 shrink-0" size={18} /> Hệ thống tự nộp bài khi hết giờ.</li>
              <li className="flex gap-2"><CheckCircle className="text-green-500 shrink-0" size={18} /> Chấp nhận dấu phẩy (,) và dấu chấm (.) cho số thập phân.</li>
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setAppState('menu')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200">Quay lại</button>
              <button onClick={handleStart} disabled={!studentName.trim()} className="flex-2 bg-blue-600 disabled:bg-slate-300 text-white font-bold py-4 px-8 rounded-2xl hover:bg-blue-700 flex items-center justify-center gap-2">
                <Play fill="currentColor" size={20} /> BẮT ĐẦU
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const exam = selectedExam.questions;
  const isReviewMode = appState === 'result' || appState === 'review';
  const answeredCount = flatQuestions.filter(q => isAnswered(q.id, q.type)).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => isReviewMode && setAppState('menu')} className="text-slate-500 hover:text-blue-600"><Home size={24} /></button>
          
          {appState === 'playing' && (
            <div className={`font-mono text-xl font-black px-4 py-1.5 rounded-full ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>{formatTime(timeLeft)}</div>
          )}
          
          {appState === 'playing' && (
            <button onClick={() => setShowSubmitConfirm(true)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
              <Send size={18} /> NỘP BÀI
            </button>
          )}

          {appState === 'review' && (
             <button onClick={() => setAppState('result')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">BẢNG ĐIỂM</button>
          )}
        </div>
      </header>

      {/* ĐÃ CHỈNH SỬA BỐ CỤC: CHIA 2 CỘT CHO MÀN HÌNH LỚN */}
      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-start pb-20">
        
        {/* CỘT TRÁI: NỘI DUNG ĐỀ THI */}
        <main className="flex-1 w-full space-y-10">
          
          {/* PHẦN 1A */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 1: Trắc nghiệm khách quan</h2>
            <div className="space-y-10">
              {exam.part1A.map((q, idx) => (
                <div key={q.id} id={`question-${q.id}`}>
                  <div className="text-slate-800 font-medium mb-4">
                    <span className="text-blue-600 font-bold">Câu {idx + 1}: </span> 
                    <span dangerouslySetInnerHTML={renderMath(q.text)} />
                    
                    {q.image && (
                      <img 
                        src={q.image} 
                        style={{ width: q.imageWidth || '60%' }}
                        className="mt-6 mb-2 mx-auto block rounded-xl border border-slate-200 shadow-sm" 
                        alt="Minh họa" 
                      />
                    )}
                    {q.images && (
                      <div className="flex flex-wrap justify-center items-center gap-4 mt-6 mb-2">
                        {q.images.map((imgObj, index) => (
                          <img 
                            key={index}
                            src={imgObj.url} 
                            style={{ width: imgObj.width || '45%' }} 
                            className="rounded-xl border border-slate-200 shadow-sm" 
                            alt={`Minh họa ${index + 1}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === oIdx;
                      const isCorrect = q.correct === oIdx;
                      return (
                        <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx)} className={`text-left p-4 rounded-xl border-2 transition-all ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700 font-bold' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
                          <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span> 
                          <span dangerouslySetInnerHTML={renderMath(opt)} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN 1B */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 1B: Trắc nghiệm nhiều lựa chọn</h2>
            <div className="space-y-10">
              {exam.part1B.map((q, idx) => (
                <div key={q.id} id={`question-${q.id}`}>
                  <div className="text-slate-800 font-medium mb-4">
                    <span className="text-blue-600 font-bold">Câu {exam.part1A.length + idx + 1}: </span> 
                    <span dangerouslySetInnerHTML={renderMath(q.text)} />
                    
                    {q.image && (
                      <img 
                        src={q.image} 
                        style={{ width: q.imageWidth || '60%' }}
                        className="mt-6 mb-2 mx-auto block rounded-xl border border-slate-200 shadow-sm" 
                        alt="Minh họa" 
                      />
                    )}
                    {q.images && (
                      <div className="flex flex-wrap justify-center items-center gap-4 mt-6 mb-2">
                        {q.images.map((imgObj, index) => (
                          <img 
                            key={index}
                            src={imgObj.url} 
                            style={{ width: imgObj.width || '45%' }} 
                            className="rounded-xl border border-slate-200 shadow-sm" 
                            alt={`Minh họa ${index + 1}`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 pl-4">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = (answers[q.id] || []).includes(oIdx);
                      const isCorrect = q.correct.includes(oIdx);
                      return (
                        <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx, 'multiple')} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700 font-bold' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>{isSelected && <CheckCircle size={14} />}</div>
                          <span dangerouslySetInnerHTML={renderMath(opt)} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN 2 */}
          {exam.part2 && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">
                Phần 2: Đọc hiểu ngữ liệu
              </h2>
              
              <div 
                className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-slate-700 leading-relaxed mb-6 italic"
                dangerouslySetInnerHTML={renderMath(exam.part2.passage)}
              />

              {exam.part2.image && (
                <img 
                  src={exam.part2.image} 
                  style={{ width: exam.part2.imageWidth || '60%' }}
                  className="mb-8 mx-auto block rounded-xl border border-slate-200 shadow-sm" 
                  alt="Minh họa ngữ liệu" 
                />
              )}

              {exam.part2.images && (
                <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
                  {exam.part2.images.map((imgObj, index) => (
                    <img 
                      key={index}
                      src={imgObj.url} 
                      style={{ width: imgObj.width || '45%' }} 
                      className="rounded-xl border border-slate-200 shadow-sm" 
                      alt={`Minh họa ngữ liệu ${index + 1}`} 
                    />
                  ))}
                </div>
              )}
              
              <div className="space-y-10">
                {exam.part2.questions.map((q, idx) => (
                  <div key={q.id} id={`question-${q.id}`}>
                    <div className="text-slate-800 font-medium mb-4">
                      <span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + idx + 1}: </span> 
                      <span dangerouslySetInnerHTML={renderMath(q.text)} />
                      
                      {q.image && (
                        <img 
                          src={q.image} 
                          style={{ width: q.imageWidth || '70%' }}
                          className="mt-6 mx-auto block rounded-xl border border-slate-200 shadow-sm" 
                          alt="Minh họa" 
                        />
                      )}
                      {q.images && (
                        <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
                          {q.images.map((imgObj, index) => (
                            <img 
                              key={index}
                              src={imgObj.url} 
                              style={{ width: imgObj.width || '45%' }} 
                              className="rounded-xl border border-slate-200 shadow-sm" 
                              alt={`Minh họa ${index + 1}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = answers[q.id] === oIdx;
                        const isCorrect = q.correct === oIdx;
                        return (
                          <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx)} className={`text-left p-4 rounded-xl border-2 transition-all ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 font-bold' : (isSelected ? 'bg-red-50 border-red-500' : 'opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-100')}`}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            <span dangerouslySetInnerHTML={renderMath(opt)} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHẦN 3 */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 3: Câu hỏi điền đáp số</h2>
            <div className="space-y-8">
              {exam.part3.map((q, idx) => {
                const userVal = answers[q.id] || '';
                const userValFormatted = userVal.toString().replace(',', '.').trim();
                const correctAnsFormatted = q.correct.toString().replace(',', '.').trim();
                const isCorrect = userValFormatted === correctAnsFormatted;
                return (
                  <div key={q.id} id={`question-${q.id}`} className="flex flex-col md:flex-row md:items-start gap-4 border-b border-slate-100 pb-8 last:border-0">
                    <div className="flex-1 text-slate-800 mt-2">
                      <span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + (exam.part2?.questions?.length || 0) + idx + 1}: </span> 
                      <span dangerouslySetInnerHTML={renderMath(q.text)} />
                      
                      {q.image && (
                        <img 
                          src={q.image} 
                          style={{ width: q.imageWidth || '60%' }}
                          className="mt-6 mb-2 mx-auto block rounded-xl border border-slate-200 shadow-sm" 
                          alt="Minh họa" 
                        />
                      )}
                      {q.images && (
                        <div className="flex flex-wrap justify-center items-center gap-4 mt-6 mb-2">
                          {q.images.map((imgObj, index) => (
                            <img 
                              key={index}
                              src={imgObj.url} 
                              style={{ width: imgObj.width || '45%' }} 
                              className="rounded-xl border border-slate-200 shadow-sm" 
                              alt={`Minh họa ${index + 1}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative md:w-40 shrink-0">
                      <input type="text" placeholder="Đáp số..." disabled={isReviewMode} value={userVal} onChange={(e) => handleAnswerChange(q.id, e.target.value, '3')} className={`w-full p-4 rounded-2xl border-2 font-mono text-lg focus:outline-none focus:border-blue-600 ${isReviewMode ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-slate-200 bg-white'}`} />
                      {isReviewMode && !isCorrect && <div className="text-sm bg-green-100 text-green-700 p-2 rounded-lg mt-2 font-bold text-center border border-green-200">Đ/A: {q.correct}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* CỘT PHẢI: BẢNG TIẾN ĐỘ LÀM BÀI (STICKY SIDEBAR) */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-20 z-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
            <h3 className="font-black text-slate-800 mb-2 uppercase">Danh sách câu hỏi</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-6">
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${(answeredCount / flatQuestions.length) * 100}%` }}></div>
              </div>
              <span className="text-blue-600 font-bold">{answeredCount}/{flatQuestions.length}</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {flatQuestions.map((q, idx) => {
                const answered = isAnswered(q.id, q.type);
                return (
                  <button 
                    key={q.id} 
                    onClick={() => scrollToQuestion(q.id)} 
                    className={`w-full aspect-square rounded-xl font-bold text-sm flex items-center justify-center transition-all 
                      ${answered ? (isReviewMode ? (checkCorrect(q) ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-blue-600 text-white shadow-md') : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Chú thích màu sắc cho Sidebar */}
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500 justify-center">
              {!isReviewMode ? (
                <>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-600"></div> Đã làm</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Chưa làm</div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Đúng</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Sai</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Bỏ trống</div>
                </>
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* MODAL: XÁC NHẬN NỘP BÀI */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Xác nhận nộp bài?</h2>
            
            {flatQuestions.length - answeredCount > 0 ? (
              <p className="text-slate-600 mb-8">
                Bạn vẫn còn <span className="font-bold text-red-500">{flatQuestions.length - answeredCount} câu</span> chưa hoàn thành. Bạn có chắc chắn muốn nộp bài ngay lúc này?
              </p>
            ) : (
              <p className="text-slate-600 mb-8">Bạn đã hoàn thành toàn bộ bài thi. Sẵn sàng xem kết quả chưa?</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">TIẾP TỤC LÀM</button>
              <button onClick={handleSubmit} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">NỘP BÀI</button>
            </div>
          </div>
        </div>
      )}

      {/* MÀN HÌNH BẢNG ĐIỂM */}
      {appState === 'result' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setAppState('review')} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"><X size={20} /></button>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><CheckCircle size={40} /></div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">HOÀN THÀNH!</h2>
              <div className="text-5xl font-black text-blue-600 mb-6">{score.scale10}<span className="text-xl text-slate-400">/10</span></div>
            </div>

            {/* Bảng mini tóm tắt trong modal Bảng điểm */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-6">
              <div className="flex justify-between text-sm font-bold text-slate-500 mb-4 px-2">
                <span>Số câu đúng: <span className="text-green-600">{score.correct}/{score.total}</span></span>
                <span>Bỏ trống: <span className="text-slate-400">{flatQuestions.length - answeredCount}</span></span>
              </div>
              <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {flatQuestions.map((q, idx) => {
                  const answered = isAnswered(q.id, q.type);
                  return (
                    <button 
                      key={q.id} 
                      onClick={() => scrollToQuestion(q.id)} 
                      title={`Đến câu ${idx + 1}`}
                      className={`w-full aspect-square rounded-lg font-bold text-xs flex items-center justify-center transition-transform hover:scale-110
                        ${answered ? (checkCorrect(q) ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-200 text-slate-400'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setAppState('review')} className="w-full py-4 bg-blue-50 text-blue-700 font-bold rounded-2xl hover:bg-blue-100 transition-all border border-blue-200">XEM LẠI CHI TIẾT ĐỀ</button>
              <button onClick={() => setAppState('menu')} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all">VỀ TRANG CHỦ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
