import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useECCPState } from '../hooks/useECCPState';

export default function Messages() {
  const { user } = useAuth();
  const { logAuditEvent } = useECCPState();
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({ target_type: 'mentor_group', subject: '', content: '' });

  const load = () => api.getMessages().then(setMessages).catch(() => {});
  useEffect(load, []);

  const filtered = messages.filter(m => {
    if (filter === 'admin') return m.message_source === 'admin';
    if (filter === 'mentor') return m.message_source === 'mentor';
    return true;
  });

  const openMessage = async (m) => {
    setSelected(m);
    setReply('');
    if (!m.is_read) { await api.markRead(m.id); load(); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const messageData = { ...form };
    await api.sendMessage(messageData);
    setForm({ target_type: 'mentor_group', subject: '', content: '' });
    load();
    alert('Message sent!');
    // Log message sent (system action)
    logAuditEvent({
      category: 'SYSTEM',
      action: 'Message sent',
      details: {
        targetType: form.target_type,
        subject: form.subject,
        contentLength: form.content.length
      },
      user
    });
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    const replyData = { id: selected.id, content: reply };
    await api.replyMessage(selected.id, reply);
    setReply('');
    const updated = await api.getMessages();
    setMessages(updated);
    setSelected(updated.find(m => m.id === selected.id));
    // Log reply sent (system action)
    logAuditEvent({
      category: 'SYSTEM',
      action: 'Reply sent',
      details: {
        messageId: selected.id,
        replyLength: reply.length
      },
      user
    });
  };

  const sourceBadge = (m) => {
    if (m.message_source === 'admin') return <span className="badge-admin">🏛️ Org Admin</span>;
    return <span className="badge-mentor">🧑‍🏫 Your Mentor</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">💬 Messages</h1>

      {user.role === 'mentor' && (
        <form onSubmit={handleSend} className="card space-y-3">
          <h3 className="font-semibold">Send to Your Scholars</h3>
          <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="input-field" required />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Your message to scholars..." className="input-field h-24" required />
          <button type="submit" className="btn-primary">Send to My Scholars</button>
        </form>
      )}

      {user.role === 'mentee' && (
        <div className="flex gap-2">
          {['all', 'admin', 'mentor'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${filter === f ? 'bg-equity-red text-white' : 'bg-white border hover:bg-gray-50'}`}>
              {f === 'all' ? 'All Messages' : f === 'admin' ? '🏛️ From Admin' : '🧑‍🏫 From Mentor'}
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map(m => (
            <div key={m.id} onClick={() => openMessage(m)}
              className={`card cursor-pointer p-4 hover:shadow-lg transition ${!m.is_read ? 'border-l-4 border-equity-red' : ''} ${selected?.id === m.id ? 'ring-2 ring-equity-red' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  {user.role === 'mentee' && <div className="mb-1">{sourceBadge(m)}</div>}
                  <p className="font-medium truncate">{m.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">From: {m.from_name} • {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                {!m.is_read && <span className="badge bg-equity-red text-white shrink-0">New</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-center py-8">No messages</p>}
        </div>

        {selected && (
          <div className="card-glow sticky top-24">
            <div className="mb-4">{user.role === 'mentee' && sourceBadge(selected)}</div>
            <h2 className="font-semibold text-xl mb-2">{selected.subject}</h2>
            <p className="text-sm text-gray-500 mb-4">From: {selected.from_name} • {new Date(selected.created_at).toLocaleString()}</p>
            <div className="prose text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl mb-4">{selected.content}</div>

            {selected.replies?.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-medium text-sm text-gray-500">Replies</h4>
                {selected.replies.map(r => (
                  <div key={r.id} className="bg-blue-50 p-3 rounded-xl text-sm">
                    <p className="font-medium">{r.name} <span className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleString()}</span></p>
                    <p>{r.content}</p>
                  </div>
                ))}
              </div>
            )}

            {user.role === 'mentee' && (
              <div className="border-t pt-4">
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply to your mentor..." className="input-field h-20 mb-2" />
                <button onClick={handleReply} disabled={!reply.trim()} className="btn-primary text-sm disabled:opacity-50">Send Reply</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
