// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  GraduationCap, Bus, CreditCard, CheckCircle, Navigation,
  Clock, AlertCircle, TrendingUp, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      api.get('/reports/dashboard')
        .then(res => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const parentName = user?.parent ? `${user.parent.firstName} ${user.parent.lastName}` : user?.email;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">
          {isAdmin ? 'Panel de Control' : `Bienvenido, ${parentName}`}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {isAdmin && data ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={GraduationCap} label="Estudiantes" value={data.stats.totalStudents} color="bg-violet-600" sub="activos" />
            <StatCard icon={Bus} label="Autobuses" value={data.stats.totalBuses} color="bg-brand-600" sub={`${data.stats.activeBuses} en ruta`} />
            <StatCard icon={AlertCircle} label="Pagos Pendientes" value={data.stats.pendingPayments} color="bg-amber-600" sub="este mes" />
            <StatCard icon={CheckCircle} label="Pagos Aprobados" value={data.stats.approvedPayments} color="bg-emerald-600" sub="este mes" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label="Rutas Activas" value={data.stats.totalRoutes} color="bg-rose-600" />
            <StatCard icon={Clock} label="Asistencias Hoy" value={data.stats.todayAttendance} color="bg-indigo-600" />
            <StatCard icon={Navigation} label="Buses en Ruta" value={data.stats.activeBuses} color="bg-teal-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <div className="card">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-semibold text-white">Últimos Pagos</h3>
                <button onClick={() => navigate('/payments')} className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
                  Ver todos <ArrowRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {data.recentPayments.length === 0 ? (
                  <p className="text-slate-500 text-sm p-5 text-center">Sin pagos recientes</p>
                ) : data.recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-white font-medium">{p.parent.firstName} {p.parent.lastName}</p>
                      <p className="text-xs text-slate-500">Q{p.amount.toFixed(2)} · Mes {p.month}/{p.year}</p>
                    </div>
                    <span className={`badge-${p.status.toLowerCase()}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="card">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="font-semibold text-white">Últimas Asistencias</h3>
                <button onClick={() => navigate('/attendance')} className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
                  Ver todas <ArrowRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-slate-800">
                {data.recentAttendances.length === 0 ? (
                  <p className="text-slate-500 text-sm p-5 text-center">Sin asistencias recientes</p>
                ) : data.recentAttendances.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-white font-medium">{a.student.firstName} {a.student.lastName}</p>
                      <p className="text-xs text-slate-500">{a.student.grade}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {format(new Date(a.date), 'dd/MM HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Parent Dashboard */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: '🎓 Mis Estudiantes', desc: 'Ver y gestionar estudiantes registrados', path: '/students' },
            { title: '✅ Confirmar Asistencia', desc: 'Registrar asistencia del día', path: '/attendance' },
            { title: '💳 Mis Pagos', desc: 'Subir comprobantes y ver estado', path: '/payments' },
            { title: '🗺️ GPS en Vivo', desc: 'Ver ubicación del bus en tiempo real', path: '/tracking' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="card p-6 text-left hover:border-brand-700 hover:bg-slate-800/50 transition-all duration-200 group"
            >
              <p className="text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">{item.title}</p>
              <p className="text-slate-400 text-sm mt-2">{item.desc}</p>
              <div className="flex items-center gap-1 mt-4 text-brand-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Ir <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
