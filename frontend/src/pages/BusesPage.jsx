// src/pages/BusesPage.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Bus, Plus, Edit2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-lg z-10 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ plate: '', model: '', capacity: 30, driverId: '' });

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/buses'), api.get('/drivers')])
      .then(([b, d]) => { setBuses(b.data); setDrivers(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = buses.filter(b =>
    `${b.plate} ${b.model}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ plate: '', model: '', capacity: 30, driverId: '' }); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ plate: b.plate, model: b.model || '', capacity: b.capacity, driverId: b.driverId || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/buses/${editing.id}`, form); toast.success('Bus actualizado'); }
      else { await api.post('/buses', form); toast.success('Bus creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Bus size={22} className="text-brand-400" /> Autobuses</h2>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} bus(es)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nuevo Bus</button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por placa o modelo..." className="input-field pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? <p className="text-slate-500 col-span-3 text-center py-12">Cargando...</p>
        : filtered.length === 0 ? <p className="text-slate-500 col-span-3 text-center py-12">Sin buses registrados</p>
        : filtered.map((b, idx) => {
          const colors = ['border-brand-700', 'border-violet-700', 'border-emerald-700', 'border-amber-700'];
          return (
            <div key={b.id} className={`card p-5 border-l-4 ${colors[idx % colors.length]}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-white text-lg font-mono">{b.plate}</p>
                  <p className="text-slate-400 text-sm">{b.model || 'Sin modelo'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${b.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    {b.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"><Edit2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Capacidad</span>
                  <span className="text-slate-200">{b.capacity} pasajeros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Piloto</span>
                  <span className="text-slate-200">{b.driver ? `${b.driver.firstName} ${b.driver.lastName}` : 'Sin asignar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rutas</span>
                  <span className="text-slate-200">{b.routes?.length || 0} asignada(s)</span>
                </div>
                {b.currentLat && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ubicación</span>
                    <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      En ruta
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Bus' : 'Nuevo Bus'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Placa *</label><input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} className="input-field font-mono" required placeholder="P-000-GT" /></div>
          <div><label className="label">Modelo</label><input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="input-field" placeholder="Toyota Coaster 2022" /></div>
          <div><label className="label">Capacidad</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} className="input-field" min={1} max={80} /></div>
          <div>
            <label className="label">Piloto asignado</label>
            <select value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} className="input-field">
              <option value="">Sin asignar</option>
              {drivers.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — {d.license}</option>)}
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
