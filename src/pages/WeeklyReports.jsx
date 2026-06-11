import { useState } from 'react';
import { api } from '../api';
import { ensureArray } from '../utils/safe';
import StaggeredParent from '../components/StaggeredParent';
import { useAuth } from '../context/AuthContext';
import { useECCPState } from '../hooks/useECCPState';

export default function WeeklyReports() {
  const [report, setReport] = useState(null);
  const [dates, setDates] = useState({
    week_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    week_end: new Date().toISOString().split('T')[0],
  });

  const generate = async () => {
    const data = await api.getWeeklyReport(dates);
    setReport(data);
    // Log report generated (academic progress)
    logAuditEvent({
      category: 'ACADEMIC',
      action: 'Weekly report generated',
      details: {
        weekStart: dates.week_start,
        weekEnd: dates.week_end,
        sessionCount: ensureArray(data.sessions).length
      },
      user
    });
  };

  const download = async () => {
    const res = await api.downloadWeeklyReport(dates);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eccp-weekly-report-${dates.week_start}-to-${dates.week_end}.csv`;
    a.click();
    // Log report downloaded (academic progress)
    logAuditEvent({
      category: 'ACADEMIC',
      action: 'Weekly report downloaded',
      details: {
        weekStart: dates.week_start,
        weekEnd: dates.week_end
      },
      user
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">📊 Weekly Meeting Reports</h1>

      <div className="card flex flex-wrap gap-4 items-end">
        <div><label className="text-sm font-medium">Week Start</label><input type="date" value={dates.week_start} onChange={e => setDates({ ...dates, week_start: e.target.value })} className="input-field mt-1" /></div>
        <div><label className="text-sm font-medium">Week End</label><input type="date" value={dates.week_end} onChange={e => setDates({ ...dates, week_end: e.target.value })} className="input-field mt-1" /></div>
        <button onClick={generate} className="btn-primary">Generate Report</button>
        <button onClick={download} className="btn-outline">📥 Download CSV</button>
      </div>

      {report && (
        <div className="space-y-4">
          <p className="text-gray-500">Report for {report.week_start} to {report.week_end} — {ensureArray(report.sessions).length} sessions</p>
          <StaggeredParent>
          {ensureArray(report.sessions).map(s => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-equity-red font-medium">{s.date}</p>
                  <h3 className="font-semibold text-lg">{s.topic}</h3>
                  <p className="text-sm text-gray-500">{s.description}</p>
                </div>
                <span className="badge bg-green-100 text-green-700">
                  {ensureArray(s.attendance).filter(a => a.attended).length}/{ensureArray(s.attendance).length} attended
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Attendance</h4>
                  <StaggeredParent>
                    {ensureArray(s.attendance).map(a => (
                      <div key={a.name} className="flex justify-between py-1 border-b border-gray-50">
                        <span>{a.name}</span><span>{a.attended ? '✅' : '❌'}</span>
                      </div>
                    ))}
                  </StaggeredParent>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Feedback</h4>
                  {ensureArray(s.feedback).length === 0 ? (
                    <p className="text-gray-400">No feedback yet</p>
                  ) : (
                    <StaggeredParent>
                      {ensureArray(s.feedback).map(f => (
                        <div key={f.name} className="py-1 border-b border-gray-50">
                          <span className="font-medium">{f.name}</span> — {'⭐'.repeat(f.understanding_rating)}
                          {f.feelings && <p className="text-gray-500 text-xs">{f.feelings}</p>}
                        </div>
                      ))}
                    </StaggeredParent>
                  )}
                </div>
              </div>
            </div>
          ))}
        </StaggeredParent>
        </div>
      )}
    </div>
  );
}
