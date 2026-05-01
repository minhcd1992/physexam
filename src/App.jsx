import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, AlertCircle, Play, RotateCcw, Send, List, ChevronRight, XCircle } from 'lucide-react';

// --- MOCK DATA: ĐỀ THI MÔ PHỎNG ---
// Đề thi được rút gọn để demo, bám sát cấu trúc ĐGNL ĐH Sư Phạm TP.HCM môn Vật lí
const EXAM_TIME = 90 * 60; // 90 phút

const examData = {
  part1A: [ // Trắc nghiệm 1 lựa chọn
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
  part1B: [ // Trắc nghiệm nhiều lựa chọn
    {
      id: 'q4',
      text: 'Trong các dao động sau đây, những dao động nào là dao động cưỡng bức? (Chọn nhiều đáp án)',
      options: [
        'Sự dao động của màng trống sau khi ngừng gõ.',
        'Sự dao động của bộ phận giảm xóc sau khi qua gờ giảm tốc.',
        'Sự dao động của chiếc nôi điện khi đang hoạt động.',
        'Sự dao động của con lắc đồng hồ khi máy đồng hồ đang chạy.'
      ],
      correct: [2, 3] // Index của đáp án đúng
    }
  ],
  part2: { // Khai thác ngữ liệu
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
  part3: [ // Điền đáp số
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
};

export default function App() {
  const [appState, setAppState] = useState('intro'); // intro, playing, result
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);

  // Hẹn giờ
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
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setAppState('playing');
    setTimeLeft(EXAM_TIME);
    setAnswers({});
  };

  const handleAnswerChange = (questionId, value, type = 'single') => {
    if (type === 'multiple') {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        if (currentAnswers.includes(value)) {
          return { ...prev, [questionId]: currentAnswers.filter(v => v !== value) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, value].sort() };
        }
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmit = () => {
    if (appState !== 'playing') return;
    
    // Logic chấm điểm cơ bản
    let currentScore = 0;
    let totalQuestions = 0;

    // Part 1A
    examData.part1A.forEach(q => {
      totalQuestions++;
      if (answers[q.id] === q.correct) currentScore++;
    });

    // Part 1B (Phải đúng hoàn toàn mới được điểm - hoặc tùy thang điểm thực tế)
    examData.part1B.forEach(q => {
      totalQuestions++;
      const userAns = answers[q.id] || [];
      if (JSON.stringify(userAns) === JSON.stringify(q.correct)) currentScore++;
    });

    // Part 2
    examData.part2.questions.forEach(q => {
      totalQuestions++;
      if (answers[q.id] === q.correct) currentScore++;
    });

    // Part 3
    examData.part3.forEach(q => {
      totalQuestions++;
      if (answers[q.id]?.toString().trim() === q.correct) currentScore++;
    });

    setScore({ correct: currentScore, total: totalQuestions });
    setAppState('result');
  };

  // --- COMPONENT: Màn hình giới thiệu ---
  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">ĐỀ THI ĐÁNH GIÁ NĂNG LỰC CHUYÊN BIỆT</h1>
            <p className="text-blue-100 text-lg">Môn thi: VẬT LÍ</p>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
              <FileText className="mr-2" /> Cấu trúc bài thi
            </h2>
            <ul className="space-y-3 text-slate-600 mb-8">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span><strong>Thời gian làm bài:</strong> 90 phút (40 câu hỏi)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span><strong>Phần 1 (25 câu):</strong> Trắc nghiệm nhiều lựa chọn (20 câu 1 đáp án đúng, 5 câu nhiều đáp án đúng).</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span><strong>Phần 2 (5 câu):</strong> Đọc hiểu, khai thác ngữ liệu để trả lời câu hỏi trắc nghiệm.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span><strong>Phần 3 (10 câu):</strong> Điền đáp số ngắn (tính toán và điền kết quả).</span>
              </li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-8 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <p>Đây là phiên bản demo. Đề thi mô phỏng một số câu hỏi tiêu biểu đại diện cho từng phần của cấu trúc đề thi chính thức năm 2025.</p>
            </div>
            <button 
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-colors text-lg"
            >
              <Play className="mr-2" fill="currentColor" /> Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPONENT: Màn hình làm bài ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg text-slate-800 hidden md:block">ĐGNL Chuyên Biệt - Vật Lí</div>
          
          <div className={`flex items-center font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="w-5 h-5 mr-2" />
            {formatTime(timeLeft)}
          </div>

          <button 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) handleSubmit();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Send className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 md:p-6 space-y-8">
        
        {/* Phần 1A */}
        <section className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-blue-800 mb-2 border-b pb-2">PHẦN 1: Trắc nghiệm khách quan</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">Lựa chọn 01 phương án đúng duy nhất.</p>
          
          <div className="space-y-8">
            {examData.part1A.map((q, idx) => (
              <div key={q.id} className="relative">
                <div className="flex gap-3 mb-3">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Câu {idx + 1}:</span>
                  <p className="text-slate-800 text-base">{q.text}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                  {q.options.map((opt, oIdx) => {
                    const isChecked = answers[q.id] === oIdx;
                    const isResultMode = appState === 'result';
                    let labelClass = "border p-3 rounded-lg flex items-start cursor-pointer transition-all ";
                    
                    if (isResultMode) {
                       if (q.correct === oIdx) labelClass += "bg-green-100 border-green-500 font-medium ";
                       else if (isChecked && q.correct !== oIdx) labelClass += "bg-red-50 border-red-300 text-red-700 ";
                       else labelClass += "bg-slate-50 text-slate-500 opacity-70 ";
                    } else {
                       labelClass += isChecked ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "hover:bg-slate-50 border-slate-200";
                    }

                    return (
                      <label key={oIdx} className={labelClass}>
                        <input 
                          type="radio" 
                          name={q.id} 
                          className="mt-1 mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => !isResultMode && handleAnswerChange(q.id, oIdx)}
                          disabled={isResultMode}
                        />
                        <span className="text-slate-700">{String.fromCharCode(65 + oIdx)}. {opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phần 1B */}
        <section className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <p className="text-sm text-slate-500 mb-6 font-medium border-b pb-2">Lựa chọn NHIỀU phương án đúng.</p>
          <div className="space-y-8">
            {examData.part1B.map((q, idx) => (
              <div key={q.id} className="relative">
                <div className="flex gap-3 mb-3">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Câu {examData.part1A.length + idx + 1}:</span>
                  <p className="text-slate-800 text-base">{q.text}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 pl-12">
                  {q.options.map((opt, oIdx) => {
                    const currentAnswers = answers[q.id] || [];
                    const isChecked = currentAnswers.includes(oIdx);
                    const isResultMode = appState === 'result';
                    const isCorrectOpt = q.correct.includes(oIdx);
                    
                    let labelClass = "border p-3 rounded-lg flex items-start cursor-pointer transition-all ";
                    
                    if (isResultMode) {
                       if (isCorrectOpt) labelClass += "bg-green-100 border-green-500 font-medium ";
                       else if (isChecked && !isCorrectOpt) labelClass += "bg-red-50 border-red-300 text-red-700 ";
                       else labelClass += "bg-slate-50 text-slate-500 opacity-70 ";
                    } else {
                       labelClass += isChecked ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "hover:bg-slate-50 border-slate-200";
                    }

                    return (
                      <label key={oIdx} className={labelClass}>
                        <input 
                          type="checkbox" 
                          className="mt-1 mr-3 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => !isResultMode && handleAnswerChange(q.id, oIdx, 'multiple')}
                          disabled={isResultMode}
                        />
                        <span className="text-slate-700">{String.fromCharCode(65 + oIdx)}. {opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phần 2 */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
             <h2 className="text-xl font-bold text-blue-800 mb-2 border-b pb-2">PHẦN 2: Khai thác dữ liệu/Ngữ liệu</h2>
             <p className="text-sm text-slate-500 mb-6 font-medium">Đọc đoạn văn sau và trả lời các câu hỏi.</p>
             
             <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 text-slate-800 leading-relaxed mb-8 shadow-inner">
               {examData.part2.passage}
             </div>

             <div className="space-y-8">
              {examData.part2.questions.map((q, idx) => {
                const globalQNum = examData.part1A.length + examData.part1B.length + idx + 1;
                return (
                  <div key={q.id} className="relative">
                    <div className="flex gap-3 mb-3">
                      <span className="font-bold text-slate-700 whitespace-nowrap">Câu {globalQNum}:</span>
                      <p className="text-slate-800 text-base">{q.text}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {q.options.map((opt, oIdx) => {
                        const isChecked = answers[q.id] === oIdx;
                        const isResultMode = appState === 'result';
                        let labelClass = "border p-3 rounded-lg flex items-start cursor-pointer transition-all ";
                        
                        if (isResultMode) {
                           if (q.correct === oIdx) labelClass += "bg-green-100 border-green-500 font-medium ";
                           else if (isChecked && q.correct !== oIdx) labelClass += "bg-red-50 border-red-300 text-red-700 ";
                           else labelClass += "bg-slate-50 text-slate-500 opacity-70 ";
                        } else {
                           labelClass += isChecked ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "hover:bg-slate-50 border-slate-200";
                        }

                        return (
                          <label key={oIdx} className={labelClass}>
                            <input 
                              type="radio" 
                              name={q.id} 
                              className="mt-1 mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                              checked={isChecked}
                              onChange={() => !isResultMode && handleAnswerChange(q.id, oIdx)}
                              disabled={isResultMode}
                            />
                            <span className="text-slate-700">{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Phần 3 */}
        <section className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-24">
          <h2 className="text-xl font-bold text-blue-800 mb-2 border-b pb-2">PHẦN 3: Câu hỏi điền đáp số</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">Tính toán và điền giá trị dạng số vào ô trống.</p>

          <div className="space-y-8">
            {examData.part3.map((q, idx) => {
               const globalQNum = examData.part1A.length + examData.part1B.length + examData.part2.questions.length + idx + 1;
               const isResultMode = appState === 'result';
               const userAnswer = answers[q.id] || '';
               const isCorrect = userAnswer.trim() === q.correct;

               return (
                <div key={q.id} className="relative">
                  <div className="flex gap-3 mb-4">
                    <span className="font-bold text-slate-700 whitespace-nowrap">Câu {globalQNum}:</span>
                    <p className="text-slate-800 text-base">{q.text}</p>
                  </div>
                  <div className="pl-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Nhập đáp số..."
                        value={userAnswer}
                        onChange={(e) => !isResultMode && handleAnswerChange(q.id, e.target.value, 'fill')}
                        disabled={isResultMode}
                        className={`border-2 rounded-lg px-4 py-3 w-48 font-mono text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${isResultMode ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700') : 'border-slate-300'}`}
                      />
                      {isResultMode && isCorrect && <CheckCircle className="absolute right-3 top-3.5 text-green-600 w-6 h-6" />}
                      {isResultMode && !isCorrect && <XCircle className="absolute right-3 top-3.5 text-red-500 w-6 h-6" />}
                    </div>
                    {isResultMode && !isCorrect && (
                      <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg border border-green-300 font-medium flex items-center">
                        Đáp án đúng: <span className="font-mono ml-2 text-lg">{q.correct}</span>
                      </div>
                    )}
                  </div>
                </div>
               )
            })}
          </div>
        </section>
      </main>

      {/* Overlay Kết Quả */}
      {appState === 'result' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Đã Nộp Bài!</h2>
            <p className="text-slate-500 mb-6">Bạn đã hoàn thành bài thi thử ĐGNL.</p>
            
            <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
              <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Kết quả của bạn</div>
              <div className="text-5xl font-black text-blue-600 mb-2">
                {score.correct} <span className="text-2xl text-slate-400">/ {score.total}</span>
              </div>
              <p className="text-slate-600">câu trả lời đúng</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setAppState('playing')} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Xem lại bài
              </button>
              <button 
                onClick={handleStart} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" /> Làm lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}