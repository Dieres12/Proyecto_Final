// src/pages/ParentsPage.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Plus, Edit2, X, Search } from 'lucide-react';
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

export default function ParentsPage() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', address: '' });

  const load = () => {
    setLoading(true);
    api.get('/parents').then(res => setParents(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = parents.filter(p =>
    `${p.firstName} ${p.lastName} ${p.user?.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', address: '' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ email: p.user?.email || '', password: '', firstName: p.firstName, lastName: p.lastName, phone: p.phone || '', address: p.address || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/parents/${editing.id}`, form);
        toast.success('Padre actualizado');
      } else {
        await api.post('/parents', form);
        toast.success('Padre creado. Credenciales: ' + form.email + ' / ' + form.password);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-brand-400" /> Padres de Familia
          </h2>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} padre(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo Padre
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-9" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Nombre', 'Correo', 'Teléfono', 'Estudiantes', 'Estado', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Sin registros</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-900/50 rounded-full flex items-center justify-center text-violet-400 font-bold text-xs">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <span className="font-medium text-white">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{p.user?.email}</td>
                  <td className="py-3 px-4 text-slate-300">{p.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="badge bg-brand-900/30 text-brand-400 border border-brand-900/50">
                      {p._count?.students ?? 0} estudiante(s)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${p.user?.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {p.user?.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Padre' : 'Nuevo Padre'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="input-field" required />
            </div>
          </div>
          {!editing && (
            <>
              <div>
                <label className="label">Correo electrónico *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" required minLength={6} />
              </div>
            </>
          )}
          <div>
            <label className="label">Teléfono</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" placeholder="5555-0000" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Actualizar' : 'Crear Padre'}</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
