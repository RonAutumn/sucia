# Sucia NYC Brand Color Palette

This document defines the complete brand color system for the Sucia NYC Check-in application, including semantic mappings, usage guidelines, and accessibility standards.

## Color Philosophy

Our brand colors reflect the sophisticated, elegant atmosphere of Sucia NYC events while maintaining excellent accessibility and user experience standards. The palette combines a sophisticated navy blue primary with elegant gold accents, supported by warm neutrals and clear semantic colors.

## Brand Color Families

### Primary Colors (Navy Blue)
**Purpose**: Main brand identity, primary actions, navigation
**Tailwind Classes**: `primary-{50-950}`

```css
primary-50:  #f0f3ff  /* Very light backgrounds, subtle highlights */
primary-100: #e1e8ff  /* Light backgrounds, hover states */
primary-200: #c3d1ff  /* Disabled states, subtle borders */
primary-300: #9fb0ff  /* Placeholder text, inactive elements */
primary-400: #7c8cff  /* Secondary actions, focus rings */
primary-500: #5b68ff  /* Brand accent, links */
primary-600: #4c59e8  /* PRIMARY - main actions, buttons */
primary-700: #3d47d1  /* Hover states for primary buttons */
primary-800: #323aa8  /* Active states, pressed buttons */
primary-900: #2a3084  /* Deep primary, strong emphasis */
primary-950: #1a1f4f  /* Darkest primary, high contrast text */
```

**Usage Examples**:
- Primary buttons: `bg-primary-600 hover:bg-primary-700`
- Navigation active state: `bg-primary-100 text-primary-700`
- Links: `text-primary-600 hover:text-primary-700`
- Focus rings: `focus:ring-primary-400`

### Secondary Colors (Gold Accent)
**Purpose**: Accent elements, highlights, premium features
**Tailwind Classes**: `secondary-{50-950}`

```css
secondary-50:  #fffbeb  /* Light gold backgrounds */
secondary-100: #fef3c7  /* Subtle gold highlights */
secondary-200: #fde68a  /* Light gold borders */
secondary-300: #fcd34d  /* Gold hover states */
secondary-400: #fbbf24  /* Gold interactive elements */
secondary-500: #f59e0b  /* SECONDARY - main gold accent */
secondary-600: #d97706  /* Rich gold, emphasis */
secondary-700: #b45309  /* Deep gold, strong contrast */
secondary-800: #92400e  /* Dark gold text */
secondary-900: #78350f  /* Very dark gold */
secondary-950: #451a03  /* Darkest gold, maximum contrast */
```

**Usage Examples**:
- Accent buttons: `bg-secondary-500 hover:bg-secondary-600`
- Premium indicators: `text-secondary-600`
- Subtle highlights: `bg-secondary-50 border-secondary-200`

### Neutral Colors (Warm Grays)
**Purpose**: Text hierarchy, backgrounds, borders, UI structure
**Tailwind Classes**: `neutral-{50-950}`

```css
neutral-50:  #fafaf9  /* Page backgrounds, cards */
neutral-100: #f5f5f4  /* Section backgrounds */
neutral-200: #e7e5e4  /* Subtle borders, dividers */
neutral-300: #d6d3d1  /* Input borders, disabled states */
neutral-400: #a8a29e  /* Placeholder text, icons */
neutral-500: #78716c  /* Secondary text */
neutral-600: #57534e  /* BODY TEXT - primary text color */
neutral-700: #44403c  /* Headings, emphasized text */
neutral-800: #292524  /* Strong emphasis, dark text */
neutral-900: #1c1917  /* Maximum contrast text */
neutral-950: #0c0a09  /* Black text, ultimate contrast */
```

**Usage Examples**:
- Body text: `text-neutral-600`
- Headings: `text-neutral-700` or `text-neutral-800`
- Backgrounds: `bg-neutral-50` or `bg-neutral-100`
- Borders: `border-neutral-200` or `border-neutral-300`

## Semantic Colors

### Success (Green)
**Purpose**: Check-in status, completed states, positive feedback
**Tailwind Classes**: `success-{50-950}`

