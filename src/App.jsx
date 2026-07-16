import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import MockInterviewPage from './features/mock-interview/MockInterviewPage'
import JobRecommendationsPage from './features/job-recommendations/JobRecommendationsPage'
import PrepareApplicationPage from './features/autofill/PrepareApplicationPage'
import AutomationCenterPage from './features/automation/AutomationCenterPage'
import ApplicationKitPage from './features/application-kit/ApplicationKitPage'
import ProfileSettingsPage from './features/settings/ProfileSettingsPage'
import CareerRoadmapPage from './features/roadmap/CareerRoadmapPage'
import NetworkCRMPage from './features/network/NetworkCRMPage'
import ResumeBuilderPage from './features/builder/ResumeBuilderPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'

const App = () => {
  return (
    <div className='text-white'>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Landing />} />
        <Route path='/auth' element={<Auth />} />

        {/* Protected Feature Routes */}
        <Route 
          path='/dashboard' 
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/mock-interview' 
          element={
            <ProtectedRoute>
              <MockInterviewPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/job-recommendations' 
          element={
            <ProtectedRoute>
              <JobRecommendationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/prepare-application' 
          element={
            <ProtectedRoute>
              <PrepareApplicationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/automation' 
          element={
            <ProtectedRoute>
              <AutomationCenterPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/settings' 
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/roadmap' 
          element={
            <ProtectedRoute>
              <CareerRoadmapPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/network' 
          element={
            <ProtectedRoute>
              <NetworkCRMPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/resume-builder' 
          element={
            <ProtectedRoute>
              <ResumeBuilderPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path='/application-kit' 
          element={
            <ProtectedRoute>
              <ApplicationKitPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App