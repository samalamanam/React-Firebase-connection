import React from 'react'
import { useState } from 'react'


const SchedulePick = ({ userData, onSubmitSchedule}) => {

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTimeOfDay) {
      return;
    }

    // runs pag sinubmit, mo ung deets mo
    const combinedScheduleData = {
      ...userData, 
      date: selectedDate,
      timeOfDay: selectedTimeOfDay,
    };
    await onSubmitSchedule(combinedScheduleData);

  };

  return (


    <div className='flex flex-col w-screen h-screen justify-center items-center'>
        
        <div className='p-10 border-4 rounded-2xl'>
            
            <form onSubmit={handleSubmit} className=' flex m-10'>
                <input type="date" name="" id="" value={selectedDate} onChange={(e)=> setSelectedDate(e.target.value)} className='border-2 mx-10' />
                <input type="radio" id="time" name="time" onChange={(e) => setSelectedTimeOfDay(e.target.value)} value="AM" />
                <label className='mr-10'>AM</label>
                <input type="radio" id="time" name="time" onChange={(e) => setSelectedTimeOfDay(e.target.value)} value="PM" />
                <label className='mr-10'>PM</label>
                <button type='submit' className='border-2 border-blue-300 rounded-sm  bg-blue-400'>schedule this date</button>
            </form>
        </div>

    </div>
  )
}

export default SchedulePick
