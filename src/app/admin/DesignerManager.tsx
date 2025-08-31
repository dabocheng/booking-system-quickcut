"use client";

import { useState, useEffect, FormEvent } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Designer = {
  id: string;
  name: string;
  userId: string | null;
};

const generateTimeOptions = () => {
  const options = [];
  for (let i = 9; i <= 17; i++) {
    options.push(`${String(i).padStart(2, '0')}:00`);
    if (i < 17) {
      options.push(`${String(i).padStart(2, '0')}:30`);
    }
  }
  return options;
};
const timeOptions = generateTimeOptions();

export default function DesignerManager() {
  const router = useRouter();
  
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleDesignerId, setScheduleDesignerId] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userMessage, setUserMessage] = useState<string | null>(null);

  const fetchDesigners = async () => {
    try {
      const response = await fetch('/api/admin/designers', { cache: 'no-store' });
      if (!response.ok) throw new Error('無法獲取設計師列表');
      const data: Designer[] = await response.json();
      setDesigners(data);
      if (data.length > 0 && !scheduleDesignerId) {
        setScheduleDesignerId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 修正後的寫法 (將 fetchDesigners 函式移入 useEffect 內部)
useEffect(() => {
    const fetchDesigners = async () => {
        try {
            const response = await fetch('/api/admin/designers', { cache: 'no-store' });
            if (!response.ok) throw new Error('無法獲取設計師列表');
            const data: Designer[] = await response.json();
            setDesigners(data);
            if (data.length > 0 && !scheduleDesignerId) {
                setScheduleDesignerId(data[0].id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    fetchDesigners();
}, [scheduleDesignerId]); // scheduleDesignerId 是一個依賴，雖然這裡可能不是必須的，但加上更嚴謹

  const handleAddDesigner = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await fetch('/api/admin/designers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error('新增設計師失敗');
      setNewName('');
      await fetchDesigners();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleScheduleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!scheduleDesignerId || !scheduleDate || !startTime || !endTime) {
      setScheduleStatus({ message: '所有欄位都必須填寫', isError: true });
      return;
    }
    if (startTime >= endTime) {
      setScheduleStatus({ message: '結束時間必須晚於開始時間', isError: true });
      return;
    }
    setIsSubmittingSchedule(true);
    setScheduleStatus(null);
    try {
      const dateStr = format(scheduleDate, 'yyyy-MM-dd');
      const startTimeISO = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const endTimeISO = new Date(`${dateStr}T${endTime}:00`).toISOString();
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designerId: scheduleDesignerId,
          startTime: startTimeISO,
          endTime: endTimeISO,
        }),
      });
      if (!response.ok) throw new Error('新增班表失敗');
      
      setScheduleStatus({ message: '班表新增成功！正在刷新...', isError: false });
      
      // 呼叫 Next.js 的 router.refresh() 來重新抓取伺服器資料
      router.refresh(); 

      // === 關鍵修正：在 2 秒後自動清除成功訊息，提升使用者體驗 ===
      setTimeout(() => {
        setScheduleStatus(null);
      }, 2000);

    } catch (err: any) {
      setScheduleStatus({ message: `錯誤: ${err.message}`, isError: true });
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDesigner) return;
    setUserMessage('處理中...');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designerId: selectedDesigner.id,
          email: userEmail,
          password: userPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '建立帳號失敗');
      setUserMessage(`帳號 ${userEmail} 建立成功！`);
      setTimeout(async () => {
        setSelectedDesigner(null);
        await fetchDesigners();
      }, 2000);
    } catch (err: any) {
      setUserMessage(`錯誤: ${err.message}`);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto space-y-8">
      {/* 設計師管理區塊 */}
      <div id="designer-management">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">設計師管理</h2>
        <form onSubmit={handleAddDesigner} className="mb-8 flex gap-2">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="輸入新設計師姓名" className="flex-grow p-2 border rounded text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400" disabled={!newName.trim()}>新增</button>
        </form>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">現有設計師</h3>
          {isLoading ? <p>載入中...</p> : error ? <p className="text-red-500">{error}</p> : (
            <ul className="space-y-2">
              {designers.length > 0 ? designers.map((d) => (
                <li key={d.id} className="text-gray-800 bg-gray-100 p-3 rounded flex justify-between items-center">
                  <span>{d.name}</span>
                  {d.userId ? (
                    <span className="text-sm text-green-600 font-semibold">✓ 已有帳號</span>
                  ) : (
                    <button onClick={() => { setSelectedDesigner(d); setUserEmail(''); setUserPassword(''); setUserMessage(null); }} className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                      建立登入帳號
                    </button>
                  )}
                </li>
              )) : <p className="text-gray-500">目前沒有任何設計師。</p>}
            </ul>
          )}
        </div>
        {selectedDesigner && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">為 {selectedDesigner.name} 建立帳號</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="email" placeholder="登入 Email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full p-2 border rounded" required />
                <input type="password" placeholder="登入密碼" value={userPassword} onChange={e => setUserPassword(e.target.value)} className="w-full p-2 border rounded" required />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">確認建立</button>
                  <button type="button" onClick={() => setSelectedDesigner(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">取消</button>
                </div>
                {userMessage && <p className="mt-2 text-sm">{userMessage}</p>}
            </form>
          </div>
        )}
      </div>

      <hr />

      {/* 班表管理區塊 */}
      <div id="schedule-management">
         <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">新增班表</h2>
        <form onSubmit={handleScheduleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">1. 選擇設計師</label>
            <select value={scheduleDesignerId} onChange={(e) => setScheduleDesignerId(e.target.value)} className="w-full p-2 border rounded" disabled={designers.length === 0}>
              {designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">2. 選擇日期</label>
            <div className="flex justify-center">
              <DayPicker mode="single" selected={scheduleDate} onSelect={setScheduleDate} fromDate={new Date()} />
            </div>
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">3. 選擇時段</label>
            <div className="flex gap-4">
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border rounded">
                <option value="">開始時間</option>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 border rounded">
                <option value="">結束時間</option>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {scheduleStatus && (<p className={`text-center font-bold ${scheduleStatus.isError ? 'text-red-500' : 'text-green-500'}`}>{scheduleStatus.message}</p>)}
          <button type="submit" className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:bg-gray-400" disabled={isSubmittingSchedule}>
            {isSubmittingSchedule ? '處理中...' : '確認新增班表'}
          </button>
        </form>
      </div>
    </div>
  );
}