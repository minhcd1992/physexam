// --- CƠ SỞ DỮ LIỆU ĐỀ THI ---
export const allExams = [
  {
    id: 'hcmue_phys_2025_01',
    title: 'Đề số 1',
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
];
