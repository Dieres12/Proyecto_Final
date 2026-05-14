// src/pages/PaymentsPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CreditCard, Plus, Upload, CheckCircle, XCircle, Clock, X, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

const StatusBadge = ({ status }) => {
  const config = {
    PENDIENTE: { cls: 'badge-pendiente', icon: Clock, label: 'Pendiente' },
    VALIDADO: { cls: 'badge-validado', icon: CheckCircle, label: 'Validado' },
    RECHAZADO: { cls: 'badge-rechazado', icon: XCircle, label: 'Rechazado' },
  };
  const { cls, icon: Icon, label } = config[status] || config.PENDIENTE;
  return (
    <span className={cls}>
      <Icon size={11} className="mr-1" />
      {label}
    </span>
  );
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ amount: '450', month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '' });
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const isPaymentWindow = new Date().getDate() <= 5;

  const load = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/payments${params}`).then(res => setPayments(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', form);
      toast.success('Pago registrado correctamente');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  const handleUploadReceipt = async (paymentId) => {
    if (!selectedFile) return toast.error('Selecciona un archivo');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', selectedFile);
      await api.post(`/payments/${paymentId}/receipt`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Comprobante subido exitosamente');
      setReceiptModal(null);
      setSelectedFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir comprobante');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (paymentId, status) => {
    try {
      await api.patch(`/payments/${paymentId}/status`, { status });
      toast.success(`Pago ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={22} className="text-brand-400" /> Pagos
          </h2>
          <p className="text-slate-400 text-sm mt-1">{payments.length} registro(s)</p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-3">
            {!isPaymentWindow && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-900/50 rounded-lg text-amber-400 text-xs">
                <AlertCircle size={13} />
                Ventana de pago cerrada (días 1-5)
              </div>
            )}
            <button
              onClick={() => setModalOpen(true)}
              disabled={!isPaymentWindow}
              className="btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              <Plus size={16} /> Registrar Pago
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDIENTE', 'VALIDADO', 'RECHAZADO'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${statusFilter === s
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Padre/Madre', 'Monto', 'Período', 'Estado', 'Comprobante', 'Fecha'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Cargando...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">Sin pagos registrados</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="py-3 px-4 font-medium text-white">{p.parent?.firstName} {p.parent?.lastName}</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Q{p.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-300">{MONTHS[p.month-1]} {p.year}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4">
                    {p.receipt ? (
                      <a
                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${p.receipt.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-xs"
                      >
                        <FileText size={13} /> Ver archivo
                      </a>
                    ) : (
                      <button
                        onClick={() => setReceiptModal(p)}
                        className="flex items-center gap-1 text-slate-400 hover:text-brand-400 text-xs transition-colors"
                      >
                        <Upload size={13} /> Subir
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {format(new Date(p.createdAt), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    {isAdmin && p.status === 'PENDIENTE' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(p.id, 'VALIDADO')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded transition-colors"
                          title="Aprobar"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(p.id, 'RECHAZADO')}
                          className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                          title="Rechazar"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Pago">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Monto (Q) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mes *</label>
              <select value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})} className="input-field">
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Año *</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Registrar</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Receipt Upload Modal */}
      <Modal open={!!receiptModal} onClose={() => { setReceiptModal(null); setSelectedFile(null); }} title="Subir Comprobante">
        {receiptModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-lg text-sm">
              <p className="text-slate-300">Pago: <span className="text-white font-medium">Q{receiptModal.amount} · {MONTHS[receiptModal.month-1]} {receiptModal.year}</span></p>
            </div>
            <div>
              <label className="label">Archivo (JPG, PNG, PDF · máx 5MB)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-brand-600 rounded-lg p-8 text-center cursor-pointer transition-colors"
              >
                <Upload size={32} className="mx-auto text-slate-500 mb-2" />
                <p className="text-slate-400 text-sm">{selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo'}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUploadReceipt(receiptModal.id)}
                disabled={!selectedFile || uploading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Subiendo...' : 'Subir comprobante'}
              </button>
              <button onClick={() => { setReceiptModal(null); setSelectedFile(null); }} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
