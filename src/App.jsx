import React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'

const App = () => {
  return (
    <div className='text-white'>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/auth' element={<Auth />} />
        <Route path='/dashboard' element={<UserDashboard />} />
      </Routes>
    </div>
  )
}

export default App