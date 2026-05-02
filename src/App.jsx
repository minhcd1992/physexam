import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, CheckCircle, AlertCircle, Play, 
  Send, ChevronRight, Home 
} from 'lucide-react';

// CHỈ DÙNG KATEX GỐC, KHÔNG DÙNG REACT-LATEX-NEXT NỮA
import katex from 'katex';
import 'katex/dist/katex.min.css';

// TỰ ĐỘNG QUÉT VÀ RENDER CÔNG THỨC TOÁN
const renderMath = (text) => {
  if (!text) return { __html: '' };
  // Tìm tất cả các đoạn nằm trong dấu $...$ và chuyển thành HTML Toán học
  const html = text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      // throwOnError: false giúp web không bao giờ bị sập dù gõ sai 1 kí tự LaTeX
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

  useEffect(() => {
    // THÊM Date.now() ĐỂ ÉP VERCEL LUÔN TẢI BẢN MỚI NHẤT, KHÔNG BỊ DÍNH CACHE CŨ
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => isReviewMode && setAppState('menu')} className="text-slate-500 hover:text-blue-600"><Home size={24} /></button>
          {appState === 'playing' && (
            <div className={`font-mono text-xl font-black px-4 py-1.5 rounded-full ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>{formatTime(timeLeft)}</div>
          )}
          {appState === 'playing' && (
            <button onClick={() => window.confirm('Nộp bài?') && handleSubmit()} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"><Send size={18} /> NỘP BÀI</button>
          )}
          {appState === 'review' && (
             <button onClick={() => setAppState('result')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">BẢNG ĐIỂM</button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-10 pb-20">
        
        {/* PHẦN 1A */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 1: Trắc nghiệm khách quan</h2>
          <div className="space-y-10">
            {exam.part1A.map((q, idx) => (
              <div key={q.id}>
                <div className="text-slate-800 font-medium mb-4">
                  <span className="text-blue-600 font-bold">Câu {idx + 1}: </span> 
                  {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
                  <span dangerouslySetInnerHTML={renderMath(q.text)} />
                  {q.image && (
  <img 
    src={q.image} 
    className="mt-6 mb-2 mx-auto block max-w-[80%] md:max-w-md rounded-xl border border-slate-200 shadow-sm" 
    alt="Minh họa" 
  />
)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    const isCorrect = q.correct === oIdx;
                    return (
                      <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx)} className={`text-left p-4 rounded-xl border-2 transition-all ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700 font-bold' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span> 
                        {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
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
          {exam.part1B.map((q, idx) => (
            <div key={q.id}>
              <div className="text-slate-800 font-medium mb-4">
                <span className="text-blue-600 font-bold">Câu {exam.part1A.length + idx + 1}: </span> 
                {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
                <span dangerouslySetInnerHTML={renderMath(q.text)} />
                {q.image && (
  <img 
    src={q.image} 
    className="mt-6 mb-2 mx-auto block max-w-[80%] md:max-w-md rounded-xl border border-slate-200 shadow-sm" 
    alt="Minh họa" 
  />
)}
              </div>
              <div className="space-y-3 pl-4">
                {q.options.map((opt, oIdx) => {
                  const isSelected = (answers[q.id] || []).includes(oIdx);
                  const isCorrect = q.correct.includes(oIdx);
                  return (
                    <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx, 'multiple')} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700 font-bold' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>{isSelected && <CheckCircle size={14} />}</div>
                      {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
                      <span dangerouslySetInnerHTML={renderMath(opt)} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* PHẦN 2 */}
        {exam.part2 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 2: Đọc hiểu ngữ liệu</h2>
            <div 
              className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-slate-700 leading-relaxed mb-8 italic"
              dangerouslySetInnerHTML={renderMath(exam.part2.passage)}
            />
            <div className="space-y-10">
              {exam.part2.questions.map((q, idx) => (
                <div key={q.id}>
                  <div className="text-slate-800 font-medium mb-4">
                    <span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + idx + 1}: </span> 
                    {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
                    <span dangerouslySetInnerHTML={renderMath(q.text)} />
                    {q.image && (
  <img 
    src={q.image} 
    className="mt-6 mb-2 mx-auto block max-w-[80%] md:max-w-md rounded-xl border border-slate-200 shadow-sm" 
    alt="Minh họa" 
  />
)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === oIdx;
                      const isCorrect = q.correct === oIdx;
                      return (
                        <button key={oIdx} disabled={isReviewMode} onClick={() => handleAnswerChange(q.id, oIdx)} className={`text-left p-4 rounded-xl border-2 transition-all ${isReviewMode ? (isCorrect ? 'bg-green-50 border-green-500 font-bold' : (isSelected ? 'bg-red-50 border-red-500' : 'opacity-60')) : (isSelected ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-100')}`}>
                          <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
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
                <div key={q.id} className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 text-slate-800 mt-2">
                    <span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + (exam.part2?.questions?.length || 0) + idx + 1}: </span> 
                    {/* SỬ DỤNG HÀM MỚI Ở ĐÂY */}
                    <span dangerouslySetInnerHTML={renderMath(q.text)} />
                    {q.image && (
  <img 
    src={q.image} 
    className="mt-6 mb-2 mx-auto block max-w-[80%] md:max-w-md rounded-xl border border-slate-200 shadow-sm" 
    alt="Minh họa" 
  />
)}
                  </div>
                  <div className="relative">
                    <input type="text" placeholder="Đáp số..." disabled={isReviewMode} value={userVal} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className={`w-full md:w-40 p-4 rounded-2xl border-2 font-mono text-lg focus:outline-none focus:border-blue-600 ${isReviewMode ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-slate-200'}`} />
                    {isReviewMode && !isCorrect && <div className="text-sm bg-green-100 text-green-700 p-2 rounded-lg mt-2 font-bold text-center border border-green-200">Đáp án: {q.correct}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MÀN HÌNH BẢNG ĐIỂM */}
      {appState === 'result' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"><CheckCircle size={48} /></div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">HOÀN THÀNH!</h2>
            <div className="bg-slate-50 rounded-3xl p-8 mb-8 border border-slate-100">
              <div className="text-6xl font-black text-blue-600 mb-2">{score.scale10}<span className="text-2xl text-slate-400">/10</span></div>
              <div className="text-slate-500 font-medium uppercase tracking-widest text-sm mb-3">Điểm số của bạn</div>
              <div className="text-slate-400 text-sm font-medium border-t border-slate-200 pt-3">Đúng: {score.correct}/{score.total} câu</div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setAppState('review')} className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">XEM LẠI BÀI</button>
              <button onClick={() => setAppState('menu')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">VỀ MENU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
