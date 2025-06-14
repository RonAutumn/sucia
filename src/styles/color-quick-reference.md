# Color Migration Quick Reference

A developer's quick lookup guide for converting hardcoded Tailwind colors to semantic brand colors.

## ⚡ Quick Conversion Table

### Primary Actions & Navigation
| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `bg-blue-600` | `bg-primary-600` | Main buttons, CTAs |
| `hover:bg-blue-700` | `hover:bg-primary-700` | Button hover states |
| `text-blue-600` | `text-primary-600` | Links, primary text |
| `border-blue-500` | `border-primary-500` | Primary borders |
| `ring-blue-500` | `ring-primary-400` | Focus rings |

### Status Indicators
| Old Classes | New Classes | Usage |
|-------------|-------------|-------|
| `bg-green-100 text-green-800` | `bg-success-100 text-success-800` | Success states |
| `bg-yellow-100 text-yellow-800` | `bg-warning-100 text-warning-800` | Warning states |
| `bg-red-100 text-red-800` | `bg-error-100 text-error-800` | Error states |
| `bg-blue-100 text-blue-800` | `bg-info-100 text-info-800` | Info states |

### Neutral UI Elements
| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `text-gray-900` | `text-neutral-800` | Headings |
| `text-gray-600` | `text-neutral-600` | Body text |
| `text-gray-500` | `text-neutral-500` | Secondary text |
| `bg-gray-50` | `bg-neutral-50` | Page backgrounds |
| `bg-gray-100` | `bg-neutral-100` | Section backgrounds |
| `border-gray-200` | `border-neutral-200` | Subtle borders |
| `border-gray-300` | `border-neutral-300` | Input borders |

### Progress & Percentage Colors
| Condition | Old Classes | New Classes |
|-----------|-------------|-------------|
| ≥80% (High) | `bg-green-500 text-green-600` | `bg-success-500 text-success-600` |
| 50-79% (Medium) | `bg-yellow-500 text-yellow-600` | `bg-warning-500 text-warning-600` |
| <50% (Low) | `bg-red-500 text-red-600` | `bg-error-500 text-error-600` |

## 🎯 Semantic Status Function

```typescript
// Copy-paste ready function
const getSemanticStatus = (percentage: number): 'success' | 'warning' | 'error' => {
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
};

const getStatusClasses = (status: 'success' | 'warning' | 'error' | 'primary' | 'info') => ({
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  error: 'bg-error-100 text-error-800 border-error-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  info: 'bg-info-100 text-info-800 border-info-200'
});
```

## 🔧 Common Migration Patterns

### Pattern 1: Metrics Cards
```typescript
// Before
interface MetricsCardProps {
  color: 'blue' | 'green' | 'yellow' | 'red';
}

// After
interface MetricsCardProps {
  status: 'primary' | 'success' | 'warning' | 'error';
}
```

### Pattern 2: Button States
```css
/* Before */
.btn { @apply bg-blue-600 hover:bg-blue-700 focus:ring-blue-500; }

/* After */
.btn { @apply bg-primary-600 hover:bg-primary-700 focus:ring-primary-400; }
```

### Pattern 3: Progress Bars
```typescript
// Before
const getProgressColor = (pct: number) => 
  pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

// After
const getProgressColor = (pct: number) => 
  pct >= 80 ? 'bg-success-500' : pct >= 50 ? 'bg-warning-500' : 'bg-error-500';
```

### Pattern 4: Event Status
```typescript
// Before
const eventColors = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800'
};

// After
const eventStatusClasses = {
  active: 'bg-success-100 text-success-800',
  upcoming: 'bg-primary-100 text-primary-800', 
  past: 'bg-neutral-100 text-neutral-800'
};
```

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Mix old and new
```typescript
// Bad - mixing old gray with new primary
className="bg-gray-50 text-primary-600"

// Good - consistent semantic colors
className="bg-neutral-50 text-primary-600"
```

### ❌ DON'T: Use wrong shade progression
```typescript
// Bad - inconsistent shade jumps
hover:bg-primary-800  // skips 700

// Good - consistent progression  
hover:bg-primary-700  // proper next shade
```

### ❌ DON'T: Use colors for wrong semantic meaning
```typescript
// Bad - success color for primary action
className="bg-success-600"  // for a main button

// Good - primary color for primary action
className="bg-primary-600"  // for a main button
```

## 📋 Pre-flight Checklist

Before starting migration:
- [ ] Read [brand-colors.md](./brand-colors.md)
- [ ] Review [color-migration-guide.md](./color-migration-guide.md)
- [ ] Create feature branch: `git checkout -b migrate-brand-colors`
- [ ] Run tests to establish baseline: `npm test`

## 🔍 Find & Replace Patterns

Use these regex patterns in your editor:

### VSCode Find & Replace
```regex
Find: bg-blue-([0-9]+)
Replace: bg-primary-$1

Find: text-gray-([0-9]+)  
Replace: text-neutral-$1

Find: border-gray-([0-9]+)
Replace: border-neutral-$1

Find: ring-blue-([0-9]+)
Replace: ring-primary-400  # Usually focus rings use 400
```

### Common Component Props
```typescript
// Find these prop patterns and update
color: 'blue' | 'green' | 'yellow' | 'red'
// Replace with
status: 'primary' | 'success' | 'warning' | 'error'
```

## 🧪 Testing Quick Commands

```bash
# Test specific component after migration
npm test -- Dashboard.test.tsx

# Run all tests
npm test

# Build to verify no CSS errors
npm run build

# Visual check in browser
npm run dev
```

## 📞 Need Help?

- **Full Documentation**: [brand-colors.md](./brand-colors.md)
- **Step-by-step Guide**: [color-migration-guide.md](./color-migration-guide.md)
- **Accessibility Standards**: Check contrast ratios in browser dev tools
- **Component Examples**: See any recently migrated components for patterns

---

*Keep this reference open while migrating for quick lookups!* 