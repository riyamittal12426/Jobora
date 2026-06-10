import React from 'react'

const features = () => {
  return (
    <div className='p-4'>
        <div className='pt-[20vh]'>
            <h2 className='font-[font1] text-[8vw] uppercase'>Features</h2>
        </div>
        <div className='-mt-10'>
            <div className='w-full h-[500px] mb-4 flex gap-4'>
                <div className='w-1/2 h-full overflow-hidden transition-all duration-500 ease-in-out hover:rounded-[2rem]'>
                <img className='w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-in-out' src="https://k72.ca/images/caseStudies/A_table/MOD_K72_20211104_CS_Divan_419.jpg?w=1200&h=1920&s=8d3bb96e89c577863b2859e004e27701" alt="Feature 1"/></div>
                <div className='w-1/2 h-full bg-blue-900'></div>
            </div>

        </div>
    </div>
  )
}

export default features