'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Leaf, Brush, Trash2, Wrench, Clock, CheckCircle2,
  MapPin, ChevronRight, X, Plus, ClipboardList,
  Download, ChevronDown, Search, User, Tag, Camera, Image as ImageIcon,
  RefreshCw, Settings, Pencil, Droplets, Flame
} from 'lucide-react';

/* ─── Data Structures ─── */

interface WorkArea {
  id: string;
  name: string;
  activities: string[];
  color: string;
}

interface Personnel {
  id: string;
  name: string;
  workAreaId: string;
}

interface Zone {
  id: string;
  name: string;
}

/* ─── Default Data ─── */

const DEFAULT_WORK_AREAS: WorkArea[] = [
  { id: 'jardineria', name: 'Jardinería', activities: ['Corte De Pasto', 'Desmalezado', 'Poda de Arbustos', 'Riego'], color: 'bg-green-600' },
  { id: 'recoleccion', name: 'Recolección y Aseo', activities: ['Barrido De Calles', 'Recolección De Basura', 'Limpieza de Quinchos', 'Limpieza Áreas Comunes'], color: 'bg-orange-500' },
  { id: 'piscinas', name: 'Piscinas y Laguna', activities: ['Limpieza De Piscina', 'Llenado De Piscina', 'Mantención Laguna', 'Tratamiento de Agua'], color: 'bg-cyan-500' },
  { id: 'mantenciones', name: 'Mantenciones', activities: ['Reparación Estructural', 'Pintura', 'Mantención General', 'Carpintería'], color: 'bg-purple-500' },
  { id: 'electricas', name: 'Eléctricas y Mantenciones', activities: ['Reparación Eléctrica', 'Mantención Eléctrica', 'Iluminación'], color: 'bg-yellow-500' },
];

const DEFAULT_PERSONNEL: Personnel[] = [
  { id: 'p1', name: 'Cesar Edmundo Adasme Aravena', workAreaId: 'jardineria' },
  { id: 'p2', name: 'Luis Alejandro Torres Bustos', workAreaId: 'jardineria' },
  { id: 'p3', name: 'Chris Esther Godoy Espinoza', workAreaId: 'recoleccion' },
  { id: 'p4', name: 'Erik Alberto Arteaga Burgos', workAreaId: 'recoleccion' },
  { id: 'p5', name: 'Marie Ginette Dorne', workAreaId: 'recoleccion' },
  { id: 'p6', name: 'Jeantelus Fleurissaint', workAreaId: 'recoleccion' },
  { id: 'p7', name: 'Paulo César Toro Pino', workAreaId: 'piscinas' },
  { id: 'p8', name: 'Macario Enrique Manríquez Trigo', workAreaId: 'piscinas' },
  { id: 'p9', name: 'Carlos Alberto Zamorano Torres', workAreaId: 'mantenciones' },
  { id: 'p10', name: 'Jose Luis Venegas Poblete', workAreaId: 'mantenciones' },
  { id: 'p11', name: 'Francisco Marcial Fuentes Carrasco', workAreaId: 'electricas' },
];

const DEFAULT_ZONES: Zone[] = [
  { id: 'z1', name: 'Club House' },
  { id: 'z2', name: 'Piscina 1' },
  { id: 'z3', name: 'Piscina 2' },
  { id: 'z4', name: 'Piscina 3' },
  { id: 'z5', name: 'Mirador' },
  { id: 'z6', name: 'Muelle' },
  { id: 'z7', name: 'Juegos Muelle' },
  { id: 'z8', name: 'Quinchos' },
  { id: 'z9', name: 'Multicancha' },
  { id: 'z10', name: 'Cancha Sintética' },
  { id: 'z11', name: 'Avenida Principal' },
  { id: 'z12', name: 'Canquén' },
  { id: 'z13', name: 'Albatros' },
  { id: 'z14', name: 'Bandurrias' },
  { id: 'z15', name: 'Becacinas' },
  { id: 'z16', name: 'Flamencos' },
  { id: 'z17', name: 'Faisanes' },
  { id: 'z18', name: 'Garzas' },
  { id: 'z19', name: 'Gaviotas' },
  { id: 'z20', name: 'Otro' },
];

/* ─── Other constants ─── */

const CATEGORIES = [
  { id: 'jardineria', name: 'Jardinería', icon: Leaf, color: 'bg-green-600', workAreaId: 'jardineria' },
  { id: 'recoleccion', name: 'Recolección y Aseo', icon: Trash2, color: 'bg-orange-500', workAreaId: 'recoleccion' },
  { id: 'piscinas', name: 'Piscinas y Laguna', icon: Droplets, color: 'bg-cyan-500', workAreaId: 'piscinas' },
  { id: 'mantenciones', name: 'Mantenciones', icon: Wrench, color: 'bg-purple-500', workAreaId: 'mantenciones' },
  { id: 'electricas', name: 'Eléctricas', icon: Zap, color: 'bg-yellow-500', workAreaId: 'electricas' },
] as const;

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  'Pendiente': { color: 'bg-red-500', text: 'text-red-500' },
  'En Proceso': { color: 'bg-amber-500', text: 'text-amber-600' },
  'Terminada': { color: 'bg-emerald-500', text: 'text-emerald-600' },
};

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

/* ─── Migration helper (backward compat) ─── */

function migrateWorkOrder(ot: any): WorkOrder {
  let collaborators: string[];
  if (Array.isArray(ot.collaborators)) {
    collaborators = ot.collaborators;
  } else if (typeof ot.collaborators === 'string' && ot.collaborators.trim()) {
    collaborators = [ot.collaborators];
  } else {
    collaborators = [];
  }
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

/* ─── LocalStorage helpers ─── */

const STORAGE_KEY = 'laguna_norte_ots';
const COUNTER_KEY = 'laguna_norte_ot_counter';
const WORK_AREAS_KEY = 'laguna_norte_work_areas';
const PERSONNEL_KEY = 'laguna_norte_personnel';
const ZONES_KEY = 'laguna_norte_zones';

function readFromLocalStorage(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(migrateWorkOrder) : [];
  } catch {
    return [];
  }
}

