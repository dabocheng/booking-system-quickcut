"use client";

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation'; // 引入 useRouter

type Designer = {
  id: string;
  name: string;
};

const TAIWAN_PHONE_REGEX = /^09\d{8}$/;

export default function BookingForm() {
  const router = useRouter(); // 初始化 router
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');

  useEffect(() => {
    // ... fetchDesigners 邏輯不變 ...
    const fetchDesigners = async () => {
      try {
        const response = await fetch('/api/admin/designers');
        if (!response.ok) throw new Error('無法獲取設計師');
        setDesigners(await response.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchDesigners();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchAvailableTimes = async () => {
      setIsLoading(true);
      // === 關鍵修正：只清除錯誤訊息，保留成功訊息 ===
      setError(null);
      setAvailableTimes([]);
      setSelectedTime(null);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        let apiUrl = `/api/availability?date=${dateString}`;
        if (selectedDesignerId) {
          apiUrl += `&designerId=${selectedDesignerId}`;
        }
        const response = await fetch(apiUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('無法查詢可預約時段');
        setAvailableTimes(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailableTimes();
  }, [selectedDate, selectedDesignerId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (此函式不變) ...
    const newPhone = e.target.value;
    setCustomerPhone(newPhone);
    if (newPhone && !TAIWAN_PHONE_REGEX.test(newPhone)) {
      setPhoneError('請輸入有效的台灣手機號碼 (例如 0912345678)');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!TAIWAN_PHONE_REGEX.test(customerPhone)) {
      setPhoneError('請輸入有效的台灣手機號碼 (例如 0912345678)');
      return;
    }
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // 在提交前先清除舊訊息

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const startTimeISO = new Date(`${dateString}T${selectedTime}:00`).toISOString();

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          startTime: startTimeISO,
          ...(selectedDesignerId && { designerId: selectedDesignerId }),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '預約失敗');
      }
      
      // === 關鍵修正：成功後的操作流程 ===
      setSuccessMessage('預約成功！感謝您的預約！');
      // 清空表單
      setSelectedTime(null);
      setCustomerName('');
      setCustomerPhone('');
      // 觸發刷新來更新時段
      router.refresh(); 
      // 3秒後自動清除成功訊息
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || !selectedDate || !selectedTime || !customerName || !customerPhone || !!phoneError;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full">
      {/* JSX 結構維持不變 */}
      <div className="mb-6"><h2 className="text-xl font-semibold mb-4 text-gray-700">1. 選擇設計師 (可選)</h2><select value={selectedDesignerId} onChange={(e) => setSelectedDesignerId(e.target.value)} className="w-full p-2 border rounded"><option value="">不指定設計師 (隨機安排)</option>{designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
      <div className="mb-6"><h2 className="text-xl font-semibold mb-4 text-gray-700">2. 選擇日期</h2><div className="flex justify-center"><DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} fromDate={new Date()} className="text-gray-800" /></div></div>
      <div className="mb-6"><h2 className="text-xl font-semibold mb-2 text-gray-700">3. 選擇時間</h2>{isLoading && <p className="text-gray-500">正在查詢可預約時段...</p>}<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{availableTimes.length > 0 ? availableTimes.map((time) => (<button key={time} onClick={() => setSelectedTime(time)} className={`p-2 rounded border transition-all duration-200 ${selectedTime === time ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-300 hover:bg-blue-50'}`}>{time}</button>)) : !isLoading && <p className="text-gray-500 col-span-full">此條件下無可預約時段</p>}</div></div>
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">4. 填寫資料</h2>
        <div className="mb-4"><input type="text" placeholder="姓名" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-2 border rounded text-gray-800" required /></div>
        <div className="mb-6">
          <input type="tel" placeholder="電話" value={customerPhone} onChange={handlePhoneChange} className={`w-full p-2 border rounded text-gray-800 ${phoneError ? 'border-red-500' : ''}`} required />
          {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}
        <button type="submit" className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400" disabled={isSubmitDisabled}>
          {isLoading ? '處理中...' : '確認預約'}
        </button>
      </form>
    </div>
  );
}