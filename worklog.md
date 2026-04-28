---
Task ID: 1
Agent: Main
Task: Fix Aseo icon not showing - separate Aseo from Recolección

Work Log:
- Discovered the file had reverted to original state without Aseo separation
- Separated DEFAULT_WORK_AREAS: added Aseo (pink, id: 'aseo') with activities ['Limpieza de Quinchos', 'Limpieza Áreas Comunes', 'Barrido De Calles']
- Updated Recolección to only have ['Recolección De Basura', 'Barrido De Calles']
- Updated DEFAULT_PERSONNEL: Chris and Marie moved to workAreaId 'aseo', Erik and Jeantelus stay in 'recoleccion'
- Created ICON_MAP lookup (Record<string, React.ElementType>) with Leaf, Brush, Trash2, Droplets, Wrench, Zap
- Changed CATEGORIES to use icon strings ('Leaf', 'Brush', etc.) instead of direct components to fix React rendering error
- Added Aseo category: { id: 'aseo', name: 'Aseo', icon: 'Brush', color: 'bg-pink-500', workAreaId: 'aseo' }
- Updated icon rendering: const IconComp = ICON_MAP[cat.icon]; {IconComp && <IconComp size={18} />}
- Added CONFIG_VERSION (2) to force localStorage reload of default data
- Updated loadWorkAreas() and loadPersonnel() to check config version
- Fixed Prisma schema from 'postgresql' to 'sqlite' to match actual database
- Rebuilt successfully - verified Aseo category with Brush icon in JS bundle

Stage Summary:
- Aseo is now a separate category with its own Brush icon (pink color)
- Recolección is a separate category with Trash2 icon (orange color)
- Personnel correctly split: Chris & Marie → Aseo, Erik & Jeantelus → Recolección
- CONFIG_VERSION=2 ensures localStorage gets refreshed with new default data
- Icon rendering uses string lookup (ICON_MAP) instead of direct component references
