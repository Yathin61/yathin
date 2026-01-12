
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { AttendanceRecord, Enrollment } from '../types';

interface StatsDashboardProps {
  attendance: AttendanceRecord[];
  enrollments: Enrollment[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ attendance, enrollments }) => {
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    }).reverse();

    const counts: { [key: string]: number } = {};
    last7Days.forEach(day => counts[day] = 0);

    attendance.forEach(record => {
      const day = new Date(record.timestamp).toLocaleDateString(undefined, { weekday: 'short' });
      if (counts[day] !== undefined) counts[day]++;
    });

    return last7Days.map(day => ({ name: day, count: counts[day] }));
  }, [attendance]);

  const pieData = useMemo(() => {
    const today = new Date().toDateString();
    const presentCount = new Set(attendance.filter(a => new Date(a.timestamp).toDateString() === today).map(a => a.studentName)).size;
    const absentCount = Math.max(0, enrollments.length - presentCount);

    return [
      { name: 'Present', value: presentCount, color: '#4f46e5' },
      { name: 'Absent', value: absentCount, color: '#e5e7eb' }
    ];
  }, [attendance, enrollments]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6 text-indigo-600" />} label="Total Enrolled" value={enrollments.length} />
        <StatCard icon={<UserCheck className="w-6 h-6 text-green-600" />} label="Total Records" value={attendance.length} />
        <StatCard icon={<Calendar className="w-6 h-6 text-blue-600" />} label="Today's Attendance" value={pieData[0].value} />
        <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-600" />} label="Attendance Rate" value={enrollments.length > 0 ? `${Math.round((pieData[0].value / enrollments.length) * 100)}%` : '0%'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Today's Presence</h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm font-medium text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-center space-x-4">
    <div className="bg-gray-50 p-3 rounded-xl">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default StatsDashboard;