function writeToLocalStorage(orders: WorkOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
  }
}

function readCounterFromLocalStorage(): number {
  try {
    const stored = localStorage.getItem(COUNTER_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function writeCounterToLocalStorage(counter: number) {
  try {
    localStorage.setItem(COUNTER_KEY, counter.toString());
  } catch { /* ignore */ }
}

/* ─── Config Data localStorage helpers ─── */

function loadWorkAreas(): WorkArea[] {
  try {
    const raw = localStorage.getItem(WORK_AREAS_KEY);
    if (!raw) {
      localStorage.setItem(WORK_AREAS_KEY, JSON.stringify(DEFAULT_WORK_AREAS));
      return DEFAULT_WORK_AREAS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WORK_AREAS;
  } catch {
    return DEFAULT_WORK_AREAS;
  }
}

function saveWorkAreas(areas: WorkArea[]) {
  try {
    localStorage.setItem(WORK_AREAS_KEY, JSON.stringify(areas));
  } catch { /* ignore */ }
}

function loadPersonnel(): Personnel[] {
  try {
    const raw = localStorage.getItem(PERSONNEL_KEY);
    if (!raw) {
      localStorage.setItem(PERSONNEL_KEY, JSON.stringify(DEFAULT_PERSONNEL));
      return DEFAULT_PERSONNEL;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PERSONNEL;
  } catch {
    return DEFAULT_PERSONNEL;
  }
}

function savePersonnel(personnel: Personnel[]) {
  try {
    localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnel));
  } catch { /* ignore */ }
}

function loadZones(): Zone[] {
  try {
    const raw = localStorage.getItem(ZONES_KEY);
    if (!raw) {
      localStorage.setItem(ZONES_KEY, JSON.stringify(DEFAULT_ZONES));
      return DEFAULT_ZONES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ZONES;
  } catch {
    return DEFAULT_ZONES;
  }
}

function saveZones(zones: Zone[]) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
  } catch { /* ignore */ }
}

/* ─── Custom Hook: useWorkOrders (Hybrid: localStorage + API sync with immediate push) ─── */

function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);
  const mountedRef = useRef(false);

  // Fetch from API; fallback to localStorage
  const fetchWorkOrders = useCallback(async (showSyncIndicator = false) => {
    try {
      if (showSyncIndicator) setSyncing(true);
      const res = await fetch('/api/workorders');
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      const migrated = Array.isArray(data) ? data.map(migrateWorkOrder) : [];
      setWorkOrders(migrated);
      writeToLocalStorage(migrated);
      setApiAvailable(true);
      setLastSync(Date.now());
    } catch {
      setApiAvailable(false);
      const local = readFromLocalStorage();
      setWorkOrders(local);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  // Initial load + polling every 5 seconds for cross-device sync
  useEffect(() => {
    mountedRef.current = true;

    // First load from localStorage for instant display
    const local = readFromLocalStorage();
    if (local.length > 0) {
      setWorkOrders(local);
      setLoading(false);
    }

    // Then fetch from API (authoritative source)
    fetchWorkOrders(true);

    // Poll every 5 seconds for near-real-time cross-device sync
    const interval = setInterval(() => {
      fetchWorkOrders(false);
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const createWorkOrder = useCallback(async (data: Partial<WorkOrder>): Promise<WorkOrder | null> => {
    let counter = readCounterFromLocalStorage();
    counter++;
    writeCounterToLocalStorage(counter);
    const otId = `OT-${String(counter).padStart(4, '0')}`;

    const newOT: WorkOrder = {
      id: generateUniqueId(),
      otId,
      activities: data.activities ?? [],
      collaborators: data.collaborators ?? [],
      zoneName: data.zoneName ?? '',
      description: data.description ?? '',
      status: data.status ?? 'Pendiente',
      createdAt: Date.now(),
      photosBefore: data.photosBefore ?? [],
      photosAfter: data.photosAfter ?? [],
    };

    // Save to state + localStorage immediately (always works offline)
    setWorkOrders(prev => {
      const updated = [newOT, ...prev];
      writeToLocalStorage(updated);
      return updated;
    });

    // Push to API immediately — this is what syncs across devices
    try {
      const res = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOT),
      });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
        // Re-fetch to confirm server state and get any other device's changes
        fetchWorkOrders(false);
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return newOT;
  }, [fetchWorkOrders]);

  const updateWorkOrder = useCallback(async (data: Partial<WorkOrder>): Promise<WorkOrder | null> => {
    if (!data.id) return null;

    // Update state + localStorage immediately
    setWorkOrders(prev => {
      const updated = prev.map(ot => ot.id === data.id ? { ...ot, ...data } as WorkOrder : ot);
      writeToLocalStorage(updated);
      return updated;
    });

    // Push to API immediately for cross-device sync
    try {
      const res = await fetch(`/api/workorders/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
        fetchWorkOrders(false);
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return { ...data } as WorkOrder;
  }, [fetchWorkOrders]);

  const deleteWorkOrder = useCallback(async (id: string): Promise<boolean> => {
    // Delete from state + localStorage immediately
    setWorkOrders(prev => {
      const updated = prev.filter(ot => ot.id !== id);
      writeToLocalStorage(updated);
      return updated;
    });

    // Push deletion to API immediately for cross-device sync
    try {
      const res = await fetch(`/api/workorders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApiAvailable(true);
        setLastSync(Date.now());
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    return true;
  }, []);

  return {
    workOrders,
    loading,
    syncing,
    apiAvailable,
    lastSync,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
  };
}

/* ─── Custom Hook: useConfigData ─── */

function useConfigData() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(() => loadWorkAreas());
  const [personnel, setPersonnel] = useState<Personnel[]>(() => loadPersonnel());
  const [zones, setZones] = useState<Zone[]>(() => loadZones());

  const updateWorkAreas = useCallback((areas: WorkArea[]) => {
    setWorkAreas(areas);
    saveWorkAreas(areas);
  }, []);

  const updatePersonnel = useCallback((p: Personnel[]) => {
    setPersonnel(p);
    savePersonnel(p);
  }, []);

  const updateZones = useCallback((z: Zone[]) => {
    setZones(z);
    saveZones(z);
  }, []);

  return { workAreas, personnel, zones, updateWorkAreas, updatePersonnel, updateZones };
}

/* ─── Utility functions ─── */

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
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

/* ─── Multi-Select Collaborators Component (now takes filtered list) ─── */

function MultiSelectCollaborators({
  selected,
  onToggle,
  availableCollaborators,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  availableCollaborators: { name: string; workAreaName: string }[];
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
    ? availableCollaborators.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.workAreaName.toLowerCase().includes(search.toLowerCase())
      )
    : availableCollaborators;

  return (
    <div ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <User size={10} /> Responsables
      </label>

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

      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full p-4 mt-2 rounded-2xl bg-slate-50 border-none font-bold text-left flex items-center justify-between gap-2"
      >
        <span className="text-slate-400 text-sm">{selected.length > 0 ? `${selected.length} seleccionado(s)` : 'Seleccionar responsables...'}</span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

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
                    <span className="block text-[9px] font-medium text-slate-400 normal-case truncate">{c.workAreaName}</span>
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
  options: { value: string; subtitle?: string; colorDot?: string }[];
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
            <span className="flex items-center gap-2">
              {selectedOption.colorDot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedOption.colorDot}`} />}
              <span className="flex flex-col truncate">
                <span className="truncate">{selectedOption.value}</span>
                {selectedOption.subtitle && (
                  <span className="text-[9px] font-medium text-slate-400 normal-case truncate">{selectedOption.subtitle}</span>
                )}
              </span>
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
                <span className="flex items-center gap-2">
                  {opt.colorDot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.colorDot}`} />}
                  <span className="flex flex-col truncate">
                    <span className="truncate">{opt.value}</span>
                    {opt.subtitle && (
                      <span className="text-[9px] font-medium text-slate-400 normal-case truncate">{opt.subtitle}</span>
                    )}
                  </span>
                </span>
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

/* ─── Multi-Select Activities Component (now takes filtered list) ─── */

function MultiSelectActivities({
  selected,
  onToggle,
  customActivity,
  onCustomActivityChange,
  onAddCustom,
  availableActivities,
}: {
  selected: string[];
  onToggle: (activity: string) => void;
  customActivity: string;
  onCustomActivityChange: (val: string) => void;
  onAddCustom: () => void;
  availableActivities: string[];
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Tag size={10} /> Actividades
      </label>
      <div className="flex flex-wrap gap-2 mt-2">
        {availableActivities.map(act => {
          const isSelected = selected.includes(act);
          return (
            <button
              key={act}
              type="button"
              onClick={() => onToggle(act)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    // Reset input value so the same file can be selected again
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
        <Camera size={10} /> {label}
      </label>
      {/* Camera input — opens camera directly on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {/* Gallery input — opens file picker / gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
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
        {/* Camera button — opens camera directly */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center gap-1 text-blue-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Camera size={18} />
          <span className="text-[7px] font-black uppercase">Cámara</span>
        </button>
        {/* Gallery button — opens file picker / gallery */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
        >
          <ImageIcon size={18} />
          <span className="text-[7px] font-black uppercase">Galería</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Admin Panel Component ─── */

type AdminTab = 'areas' | 'personal' | 'zonas';

function AdminPanel({
  isOpen,
  onClose,
  workAreas,
  personnel,
  zones,
  onUpdateWorkAreas,
  onUpdatePersonnel,
  onUpdateZones,
}: {
  isOpen: boolean;
  onClose: () => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
  onUpdateWorkAreas: (areas: WorkArea[]) => void;
  onUpdatePersonnel: (p: Personnel[]) => void;
  onUpdateZones: (z: Zone[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('areas');
  const [editingArea, setEditingArea] = useState<WorkArea | null>(null);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('bg-green-600');
  const [newAreaActivities, setNewAreaActivities] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonWorkAreaId, setNewPersonWorkAreaId] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  const COLOR_OPTIONS = [
    'bg-green-600', 'bg-orange-500', 'bg-cyan-500', 'bg-purple-500', 'bg-yellow-500',
    'bg-red-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
  ];

  if (!isOpen) return null;

  // Work Area CRUD
  const handleAddArea = () => {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const activities = newAreaActivities.split(',').map(a => a.trim()).filter(Boolean);
    const newArea: WorkArea = { id: 'wa_' + generateUniqueId(), name: trimmed, activities, color: newAreaColor };
    onUpdateWorkAreas([...workAreas, newArea]);
    setNewAreaName('');
    setNewAreaActivities('');
    setNewAreaColor('bg-green-600');
  };

  const handleDeleteArea = (id: string) => {
    onUpdateWorkAreas(workAreas.filter(a => a.id !== id));
    // Also remove personnel references
    onUpdatePersonnel(personnel.filter(p => p.workAreaId !== id));
  };

  const handleSaveArea = () => {
    if (!editingArea) return;
    const activities = newAreaActivities.split(',').map(a => a.trim()).filter(Boolean);
    const updated = workAreas.map(a => a.id === editingArea.id ? { ...a, name: newAreaName.trim() || a.name, activities, color: newAreaColor } : a);
    onUpdateWorkAreas(updated);
    setEditingArea(null);
    setNewAreaName('');
    setNewAreaActivities('');
    setNewAreaColor('bg-green-600');
  };

  const startEditArea = (area: WorkArea) => {
    setEditingArea(area);
    setNewAreaName(area.name);
    setNewAreaActivities(area.activities.join(', '));
    setNewAreaColor(area.color);
  };

  // Personnel CRUD
  const handleAddPerson = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed || !newPersonWorkAreaId) return;
    const newPerson: Personnel = { id: 'p_' + generateUniqueId(), name: trimmed, workAreaId: newPersonWorkAreaId };
    onUpdatePersonnel([...personnel, newPerson]);
    setNewPersonName('');
    setNewPersonWorkAreaId('');
  };

  const handleDeletePerson = (id: string) => {
    onUpdatePersonnel(personnel.filter(p => p.id !== id));
  };

  const handleSavePerson = () => {
    if (!editingPerson) return;
    const updated = personnel.map(p => p.id === editingPerson.id ? { ...p, name: newPersonName.trim() || p.name, workAreaId: newPersonWorkAreaId || p.workAreaId } : p);
    onUpdatePersonnel(updated);
    setEditingPerson(null);
    setNewPersonName('');
    setNewPersonWorkAreaId('');
  };

  const startEditPerson = (person: Personnel) => {
    setEditingPerson(person);
    setNewPersonName(person.name);
    setNewPersonWorkAreaId(person.workAreaId);
  };

  // Zone CRUD
  const handleAddZone = () => {
    const trimmed = newZoneName.trim();
    if (!trimmed) return;
    const newZone: Zone = { id: 'z_' + generateUniqueId(), name: trimmed };
    onUpdateZones([...zones, newZone]);
    setNewZoneName('');
  };

  const handleDeleteZone = (id: string) => {
    onUpdateZones(zones.filter(z => z.id !== id));
  };

  const handleSaveZone = () => {
    if (!editingZone) return;
    const updated = zones.map(z => z.id === editingZone.id ? { ...z, name: newZoneName.trim() || z.name } : z);
    onUpdateZones(updated);
    setEditingZone(null);
    setNewZoneName('');
  };

  const startEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setNewZoneName(zone.name);
  };

  const getWorkAreaName = (id: string) => workAreas.find(a => a.id === id)?.name ?? 'Sin área';

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'areas', label: 'Áreas de Trabajo' },
    { key: 'personal', label: 'Personal' },
    { key: 'zonas', label: 'Zonas' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl no-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-4 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
            <Settings size={18} /> Administración
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setEditingArea(null); setEditingPerson(null); setEditingZone(null); }}
              className={`flex-1 py-3 text-[9px] font-black uppercase transition-all ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* ─── Work Areas Tab ─── */}
          {activeTab === 'areas' && (
            <>
              {workAreas.map(area => (
                <div key={area.id} className="bg-slate-50 rounded-2xl p-4">
                  {editingArea?.id === area.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newAreaName}
                        onChange={e => setNewAreaName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre del área"
                      />
                      <input
                        type="text"
                        value={newAreaActivities}
                        onChange={e => setNewAreaActivities(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Actividades separadas por coma"
                      />
                      <div className="flex flex-wrap gap-1">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewAreaColor(c)}
                            className={`w-6 h-6 rounded-full ${c} ${newAreaColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveArea} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                        <button onClick={() => { setEditingArea(null); setNewAreaName(''); setNewAreaActivities(''); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full ${area.color}`} />
                          <span className="font-black text-slate-800 text-sm uppercase">{area.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditArea(area)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteArea(area.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {area.activities.map(act => (
                          <span key={act} className="px-2 py-1 bg-white text-slate-500 rounded-lg text-[9px] font-bold">{act}</span>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-400 mt-2 font-bold uppercase">
                        {personnel.filter(p => p.workAreaId === area.id).length} persona(s)
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new area */}
              {!editingArea && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Área de Trabajo</p>
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Nombre del área"
                  />
                  <input
                    type="text"
                    value={newAreaActivities}
                    onChange={e => setNewAreaActivities(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Actividades separadas por coma"
                  />
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewAreaColor(c)}
                        className={`w-6 h-6 rounded-full ${c} ${newAreaColor === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleAddArea}
                    disabled={!newAreaName.trim()}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    <Plus size={14} className="inline mr-1" /> Agregar Área
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── Personnel Tab ─── */}
          {activeTab === 'personal' && (
            <>
              {personnel.map(person => (
                <div key={person.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  {editingPerson?.id === person.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newPersonName}
                        onChange={e => setNewPersonName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre completo"
                      />
                      <select
                        value={newPersonWorkAreaId}
                        onChange={e => setNewPersonWorkAreaId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                      >
                        <option value="">Seleccionar área...</option>
                        {workAreas.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleSavePerson} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                        <button onClick={() => { setEditingPerson(null); setNewPersonName(''); setNewPersonWorkAreaId(''); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{person.name}</p>
                        <p className="text-[9px] font-medium text-slate-400">{getWorkAreaName(person.workAreaId)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditPerson(person)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDeletePerson(person.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new person */}
              {!editingPerson && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Personal</p>
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={e => setNewPersonName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                    placeholder="Nombre completo"
                  />
                  <select
                    value={newPersonWorkAreaId}
                    onChange={e => setNewPersonWorkAreaId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                  >
                    <option value="">Seleccionar área...</option>
                    {workAreas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddPerson}
                    disabled={!newPersonName.trim() || !newPersonWorkAreaId}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                  >
                    <Plus size={14} className="inline mr-1" /> Agregar Personal
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── Zones Tab ─── */}
          {activeTab === 'zonas' && (
            <>
              {zones.map(zone => (
                <div key={zone.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  {editingZone?.id === zone.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newZoneName}
                        onChange={e => setNewZoneName(e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-white border border-slate-200 font-bold text-sm"
                        placeholder="Nombre de zona"
                      />
                      <button onClick={handleSaveZone} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">Guardar</button>
                      <button onClick={() => { setEditingZone(null); setNewZoneName(''); }} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase">X</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-700 text-sm">{zone.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditZone(zone)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add new zone */}
              {!editingZone && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Agregar Zona</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={e => setNewZoneName(e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-slate-50 border-none font-bold text-sm"
                      placeholder="Nombre de zona"
                    />
                    <button
                      onClick={handleAddZone}
                      disabled={!newZoneName.trim()}
                      className="px-4 py-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
  workAreas,
  personnel,
  zones,
}: {
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
}) {
  const [form, setForm] = useState(() => {
    // Try to infer work area from editing item's activities
    let initialWorkAreaId = '';
    if (editingItem?.activities && editingItem.activities.length > 0) {
      for (const wa of loadWorkAreas()) {
        if (editingItem.activities.some(a => wa.activities.includes(a))) {
          initialWorkAreaId = wa.id;
          break;
        }
      }
    }
    return {
      id: editingItem?.id,
      otId: editingItem?.otId,
      workAreaId: initialWorkAreaId,
      activities: editingItem?.activities ?? [],
      collaborators: editingItem?.collaborators ?? [],
      zoneName: editingItem?.zoneName ?? '',
      description: editingItem?.description ?? '',
      status: editingItem?.status ?? 'Pendiente',
      createdAt: editingItem?.createdAt,
      photosBefore: editingItem?.photosBefore ?? [],
      photosAfter: editingItem?.photosAfter ?? [],
    };
  });
  const [customActivity, setCustomActivity] = useState('');
  const [validationError, setValidationError] = useState('');
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(!!editingItem?.description);

  // Derived filtered data based on selected work area
  const selectedWorkArea = workAreas.find(wa => wa.id === form.workAreaId);
  const filteredActivities = selectedWorkArea ? selectedWorkArea.activities : [];
  const filteredCollaborators = form.workAreaId
    ? personnel.filter(p => p.workAreaId === form.workAreaId).map(p => ({
        name: p.name,
        workAreaName: workAreas.find(wa => wa.id === p.workAreaId)?.name ?? '',
      }))
    : personnel.map(p => ({
        name: p.name,
        workAreaName: workAreas.find(wa => wa.id === p.workAreaId)?.name ?? '',
      }));

  const zoneOptions = zones.map(z => ({ value: z.name }));

  const workAreaOptions = workAreas.map(wa => ({
    value: wa.id,
    subtitle: `${wa.activities.length} actividades, ${personnel.filter(p => p.workAreaId === wa.id).length} personas`,
    colorDot: wa.color,
  }));

  // Auto-generate description
  const generateDescription = useCallback((activities: string[], collaborators: string[], workAreaName: string) => {
    const actStr = activities.length > 0 ? activities.join(', ') : '';
    const collStr = collaborators.length > 0 ? collaborators.join(', ') : '';
    const parts: string[] = [];
    if (actStr) parts.push(`Realizar ${actStr}`);
    if (workAreaName) parts.push(`en área ${workAreaName}`);
    if (collStr) parts.push(`Personal asignado: ${collStr}`);
    return parts.join('. ') + '.';
  }, []);

  // Handle work area change
  const handleWorkAreaChange = useCallback((workAreaId: string) => {
    const wa = workAreas.find(a => a.id === workAreaId);
    if (!wa) {
      setForm(prev => ({ ...prev, workAreaId: '', activities: [], collaborators: [] }));
      return;
    }

    // Filter activities: keep only those in the new work area
    const keptActivities = form.activities.filter(a => wa.activities.includes(a));

    // Auto-select all personnel from the new work area
    const areaPersonnel = personnel.filter(p => p.workAreaId === workAreaId).map(p => p.name);

    const newDescription = generateDescription(keptActivities, areaPersonnel, wa.name);

    setForm(prev => ({
      ...prev,
      workAreaId,
      activities: keptActivities,
      collaborators: areaPersonnel,
      description: descriptionManuallyEdited ? prev.description : newDescription,
    }));
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, personnel, form.activities, generateDescription, descriptionManuallyEdited]);

  const handleToggleActivity = useCallback((activity: string) => {
    setForm(prev => {
      const newActivities = prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity];
      const wa = workAreas.find(a => a.id === prev.workAreaId);
      const newDescription = generateDescription(newActivities, prev.collaborators, wa?.name ?? '');
      return {
        ...prev,
        activities: newActivities,
        description: descriptionManuallyEdited ? prev.description : newDescription,
      };
    });
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, generateDescription, descriptionManuallyEdited]);

  const handleToggleCollaborator = useCallback((name: string) => {
    setForm(prev => {
      const newCollaborators = prev.collaborators.includes(name)
        ? prev.collaborators.filter(c => c !== name)
        : [...prev.collaborators, name];
      const wa = workAreas.find(a => a.id === prev.workAreaId);
      const newDescription = generateDescription(prev.activities, newCollaborators, wa?.name ?? '');
      return {
        ...prev,
        collaborators: newCollaborators,
        description: descriptionManuallyEdited ? prev.description : newDescription,
      };
    });
    setDescriptionManuallyEdited(false);
    setValidationError('');
  }, [workAreas, generateDescription, descriptionManuallyEdited]);

  const handleAddCustomActivity = () => {
    const trimmed = customActivity.trim();
    if (trimmed && !form.activities.includes(trimmed)) {
      setForm(prev => {
        const newActivities = [...prev.activities, trimmed];
        const wa = workAreas.find(a => a.id === prev.workAreaId);
        const newDescription = generateDescription(newActivities, prev.collaborators, wa?.name ?? '');
        return {
          ...prev,
          activities: newActivities,
          description: descriptionManuallyEdited ? prev.description : newDescription,
        };
      });
      setDescriptionManuallyEdited(false);
      setCustomActivity('');
      setValidationError('');
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescriptionManuallyEdited(true);
    setForm(prev => ({ ...prev, description: value }));
    setValidationError('');
  };

  const handleSave = () => {
    if (!form.workAreaId) {
      setValidationError('Selecciona un área de trabajo');
      return;
    }
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
          {/* 1. Work Area Selector */}
          <Dropdown
            label="Área de Trabajo"
            icon={Settings}
            options={workAreaOptions}
            selected={form.workAreaId}
            onSelect={handleWorkAreaChange}
            placeholder="Seleccionar área de trabajo..."
          />

          {/* 2. Activities (filtered by work area) */}
          <MultiSelectActivities
            selected={form.activities}
            onToggle={handleToggleActivity}
            customActivity={customActivity}
            onCustomActivityChange={setCustomActivity}
            onAddCustom={handleAddCustomActivity}
            availableActivities={filteredActivities}
          />

          {/* 3. Collaborators (filtered by work area) */}
          <MultiSelectCollaborators
            selected={form.collaborators}
            onToggle={handleToggleCollaborator}
            availableCollaborators={filteredCollaborators}
          />

          {/* 4. Zone */}
          <Dropdown
            label="Zona"
            icon={MapPin}
            options={zoneOptions}
            selected={form.zoneName}
            onSelect={(z) => { setForm(prev => ({ ...prev, zoneName: z })); setValidationError(''); }}
            placeholder="Seleccionar zona..."
            searchable
          />

          {/* 5. Observations (auto-generated but editable) */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones *</label>
            <textarea
              className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-medium text-sm min-h-[80px]"
              placeholder="Detalle de la tarea..."
              value={form.description}
              onChange={e => handleDescriptionChange(e.target.value)}
            />
          </div>

          {/* 6. Photos */}
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

          {/* 7. Status */}
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
  workAreas,
  personnel,
  zones,
}: {
  isOpen: boolean;
  editingItem: Partial<WorkOrder> | null;
  onClose: () => void;
  onSave: (data: Partial<WorkOrder>) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (ot: Partial<WorkOrder>) => void;
  workAreas: WorkArea[];
  personnel: Personnel[];
  zones: Zone[];
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
      workAreas={workAreas}
      personnel={personnel}
      zones={zones}
    />
  );
}

/* ─── PDF Generation ─── */

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

function addPageFooter(doc: any, pw: number, ph: number) {
  const footerY = ph - 30;
  doc.setDrawColor(31, 40, 107);
  doc.setLineWidth(0.5);
  doc.line(40, footerY - 8, pw - 40, footerY - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Documento generado automaticamente por Sistema de Gestion Laguna Norte', pw / 2, footerY, { align: 'center' });
  doc.text('Administracion - Asesorias Integrales CyJ', pw / 2, footerY + 8, { align: 'center' });
}

async function buildPDF(ot: Partial<WorkOrder>) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = 595.28;
  const ph = 841.89;
  const m = 40;
  const cw = pw - m * 2;

  const navy = [31, 40, 107];
  const navyLight = [230, 233, 245];
  const valueColor = [30, 30, 30];
  const borderColor = [190, 195, 210];

  let y = 30;

  try {
    const logo1 = await loadImageAsBase64('/logo-laguna.jpg');
    doc.addImage(logo1, 'JPEG', m, y, 130, 52);
  } catch { /* skip */ }

  try {
    const logo2 = await loadImageAsBase64('/logo-empresa.png');
    doc.addImage(logo2, 'PNG', pw - m - 90, y, 90, 52);
  } catch { /* skip */ }

  y += 62;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(9);
  doc.text('C O N D O M I N I O   &   P A R Q U E', pw / 2, y, { align: 'center' });
  y += 16;
  doc.setFontSize(14);
  doc.text('REPORTE DE OPERACION', pw / 2, y, { align: 'center' });
  y += 14;
  doc.setFontSize(10);
  doc.text(`CODIGO: ${ot.otId ?? ''}`, pw / 2, y, { align: 'center' });
  y += 12;

  doc.setDrawColor(...navy);
  doc.setLineWidth(1.5);
  doc.line(m, y, pw - m, y);
  y += 14;

  const tblX = m;
  const tblW = cw;
  const labelColW = 90;
  const halfW = tblW / 2;
  const valColW = halfW - labelColW;
  const rowH = 24;

  function drawTableRow(
    label1: string, value1: string,
    label2: string, value2: string,
    rowY: number
  ): number {
    doc.setFillColor(252, 252, 255);
    doc.rect(tblX, rowY, tblW, rowH, 'F');
    doc.setFillColor(...navyLight);
    doc.rect(tblX, rowY, labelColW, rowH, 'F');
    doc.setFillColor(...navyLight);
    doc.rect(tblX + halfW, rowY, labelColW, rowH, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(tblX, rowY, tblW, rowH, 'S');
    doc.line(tblX + halfW, rowY, tblX + halfW, rowY + rowH);
    doc.line(tblX + labelColW, rowY, tblX + labelColW, rowY + rowH);
    doc.line(tblX + halfW + labelColW, rowY, tblX + halfW + labelColW, rowY + rowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...navy);
    doc.text(label1, tblX + 6, rowY + 15);
    doc.text(label2, tblX + halfW + 6, rowY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...valueColor);
    const v1 = doc.splitTextToSize(value1, valColW - 12);
    const v2 = doc.splitTextToSize(value2, valColW - 12);
    doc.text(v1[0] || '', tblX + labelColW + 6, rowY + 15);
    doc.text(v2[0] || '', tblX + halfW + labelColW + 6, rowY + 15);
    return rowY + rowH;
  }

  doc.setFillColor(...navy);
  doc.rect(tblX, y, tblW, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('INFORMACION DE LA ORDEN', tblX + 6, y + 15);
  doc.text('DETALLE', tblX + halfW + 6, y + 15);
  y += rowH;

  const activities = (ot.activities ?? []).join(', ');
  const collaborators = (ot.collaborators ?? []).join(', ');
  const dateStr = ot.createdAt ? formatDate(ot.createdAt) : '';

  y = drawTableRow('Actividad', activities, 'Fecha', dateStr, y);
  y = drawTableRow('Estado', ot.status ?? '', 'Zona', ot.zoneName ?? '', y);
  y = drawTableRow('Codigo', ot.otId ?? '', 'Area', activities, y);

  const respSplit = doc.splitTextToSize(collaborators, tblW - labelColW - 12);
  const respH = Math.max(rowH, respSplit.length * 11 + 12);

  doc.setFillColor(252, 252, 255);
  doc.rect(tblX, y, tblW, respH, 'F');
  doc.setFillColor(...navyLight);
  doc.rect(tblX, y, labelColW, respH, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.rect(tblX, y, tblW, respH, 'S');
  doc.line(tblX + labelColW, y, tblX + labelColW, y + respH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text('Responsables', tblX + 6, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...valueColor);
  doc.text(respSplit, tblX + labelColW + 6, y + 14);
  y += respH;

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('OBSERVACIONES', m, y);
  y += 6;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 10;

  const descText = ot.description || 'Sin observaciones registradas';
  const splitDesc = doc.splitTextToSize(descText, cw - 24);
  const descH = Math.max(40, splitDesc.length * 11 + 18);

  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.setFillColor(252, 252, 255);
  doc.roundedRect(m, y, cw, descH, 3, 3, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...valueColor);
  doc.setFontSize(9);
  doc.text(splitDesc, m + 12, y + 14);
  y += descH + 18;

  const photoW = (cw - 16) / 2;
  const photoH = photoW * 0.75;
  const minSpaceNeeded = photoH + 50;

  if (y + minSpaceNeeded > ph - 50) {
    addPageFooter(doc, pw, ph);
    doc.addPage();
    y = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.setFontSize(10);
  doc.text('EVIDENCIA FOTOGRAFICA', pw / 2, y, { align: 'center' });
  y += 6;
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 12;

  const gap = 16;
  const beforeX = m;
  const afterX = m + photoW + gap;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navy);
  doc.text('ANTES', beforeX + photoW / 2, y, { align: 'center' });
  doc.text('DESPUES', afterX + photoW / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(...borderColor);
  doc.setFillColor(245, 246, 250);
  doc.setLineWidth(0.3);
  doc.roundedRect(beforeX, y, photoW, photoH, 3, 3, 'FD');
  doc.roundedRect(afterX, y, photoW, photoH, 3, 3, 'FD');

  const photosBefore = ot.photosBefore ?? [];
  const photosAfter = ot.photosAfter ?? [];

  if (photosBefore.length > 0) {
    try { doc.addImage(photosBefore[0], 'JPEG', beforeX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', beforeX + photoW / 2, y + photoH / 2, { align: 'center' });
  }

  if (photosAfter.length > 0) {
    try { doc.addImage(photosAfter[0], 'JPEG', afterX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin foto', afterX + photoW / 2, y + photoH / 2, { align: 'center' });
  }
  y += photoH + 8;

  const extraBefore = photosBefore.slice(1);
  const extraAfter = photosAfter.slice(1);
  if (extraBefore.length > 0 || extraAfter.length > 0) {
    const maxExtra = Math.max(extraBefore.length, extraAfter.length);
    for (let i = 0; i < maxExtra; i++) {
      if (y + photoH + 40 > ph - 40) {
        addPageFooter(doc, pw, ph);
        doc.addPage();
        y = 40;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navy);
      doc.text(`Foto ${i + 2}`, m, y);
      y += 12;

      doc.setDrawColor(...borderColor);
      doc.setFillColor(245, 246, 250);
      doc.setLineWidth(0.3);
      doc.roundedRect(beforeX, y, photoW, photoH, 3, 3, 'FD');
      doc.roundedRect(afterX, y, photoW, photoH, 3, 3, 'FD');

      if (extraBefore[i]) {
        try { doc.addImage(extraBefore[i], 'JPEG', beforeX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      } else {
        doc.setFontSize(7); doc.setTextColor(180, 180, 180); doc.setFont('helvetica', 'italic');
        doc.text('Sin foto', beforeX + photoW / 2, y + photoH / 2, { align: 'center' });
      }
      if (extraAfter[i]) {
        try { doc.addImage(extraAfter[i], 'JPEG', afterX + 2, y + 2, photoW - 4, photoH - 4); } catch { /* skip */ }
      } else {
        doc.setFontSize(7); doc.setTextColor(180, 180, 180); doc.setFont('helvetica', 'italic');
        doc.text('Sin foto', afterX + photoW / 2, y + photoH / 2, { align: 'center' });
      }
      y += photoH + 12;
    }
  }

  addPageFooter(doc, pw, ph);
  doc.save(`OT_${ot.otId ?? 'Reporte'}_Reporte.pdf`);
}

/* ─── Main App (Unified Single Page) ─── */

type StatusFilter = 'Todas' | 'Pendiente' | 'En Proceso' | 'Terminada';

export default function LagunaNorteApp() {
  const { workOrders, loading, syncing, apiAvailable, lastSync, createWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrders();
  const { workAreas, personnel, zones, updateWorkAreas, updatePersonnel, updateZones } = useConfigData();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WorkOrder> | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleSaveOT = useCallback(async (data: Partial<WorkOrder>) => {
    if (data.id) {
      await updateWorkOrder(data);
    } else {
      await createWorkOrder(data);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  }, [createWorkOrder, updateWorkOrder]);

  const handleDeleteOT = useCallback(async (id: string) => {
    await deleteWorkOrder(id);
    setIsModalOpen(false);
    setEditingItem(null);
  }, [deleteWorkOrder]);

  const handleCreateFromCategory = useCallback((cat: typeof CATEGORIES[number]) => {
    const wa = workAreas.find(a => a.id === cat.workAreaId);
    const areaPersonnel = personnel.filter(p => p.workAreaId === cat.workAreaId).map(p => p.name);
    const activities = wa ? wa.activities : [];
    const description = activities.length > 0 || areaPersonnel.length > 0
      ? `Realizar ${activities.join(', ')} en área ${wa?.name ?? ''}. Personal asignado: ${areaPersonnel.join(', ')}.`
      : '';

    setEditingItem({
      workAreaId: cat.workAreaId,
      activities,
      collaborators: areaPersonnel,
      status: 'Pendiente',
      zoneName: '',
      description,
      photosBefore: [],
      photosAfter: [],
    } as any);
    setIsModalOpen(true);
  }, [workAreas, personnel]);

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

  // Counts
  const pendientes = workOrders.filter(o => o.status === 'Pendiente').length;
  const enProceso = workOrders.filter(o => o.status === 'En Proceso').length;
  const terminadas = workOrders.filter(o => o.status === 'Terminada').length;

  // Filtered OTs
  const filteredOTs = statusFilter === 'Todas'
    ? workOrders
    : workOrders.filter(o => o.status === statusFilter);

  // Helper: get work area color for an OT by matching its activities
  const getWorkAreaForOT = useCallback((ot: WorkOrder) => {
    for (const wa of workAreas) {
      if (ot.activities.some(a => wa.activities.includes(a))) {
        return wa;
      }
    }
    return null;
  }, [workAreas]);

  // Show loading spinner while initial data is being fetched
  if (loading) {
    return (
      <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-bold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-screen pb-24 bg-slate-50">
      {/* ─── Header ─── */}
      <header className="p-4 bg-white border-b border-slate-100 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo-laguna.jpg" alt="Laguna Norte" className="h-10 rounded-lg" />
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">Laguna Norte</h1>
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Condominio & Parque</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[8px] font-black uppercase ${syncing ? 'text-amber-500' : apiAvailable ? 'text-emerald-500' : 'text-orange-400'}`}>
            <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{syncing ? 'Sincronizando...' : apiAvailable ? 'En línea' : 'Sin BD'}</span>
          </div>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Administración"
          >
            <Settings size={16} />
          </button>
          <img src="/logo-empresa.png" alt="CyJ" className="h-10 rounded-lg" />
        </div>
      </header>

      <main className="p-4 space-y-5">
        {/* ─── Stats Chips ─── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center gap-2">
            <Clock className="text-red-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-red-600 leading-none">{pendientes}</div>
              <div className="text-[8px] font-bold text-red-400 uppercase tracking-wider">Pendientes</div>
            </div>
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-2">
            <Zap className="text-amber-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-amber-600 leading-none">{enProceso}</div>
              <div className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">En Proceso</div>
            </div>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
            <div>
              <div className="text-xl font-black text-emerald-600 leading-none">{terminadas}</div>
              <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Listas</div>
            </div>
          </div>
        </div>

        {/* ─── Quick Create Categories ─── */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Crear OT rápida</p>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map(cat => {
              const IconComp = cat.icon;
              return (
                <button key={cat.id} onClick={() => handleCreateFromCategory(cat)} className="flex-shrink-0 flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                  <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    <IconComp size={18} />
                  </div>
                  <span className="text-[7px] font-black uppercase text-slate-500">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Status Filter Tabs ─── */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {(['Todas', 'Pendiente', 'En Proceso', 'Terminada'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {s === 'Todas' ? `Todas (${workOrders.length})` : s}
            </button>
          ))}
        </div>

        {/* ─── Work Order List ─── */}
        <div className="space-y-3">
          {filteredOTs.map(ot => {
            const wa = getWorkAreaForOT(ot);
            return (
              <div
                key={ot.id}
                onClick={() => handleEditOT(ot)}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm cursor-pointer relative overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${wa?.color ?? STATUS_CONFIG[ot.status]?.color ?? 'bg-gray-500'}`}></div>
                <div className="flex-1 truncate pr-3 pl-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded-full">{ot.otId}</span>
                    <span className={`text-[9px] font-black uppercase ${STATUS_CONFIG[ot.status]?.text ?? 'text-gray-500'}`}>{ot.status}</span>
                    <span className="text-[8px] text-slate-300 font-medium">{formatDate(ot.createdAt)}</span>
                  </div>
                  <h4 className="font-black text-slate-800 uppercase truncate text-sm">{(ot.activities ?? []).join(', ')}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <MapPin size={10} className="text-blue-500" /> {ot.zoneName}
                    </p>
                    {(ot.collaborators ?? []).length > 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <User size={10} className="text-purple-500" /> {(ot.collaborators ?? []).map(c => c.split(' ').slice(0, 2).join(' ')).join(', ')}
                      </p>
                    )}
                  </div>
                  {wa && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white ${wa.color}`}>
                      {wa.name}
                    </span>
                  )}
                </div>
                <ChevronRight className="text-slate-300 flex-shrink-0" size={18} />
              </div>
            );
          })}
          {filteredOTs.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto text-slate-200 mb-3" size={40} />
              <p className="text-slate-300 text-xs font-bold uppercase">No hay órdenes {statusFilter === 'Todas' ? '' : statusFilter.toLowerCase()}</p>
            </div>
          )}
        </div>
      </main>

      {/* ─── Floating Action Button ─── */}
      <button
        onClick={handleOpenNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-300/50 active:scale-90 transition-transform z-50"
      >
        <Plus size={28} />
      </button>

      <Modal
        isOpen={isModalOpen}
        editingItem={editingItem}
        onClose={handleCloseModal}
        onSave={handleSaveOT}
        onDelete={handleDeleteOT}
        onGeneratePDF={generatePDF}
        workAreas={workAreas}
        personnel={personnel}
        zones={zones}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        workAreas={workAreas}
        personnel={personnel}
        zones={zones}
        onUpdateWorkAreas={updateWorkAreas}
        onUpdatePersonnel={updatePersonnel}
        onUpdateZones={updateZones}
      />
    </div>
  );
}
