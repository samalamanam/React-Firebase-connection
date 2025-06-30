import React from 'react';
import studentsBg from '../public/students-with-unif-tb.png';

export default function LimitPage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen relative w-screen bg-cover  "
      style={{
        backgroundImage: `url(${studentsBg})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-60 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center m-4 sm:m-0">
        <h1 className="text-6xl font-bold text-red-700 mb-4">DAILY LIMIT REACHED</h1>
        <p className="text-lg text-white mb-6">Sorry, the daily limit for registrations has been reached.</p>
        <p className="text-white">Please try again tomorrow.</p>
      </div>
    </div>
  );
}
