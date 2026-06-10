import React from 'react'
import { useNavigate } from 'react-router-dom'
import Video from '../components/Landing/video'
import Herotext from '../components/Landing/herotext'
import Bottomtext from '../components/Landing/bottomtext'
import ShapeBlur from '../components/Landing/ShapeBlur';
import FlowingMenu from '../components/Landing/FlowingMenu';
import Features from '../components/Landing/features';

const menuItems = [
  { link: '#', text: 'Resume Analysis', image: 'https://picsum.photos/600/400?random=1' },
  { link: '#', text: 'Job Matching', image: 'https://picsum.photos/600/400?random=2' },
  { link: '#', text: 'Track Applications', image: 'https://picsum.photos/600/400?random=3' },
  { link: '#', text: 'AI Career Guidance', image: 'https://picsum.photos/600/400?random=4' },
]

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className='relative w-full bg-black min-h-[200vh]'>
      
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
          <button onClick={() => navigate("/Auth")}>
            Login / Sign Up
          </button>
        </div>

        {/* 4) Ensure your text wrapper is completely absolute and covers section 1 */}
        <div className='absolute inset-0 w-full h-full z-20 flex flex-col justify-between pt-[10vh] pointer-events-none'>
            {/* You may need to add pointer-events-auto to Herotext/Bottomtext if they have clickable buttons inside */}
            <Herotext />
            <Bottomtext />
        </div>

      </div>
      
      {/* Scroll down into this section; it will be a blank terminal over the black bg with ShapeBlur hovering. */}
      <div className='section2 relative h-screen w-full z-20 pointer-events-none'>
          <Features />
      </div>

    </div>
  )
}

export default Landing