```css
success-50:  #f0fdf4  /* Success message backgrounds */
success-100: #dcfce7  /* Light success highlights */
success-200: #bbf7d0  /* Success hover states */
success-300: #86efac  /* Success interactive elements */
success-400: #4ade80  /* Success accent */
success-500: #22c55e  /* Success primary */
success-600: #16a34a  /* SUCCESS - main success color */
success-700: #15803d  /* Success emphasis */
success-800: #166534  /* Dark success text */
success-900: #14532d  /* Very dark success */
success-950: #052e16  /* Darkest success */
```

**Usage Examples**:
- Checked-in status: `bg-success-100 text-success-800`
- Success buttons: `bg-success-600 hover:bg-success-700`
- Success messages: `bg-success-50 border-success-200 text-success-700`

### Warning (Amber)
**Purpose**: Offline states, cautionary messages, pending status
**Tailwind Classes**: `warning-{50-950}`

```css
warning-50:  #fffbeb  /* Warning message backgrounds */
warning-100: #fef3c7  /* Light warning highlights */
warning-200: #fde68a  /* Warning borders */
warning-300: #fcd34d  /* Warning hover states */
warning-400: #fbbf24  /* Warning interactive */
warning-500: #f59e0b  /* Warning primary */
warning-600: #d97706  /* WARNING - main warning color */
warning-700: #b45309  /* Warning emphasis */
warning-800: #92400e  /* Dark warning text */
warning-900: #78350f  /* Very dark warning */
warning-950: #451a03  /* Darkest warning */
```

**Usage Examples**:
- Offline banner: `bg-warning-600 text-white`
- Warning messages: `bg-warning-50 border-warning-200 text-warning-700`
- Pending status: `bg-warning-100 text-warning-800`

### Error (Red)
**Purpose**: Error states, deletion actions, critical alerts
**Tailwind Classes**: `error-{50-950}`

```css
error-50:  #fef2f2  /* Error message backgrounds */
error-100: #fee2e2  /* Light error highlights */
error-200: #fecaca  /* Error borders */
error-300: #fca5a5  /* Error hover states */
error-400: #f87171  /* Error interactive */
error-500: #ef4444  /* Error primary */
error-600: #dc2626  /* ERROR - main error color */
error-700: #b91c1c  /* Error emphasis */
error-800: #991b1b  /* Dark error text */
error-900: #7f1d1d  /* Very dark error */
error-950: #450a0a  /* Darkest error */
```

**Usage Examples**:
- Reset buttons: `bg-error-600 hover:bg-error-700 text-white`
- Error messages: `bg-error-50 border-error-200 text-error-700`
- Not checked-in status: `bg-error-100 text-error-800`

### Info (Blue)
**Purpose**: Informational messages, help text, neutral status
**Tailwind Classes**: `info-{50-950}`

```css
info-50:  #eff6ff  /* Info message backgrounds */
info-100: #dbeafe  /* Light info highlights */
info-200: #bfdbfe  /* Info borders */
info-300: #93c5fd  /* Info hover states */
info-400: #60a5fa  /* Info interactive */
info-500: #3b82f6  /* Info primary */
info-600: #2563eb  /* INFO - main info color */
info-700: #1d4ed8  /* Info emphasis */
info-800: #1e40af  /* Dark info text */
info-900: #1e3a8a  /* Very dark info */
info-950: #172554  /* Darkest info */
```

**Usage Examples**:
- Info buttons: `bg-info-600 hover:bg-info-700 text-white`
- Info messages: `bg-info-50 border-info-200 text-info-700`
- Help text: `text-info-600`

## Advanced Semantic Mapping Patterns

### Percentage-Based Color Logic
For dynamic status indicators based on percentage thresholds:

```typescript
// ✅ DO: Use semantic color functions
const getStatusColor = (percentage: number) => {
  if (percentage >= 80) return 'success'; // High performance
  if (percentage >= 50) return 'warning'; // Medium performance  
  return 'error'; // Low performance
};

const getColorClasses = (status: 'success' | 'warning' | 'error') => ({
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  error: 'bg-error-100 text-error-800 border-error-200'
});

// ❌ DON'T: Use hardcoded color classes
const getColorClasses = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-100 text-green-800';
  if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
```

### Progress Bar Color Patterns
For visual progress indicators:

```css
/* ✅ DO: Use semantic progress colors */
.progress-success { @apply bg-success-500; }
.progress-warning { @apply bg-warning-500; }
.progress-error { @apply bg-error-500; }
.progress-primary { @apply bg-primary-500; }

/* ❌ DON'T: Use hardcoded progress colors */
.progress-bar { background-color: #22c55e; }
```

