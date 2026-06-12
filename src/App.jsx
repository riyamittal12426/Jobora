import React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import MockInterviewPage from './features/mock-interview/MockInterviewPage'
import JobRecommendationsPage from './features/job-recommendations/JobRecommendationsPage'
import PrepareApplicationPage from './features/autofill/PrepareApplicationPage'

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
      </Routes>
    </div>
  )
}

export default App