// src/pages/AttendancePage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ClipboardList, Plus, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function AttendancePage() {
  const { isAdmin } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    studentId: '', date: new Date().toISOString().split('T')[0],
    lat: '', lng: '', observations: ''
  });

  const load = () => {
    setLoading(true);
    api.get('/attendance').then(res => setAttendance(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/students').then(res => setStudents(res.data));
  }, []);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
        toast.success('Ubicación obtenida');
      },
      () => { toast.error('No se pudo obtener ubicación'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance', {
        ...form,
        date: new Date(form.date + 'T' + new Date().toTimeString().slice(0,5)).toISOString()
      });
      toast.success('Asistencia confirmada');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-400" /> Asistencia
          </h2>
          <p className="text-slate-400 text-sm mt-1">{attendance.length} registros</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Confirmar Asistencia
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Estudiante', 'Grado', 'Fecha', 'Ubicación', 'Observaciones'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Cargando...</td></tr>
              ) : attendance.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Sin registros de asistencia</td></tr>
              ) : attendance.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-900/50 rounded-full flex items-center justify-center text-brand-400 font-bold text-xs">
                        {a.student?.firstName?.[0]}{a.student?.lastName?.[0]}
                      </div>
                      <span className="font-medium text-white">{a.student?.firstName} {a.student?.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{a.student?.grade}</td>
                  <td className="py-3 px-4 text-slate-300">{format(new Date(a.date), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="py-3 px-4">
                    {a.lat && a.lng ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <MapPin size={12} /> {parseFloat(a.lat).toFixed(4)}, {parseFloat(a.lng).toFixed(4)}
                      </span>
                    ) : <span className="text-slate-500 text-xs">Sin ubicación</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{a.observations || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirmar Asistencia">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Estudiante *</label>
            <select value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} className="input-field" required>
              <option value="">Seleccionar estudiante</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.grade}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha *</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="label">Ubicación (opcional)</label>
            <div className="flex gap-2">
              <input value={form.lat} readOnly placeholder="Latitud" className="input-field text-xs" />
              <input value={form.lng} readOnly placeholder="Longitud" className="input-field text-xs" />
              <button type="button" onClick={getLocation} disabled={locating} className="btn-secondary flex-shrink-0 flex items-center gap-1 text-xs">
                <MapPin size={13} /> {locating ? '...' : 'GPS'}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} className="input-field" rows={2} placeholder="Notas adicionales..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Confirmar Asistencia</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
