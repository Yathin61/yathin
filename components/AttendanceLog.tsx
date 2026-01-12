
import React from 'react';
import { History, Clock, CheckCircle } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceLogProps {
  attendance: AttendanceRecord[];
}

const AttendanceLog: React.FC<AttendanceLogProps> = ({ attendance }) => {
  const recentAttendance = attendance.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        </div>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">
          Logs: {attendance.length}
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {recentAttendance.length > 0 ? (
          recentAttendance.map((record) => (
            <div 
              key={record.id} 
              className="flex items-start space-x-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-white transition"
            >
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{record.studentName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Clock className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Scanning for faces...</p>
            <p className="text-xs mt-1">Attendance will appear here automatically.</p>
          </div>
        )}
      </div>

      {attendance.length > 10 && (
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">Viewing last 10 of {attendance.length} total records</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceLog;
