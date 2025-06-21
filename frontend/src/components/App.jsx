import React from 'react'
import RegistrationForm from './RegistrationForm';
import { useState } from 'react'
import SchedulePick from './SchedulePick';
import {db} from '/firebase'
import {doc, setDoc, addDoc, collection} from 'firebase/firestore'
import { SpeedInsights } from "@vercel/speed-insights/react"
const App = () => {

     const [currentUserData, setCurrentUserData] = useState(null); // Stores { name, studentNumber } pero will then add the date and time pag sa schedule na
     const [currentPage, setCurrentPage] = useState('register'); // register, schedule, receipt

     const handleRegistrationSubmit = (data) =>{ // after masubmit ng registration
        setCurrentUserData(data);
        setCurrentPage('schedule')
        console.log(data)
     }
     
     const handleCombineData = async (fullData) =>{ // after ng scheduler submission
        console.log(fullData)   

        const customDocId = fullData.studentNumber; 
    try {
      const docRef = doc(db, "Schedules", customDocId); //looking for proper colletion and creating new documentation renamed ng studentnumber na inimput
      await setDoc(docRef, { 
        ...fullData
      });
      setCurrentUserData(null); 
      setCurrentPage('register');
    } catch (e) {
      console.log("u fucked up")
    }   
        
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
        <SpeedInsights />
    </div>
  )
}

export default App
