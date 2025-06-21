import React from 'react'
import RegistrationForm from './RegistrationForm';
import { useState } from 'react'
import SchedulePick from './SchedulePick';

const App = () => {

     const [currentUserData, setCurrentUserData] = useState(null); // Stores { name, studentNumber } pero will then add the date and time pag sa schedule na
     const [currentPage, setCurrentPage] = useState('register'); // register, schedule, receipt

     const handleRegistrationSubmit = (data) =>{ // after masubmit ng registration
        setCurrentUserData(data);
        setCurrentPage('schedule')
        console.log(data)
     }
     
     const handleCombineData = (data) =>{ // after masubmit ng scheduler
        setCurrentUserData(data);
        console.log(data)   
     }

  return (
    <div className='w-screen h-screen'> 
        {currentPage === 'register' &&(
            <RegistrationForm onSubmitRegistration={handleRegistrationSubmit} /> 
        )}
        {currentPage === 'schedule' &&(
            <SchedulePick onSubmitSchedule={handleCombineData}
            userData={currentUserData}/>
        )}
        {currentPage === 'receipt' &&(
            <SchedulePick onSubmitSchedule={handleCombineData}
            userData={currentUserData}/>
        )}
    </div>
  )
}

export default App
