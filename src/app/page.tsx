'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  Zap, Leaf, Brush, Trash2, Wrench, Clock, CheckCircle2,
  MapPin, ChevronRight, X, Plus, LayoutDashboard, ClipboardList,
  Download, ChevronDown, Search, User, Tag, Camera, Image as ImageIcon
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
  collaborators: string[];
  zoneName: string;
  description: string;
  status: string;
  createdAt: number;
  photosBefore: string[];
  photosAfter: string[];
}

/* ─── External Store for localStorage (SSR-safe, no infinite loops) ─── */

const emptyWorkOrders: WorkOrder[] = [];
let cachedSnapshot: WorkOrder[] | null = null;
let cachedRaw: string | null = null;
let storeListeners: (() => void)[] = [];

function notifyStoreListeners() {
  for (const listener of storeListeners) listener();
}

function subscribeToStore(callback: () => void): () => void {
  storeListeners.push(callback);
  const onStorage = () => { cachedSnapshot = null; callback(); };
  window.addEventListener('storage', onStorage);
  return () => {
    storeListeners = storeListeners.filter(l => l !== callback);
    window.removeEventListener('storage', onStorage);
  };
}

function migrateWorkOrder(ot: any): WorkOrder {
  // Ensure collaborators is always an array (old format stored a single string)
  let collaborators: string[];
  if (Array.isArray(ot.collaborators)) {
    collaborators = ot.collaborators;
  } else if (typeof ot.collaborators === 'string' && ot.collaborators.trim()) {
    collaborators = [ot.collaborators];
  } else {
    collaborators = [];
  }
  // Ensure activities is always an array
  let activities: string[];
  if (Array.isArray(ot.activities)) {
    activities = ot.activities;
  } else if (typeof ot.activities === 'string' && ot.activities.trim()) {
    activities = [ot.activities];
  } else {
    activities = [];
  }
  return {
    ...ot,
    collaborators,
    activities,
    photosBefore: Array.isArray(ot.photosBefore) ? ot.photosBefore : [],
    photosAfter: Array.isArray(ot.photosAfter) ? ot.photosAfter : [],
  };
}

function getStoreSnapshot(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = raw ? JSON.parse(raw) : [];
      cachedSnapshot = Array.isArray(parsed) ? parsed.map(migrateWorkOrder) : [];
      // Persist migrated data back so we don't re-migrate every time
      const migratedRaw = JSON.stringify(cachedSnapshot);
      if (migratedRaw !== raw) {
        localStorage.setItem(STORAGE_KEY, migratedRaw);
      }
    }
  } catch (e) {
    console.error('Error al leer localStorage:', e);
    cachedSnapshot = [];
  }
  return cachedSnapshot ?? [];
}

function getServerSnapshot(): WorkOrder[] {
  return emptyWorkOrders;
}

function writeWorkOrders(updater: React.SetStateAction<WorkOrder[]>): void {
  try {
    const current = getStoreSnapshot();
    const next = typeof updater === 'function' ? updater(current) : updater;
    const raw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedSnapshot = next;
    notifyStoreListeners();
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
  }
}

