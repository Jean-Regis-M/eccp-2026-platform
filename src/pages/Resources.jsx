import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { ensureArray } from '../utils/safe';

const TYPE_ICONS = { link: '🔗', pdf: '📄', ppt: '📊', word: '📝', youtube: '▶️', drive: '📁' };

export default function Resources() {
  const { user } = useAuth();
  const [data, setData] = useState({ categories: [], resources: [] });
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'SAT Prep', title: '', description: '', resource_type: 'link', url: '' });
  const [file, setFile] = useState(null);

  const load = () => api.getResources(filter || undefined).then(setData).catch(() => {});
  useEffect(load, [filter]);

  const handleAddLink = async (e) => {
    e.preventDefault();
    await api.createResource(form);
    setShowAdd(false);
    load();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', form.category);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('resource_type', form.resource_type);
    await api.uploadResource(fd);
    setShowAdd(false);
    setFile(null);
    load();
  };

  const openResource = async (r) => {
    if (r.url && !r.file_path) {
      window.open(r.url, '_blank');
      return;
    }
    if (r.file_path?.startsWith('/api')) {
      const filename = r.file_path.split('/').pop();
      await api.downloadResourceFile(filename, r.title || 'resource');
      return;
    }
    if (r.url) window.open(r.url, '_blank');
  };

  const categories = ensureArray(data.categories);
  const resources = ensureArray(data.resources);
  const grouped = categories.map(cat => ({
    category: cat,
    items: resources.filter(r => r.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">📁 Resource Library</h1>
          <p className="text-gray-500">SAT Prep • Essays • Recommendations • Financial Aid & more</p>
        </div>
        {user.role !== 'mentee' && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary shrink-0">+ Add Resource</button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-xl text-sm ${!filter ? 'bg-equity-red text-white' : 'bg-white border'}`}>All</button>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-xl text-sm ${filter === c ? 'bg-equity-red text-white' : 'bg-white border'}`}>{c}</button>
        ))}
      </div>

      {showAdd && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Add Resource</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.resource_type} onChange={e => setForm({ ...form, resource_type: e.target.value })} className="input-field">
              <option value="link">Link</option>
              <option value="drive">Google Drive</option>
              <option value="youtube">YouTube</option>
              <option value="pdf">PDF Upload</option>
              <option value="ppt">PPT Upload</option>
              <option value="word">Word Upload</option>
            </select>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input-field md:col-span-2" required />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field md:col-span-2" />
          </div>
          {['link', 'drive', 'youtube'].includes(form.resource_type) ? (
            <form onSubmit={handleAddLink} className="space-y-3">
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="URL" className="input-field" required />
              <button type="submit" className="btn-primary">Save Link</button>
            </form>
          ) : (
            <form onSubmit={handleUpload} className="space-y-3">
              <input type="file" onChange={e => setFile(e.target.files[0])} className="input-field" required />
              <button type="submit" className="btn-primary" disabled={!file}>Upload File</button>
            </form>
          )}
        </div>
      )}

      {grouped.map(g => (
        <div key={g.category} className="card-glow">
          <h3 className="font-display font-bold text-equity-red mb-4">{g.category}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.items.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-lg hover:border-equity-red/30 transition cursor-pointer bg-white" onClick={() => openResource(r)}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{TYPE_ICONS[r.resource_type] || '📎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description || r.url}</p>
                    <p className="text-xs text-gray-400 mt-2">By {r.created_by_name}</p>
                  </div>
                  {user.role !== 'mentee' && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) api.deleteResource(r.id).then(load); }} className="text-red-400 text-xs">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {data.resources.length === 0 && <p className="text-center text-gray-400 py-12">No resources yet. {user.role !== 'mentee' && 'Add the first one!'}</p>}
    </div>
  );
}