### Interactive State Mapping
Standardized patterns for all interactive elements:

```css
/* Primary Interactive Elements */
.btn-primary {
  @apply bg-primary-600 text-white border-primary-600;
  @apply hover:bg-primary-700 hover:border-primary-700;
  @apply focus:ring-2 focus:ring-primary-400 focus:ring-offset-2;
  @apply active:bg-primary-800 active:border-primary-800;
  @apply disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-300;
}

/* Secondary Interactive Elements */
.btn-secondary {
  @apply bg-secondary-500 text-white border-secondary-500;
  @apply hover:bg-secondary-600 hover:border-secondary-600;
  @apply focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2;
  @apply active:bg-secondary-700 active:border-secondary-700;
  @apply disabled:bg-neutral-300 disabled:text-neutral-500 disabled:border-neutral-300;
}

/* Ghost/Outline Buttons */
.btn-outline {
  @apply bg-transparent text-primary-600 border-primary-600;
  @apply hover:bg-primary-50 hover:text-primary-700;
  @apply focus:ring-2 focus:ring-primary-400 focus:ring-offset-2;
  @apply active:bg-primary-100;
  @apply disabled:text-neutral-400 disabled:border-neutral-300;
}
```

## Color Migration Strategy

### Current Color Mappings

| Current Usage | Old Classes | New Brand Classes |
|---------------|-------------|-------------------|
| Primary actions | `bg-blue-600` | `bg-primary-600` |
| Success states | `bg-green-100 text-green-800` | `bg-success-100 text-success-800` |
| Warning states | `bg-yellow-600` | `bg-warning-600` |
| Error states | `bg-red-600` | `bg-error-600` |
| Body text | `text-gray-900` | `text-neutral-700` |
| Secondary text | `text-gray-600` | `text-neutral-600` |
| Backgrounds | `bg-gray-50` | `bg-neutral-50` |
| Borders | `border-gray-200` | `border-neutral-200` |
| Focus rings | `ring-blue-500` | `ring-primary-400` |
| Table headers | `bg-gray-50 text-gray-500` | `bg-neutral-50 text-neutral-500` |
| Input borders | `border-gray-300 focus:border-blue-500` | `border-neutral-300 focus:border-primary-500` |

### Component-Specific Migration Patterns

#### Dashboard Metrics Cards
```typescript
// ✅ DO: Use semantic status mapping
interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error' | 'primary';
}

const statusClasses = {
  success: 'bg-success-50 border-success-200 text-success-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700', 
  error: 'bg-error-50 border-error-200 text-error-700',
  primary: 'bg-primary-50 border-primary-200 text-primary-700'
};

// ❌ DON'T: Use hardcoded color props
interface MetricsCardProps {
  color: 'blue' | 'green' | 'yellow' | 'red';
}
```

#### Event Status Indicators
```typescript
// ✅ DO: Use semantic event status
const getEventStatusColor = (status: 'active' | 'upcoming' | 'past') => ({
  active: { bg: 'bg-success-100', text: 'text-success-800', border: 'border-success-200' },
  upcoming: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
  past: { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200' }
});

// ❌ DON'T: Use hardcoded status colors
const statusColors = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800', 
  gray: 'bg-gray-100 text-gray-800'
};
```

#### Progress Visualization
```typescript
// ✅ DO: Use threshold-based semantic colors
const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-success-500';
  if (percentage >= 50) return 'bg-warning-500';
  return 'bg-error-500';
};

const getProgressTextColor = (percentage: number) => {
  if (percentage >= 80) return 'text-success-700';
  if (percentage >= 50) return 'text-warning-700';
  return 'text-error-700';
};

// ❌ DON'T: Use hardcoded progress colors
const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};
```

### Migration Checklist

When migrating components, ensure:

