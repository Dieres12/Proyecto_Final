// src/pages/RoutesPage.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Map, Plus, Edit2, X, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-lg z-10 fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', busId: '' });

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/routes'), api.get('/buses')])
      .then(([r, b]) => { setRoutes(r.data); setBuses(b.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = routes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', busId: '' }); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, description: r.description || '', busId: r.busId || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/routes/${editing.id}`, form); toast.success('Ruta actualizada'); }
      else { await api.post('/routes', form); toast.success('Ruta creada'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Map size={22} className="text-brand-400" /> Rutas</h2>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} ruta(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nueva Ruta</button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ruta..." className="input-field pl-9" />
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-slate-500 text-center py-12">Cargando...</p>
        : filtered.length === 0 ? <p className="text-slate-500 text-center py-12">Sin rutas registradas</p>
        : filtered.map(r => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{r.name}</h3>
                  <span className={`badge ${r.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    {r.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {r.description && <p className="text-slate-400 text-sm mt-1">{r.description}</p>}
              </div>
              <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"><Edit2 size={14} /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <p className="text-slate-500 text-xs mb-1">Bus asignado</p>
                <p className="text-slate-200">{r.bus ? `${r.bus.plate} — ${r.bus.model || ''}` : 'Sin bus'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Piloto</p>
                <p className="text-slate-200">{r.bus?.driver ? `${r.bus.driver.firstName} ${r.bus.driver.lastName}` : '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Estudiantes</p>
                <p className="text-slate-200">{r._count?.students || 0} registrados</p>
              </div>
            </div>

            {r.stops?.length > 0 && (
              <div>
                <p className="text-slate-500 text-xs mb-2">Paradas ({r.stops.length})</p>
                <div className="flex flex-wrap gap-2">
                  {r.stops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1.5">
                      <span className="w-4 h-4 rounded-full bg-brand-600/30 text-brand-400 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                      <span className="text-slate-300 text-xs">{stop.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Ruta' : 'Nueva Ruta'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Nombre de ruta *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required placeholder="Ruta Norte - Zona 6" /></div>
          <div><label className="label">Descripción</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} /></div>
          <div>
            <label className="label">Bus asignado</label>
            <select value={form.busId} onChange={e => setForm({...form, busId: e.target.value})} className="input-field">
              <option value="">Sin asignar</option>
              {buses.filter(b => b.active).map(b => <option key={b.id} value={b.id}>{b.plate} — {b.model || 'Bus'}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
