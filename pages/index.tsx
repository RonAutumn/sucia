import React from 'react'
import DashboardLayout from '../src/components/layout/DashboardLayout'
import ControlHubDashboard from '../src/components/ControlHubDashboard'
import SEOHead from '../src/components/layout/SEOHead'

export default function SuciaMVPDashboard() {
  return (
    <>
      <SEOHead 
        title="Event Management Dashboard"
        description="Real-time event management and guest experience platform for Sucia NYC. Manage check-ins, games, and guest experiences seamlessly."
      />

      <DashboardLayout title="Event Management Dashboard">
        <ControlHubDashboard />
      </DashboardLayout>
    </>
  )
} 