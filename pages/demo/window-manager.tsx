import { WindowManagerDemo } from '../../src/components/demo/WindowManagerDemo'
import { DashboardLayout } from '../../src/components/layout/DashboardLayout'

export default function WindowManagerDemoPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <WindowManagerDemo />
      </div>
    </DashboardLayout>
  )
} 