'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Leaf, Brush, Trash2, Wrench, Clock, CheckCircle2,
  MapPin, ChevronRight, X, Plus, LayoutDashboard, ClipboardList,
  Download, ChevronDown, Search, User, Tag
} from 'lucide-react';
import { jsPDF } from 'jspdf';

/* ─── Data Lists ─── */

interface Collaborator {
  name: string;
  role: string;
}

const COLLABORATORS: Collaborator[] = [
  { name: 'Cesar Edmundo Adasme Aravena', role: 'Auxiliar de aseo Full Time' },
  { name: 'Chris Esther Godoy Espinoza', role: 'Auxiliar de aseo Full Time' },
  { name: 'Erik Alberto Arteaga Burgos', role: 'Auxiliar de aseo Full Time' },
  { name: 'Irma Del Rosario Pinna Lopez', role: 'Auxiliar de aseo Full Time' },
  { name: 'Marie Ginette Dorne', role: 'Auxiliar de aseo Full Time' },
  { name: 'Jeantelus Fleurissaint', role: 'Auxiliar de servicios generales' },
  { name: 'Luis Alejandro Torres Bustos', role: 'Auxiliar de servicios generales' },
  { name: 'Nelson Enrique Lema Muñoz', role: 'Auxiliar de servicios generales' },
  { name: 'Paulo César Toro Pino', role: 'Auxiliar de servicios generales' },
  { name: 'Macario Enrique Manríquez Trigo', role: 'Lagunero' },
  { name: 'Carlos Alberto Zamorano Torres', role: 'Mantenciones' },
  { name: 'Francisco Marcial Fuentes Carrasco', role: 'Eléctrico' },
  { name: 'Jose Luis Venegas Poblete', role: 'Mantenciones' },
];

const ZONES = [
  'Club House', 'Piscina 1', 'Piscina 2', 'Piscina 3', 'Mirador',
  'Muelle', 'Juegos Muelle', 'Quinchos', 'Multicancha', 'Cancha Sintética',
  'Avenida Principal', 'Canquén', 'Albatros', 'Bandurrias', 'Becacinas',
  'Flamencos', 'Faisanes', 'Garzas', 'Gaviotas', 'Otro',
];

const ACTIVITIES = [
  'Corte De Pasto', 'Desmalezado', 'Poda de Arbustos', 'Barrido De Calles',
  'Recolección De Basura', 'Reparación Eléctrica', 'Reparación Estructural',
  'Limpieza De Piscina', 'Llenado De Piscina', 'Otro',
];

/* ─── Other constants ─── */

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

const STORAGE_KEY = 'laguna_norte_ots';
const COUNTER_KEY = 'laguna_norte_ot_counter';

/* ─── Types ─── */

