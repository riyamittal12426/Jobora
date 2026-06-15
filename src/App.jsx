import React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import MockInterviewPage from './features/mock-interview/MockInterviewPage'
import JobRecommendationsPage from './features/job-recommendations/JobRecommendationsPage'
import PrepareApplicationPage from './features/autofill/PrepareApplicationPage'
import AutomationCenterPage from './features/automation/AutomationCenterPage'
import ProfileSettingsPage from './features/settings/ProfileSettingsPage'
import CareerRoadmapPage from './features/roadmap/CareerRoadmapPage'

const App = () => {
  return (
    <div className='text-white'>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/auth' element={<Auth />} />
        <Route path='/dashboard' element={<UserDashboard />} />
        <Route path='/mock-interview' element={<MockInterviewPage />} />
        <Route path='/job-recommendations' element={<JobRecommendationsPage />} />
        <Route path='/prepare-application' element={<PrepareApplicationPage />} />
        <Route path='/automation' element={<AutomationCenterPage />} />
        <Route path='/settings' element={<ProfileSettingsPage />} />
        <Route path='/roadmap' element={<CareerRoadmapPage />} />
      </Routes>
    </div>
  )
}

export default App