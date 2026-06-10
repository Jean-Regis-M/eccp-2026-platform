import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProgramTimeline({ editable }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ period: '', event: '', description: '' });
  const [showAdd, setShowAdd] = useState(false);

  const load = () => api.getTimeline().then(setItems).catch(() => {});
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.createTimelineItem(form);
    setForm({ period: '', event: '', description: '' });
    setShowAdd(false);
    load();
  };

  return (
    <div className="card-glow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-lg">📅 ECCP 2026 Program Timeline</h3>
        {editable && user?.role === 'admin' && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-sm text-equity-red hover:underline">+ Add Phase</button>
        )}
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="grid md:grid-cols-3 gap-2 mb-4 p-4 bg-gray-50 rounded-xl">
          <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="Period" className="input-field" required />
          <input value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} placeholder="Event" className="input-field" required />
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field" />
          <button type="submit" className="btn-primary md:col-span-3">Save</button>
        </form>
      )}
      <div className="space-y-0 relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-equity-red to-equity-gold" />
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-4 pl-10 pb-4 relative">
            <div className="absolute left-2.5 w-3 h-3 rounded-full bg-equity-red ring-4 ring-white" />
            <div className="flex-1 bg-white/80 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-equity-red">{item.period}</p>
              <p className="font-medium">{item.event}</p>
              {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