interface WorkOrder {
  id: string;
  otId: string;
  activities: string[];
  collaborator: string;
  collaboratorRole: string;
  zoneName: string;
  description: string;
  status: string;
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

/* ─── Custom Dropdown Component ─── */

function Dropdown({
  label,
  icon: IconComp,
  options,
  selected,
  onSelect,
  placeholder,
  searchable = false,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: string; subtitle?: string }[];
  selected: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = searchable && search.trim()
    ? options.filter(o =>
        o.value.toLowerCase().includes(search.toLowerCase()) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const selectedOption = options.find(o => o.value === selected);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold text-left flex items-center justify-between gap-2"
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? (
            <span className="flex flex-col">
              <span className="truncate">{selectedOption.value}</span>
              {selectedOption.subtitle && (
                <span className="text-[9px] font-medium text-slate-400 normal-case truncate">{selectedOption.subtitle}</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-56 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-slate-300"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-40 no-scrollbar">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onSelect(opt.value); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors ${selected === opt.value ? 'bg-blue-50 text-blue-600 font-black' : 'text-slate-700 font-semibold'}`}
              >
                <span className="block truncate">{opt.value}</span>
                {opt.subtitle && (
                  <span className="block text-[9px] font-medium text-slate-400 normal-case truncate">{opt.subtitle}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-400 italic">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Multi-Select Activities Component ─── */

function MultiSelectActivities({
  selected,
  onToggle,
  customActivity,
  onCustomActivityChange,
  onAddCustom,
}: {
  selected: string[];
  onToggle: (activity: string) => void;
  customActivity: string;
  onCustomActivityChange: (val: string) => void;
  onAddCustom: () => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Tag size={10} /> Actividades
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {ACTIVITIES.map(act => {
          const isSelected = selected.includes(act);
          const isOther = act === 'Otro';
          return (
            <button
              key={act}
              type="button"
              onClick={() => { if (!isOther) onToggle(act); }}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : isOther
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              {act}
            </button>
          );
        })}
      </div>
      {/* Custom activity input for "Otro" */}
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={customActivity}
          onChange={e => onCustomActivityChange(e.target.value)}
          placeholder="Otra actividad..."
          className="flex-1 p-3 rounded-xl bg-slate-50 border-none font-bold text-sm placeholder:text-slate-300"
          onKeyDown={e => { if (e.key === 'Enter' && customActivity.trim()) { e.preventDefault(); onAddCustom(); } }}
        />
        <button
          type="button"
          onClick={onAddCustom}
          disabled={!customActivity.trim()}
          className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Plus size={14} />
        </button>
      </div>
      {/* Selected activities summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {selected.map(act => (
            <span
              key={act}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase"
            >
              {act}
              <button type="button" onClick={() => onToggle(act)} className="hover:text-red-500 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
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
                <p className="font-bold text-sm uppercase truncate">{ot.activities.join(', ')}</p>
                <p className="text-[10px] text-white/40 uppercase">{ot.zoneName} · {ot.collaborator.split(' ').slice(0, 2).join(' ')}</p>
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
              <h4 className="font-black text-slate-800 uppercase truncate">{ot.activities.join(', ')}</h4>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <MapPin size={10} className="text-blue-500" /> {ot.zoneName}
                </p>
                {ot.collaborator && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <User size={10} className="text-purple-500" /> {ot.collaborator.split(' ').slice(0, 2).join(' ')}
                  </p>
                )}
              </div>
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
    activities: editingItem?.activities ?? [],
    collaborator: editingItem?.collaborator ?? '',
    collaboratorRole: editingItem?.collaboratorRole ?? '',
    zoneName: editingItem?.zoneName ?? '',
    description: editingItem?.description ?? '',
    status: editingItem?.status ?? 'Pendiente',
    createdAt: editingItem?.createdAt,
  }));
  const [customActivity, setCustomActivity] = useState('');
  const [validationError, setValidationError] = useState('');

  const collaboratorOptions = COLLABORATORS.map(c => ({ value: c.name, subtitle: c.role }));
  const zoneOptions = ZONES.map(z => ({ value: z }));

  const handleToggleActivity = (activity: string) => {
    setForm(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity],
    }));
    setValidationError('');
  };

  const handleAddCustomActivity = () => {
    const trimmed = customActivity.trim();
    if (trimmed && !form.activities.includes(trimmed)) {
      setForm(prev => ({ ...prev, activities: [...prev.activities, trimmed] }));
      setCustomActivity('');
      setValidationError('');
    }
  };

  const handleSelectCollaborator = (name: string) => {
    const collab = COLLABORATORS.find(c => c.name === name);
    setForm(prev => ({
      ...prev,
      collaborator: name,
      collaboratorRole: collab?.role ?? '',
    }));
    setValidationError('');
  };

  const handleSave = () => {
    if (form.activities.length === 0) {
      setValidationError('Selecciona al menos una actividad');
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

        <div className="space-y-5">
          {/* Multi-select Activities */}
          <MultiSelectActivities
            selected={form.activities}
            onToggle={handleToggleActivity}
            customActivity={customActivity}
            onCustomActivityChange={setCustomActivity}
            onAddCustom={handleAddCustomActivity}
          />

          {/* Collaborator dropdown */}
          <Dropdown
            label="Colaborador"
            icon={User}
            options={collaboratorOptions}
            selected={form.collaborator}
            onSelect={handleSelectCollaborator}
            placeholder="Seleccionar colaborador..."
            searchable
          />

          {/* Zone dropdown */}
          <Dropdown
            label="Zona"
            icon={MapPin}
            options={zoneOptions}
            selected={form.zoneName}
            onSelect={(z) => { setForm(prev => ({ ...prev, zoneName: z })); setValidationError(''); }}
            placeholder="Seleccionar zona..."
            searchable
          />

          {/* Observations */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones</label>
            <textarea
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-medium text-sm min-h-[80px]"
              placeholder="..."
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Status */}
          <div className="flex gap-2">
            {Object.keys(STATUS_CONFIG).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, status: s }))}
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
            type="button"
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-transform"
          >
            GUARDAR
          </button>

          {editingItem?.id && (
            <div className="flex gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => onGeneratePDF(editingItem)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
              >
                <Download size={14} /> PDF
              </button>
              <button
                type="button"
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
        activities: data.activities ?? [],
        collaborator: data.collaborator ?? '',
        collaboratorRole: data.collaboratorRole ?? '',
        zoneName: data.zoneName ?? '',
        description: data.description ?? '',
        status: data.status ?? 'Pendiente',
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
    setEditingItem({ activities: [categoryName], status: 'Pendiente', zoneName: '', collaborator: '', collaboratorRole: '' });
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
    doc.text('REPORTE DE OPERACION', 105, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`CODIGO: ${ot.otId ?? ''}`, 105, 57, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Actividades:', 20, 70);
    doc.setFont('helvetica', 'normal');
    const actsText = (ot.activities ?? []).join(' / ') || 'Sin actividades';
    const splitActs = doc.splitTextToSize(actsText, 170);
    doc.text(splitActs, 20, 77);

    const afterActs = 77 + splitActs.length * 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Colaborador: ', 20, afterActs);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ot.collaborator ?? ''} - ${ot.collaboratorRole ?? ''}`, 55, afterActs);

    doc.setFont('helvetica', 'bold');
    doc.text('Zona: ', 20, afterActs + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(ot.zoneName ?? '', 40, afterActs + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Estado: ', 20, afterActs + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(ot.status ?? '', 47, afterActs + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Detalle:', 20, afterActs + 24);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(ot.description || 'Sin detalle adicional', 170);
    doc.text(splitDesc, 20, afterActs + 31);

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
