import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, CheckCircle, AlertCircle, Play, 
  RotateCcw, Send, ChevronRight, XCircle, Home 
} from 'lucide-react';

// --- CƠ SỞ DỮ LIỆU ĐỀ THI ---
const allExams = [
  {
    id: 'hcmue_phys_2025_01',
    title: 'Đề minh họa ĐGNL 2025 - ĐH Sư Phạm TP.HCM',
    subject: 'VẬT LÍ',
    duration: 90 * 60,
    questions: {
      part1A: [
        {
          id: 'q1',
          text: 'Trong dao động tắt dần của một con lắc lò xo, đại lượng nào sau đây luôn giảm liên tục theo thời gian?',
          options: ['Li độ.', 'Gia tốc.', 'Động năng.', 'Cơ năng.'],
          correct: 3
        },
        {
          id: 'q2',
          text: 'Tia nào sau đây có bản chất là dòng các hạt mang điện?',
          options: ['Tia X.', 'Tia gamma (γ).', 'Tia alpha (α).', 'Tia tử ngoại.'],
          correct: 2
        },
        {
          id: 'q3',
          text: 'Theo thang sóng điện từ, bức xạ nào sau đây có bước sóng dài nhất?',
          options: ['Tia X', 'Ánh sáng vàng', 'Vi sóng', 'Tia hồng ngoại'],
          correct: 2
        }
      ],
      part1B: [
        {
          id: 'q4',
          text: 'Trong các dao động sau đây, những dao động nào là dao động cưỡng bức? (Chọn nhiều đáp án)',
          options: [
            'Sự dao động của màng trống sau khi ngừng gõ.',
            'Sự dao động của bộ phận giảm xóc sau khi qua gờ giảm tốc.',
            'Sự dao động của chiếc nôi điện khi đang hoạt động.',
            'Sự dao động của con lắc đồng hồ khi máy đồng hồ đang chạy.'
          ],
          correct: [2, 3]
        }
      ],
      part2: {
        passage: `Quá trình biến đổi tín hiệu tương tự (Analog) sang tín hiệu số (Digital) thông qua bộ biến đổi ADC bắt buộc phải đi qua 3 bước cốt lõi: Lấy mẫu (Sampling), Lượng tử hoá và Mã hoá nhị phân. Cần đo tín hiệu tương tự trong các khoảng thời gian đều đặn gọi là lấy mẫu. Định lý Nyquist chỉ ra rằng: Tần số lấy mẫu tối thiểu phải gấp đôi tần số tín hiệu tối đa cần thu để có thể khôi phục lại tín hiệu ban đầu một cách chính xác.`,
        questions: [
          {
            id: 'q5',
            text: 'Bước nào sau đây KHÔNG thuộc quá trình biến đổi tín hiệu qua bộ ADC được nhắc đến trong đoạn văn?',
            options: ['Lấy mẫu', 'Mã hóa nhị phân', 'Khuếch đại tín hiệu', 'Lượng tử hóa'],
            correct: 2
          },
          {
            id: 'q6',
            text: 'Theo định lý Nyquist, nếu tần số tín hiệu âm thanh tối đa cần thu là 20 kHz, thì tần số lấy mẫu tối thiểu phải là bao nhiêu?',
            options: ['10 kHz', '20 kHz', '40 kHz', '80 kHz'],
            correct: 2
          }
        ]
      },
      part3: [
        {
          id: 'q7',
          text: 'Một vật chuyển động từ trạng thái nghỉ. Trong 2 giây đầu, vật có gia tốc không đổi là 5 m/s². Trong 2 giây tiếp theo, vật có gia tốc không đổi là 2 m/s². Tính vận tốc của vật ở thời điểm t = 4 giây (Đơn vị: m/s).',
          correct: '14'
        },
        {
          id: 'q8',
          text: 'Một nhiệt điện trở PTC có điện trở R0 = 100 Ω ở 25°C. Hệ số nhiệt điện trở α = 0,05 K⁻¹. Tính điện trở của nó ở 45°C (Đơn vị: Ω).',
          correct: '200'
        }
      ]
    }
  }
  // Bạn có thể thêm các đề thi mới vào đây theo cấu trúc tương tự
];

