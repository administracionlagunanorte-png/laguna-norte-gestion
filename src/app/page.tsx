'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Leaf, Brush, Trash2, Wrench, Clock, CheckCircle2,
  MapPin, ChevronRight, X, Plus, LayoutDashboard, ClipboardList,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

/* ─── Constants ─── */

const CATEGORIES = [
  { id: 'electrica', name: 'Eléctrica', icon: Zap, color: 'bg-yellow-500' },
  { id: 'jardineria', name: 'Jardinería', icon: Leaf, color: 'bg-green-600' },
  { id: 'aseo', name: 'Aseo General', icon: Brush, color: 'bg-blue-400' },
  { id: 'basura', name: 'Recolección Basura', icon: Trash2, color: 'bg-orange-500' },
  { id: 'servicios', name: 'Servicios Generales', icon: Wrench, color: 'bg-purple-500' },
] as const;

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  'Pendiente': { color: 'bg-red-500', text: 'text-red-500' },
  'En Proceso': { color: 'bg-amber-500', text: 'text-amber-600' },
  'Terminada': { color: 'bg-emerald-500', text: 'text-emerald-600' },
};

const ZONES = ['Portería', 'Áreas Verdes', 'Piscina', 'Club House', 'Canque', 'Avenida Principal', 'Muelle', 'Anfiteatro'] as const;

const STORAGE_KEY = 'laguna_norte_ots';
const COUNTER_KEY = 'laguna_norte_ot_counter';

/* ─── Types ─── */

interface WorkOrder {
  id: string;
  otId: string;
  title: string;
  description: string;
  status: string;
  zoneName: string;
  createdAt: number;
}

/* ─── Utility functions ─── */

function loadWorkOrders(): WorkOrder[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error al leer localStorage:', e);
  }
  return [];
}

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

function generateOTId(): string {
  let counter = 1;
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    if (stored) counter = parseInt(stored, 10) + 1;
  } catch (e) {
    // fallback to default
  }
  localStorage.setItem(COUNTER_KEY, counter.toString());
  return `OT-${String(counter).padStart(4, '0')}`;
}

/* ─── Dashboard Component ─── */

