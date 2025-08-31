"use client";

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

// 擴充型別以符合我們新 API 的回傳格式
type Designer = { id: string; name: string };
type Appointment = { id: string; customerName: string; startTime: string };
type ScheduleWithDetails = {
  id: string;
  startTime: string;
  endTime: string;
  designer: {
    id: string;
    name: string;
    appointments: Appointment[];
  };
};

export default function SharedScheduleViewer() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [filterDesignerId, setFilterDesignerId] = useState<string>(''); // "" 代表全部
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取所有設計師列表，用於篩選器
  useEffect(() => {
    const fetchDesigners = async () => {
      const response = await fetch('/api/admin/designers');
      if (response.ok) {
        const data = await response.json();
        setDesigners(data);
      }
    };
    fetchDesigners();
  }, []);

  // 根據日期獲取排班和預約
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSchedules = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        // 我們之前建立的 API 已經傳回了所有需要的資料
        const response = await fetch(`/api/admin/schedules-view?date=${dateString}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('無法獲取排班資料');
        setSchedules(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, [selectedDate]);

  // 根據篩選器過濾要顯示的班表
  const filteredSchedules = filterDesignerId
    ? schedules.filter(s => s.designer.id === filterDesignerId)
    : schedules;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">聯合排班看板</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">篩選條件</h3>
          <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} />
          <label className="block mt-4">
            <span className="text-gray-700">設計師:</span>
            <select
              value={filterDesignerId}
              onChange={(e) => setFilterDesignerId(e.target.value)}
              className="block w-full mt-1 p-2 border rounded"
            >
              <option value="">全部設計師</option>
              {designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">
            {selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '請選擇日期'} 的班表與預約
          </h3>
          {isLoading ? <p>載入中...</p> : error ? <p className="text-red-500">{error}</p> : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map(schedule => (
                  <div key={schedule.id} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-bold text-lg text-indigo-600">
                      {schedule.designer.name}
                    </p>
                    {/* === 關鍵修正：顯示完整的排班時段 === */}
                    <p className="text-sm text-gray-500 mb-2">
                      排班時段: {format(new Date(schedule.startTime), 'HH:mm')} - {format(new Date(schedule.endTime), 'HH:mm')}
                    </p>

                    {/* 預約列表部分維持不變 */}
                    {schedule.designer.appointments.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600">已預約:</h4>
                        <ul className="list-disc pl-5">
                          {schedule.designer.appointments.map(apt => (
                             <li key={apt.id} className="text-sm">
                               <span className="font-semibold">{format(new Date(apt.startTime), 'HH:mm')}</span> - {apt.customerName}
                             </li>
                          ))}
                        </ul>
                      </div>
                    ) : <p className="text-sm text-gray-400">尚無預約</p>}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 mt-4">當天無人排班。</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}