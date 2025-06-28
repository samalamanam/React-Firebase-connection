import React, { useEffect, useState } from "react";
import RegistrationForm from "./Components/Student/Pages/RegistrationForm";
import NewScheduleSelection from "./Components/Student/Pages/NewScheduleSelection";
import ScheduleReceipt from "./Components/Student/Pages/ScheduleReceipt";
import EndPage from "./Components/Student/Pages/EndPage";
import {db} from './db/firebase';
import {doc, setDoc, addDoc, collection} from 'firebase/firestore'

export default function App() {

    localStorage.removeItem('currentUserData');//  NEEDED IF YOU WANT TO RESET THE DATA AFTER CONFIRMATION OTHERWISE MAGRERESET AGAD
    localStorage.removeItem('currentPage');  


  // Initialize currentPage from localStorage, defaulting to 'register' if not found
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentPage');
    return savedPage || 'register';
  });

  const [currentUserData, setCurrentUserData] = useState(() => {
    const savedUserData = localStorage.getItem('currentUserData'); // Retrieve user data from localStorage PARA PAG NAG REFRESH DI MAWALA ANG DATA TAPOS DI MARERESET ANG PAGE
    return savedUserData ? JSON.parse(savedUserData) : null; // Default to null if no data is found
  });

  // Save currentPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Save currentUserData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
  }, [currentUserData]);

  const handleRegistrationSubmit = (data) => {
    setCurrentUserData(data);
    setCurrentPage('schedule');
    console.log(data);
  };

  const getFullBookingData = async (fullScheduleData) => {
    setCurrentUserData(fullScheduleData);
    console.log(fullScheduleData);
    setCurrentPage('receipt');    //change page to receipt
  };

  const confirmBooking = async (currentUserData) => {
    console.log(Object.values(currentUserData));
    console.log("YOU HAVE CONFIRMED YOUR BOOKING");


    // Prepare the data to be saved in Firestore
  const customDocId = currentUserData.studentNumber; 
    try {
      const docRef = doc(db, "Schedules", customDocId); //looking for proper colletion and creating new documentation renamed ng studentnumber na inimput
      await setDoc(docRef, { 
        ...currentUserData
      });
      setCurrentUserData(null); 
      setCurrentPage('register');
    } catch (e) {
      console.log("u fucked up")
    }   
     setCurrentPage('end');
    // Clear registration/schedule data after successful confirmation
    localStorage.removeItem('currentUserData');//  NEEDED IF YOU WANT TO RESET THE DATA AFTER CONFIRMATION OTHERWISE MAGRERESET AGAD
    localStorage.removeItem('currentPage');  

    console.log("goodbye");
     }


  return (
    <div className="w-screen h-screen">
      {currentPage === 'register' && (
        <RegistrationForm onSubmitRegistration={handleRegistrationSubmit} />
      )}

      {currentPage === 'schedule' && (
        <NewScheduleSelection userData={currentUserData} getFullBookingData={getFullBookingData} />
      )}

      {currentPage === 'receipt' && (
        <ScheduleReceipt userData={currentUserData} confirmBooking={confirmBooking} />
      )}

      {currentPage === 'end' && (
        <EndPage />
      )}
    </div>
  );
}