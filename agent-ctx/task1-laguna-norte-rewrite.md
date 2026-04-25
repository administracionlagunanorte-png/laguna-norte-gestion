# Task 1: Rewrite LagunaNorteApp.tsx with Major Feature Enhancements

## Summary
Rewrote `/home/z/my-project/src/app/LagunaNorteApp.tsx` from ~1430 lines to ~2161 lines with the following enhancements:

### Changes Made

1. **Replaced static COLLABORATORS/ACTIVITIES with work-area-based structure**
   - Removed old `COLLABORATORS` array (with role-based) and `ACTIVITIES` flat list
   - Added `WorkArea`, `Personnel`, `Zone` interfaces
   - Added `DEFAULT_WORK_AREAS`, `DEFAULT_PERSONNEL`, `DEFAULT_ZONES` constants
   - Work areas: Jardinería, Recolección y Aseo, Piscinas y Laguna, Mantenciones, Eléctricas y Mantenciones

2. **Auto-filter collaborators when work area is selected**
   - Added "Área de Trabajo" dropdown as the first field in the OT modal
   - When a work area is selected, activities dropdown filters to show only that area's activities
   - Collaborators dropdown filters to show only that area's personnel
   - All personnel from the selected work area are auto-selected
   - Color dot indicators on the work area dropdown options

3. **Auto-generate OT description**
   - Template: "Realizar [activities] en área [workAreaName]. Personal asignado: [collaborators]."
   - Auto-updates when activities or collaborators change
   - Tracks `descriptionManuallyEdited` flag - won't overwrite manual edits
   - Resets flag when activities/collaborators change again

4. **Admin Panel for managing personnel, zones, and activities**
   - New `AdminPanel` component that slides in from the right
   - Three tabs: Áreas de Trabajo, Personal, Zonas
   - Full CRUD for each: add, edit, delete
   - Color picker for work areas
   - Work area assignment dropdown for personnel
   - Accessible via Settings/Gear icon in header

5. **localStorage persistence for configurable data**
   - `laguna_norte_work_areas` - Work areas with activities
   - `laguna_norte_personnel` - Personnel with work area assignments
   - `laguna_norte_zones` - Geographic zones
   - First load initializes from defaults; subsequent loads from localStorage
   - `useConfigData` hook manages all config state

6. **Updated CATEGORIES for quick-create buttons**
   - Now maps to work areas instead of generic categories
   - Each category has a `workAreaId` field
   - Quick-create pre-selects all activities and personnel from the work area
   - Uses `Droplets` icon for Piscinas, `Trash2` for Recolección

7. **OT list cards enhanced**
   - Shows work area color badge on each OT card
   - Work area color stripe on left side when no status match
   - Work area name badge below the OT details

### Preserved Functionality
- PDF generation (`buildPDF`) - unchanged
- `useWorkOrders` hook - unchanged
- `WorkOrder` interface - unchanged (stores string arrays)
- `PhotoUpload` component - unchanged
- `migrateWorkOrder` helper - unchanged
- API sync, localStorage fallback, polling - all unchanged
- Migration helper for backward compatibility - unchanged

### Lint Results
- Passes cleanly with no errors or warnings

### Line Count
- Original: ~1430 lines
- New: ~2161 lines (added ~731 lines for new features)
