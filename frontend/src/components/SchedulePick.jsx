import React from 'react'
import { useState } from 'react'


const SchedulePick = ({ userData, onSubmitSchedule}) => {

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedTimeOfDay) {
      showUserMessage('Please select both a date and AM/PM.', 'error');
      return;
    }

    // Combine data from this form with user data received via props
    const combinedScheduleData = {
      ...userData, // This is the 'name' and 'studentNumber' from App.jsx
      date: selectedDate, // Date from this form
      timeOfDay: selectedTimeOfDay, // Time of Day from this form
    };

    console.log('Combined Data ready to send from SchedulePick:', combinedScheduleData);

    // Pass the combined data UP to the parent component's submission handler
    await onSubmitSchedule(combinedScheduleData);
    
    // Optional: Clear fields after submission
    setSelectedDate('');
    setSelectedTimeOfDay('');
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
