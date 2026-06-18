import React from 'react'
import ShapeBlur from './ShapeBlur';

const HeroText = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pt-40 font-[font2]">

      {/* Glass Hero Card */}
      <div
        className="
          w-[60%]
          min-h-[500px]

          bg-white/[0.12]
          backdrop-blur-2xl
          border border-white/15
          rounded-3xl
          shadow-2xl

          flex
          flex-col
          items-center
          justify-center

          text-center
          px-12
        "
      >


        {/* Main Heading */}
        <h1 className="text-[7vw] font-bold uppercase text-white leading-none">
          Jobora
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-2xl mt-4">
          Your Smart Career Companion
        </p>

        {/* Description */}
        <p className="text-white/80 text-xl mt-8 max-w-[85%] leading-relaxed">
          JOBORA intelligently analyzes your resume, matches you with
          the most relevant internships and jobs, and helps streamline
          the application process. Track every application, improve
          your profile, and move closer to the right opportunity with
          AI-powered career guidance.
        </p>

        <div className="flex gap-4 mt-8">
          <button className="px-6 py-3 bg-white text-black rounded-full font-semibold">
            Get Started
          </button>

          <button className="px-6 py-3 border border-white/30 text-white rounded-full">
            Learn More
          </button>
        </div>
      </div>

    </div>
  );
};

export default HeroText;