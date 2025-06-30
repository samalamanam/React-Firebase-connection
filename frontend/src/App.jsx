import React, { useEffect, useState } from "react";
import RegistrationForm from "./Components/Student/Pages/RegistrationForm";
import NewScheduleSelection from "./Components/Student/Pages/NewScheduleSelection";
import ScheduleReceipt from "./Components/Student/Pages/ScheduleReceipt";
import EndPage from "./Components/Student/Pages/EndPage";
import LimitPage from "./Components/Error/LimitPage"; // Import LimitPage for quota errors
import NotFoundPage from "./Components/Error/NotFoundPage"; // Import NotFoundPage for general errors
import { db } from './db/firebase'; // Ensure this path is correct and db is initialized
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'; // Import getDoc

export default function App() {

  // IMPORTANT: Removed top-level localStorage.removeItem calls.
  // These were causing data loss on every refresh.
  // localStorage is now managed only within useEffects and specific functions.

      localStorage.removeItem('currentUserData');//  NEEDED IF YOU WANT TO RESET THE DATA AFTER CONFIRMATION OTHERWISE MAGRERESET AGAD
    localStorage.removeItem('currentPage');

  // Initialize currentPage from localStorage, defaulting to 'register' if not found
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentPage');
    return savedPage || 'register';
  });

  const [currentUserData, setCurrentUserData] = useState(() => {
    const savedUserData = localStorage.getItem('currentUserData'); // Retrieve user data from localStorage
    return savedUserData ? JSON.parse(savedUserData) : null; // Default to null if no data is found
  });

  // New state for registration-specific errors and Firestore limit
  const [registrationError, setRegistrationError] = useState(null);
  const [firestoreLimitHit, setFirestoreLimitHit] = useState(false);

  // Save currentPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Save currentUserData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
  }, [currentUserData]);

  // CENTRALIZED ERROR HANDLER FOR FIRESTORE OPERATIONS (for registration and other potential future uses)
  const handleFirestoreError = (e) => {
    console.error("handleFirestoreError: Caught Firestore error:", e);
    // Check for specific error codes related to quota limits or permissions
    // 'resource-exhausted' is direct quota. 'permission-denied' can sometimes be quota if message indicates.
    if (e.code === 'resource-exhausted' || (e.code === 'permission-denied' && e.message.includes('quota'))) {
      console.warn("handleFirestoreError: Firestore quota limit likely hit!");
      setFirestoreLimitHit(true);
      setCurrentPage('limit'); // Redirect to LimitPage
    } else {
      console.error("handleFirestoreError: An unexpected non-quota Firestore error occurred:", e.message);
      setRegistrationError(`An unexpected error occurred: ${e.message}. Please try again.`);
      setCurrentPage('error'); // Redirect to generic error page (NotFoundPage)
    }
    // Clear user data and page in localStorage to ensure a fresh start after error
    setCurrentUserData(null);
    localStorage.removeItem('currentUserData');
    localStorage.removeItem('currentPage');
  };


  const handleRegistrationSubmit = async (data) => {
    setRegistrationError(null); // Clear previous errors
    setFirestoreLimitHit(false); // Clear previous limit flags

    const studentNumberToCheck = data.studentNumber;
    // Reference to the document where user registration info might be stored
    // Assuming 'Schedules' collection stores user registration info, using student number as doc ID
    const userDocRef = doc(db, "Schedules", studentNumberToCheck);

    try {
      console.log("handleRegistrationSubmit: Attempting to check for existing user:", studentNumberToCheck);
      const docSnap = await getDoc(userDocRef); // <-- FIRESTORE READ OPERATION

      if (docSnap.exists()) {
        console.log("handleRegistrationSubmit: User with this student number already exists.");
        // NOTE: This alert will be replaced by a custom modal later
        alert("This student number is already registered. Please check your information.");
        return; // Stop the process if user exists
      }

      console.log("handleRegistrationSubmit: User not found, proceeding to schedule selection.");
      setCurrentUserData(data);
      setCurrentPage('schedule');
    } catch (e) {
      console.error("handleRegistrationSubmit: Error during user existence check:", e);
      // Pass any Firestore errors to the centralized handler
      handleFirestoreError(e);
    }
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
      {/* Conditional rendering based on currentPage and firestoreLimitHit */}
      {firestoreLimitHit ? (
        <LimitPage /> // Render LimitPage if Firestore limit is hit
      ) : currentPage === 'register' ? (
        <RegistrationForm onSubmitRegistration={handleRegistrationSubmit} registrationError={registrationError} />
      ) : currentPage === 'schedule' ? (
        <NewScheduleSelection userData={currentUserData} getFullBookingData={getFullBookingData} />
      ) : currentPage === 'receipt' ? (
        <ScheduleReceipt userData={currentUserData} confirmBooking={confirmBooking} />
      ) : currentPage === 'end' ? (
        <EndPage />
      ) : currentPage === "error" ? ( // Render NotFoundPage for generic errors
        <NotFoundPage />
      ) : null}
    </div>
  );
}