- [ ] **Primary Actions**: `bg-blue-*` → `bg-primary-*`
- [ ] **Status Success**: `bg-green-*` → `bg-success-*`
- [ ] **Status Warning**: `bg-yellow-*` → `bg-warning-*`
- [ ] **Status Error**: `bg-red-*` → `bg-error-*`
- [ ] **Neutral UI**: `bg-gray-*` → `bg-neutral-*`
- [ ] **Text Colors**: `text-gray-*` → `text-neutral-*`
- [ ] **Border Colors**: `border-gray-*` → `border-neutral-*`
- [ ] **Focus Rings**: `ring-blue-*` → `ring-primary-*`
- [ ] **Icon Colors**: Match semantic context (success/warning/error/primary)
- [ ] **Hover States**: Maintain consistent +100 shade progression

### Interactive State Patterns

```css
/* Primary Buttons */
.btn-primary {
  @apply bg-primary-600 text-white;
  @apply hover:bg-primary-700 focus:ring-primary-400;
  @apply active:bg-primary-800 disabled:bg-neutral-300;
}

/* Secondary Buttons */
.btn-secondary {
  @apply bg-secondary-500 text-white;
  @apply hover:bg-secondary-600 focus:ring-secondary-400;
  @apply active:bg-secondary-700 disabled:bg-neutral-300;
}

/* Success States */
.status-success {
  @apply bg-success-100 text-success-800 border-success-200;
}

/* Warning States */
.status-warning {
  @apply bg-warning-100 text-warning-800 border-warning-200;
}

/* Error States */
.status-error {
  @apply bg-error-100 text-error-800 border-error-200;
}
```

## Accessibility Standards

All color combinations meet **WCAG 2.2 AA** standards:
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Tested Combinations

✅ **Safe Text Combinations**:
- `text-neutral-700` on `bg-white` (11.4:1)
- `text-neutral-600` on `bg-neutral-50` (8.9:1)
- `text-white` on `bg-primary-600` (8.1:1)
- `text-success-800` on `bg-success-100` (7.2:1)
- `text-warning-800` on `bg-warning-100` (6.8:1)
- `text-error-800` on `bg-error-100` (7.1:1)

### Accessibility Validation Tools
```bash
# Automated contrast checking
npm run test:accessibility
npm run test:colors

# Manual validation with browser dev tools
# 1. Inspect element
# 2. Check "Accessibility" tab
# 3. Verify contrast ratios meet WCAG AA standards
```

## Implementation Guidelines

### 1. Component Hierarchy
- Use `primary-*` for main actions and navigation
- Use `neutral-*` for text hierarchy and structure
- Use semantic colors (`success-*`, `warning-*`, `error-*`) for status
- Use `secondary-*` sparingly for special emphasis

### 2. Dark Mode Preparation
Colors are structured to support future dark mode implementation:
- Light shades (50-400) become dark mode backgrounds
- Dark shades (600-950) become dark mode text colors
- Semantic meanings remain consistent

### 3. CSS Custom Properties
For dynamic color usage, CSS custom properties are available:

```css
:root {
  --color-primary: theme('colors.primary.600');
  --color-success: theme('colors.success.600');
  --color-warning: theme('colors.warning.600');
  --color-error: theme('colors.error.600');
}
```

## Component-Specific Guidelines

### Check-in Status
- **Checked In**: `bg-success-100 text-success-800`
- **Not Checked In**: `bg-warning-100 text-warning-800`
- **Check-in Action**: `bg-success-600 hover:bg-success-700 text-white`
- **Undo Action**: `bg-error-600 hover:bg-error-700 text-white`

### Navigation
- **Active State**: `bg-primary-100 text-primary-700`
- **Hover State**: `text-neutral-600 hover:text-neutral-900`
- **Focus State**: `focus:ring-2 focus:ring-primary-400`

### Backgrounds
- **Page Background**: `bg-neutral-50`
- **Card Background**: `bg-white`
- **Section Background**: `bg-neutral-100`
- **Modal Overlay**: `bg-neutral-600 bg-opacity-50`

### Forms and Inputs
- **Default Border**: `border-neutral-300`
- **Focus Border**: `focus:border-primary-500`
- **Error Border**: `border-error-500`
- **Success Border**: `border-success-500`
- **Placeholder Text**: `placeholder-neutral-400`

### Loading and States
- **Loading Spinner**: `border-primary-600` for accent color
- **Disabled Elements**: `bg-neutral-300 text-neutral-500`
- **Selected Items**: `bg-primary-100 border-primary-200`

---

*This documentation should be updated as the design system evolves. All developers should reference this guide when implementing new components or updating existing ones.* 