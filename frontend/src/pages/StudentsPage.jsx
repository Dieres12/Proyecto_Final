// src/pages/StudentsPage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GraduationCap, Plus, Search, Edit2, ToggleLeft, X, ChevronDown } from 'lucide-react';
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

export default function StudentsPage() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', grade: '', section: 'A', parentId: '', routeId: '' });

  const load = () => {
    setLoading(true);
    api.get('/students').then(res => setStudents(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      api.get('/routes').then(res => setRoutes(res.data));
      api.get('/parents').then(res => setParents(res.data));
    }
  }, [isAdmin]);

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.grade}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', grade: '', section: 'A', parentId: '', routeId: '' });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, grade: s.grade, section: s.section || 'A', parentId: s.parentId, routeId: s.routeId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/students/${editing.id}`, form);
        toast.success('Estudiante actualizado');
      } else {
        await api.post('/students', form);
        toast.success('Estudiante creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/students/${s.id}`, { active: !s.active });
      toast.success(s.active ? 'Estudiante desactivado' : 'Estudiante activado');
      load();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const grades = ['Kinder', 'Preparatoria', '1ro Primaria', '2do Primaria', '3ro Primaria', '4to Primaria', '5to Primaria', '6to Primaria', '1ro Básico', '2do Básico', '3ro Básico'];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap size={22} className="text-brand-400" /> Estudiantes
          </h2>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} estudiante(s) encontrado(s)</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o grado..."
          className="input-field pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Estudiante', 'Grado', 'Sección', 'Padre/Madre', 'Ruta', 'Estado'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
                {isAdmin && <th className="py-3 px-4" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Sin estudiantes</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-900/50 rounded-full flex items-center justify-center text-violet-400 font-bold text-xs">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="font-medium text-white">{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{s.grade}</td>
                  <td className="py-3 px-4 text-slate-300">{s.section || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{s.parent ? `${s.parent.firstName} ${s.parent.lastName}` : '—'}</td>
                  <td className="py-3 px-4">
                    {s.route ? (
                      <span className="badge bg-brand-900/30 text-brand-400 border border-brand-900/50">{s.route.name}</span>
                    ) : <span className="text-slate-500">Sin ruta</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${s.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => toggleActive(s)} className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors">
                          <ToggleLeft size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Estudiante' : 'Nuevo Estudiante'}>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Grado *</label>
              <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} className="input-field" required>
                <option value="">Seleccionar</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sección</label>
              <select value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="input-field">
                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {isAdmin && (
            <>
              <div>
                <label className="label">Padre/Madre *</label>
                <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="input-field" required={!editing}>
                  <option value="">Seleccionar padre</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ruta</label>
                <select value={form.routeId} onChange={e => setForm({...form, routeId: e.target.value})} className="input-field">
                  <option value="">Sin asignar</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
