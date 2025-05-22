'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import axios from 'axios';

type ChargingRecord = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  createdAt: string;
};

export default function ChargingRecordPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ChargingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchRecords = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/user/charging-records`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          console.log(response.data);
          setRecords(response.data.data || []);
        } catch (error) {
          console.error('Error fetching charging records:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">消费记录</h1>
      {records.length === 0 ? (
        <div className="text-center text-gray-500">暂无消费记录</div>
      ) : (
        <ul className="space-y-4">
          {records.map(record => (
            <li key={record.id} className="p-4 bg-white shadow-md rounded-lg">
              <div className="flex justify-between text-lg">
                <span>金额: ¥{record.amount}</span>
                <span>类型: {record.type}</span>
              </div>
              <div className="text-gray-500">{new Date(record.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}