// src/pages/DriversPage.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import { UserCheck, Plus, Edit2, X, Search } from 'lucide-react';
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

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', license: '', phone: '', email: '' });

  const load = () => {
    setLoading(true);
    api.get('/drivers').then(res => setDrivers(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = drivers.filter(d =>
    `${d.firstName} ${d.lastName} ${d.license}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ firstName: '', lastName: '', license: '', phone: '', email: '' }); setModalOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ firstName: d.firstName, lastName: d.lastName, license: d.license, phone: d.phone || '', email: d.email || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/drivers/${editing.id}`, form); toast.success('Piloto actualizado'); }
      else { await api.post('/drivers', form); toast.success('Piloto creado'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserCheck size={22} className="text-brand-400" /> Pilotos</h2>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} piloto(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nuevo Piloto</button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o licencia..." className="input-field pl-9" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Piloto', 'Licencia', 'Teléfono', 'Correo', 'Buses asignados', 'Estado', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-12 text-center text-slate-500">Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-slate-500">Sin pilotos registrados</td></tr>
              : filtered.map(d => (
                <tr key={d.id} className="table-row">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-900/50 rounded-full flex items-center justify-center text-teal-400 font-bold text-xs">{d.firstName[0]}{d.lastName[0]}</div>
                      <span className="font-medium text-white">{d.firstName} {d.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{d.license}</td>
                  <td className="py-3 px-4 text-slate-300">{d.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{d.email || '—'}</td>
                  <td className="py-3 px-4">
                    {d.buses?.length > 0
                      ? d.buses.map(b => <span key={b.id} className="badge bg-brand-900/30 text-brand-400 border border-brand-900/50 mr-1">{b.plate}</span>)
                      : <span className="text-slate-500 text-xs">Sin asignar</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${d.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {d.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openEdit(d)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"><Edit2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Piloto' : 'Nuevo Piloto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nombre *</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="input-field" required /></div>
            <div><label className="label">Apellido *</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input-field" required /></div>
          </div>
          <div><label className="label">No. Licencia *</label><input value={form.license} onChange={e => setForm({...form, license: e.target.value})} className="input-field" required placeholder="GT-000000" /></div>
          <div><label className="label">Teléfono</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" /></div>
          <div><label className="label">Correo</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Actualizar' : 'Crear'}</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
