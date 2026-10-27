# BuildPlan AI – Completed Full-Stack Construction Platform

**BuildPlan AI** is an integrated construction project management, building design, quantity surveying, BOQ generation, and cost estimation platform built with React, NestJS, TypeScript, and PostgreSQL.

---

## Key Modules & Features Implemented

### 1. User Authentication System
- **Google Sign-In**: Integration with OAuth profile creation and JWT session management.
- **Email & Password Login**: bcrypt hashing (12 salt rounds), password strength meter requiring uppercase, lowercase, numbers, and special characters.
- **Email OTP Login**: Generates secure 6-digit OTP with SHA-256 hashing, 5-minute expiry, 30-second resend cooldown timer, and 6 individual input digit boxes.
- **Password Reset**: Token-based forgot/reset password workflows.

### 2. User Dashboard
- **Welcome Banner**: Displays user profile, active project counts, and platform status.
- **Summary Metrics**: Total Projects, Active Projects, Cumulative Estimated Cost (INR), and Quick Actions.
- **Project Cards**: Shows building type, floor count, location, last updated timestamp, estimated cost, and quick action menu (Edit, Duplicate, Delete with modal confirmation).

### 3. Multi-Step Project Creation Wizard
- **Step 1: Basic Information**: Project name, description, location, building type (Residential, Commercial, Office, Apartment, Villa, Custom), floor count, start/completion dates.
- **Step 2: Building Configuration**: Floor length, width, floor height, wall height, wall thickness, foundation type, roof type, unit system (Metric/Imperial).
- **Step 3: Initial Layout Template**: Choice between Basic Template (auto-generates hall, walls, doors, windows), Blank Canvas, or Copy from another floor.

### 4. AutoCAD-Inspired 2D Design Workspace
- **Interactive HTML5 Canvas (React Konva)**:
   - **Top Toolbar**: Save, Undo, Redo, Zoom In/Out, Fit to Screen, Toggle Grid, Toggle Grid Snap, Grid Scale (e.g. 1 unit = 0.5m), Clear Canvas.
   - **Visual Grid & Ruler Lines**: Grid lines with dynamic coordinate tick marks rendering seamlessly across zoom and pan scales.
   - **Left Tool Sidebar**: Select Tool, Wall Tool (click-drag-click), Room Tool (rectangle room creation), Door Tool (attaches to walls), Window Tool (parallel glass lines), Dimension Tool, Move Tool, Delete Tool.
   - **Ghost Drawing Preview**: Active preview lines and dimensions displayed dynamically while drawing walls, rooms, doors, and windows.
   - **Real-World Measurements**: Displayed live on canvas annotations in real-world meters.
   - **Right Properties Panel**: Edit wall length, thickness, material, room name, area (m²), door/window dimensions.

### 5. Multi-Floor Management
- **Floor Navigation Tabs**: Switch seamlessly between Ground Floor, First Floor, Second Floor, etc.
- Combine quantities across all floors to compute building totals.

### 6. Quantity Surveying Calculation Engine
Automated calculations using exact formulas:
- **Floor Area**: $\text{Length} \times \text{Width}$
- **Gross Wall Area**: $\sum (\text{Wall Length} \times \text{Wall Height})$
- **Net Wall Area**: $\text{Gross Wall Area} - \text{Total Door Area} - \text{Total Window Area}$
- **Wall Volume**: $\text{Net Wall Area} \times \text{Wall Thickness}$
- **Plastering & Painting Area**: $(\text{Net Wall Area} \times 2) + \text{Ceiling Area}$
- **Concrete & Brickwork Quantities** for RCC slabs and masonry walls.

### 7. Bill of Quantities (BOQ) Module
- Auto-generate itemized BOQ from quantity surveying.
- Editable unit rates and quantities inline.
- Add custom BOQ items modal with category grouping.

### 8. Construction Cost Estimation
- **Total Project Cost Formula**:
  $$\text{Total Cost} = \text{Material} + \text{Labor (30\%)} + \text{Equipment (10\%)} + \text{Transportation (5\%)} + \text{Additional (5\%)} + \text{Contingency (5\%)}$$
- Visual **Recharts Pie Chart** and **Bar Chart** for cost distribution.

### 9. Downloadable Reports
- **PDF Report (jsPDF)**: Complete project summary, floor quantity breakdown tables, and itemized BOQ table.
- **Excel Spreadsheet (ExcelJS)**: Multi-sheet `.xlsx` file containing cost estimates and BOQ worksheets.

---

## File Structure Overview

```
buildplan-ai/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/
│       ├── projects/
│       ├── floors/
│       ├── designs/
│       ├── calculations/
│       ├── boq/
│       ├── costs/
│       └── materials/
└── frontend/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── pages/
        ├── features/
        │   ├── design/
        │   ├── calculations/
        │   ├── boq/
        │   ├── costs/
        │   └── reports/
        ├── components/
        ├── api/
        └── store/
```

---

## How to Run

1. **Backend Setup**:
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```
2. **Frontend Setup**:
   ```bash
   cd frontend
   npm run dev
   ```

Both **Frontend** (`npm run build`) and **Backend** (`npm run build`) pass production TypeScript compilation without errors.
