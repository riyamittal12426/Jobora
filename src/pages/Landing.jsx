import React from 'react'
import { useNavigate } from 'react-router-dom'
import Video from '../components/Landing/video'
import Herotext from '../components/Landing/herotext'

import ShapeBlur from '../components/Landing/ShapeBlur';
import FlowingMenu from '../components/Landing/FlowingMenu';
import Features from '../components/Landing/features';

const menuItems = [
  { link: '#', text: 'Resume Analysis', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400' },
  { link: '#', text: 'Job Matching', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400' },
  { link: '#', text: 'Track Applications', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400' },
  { link: '#', text: 'AI Career Guidance', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' },
]

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className='relative w-full bg-black'>

      {/* 1) Moving ShapeBlur here with 'fixed' ensures it follows your screen forever */}
      <div className='fixed inset-0 pointer-events-none z-10'>
        <ShapeBlur
          variation={0}
          pixelRatioProp={window.devicePixelRatio || 1}
          shapeSize={0.8}
          roundness={0.5}
          borderSize={0.05}
          circleSize={0.4}
          circleEdge={1.2}
        />
      </div>

      <div className='section1 relative h-screen w-full overflow-hidden'>

        {/* 2) Changing fixed -> absolute makes the video stick to section 1, so it scrolls away */}
        <div className='absolute inset-0 w-full h-full z-0'>
          <Video />
        </div>

        {/* 3) Navbar -> absolute so it belongs to section 1 entirely */}
        <section className='absolute top-0 left-150 w-90 z-50 shadow-md' style={{ height: '27vh' }}>
          <FlowingMenu
            items={menuItems}
            bgColor='#0d0d0d'
            textColor='#ffffff'
            marqueeBgColor='#7c3aed'
            marqueeTextColor='#ffffff'
            borderColor='#2a2a2a'
            speed={12}
          />
        </section>

        <div className='absolute top-5 right-5 p-4 z-50'>
          <button
            onClick={() => navigate("/Auth")}
            className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-full shadow-lg transition-all hover:bg-white/20 hover:scale-105"
          >
            Login / Sign Up
          </button>
        </div>

        {/* 4) Ensure your text wrapper is completely absolute and covers section 1 */}
        <div className='absolute inset-0 w-full h-full z-20 flex flex-col justify-between pt-[10vh] pointer-events-none'>
          {/* You may need to add pointer-events-auto to Herotext/Bottomtext if they have clickable buttons inside */}
          <Herotext />

        </div>

      </div>

      {/* Features section — full height for grid layout */}
      <div className='section2 relative w-full z-20'>
        <Features />
      </div>

    </div>
  )
}

export default Landing