/* ─── Utility functions ─── */

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
  } catch (e) { /* fallback */ }
  localStorage.setItem(COUNTER_KEY, counter.toString());
  return `OT-${String(counter).padStart(4, '0')}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('No canvas context'); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Multi-Select Collaborators Component ─── */

function MultiSelectCollaborators({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (name: string) => void;
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

  const filtered = search.trim()
    ? COLLABORATORS.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
      )
    : COLLABORATORS;

  return (
    <div ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <User size={10} /> Responsables
      </label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(name => (
            <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black">
              {name.split(' ').slice(0, 3).join(' ')}
              <button type="button" onClick={() => onToggle(name)} className="hover:text-red-500 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Toggle dropdown */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full p-4 mt-2 rounded-2xl bg-slate-50 border-none font-bold text-left flex items-center justify-between gap-2"
      >
        <span className="text-slate-400 text-sm">{selected.length > 0 ? `${selected.length} seleccionado(s)` : 'Seleccionar responsables...'}</span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div className="mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-56 overflow-hidden">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <Search size={14} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar colaborador..."
                className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-slate-300"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40 no-scrollbar">
            {filtered.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => onToggle(c.name)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors ${selected.includes(c.name) ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected.includes(c.name) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {selected.includes(c.name) && <span className="text-white text-[8px] font-black">✓</span>}
                  </div>
                  <div>
                    <span className={`block truncate ${selected.includes(c.name) ? 'text-blue-600 font-black' : 'text-slate-700 font-semibold'}`}>{c.name}</span>
                    <span className="block text-[9px] font-medium text-slate-400 normal-case truncate">{c.role}</span>
                  </div>
                </div>
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

/* ─── Custom Dropdown Component (single select) ─── */

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
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {selected.map(act => (
            <span key={act} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">
              {act}
              <button type="button" onClick={() => onToggle(act)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Photo Upload Component ─── */

function PhotoUpload({
  label,
  photos,
  onPhotosChange,
}: {
  label: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newPhotos: string[] = [...photos];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], 800, 0.6);
        newPhotos.push(compressed);
      } catch (e) {
        console.error('Error processing image:', e);
      }
    }
    onPhotosChange(newPhotos);
  };

  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Camera size={10} /> {label}
      </label>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
        {photos.map((photo, idx) => (
          <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group">
            <img src={photo} alt={`${label} ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onPhotosChange(photos.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
        >
          <ImageIcon size={18} />
          <span className="text-[7px] font-black uppercase">Agregar</span>
        </button>
      </div>
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
                <p className="font-bold text-sm uppercase truncate">{(ot.activities ?? []).join(', ')}</p>
                <p className="text-[10px] text-white/40 uppercase">{ot.zoneName} · {(ot.collaborators ?? []).map(c => c.split(' ').slice(0, 2).join(' ')).join(', ')}</p>
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
            <button key={cat.id} onClick={() => onCreateFromCategory(cat.name)} className="flex-shrink-0 flex flex-col items-center gap-2">
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
              <h4 className="font-black text-slate-800 uppercase truncate">{(ot.activities ?? []).join(', ')}</h4>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <MapPin size={10} className="text-blue-500" /> {ot.zoneName}
                </p>
                {(ot.collaborators ?? []).length > 0 && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <User size={10} className="text-purple-500" /> {(ot.collaborators ?? []).map(c => c.split(' ').slice(0, 2).join(' ')).join(', ')}
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
    collaborators: editingItem?.collaborators ?? [],
    zoneName: editingItem?.zoneName ?? '',
    description: editingItem?.description ?? '',
    status: editingItem?.status ?? 'Pendiente',
    createdAt: editingItem?.createdAt,
    photosBefore: editingItem?.photosBefore ?? [],
    photosAfter: editingItem?.photosAfter ?? [],
  }));
  const [customActivity, setCustomActivity] = useState('');
  const [validationError, setValidationError] = useState('');

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

  const handleToggleCollaborator = (name: string) => {
    setForm(prev => ({
      ...prev,
      collaborators: prev.collaborators.includes(name)
        ? prev.collaborators.filter(c => c !== name)
        : [...prev.collaborators, name],
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

  const handleSave = () => {
    if (form.activities.length === 0) {
      setValidationError('Selecciona al menos una actividad');
      return;
    }
    if (!form.zoneName) {
      setValidationError('Selecciona una zona');
      return;
    }
    if (!form.description.trim()) {
      setValidationError('Las observaciones son obligatorias');
      return;
    }
    if (form.collaborators.length === 0) {
      setValidationError('Selecciona al menos un responsable');
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
          <MultiSelectActivities
            selected={form.activities}
            onToggle={handleToggleActivity}
            customActivity={customActivity}
            onCustomActivityChange={setCustomActivity}
            onAddCustom={handleAddCustomActivity}
          />

          <MultiSelectCollaborators
            selected={form.collaborators}
            onToggle={handleToggleCollaborator}
          />

          <Dropdown
            label="Zona"
            icon={MapPin}
            options={zoneOptions}
            selected={form.zoneName}
            onSelect={(z) => { setForm(prev => ({ ...prev, zoneName: z })); setValidationError(''); }}
            placeholder="Seleccionar zona..."
            searchable
          />

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones *</label>
            <textarea
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-medium text-sm min-h-[80px]"
              placeholder="Detalle de la tarea..."
              value={form.description}
              onChange={e => { setForm(prev => ({ ...prev, description: e.target.value })); setValidationError(''); }}
            />
          </div>

          <PhotoUpload
            label="Fotos Antes"
            photos={form.photosBefore}
            onPhotosChange={(p) => setForm(prev => ({ ...prev, photosBefore: p }))}
          />
          <PhotoUpload
            label="Fotos Después"
            photos={form.photosAfter}
            onPhotosChange={(p) => setForm(prev => ({ ...prev, photosAfter: p }))}
          />

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

/* ─── PDF Generation (matching reference format exactly) ─── */

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('No canvas'); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function buildPDF(ot: Partial<WorkOrder>) {
  const doc = new jsPDF();
  const pw = 595.28;
  const ph = 841.89;
  const m = 57;
  const cw = pw - m * 2;

  // ─── Header: Logos ───
  try {
    const logo1 = await loadImageAsBase64('/logo-laguna.jpg');
    doc.addImage(logo1, 'JPEG', m, 29, 138, 64);
  } catch { /* skip */ }
  try {
    const logo2 = await loadImageAsBase64('/logo-empresa.png');
    doc.addImage(logo2, 'PNG', 445, 29, 98, 66);
  } catch { /* skip */ }

  // ─── Header: Title ───
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 40, 107);
  doc.setFontSize(10);
  doc.text('C O N D O M I N I O   &   P A R Q U E', pw / 2, 125, { align: 'center' });
  doc.setFontSize(14);
  doc.text('REPORTE DE OPERACION', pw / 2, 150, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`CODIGO: ${ot.otId ?? ''}`, pw / 2, 170, { align: 'center' });

  // ─── Divider ───
  doc.setDrawColor(31, 40, 107);
  doc.setLineWidth(0.5);
  doc.line(m, 185, pw - m, 185);

  // ─── Data Table with borders ───
  const tblX = m;
  const tblW = cw;
  const col1W = 70;
  const col2W = tblW / 2 - col1W;
  const col3W = 40;
  const col4W = tblW / 2 - col3W;
  const rowH = 22;
  let y = 200;

  const navy = [31, 40, 107];
  const labelColor = [50, 50, 50];
  const valueColor = [0, 0, 0];

  function drawRow(label: string, value: string, label2: string, value2: string) {
    // Row background
    doc.setFillColor(250, 250, 255);
    doc.rect(tblX, y, tblW, rowH, 'F');
    // Border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(tblX, y, tblW, rowH, 'S');
    doc.line(tblX + tblW / 2, y, tblX + tblW / 2, y + rowH);
    // Label column
    doc.setFillColor(240, 242, 255);
    doc.rect(tblX, y, col1W, rowH, 'F');
    doc.rect(tblX + tblW / 2, y, col3W, rowH, 'F');
    // Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...labelColor);
    doc.text(label, tblX + 5, y + 14);
    doc.text(label2, tblX + tblW / 2 + 5, y + 14);
    // Values
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...valueColor);
    doc.text(doc.splitTextToSize(value, col2W - 10)[0] || '', tblX + col1W + 5, y + 14);
    doc.text(doc.splitTextToSize(value2, col4W - 10)[0] || '', tblX + tblW / 2 + col3W + 5, y + 14);
    y += rowH;
  }

  drawRow('Actividad', (ot.activities ?? []).join(', '), 'Fecha', ot.createdAt ? formatDate(ot.createdAt) : '');
  drawRow('Estado', ot.status ?? '', 'Zona', ot.zoneName ?? '');
  drawRow('Area', (ot.activities ?? []).join(', '), 'Codigo', ot.otId ?? '');

  // Responsables row (may be taller)
  const respText = (ot.collaborators ?? []).join(', ');
  const splitResp = doc.splitTextToSize(respText, col2W + col4W + col3W - 10);
  const respRowH = Math.max(rowH, splitResp.length * 12 + 10);
  doc.setFillColor(250, 250, 255);
  doc.rect(tblX, y, tblW, respRowH, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(tblX, y, tblW, respRowH, 'S');
  doc.setFillColor(240, 242, 255);
  doc.rect(tblX, y, col1W, respRowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...labelColor);
  doc.text('Responsables', tblX + 5, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...valueColor);
  doc.text(splitResp, tblX + col1W + 5, y + 14);
  y += respRowH;

  // ─── Detalle de la Tarea ───
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('Detalle de la Tarea:', m, y);
  y += 10;

  // Box for detail
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  const descText = ot.description || 'Sin detalle adicional';
  const splitDesc = doc.splitTextToSize(descText, cw - 20);
  const descH = Math.max(30, splitDesc.length * 10 + 16);
  doc.setFillColor(252, 252, 255);
  doc.roundedRect(m, y, cw, descH, 3, 3, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...valueColor);
  doc.setFontSize(9);
  doc.text(splitDesc, m + 10, y + 12);
  y += descH + 15;

  // ─── EVIDENCIA FOTOGRAFICA ───
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('EVIDENCIA FOTOGRAFICA', pw / 2, y, { align: 'center' });
  y += 10;

  // Divider under title
  doc.setDrawColor(31, 40, 107);
  doc.setLineWidth(0.3);
  doc.line(m, y, pw - m, y);
  y += 10;

  // ANTES / DESPUES labels
  const photoW = 227;
  const photoH = 150;
  const gap = cw - photoW * 2;
  const beforeX = m;
  const afterX = m + photoW + gap;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...labelColor);
  doc.text('ANTES', beforeX + photoW / 2, y, { align: 'center' });
  doc.text('DESPUES', afterX + photoW / 2, y, { align: 'center' });
  y += 8;

  // Photo placeholder boxes
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 252);
  doc.roundedRect(beforeX, y, photoW, photoH, 4, 4, 'FD');
  doc.roundedRect(afterX, y, photoW, photoH, 4, 4, 'FD');

  const photosBefore = ot.photosBefore ?? [];
  const photosAfter = ot.photosAfter ?? [];

  if (photosBefore.length > 0) {
    try {
      doc.addImage(photosBefore[0], 'JPEG', beforeX + 2, y + 2, photoW - 4, photoH - 4);
    } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', beforeX + photoW / 2, y + photoH / 2, { align: 'center' });
  }

  if (photosAfter.length > 0) {
    try {
      doc.addImage(photosAfter[0], 'JPEG', afterX + 2, y + 2, photoW - 4, photoH - 4);
    } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', afterX + photoW / 2, y + photoH / 2, { align: 'center' });
  }
  y += photoH + 5;

  // Extra photos
  const extraBefore = photosBefore.slice(1);
  const extraAfter = photosAfter.slice(1);
  if (extraBefore.length > 0 || extraAfter.length > 0) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text('EVIDENCIA FOTOGRAFICA (continuacion)', pw / 2, 40, { align: 'center' });
    let py = 60;
    const pairs: { before?: string; after?: string }[] = [];
    const maxExtra = Math.max(extraBefore.length, extraAfter.length);
    for (let i = 0; i < maxExtra; i++) {
      pairs.push({ before: extraBefore[i], after: extraAfter[i] });
    }
    for (const pair of pairs) {
      if (py + photoH + 30 > ph) { doc.addPage(); py = 40; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...labelColor);
      if (pair.before) {
        doc.text('ANTES', beforeX + photoW / 2, py, { align: 'center' });
        py += 8;
        doc.setFillColor(248, 248, 252);
        doc.roundedRect(beforeX, py, photoW, photoH, 4, 4, 'FD');
        try { doc.addImage(pair.before, 'JPEG', beforeX + 2, py + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      }
      if (pair.after) {
        doc.text('DESPUES', afterX + photoW / 2, py - 8, { align: 'center' });
        doc.setFillColor(248, 248, 252);
        doc.roundedRect(afterX, py, photoW, photoH, 4, 4, 'FD');
        try { doc.addImage(pair.after, 'JPEG', afterX + 2, py + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      }
      py += photoH + 20;
    }
  }

  // ─── Footer ───
  const footerY = ph - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento generado automaticamente por Sistema de Gestion Laguna Norte.', pw / 2, footerY, { align: 'center' });
  doc.text('administracion asesorias integrales CyJ', pw / 2, footerY + 10, { align: 'center' });

  doc.save(`OT_${ot.otId ?? 'Reporte'}_Reporte.pdf`);
}

/* ─── Custom hook ─── */

function useLocalStorageWorkOrders(): [WorkOrder[], (updater: React.SetStateAction<WorkOrder[]>) => void] {
  const storedOrders = useSyncExternalStore(subscribeToStore, getStoreSnapshot, getServerSnapshot);
  return [storedOrders, writeWorkOrders];
}

/* ─── Main App ─── */

export default function Home() {
  const [view, setView] = useState<'dashboard' | 'ots'>('dashboard');
  const [workOrders, setWorkOrders] = useLocalStorageWorkOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WorkOrder> | null>(null);

  const handleSaveOT = useCallback((data: Partial<WorkOrder>) => {
    if (data.id) {
      setWorkOrders(prev => prev.map(ot => ot.id === data.id ? { ...ot, ...data } as WorkOrder : ot));
    } else {
      const newOT: WorkOrder = {
        id: generateUniqueId(),
        otId: generateOTId(),
        activities: data.activities ?? [],
        collaborators: data.collaborators ?? [],
        zoneName: data.zoneName ?? '',
        description: data.description ?? '',
        status: data.status ?? 'Pendiente',
        createdAt: Date.now(),
        photosBefore: data.photosBefore ?? [],
        photosAfter: data.photosAfter ?? [],
      };
      setWorkOrders(prev => [newOT, ...prev]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  }, [setWorkOrders]);

  const handleDeleteOT = useCallback((id: string) => {
    setWorkOrders(prev => prev.filter(o => o.id !== id));
    setIsModalOpen(false);
    setEditingItem(null);
  }, [setWorkOrders]);

  const handleCreateFromCategory = useCallback((categoryName: string) => {
    setEditingItem({ activities: [categoryName], collaborators: [], status: 'Pendiente', zoneName: '', description: '', photosBefore: [], photosAfter: [] });
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
    buildPDF(ot);
  }, []);

  return (
    <div className="max-w-xl mx-auto min-h-screen pb-32 bg-slate-50">
      <header className="p-6 bg-white border-b border-slate-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo-laguna.jpg" alt="Laguna Norte" className="h-10 rounded-lg" />
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Laguna Norte</h1>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Condominio & Parque</p>
          </div>
        </div>
        <img src="/logo-empresa.png" alt="CyJ" className="h-10 rounded-lg" />
      </header>

      <main className="p-6">
        {view === 'dashboard' ? (
          <Dashboard workOrders={workOrders} />
        ) : (
          <OTList workOrders={workOrders} onCreateFromCategory={handleCreateFromCategory} onEditOT={handleEditOT} />
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl rounded-[32px] p-4 flex justify-around items-center shadow-2xl border border-white z-50">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-300'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[8px] font-black uppercase">Inicio</span>
        </button>
        <button onClick={handleOpenNew} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 -mt-10 border-4 border-white active:scale-90 transition-transform">
          <Plus size={24} />
        </button>
        <button onClick={() => setView('ots')} className={`flex flex-col items-center gap-1 ${view === 'ots' ? 'text-blue-600' : 'text-slate-300'}`}>
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