export default function App() {
  const [appState, setAppState] = useState('menu'); // menu, intro, playing, result
  const [selectedExam, setSelectedExam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Quản lý đếm ngược
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
    let correctCount = 0;
    const data = selectedExam.questions;

    data.part1A.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    data.part1B.forEach(q => {
      if (JSON.stringify(answers[q.id] || []) === JSON.stringify(q.correct)) correctCount++;
    });
    data.part2.questions.forEach(q => { if (answers[q.id] === q.correct) correctCount++; });
    data.part3.forEach(q => {
      if (answers[q.id]?.toString().trim() === q.correct) correctCount++;
    });

    const total = data.part1A.length + data.part1B.length + data.part2.questions.length + data.part3.length;
    // Gửi dữ liệu về Google Sheets
    fetch('https://script.google.com/macros/s/AKfycbyqsL94snNjcUAe4MbtCHcZp0rM2KKy2WoY6UrpqsUMXYQ3q4H5jMX78CRWt6jAGkYFxA/exec', {
    method: 'POST',
    body: JSON.stringify({
      name: "Thí sinh ẩn danh", // Bạn có thể thêm ô nhập tên ở màn hình Intro
      class: "12A1",
      examTitle: selectedExam.title,
      score: `${currentScore}/${totalQuestions}`
    }),
  });
    setScore({ correct: correctCount, total });
    setAppState('result');
  };

  // --- MÀN HÌNH 1: DANH SÁCH ĐỀ THI ---
  if (appState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Hệ thống Thi thử Vật lí</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allExams.map(exam => (
              <button 
                key={exam.id}
                onClick={() => handleSelectExam(exam)}
                className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all text-left group"
              >
                <div className="text-blue-600 font-bold text-sm mb-2 uppercase">{exam.subject}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 group-hover:text-blue-700">{exam.title}</h3>
                <div className="flex items-center text-slate-500 text-sm">
                  <Clock size={16} className="mr-1" /> {exam.duration / 60} phút
                  <ChevronRight size={16} className="ml-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH 2: HƯỚNG DẪN ---
  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2 uppercase">{selectedExam.title}</h1>
            <p className="opacity-90">Thời gian làm bài: {selectedExam.duration / 60} phút</p>
          </div>
          <div className="p-8">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center"><AlertCircle className="mr-2 text-blue-600" /> Lưu ý trước khi thi:</h2>
            <ul className="space-y-3 text-slate-600 mb-8 text-sm">
              <li className="flex gap-2"> <CheckCircle className="text-green-500 shrink-0" size={18} /> Hệ thống tự động nộp bài khi hết giờ.</li>
              <li className="flex gap-2"> <CheckCircle className="text-green-500 shrink-0" size={18} /> Phần điền đáp số: Chỉ nhập số, không nhập đơn vị.</li>
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setAppState('menu')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all">Quay lại</button>
              <button onClick={handleStart} className="flex-2 bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Play fill="currentColor" size={20} /> BẮT ĐẦU NGAY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH 3: LÀM BÀI & KẾT QUẢ ---
  const exam = selectedExam.questions;
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => appState === 'result' && setAppState('menu')} className="text-slate-500 hover:text-blue-600 transition-colors">
            <Home size={24} />
          </button>
          <div className={`font-mono text-xl font-black px-4 py-1.5 rounded-full ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
            {formatTime(timeLeft)}
          </div>
          {appState === 'playing' ? (
            <button onClick={() => window.confirm('Nộp bài ngay?') && handleSubmit()} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2">
              <Send size={18} /> NỘP BÀI
            </button>
          ) : (
            <div className="font-bold text-blue-600">KẾT QUẢ: {score.correct}/{score.total}</div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-10 pb-20">
        {/* PHẦN 1A */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 1: Trắc nghiệm 1 đáp án</h2>
          <div className="space-y-10">
            {exam.part1A.map((q, idx) => (
              <div key={q.id}>
                <p className="text-slate-800 font-medium mb-4"><span className="text-blue-600 font-bold">Câu {idx + 1}:</span> {q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    const isResult = appState === 'result';
                    const isCorrect = q.correct === oIdx;
                    return (
                      <button 
                        key={oIdx}
                        disabled={isResult}
                        onClick={() => handleAnswerChange(q.id, oIdx)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isResult 
                            ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60'))
                            : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
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
          <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 1B: Trắc nghiệm nhiều đáp án</h2>
          {exam.part1B.map((q, idx) => (
            <div key={q.id}>
              <p className="text-slate-800 font-medium mb-4"><span className="text-blue-600 font-bold">Câu {exam.part1A.length + idx + 1}:</span> {q.text}</p>
              <div className="space-y-3 pl-4">
                {q.options.map((opt, oIdx) => {
                  const isSelected = (answers[q.id] || []).includes(oIdx);
                  const isResult = appState === 'result';
                  const isCorrect = q.correct.includes(oIdx);
                  return (
                    <button 
                      key={oIdx}
                      disabled={isResult}
                      onClick={() => handleAnswerChange(q.id, oIdx, 'multiple')}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isResult 
                          ? (isCorrect ? 'bg-green-50 border-green-500 text-green-700' : (isSelected ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-100 opacity-60'))
                          : (isSelected ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 hover:border-slate-300')
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle size={14} />}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* PHẦN 2 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 2: Đọc hiểu ngữ liệu</h2>
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-slate-700 leading-relaxed mb-8 italic">
            {exam.part2.passage}
          </div>
          <div className="space-y-10">
            {exam.part2.questions.map((q, idx) => (
              <div key={q.id}>
                <p className="text-slate-800 font-medium mb-4"><span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + idx + 1}:</span> {q.text}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === oIdx;
                    const isResult = appState === 'result';
                    const isCorrect = q.correct === oIdx;
                    return (
                      <button key={oIdx} disabled={isResult} onClick={() => handleAnswerChange(q.id, oIdx)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isResult ? (isCorrect ? 'bg-green-50 border-green-500' : (isSelected ? 'bg-red-50 border-red-500' : 'opacity-60'))
                          : (isSelected ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-100')
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PHẦN 3 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-blue-800 mb-6 border-l-4 border-blue-600 pl-4 uppercase">Phần 3: Điền đáp số</h2>
          <div className="space-y-8">
            {exam.part3.map((q, idx) => {
              const isResult = appState === 'result';
              const userVal = answers[q.id] || '';
              const isCorrect = userVal.trim() === q.correct;
              return (
                <div key={q.id} className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 text-slate-800">
                    <span className="text-blue-600 font-bold">Câu {exam.part1A.length + exam.part1B.length + exam.part2.questions.length + idx + 1}:</span> {q.text}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Đáp số..."
                      disabled={isResult}
                      value={userVal}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className={`w-full md:w-40 p-4 rounded-2xl border-2 font-mono text-lg focus:outline-none focus:border-blue-600 ${
                        isResult ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-slate-100'
                      }`}
                    />
                    {isResult && !isCorrect && <div className="text-xs text-green-600 mt-1 font-bold">Đáp án: {q.correct}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MÀN HÌNH KẾT QUẢ (OVERLAY) */}
      {appState === 'result' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl scale-in-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 font-serif">HOÀN THÀNH!</h2>
            <div className="bg-slate-50 rounded-3xl p-8 mb-8">
              <div className="text-6xl font-black text-blue-600 mb-2">{score.correct}<span className="text-2xl text-slate-400">/{score.total}</span></div>
              <div className="text-slate-500 font-medium uppercase tracking-widest text-sm">Điểm số của bạn</div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setAppState('playing')} className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">XEM LẠI BÀI</button>
              <button onClick={() => setAppState('menu')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">VỀ DANH SÁCH ĐỀ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
