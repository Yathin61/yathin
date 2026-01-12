
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, UserPlus, ClipboardList, LayoutDashboard, Download, Settings, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import CameraView from './components/CameraView';
import AttendanceLog from './components/AttendanceLog';
import EnrollmentForm from './components/EnrollmentForm';
import StatsDashboard from './components/StatsDashboard';
import { Enrollment, AttendanceRecord } from './types';
import { exportToExcel } from './services/excelService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'enrollment' | 'dashboard' | 'records'>('attendance');
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => {
    const saved = localStorage.getItem('faceguard_enrollments');
    return saved ? JSON.parse(saved) : [];
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('faceguard_attendance');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('faceguard_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    localStorage.setItem('faceguard_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const handleEnroll = (name: string, photo: string) => {
    const newEnrollment: Enrollment = {
      id: crypto.randomUUID(),
      name,
      photoBase64: photo,
      enrolledAt: new Date().toISOString()
    };
    setEnrollments(prev => [...prev, newEnrollment]);
    setActiveTab('attendance');
  };

  const markAttendance = useCallback((name: string) => {
    // Only mark attendance once every hour for the same person to prevent duplicate records
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const alreadyMarked = attendance.some(a => 
      a.studentName === name && new Date(a.timestamp) > oneHourAgo
    );

    if (alreadyMarked) return;

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      studentName: name,
      timestamp: new Date().toISOString(),
      status: 'Present'
    };
    setAttendance(prev => [newRecord, ...prev]);
  }, [attendance]);

  const clearRecords = () => {
    if (window.confirm("Are you sure you want to clear all attendance records?")) {
      setAttendance([]);
    }
  };

  const deleteEnrollment = (id: string) => {
    if (window.confirm("Remove this person from the system?")) {
      setEnrollments(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleExport = () => {
    if (attendance.length === 0) {
      alert("No attendance records to export.");
      return;
    }
    exportToExcel(attendance);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Camera className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FaceGuard AI</h1>
        </div>
        
        <div className="mt-4 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'attendance' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <Camera className="w-5 h-5" />
            <span>Scan Camera</span>
          </button>
          <button 
            onClick={() => setActiveTab('enrollment')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'enrollment' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <UserPlus className="w-5 h-5" />
            <span>Enroll Faces</span>
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'records' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Records</span>
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-800 hidden md:block">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
            <span>System Stats</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Enrolled</span>
              <span className="font-mono">{enrollments.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Today</span>
              <span className="font-mono">{attendance.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h2>
            <p className="text-gray-500">Manage your AI-powered attendance system effortlessly.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button 
              onClick={clearRecords}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Clear Records"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CameraView 
                enrollments={enrollments} 
                onDetected={markAttendance}
                setIsProcessing={setIsProcessing}
              />
            </div>
            <div>
              <AttendanceLog attendance={attendance} />
            </div>
          </div>
        )}

        {activeTab === 'enrollment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EnrollmentForm onEnroll={handleEnroll} />
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Enrolled Persons</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {enrollments.map(e => (
                  <div key={e.id} className="group relative bg-gray-50 rounded-lg p-3 border hover:border-indigo-300 transition">
                    <img src={e.photoBase64} alt={e.name} className="w-full h-24 object-cover rounded-md mb-2" />
                    <p className="text-sm font-medium text-center truncate">{e.name}</p>
                    <button 
                      onClick={() => deleteEnrollment(e.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {enrollments.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400">
                    <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No enrollments yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
           <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-gray-50 border-b">
                 <tr>
                   <th className="px-6 py-4 font-semibold text-sm text-gray-600">Person Name</th>
                   <th className="px-6 py-4 font-semibold text-sm text-gray-600">Timestamp</th>
                   <th className="px-6 py-4 font-semibold text-sm text-gray-600">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {attendance.length > 0 ? (
                   attendance.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{record.studentName}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(record.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                       No attendance records found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        )}

        {activeTab === 'dashboard' && (
          <StatsDashboard attendance={attendance} enrollments={enrollments} />
        )}
      </main>

      {/* Floating Status Indicator for processing */}
      {isProcessing && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-xs font-bold uppercase tracking-widest">AI Analysing...</span>
        </div>
      )}
    </div>
  );
};

export default App;