function Dashboard({ workOrders }: { workOrders: WorkOrder[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <Clock className="text-red-500 mb-2" size={20} />
          <div className="text-3xl font-black">{workOrders.filter(o => o.status === 'Pendiente').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendientes</div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <CheckCircle2 className="text-emerald-500 mb-2" size={20} />
          <div className="text-3xl font-black">{workOrders.filter(o => o.status === 'Terminada').length}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listas</div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] p-8 text-white">
        <h3 className="font-black text-lg mb-4 uppercase">Recientes</h3>
        <div className="space-y-3">
          {workOrders.slice(0, 3).map(ot => (
            <div key={ot.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="truncate pr-4">
                <p className="font-bold text-sm uppercase truncate">{ot.title}</p>
                <p className="text-[10px] text-white/40 uppercase">{ot.zoneName}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${STATUS_CONFIG[ot.status]?.color ?? 'bg-gray-500'}`}>
                {ot.status}
              </div>
            </div>
          ))}
          {workOrders.length === 0 && <p className="text-white/30 text-xs italic text-center py-4">No hay registros.</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── OTList Component ─── */

function OTList({
  workOrders,
  onCreateFromCategory,
  onEditOT,
}: {
  workOrders: WorkOrder[];
  onCreateFromCategory: (name: string) => void;
  onEditOT: (ot: WorkOrder) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map(cat => {
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onCreateFromCategory(cat.name)}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform`}>
                <IconComp size={20} />
              </div>
              <span className="text-[8px] font-black uppercase text-slate-500">{cat.name}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {workOrders.map(ot => (
          <div
            key={ot.id}
            onClick={() => onEditOT(ot)}
            className="bg-white p-5 rounded-[32px] border border-slate-100 flex items-center justify-between shadow-sm cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${STATUS_CONFIG[ot.status]?.color ?? 'bg-gray-500'}`}></div>
            <div className="flex-1 truncate pr-4 pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded-full">{ot.otId}</span>
                <span className={`text-[9px] font-black uppercase ${STATUS_CONFIG[ot.status]?.text ?? 'text-gray-500'}`}>{ot.status}</span>
              </div>
              <h4 className="font-black text-slate-800 uppercase truncate">{ot.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                <MapPin size={10} className="text-blue-500" /> {ot.zoneName}
              </p>
            </div>
            <ChevronRight className="text-slate-300" size={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal Component ─── */

function ModalInner({
  editingItem,
  onClose,
  onSave,
  onDelete,
  onGeneratePDF,
}: {
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
}) {
  const [form, setForm] = useState(() => ({
    id: editingItem?.id,
    otId: editingItem?.otId,
    title: editingItem?.title ?? '',
    description: editingItem?.description ?? '',
    status: editingItem?.status ?? 'Pendiente',
    zoneName: editingItem?.zoneName ?? ZONES[0],
    createdAt: editingItem?.createdAt,
  }));
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    if (!form.title.trim()) {
      setValidationError('La actividad es obligatoria');
      return;
    }
    if (!form.zoneName) {
      setValidationError('Selecciona una zona');
      return;
    }
    setValidationError('');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] max-h-[90vh] overflow-y-auto p-8 shadow-2xl no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Detalle de OT</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Actividad</label>
            <input
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold"
              placeholder="Nombre..."
              value={form.title}
              onChange={e => { setForm({ ...form, title: e.target.value }); setValidationError(''); }}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones</label>
            <textarea
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-medium text-sm min-h-[80px]"
              placeholder="..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Zona</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ZONES.map(z => (
                <button
                  key={z}
                  onClick={() => setForm({ ...form, zoneName: z })}
                  className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase ${form.zoneName === z ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {Object.keys(STATUS_CONFIG).map(s => (
              <button
                key={s}
                onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${form.status === s ? `${STATUS_CONFIG[s].color} text-white` : 'bg-slate-100 text-slate-400'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {validationError && (
            <p className="text-red-500 text-xs font-bold text-center">{validationError}</p>
          )}

          <button
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-transform"
          >
            GUARDAR
          </button>

          {editingItem?.id && (
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => onGeneratePDF(editingItem)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
              >
                <Download size={14} /> PDF
              </button>
              <button
                onClick={() => onDelete(editingItem.id!)}
                className="p-3 bg-red-50 text-red-500 rounded-xl"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({
  isOpen,
  editingItem,
  onClose,
  onSave,
  onDelete,
  onGeneratePDF,
}: {
  isOpen: boolean;
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
}) {
  if (!isOpen) return null;

  // Using key to reset ModalInner state when editingItem changes
  const modalKey = editingItem?.id ?? 'new';

  return (
    <ModalInner
      key={modalKey}
      editingItem={editingItem}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
      onGeneratePDF={onGeneratePDF}
    />
  );
}

/* ─── Main App ─── */

export default function Home() {
  const [view, setView] = useState<'dashboard' | 'ots'>('dashboard');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(loadWorkOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WorkOrder> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workOrders));
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }, [workOrders]);

  const handleSaveOT = useCallback((data: Partial<WorkOrder>) => {
    if (data.id) {
      setWorkOrders(prev => prev.map(ot => ot.id === data.id ? { ...ot, ...data } as WorkOrder : ot));
    } else {
      const newOT: WorkOrder = {
        id: generateUniqueId(),
        otId: generateOTId(),
        title: data.title ?? '',
        description: data.description ?? '',
        status: data.status ?? 'Pendiente',
        zoneName: data.zoneName ?? ZONES[0],
        createdAt: Date.now(),
      };
      setWorkOrders(prev => [newOT, ...prev]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleDeleteOT = useCallback((id: string) => {
    setWorkOrders(prev => prev.filter(o => o.id !== id));
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleCreateFromCategory = useCallback((categoryName: string) => {
    setEditingItem({ title: categoryName, status: 'Pendiente', zoneName: ZONES[0] });
    setIsModalOpen(true);
  }, []);

  const handleEditOT = useCallback((ot: WorkOrder) => {
    setEditingItem(ot);
    setIsModalOpen(true);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const generatePDF = useCallback((ot: Partial<WorkOrder>) => {
    const doc = new jsPDF();

    doc.setFillColor(34, 158, 197);
    doc.circle(20, 20, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 40, 107);
    doc.setFontSize(22);
    doc.text('Laguna Norte', 40, 25);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.text('REPORTE DE OPERACIÓN', 105, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`CÓDIGO: ${ot.otId ?? ''}`, 105, 57, { align: 'center' });

    doc.text(`Actividad: ${ot.title ?? ''}`, 20, 75);
    doc.text(`Zona: ${ot.zoneName ?? ''}`, 20, 82);
    doc.text(`Estado: ${ot.status ?? ''}`, 20, 89);

    doc.text('Detalle:', 20, 105);
    const splitDesc = doc.splitTextToSize(ot.description || 'Sin detalle adicional', 170);
    doc.text(splitDesc, 20, 112);

    doc.save(`Reporte_${ot.otId ?? 'OT'}.pdf`);
  }, []);

  return (
    <div className="max-w-xl mx-auto min-h-screen pb-32 bg-slate-50">
      <header className="p-8 bg-white border-b border-slate-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Laguna Norte</h1>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Operaciones</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
          <ClipboardList size={24} />
        </div>
      </header>

      <main className="p-6">
        {view === 'dashboard' ? (
          <Dashboard workOrders={workOrders} />
        ) : (
          <OTList workOrders={workOrders} onCreateFromCategory={handleCreateFromCategory} onEditOT={handleEditOT} />
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl rounded-[32px] p-4 flex justify-around items-center shadow-2xl border border-white z-50">
        <button
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[8px] font-black uppercase">Inicio</span>
        </button>
        <button
          onClick={handleOpenNew}
          className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 -mt-10 border-4 border-white active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
        <button
          onClick={() => setView('ots')}
          className={`flex flex-col items-center gap-1 ${view === 'ots' ? 'text-blue-600' : 'text-slate-300'}`}
        >
          <ClipboardList size={20} />
          <span className="text-[8px] font-black uppercase">Listado</span>
        </button>
      </nav>

      <Modal
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={handleCloseModal}
        onSave={handleSaveOT}
        onDelete={handleDeleteOT}
        onGeneratePDF={generatePDF}
      />
    </div>
  );
}
