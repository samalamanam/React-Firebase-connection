import React, { useEffect, useState } from "react";
import RegistrationForm from "./Components/Student/Pages/RegistrationForm";
import NewScheduleSelection from "./Components/Student/Pages/NewScheduleSelection";
import ScheduleReceipt from "./Components/Student/Pages/ScheduleReceipt";
import EndPage from "./Components/Student/Pages/EndPage";
import LimitPage from "./Components/Error/LimitPage"; // Import LimitPage for quota errors
import NotFoundPage from "./Components/Error/NotFoundPage"; // Import NotFoundPage for general errors
import { db } from './db/firebase'; // Ensure this path is correct and db is initialized
import { doc, setDoc, collection, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'; // Import necessary Firestore functions

export default function App() {

  // IMPORTANT: Removed top-level localStorage.removeItem calls.
  // These were causing data loss on every refresh.
  // localStorage is now managed only within useEffects and specific functions.

      localStorage.removeItem('currentUserData');
    localStorage.removeItem('currentPage');

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentPage');
    return savedPage || 'register';
  });

  const [currentUserData, setCurrentUserData] = useState(() => {
    const savedUserData = localStorage.getItem('currentUserData');
    return savedUserData ? JSON.parse(savedUserData) : null;
  });

  const [registrationError, setRegistrationError] = useState(null);
  const [firestoreLimitHit, setFirestoreLimitHit] = useState(false); // State for Firestore quota limit

  // useEffect to persist state to localStorage
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
    localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
  }, [currentPage, currentUserData]);

  // CENTRALIZED ERROR HANDLER FOR FIRESTORE OPERATIONS
  // This function will be passed down to components that perform Firestore ops
  const handleFirestoreError = (e) => {
    console.error("handleFirestoreError: Caught Firestore error:", e);
    // Check for specific error codes related to quota limits or permissions
    // 'resource-exhausted' is direct quota. 'permission-denied' can sometimes be quota if message includes 'quota'.
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


  // Handle user registration submission
  const handleRegistrationSubmit = async (data) => {
    setRegistrationError(null); // Clear previous errors
    setFirestoreLimitHit(false); // Clear previous limit flags

    const studentNumberToCheck = data.studentNumber;
    // Assuming 'Schedules' collection stores user registration info for existence check
    const userDocRef = doc(db, "Schedules", studentNumberToCheck);

    try {
      console.log("handleRegistrationSubmit: Checking for existing user registration...");
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
      handleFirestoreError(e); // Pass any Firestore errors to the centralized handler
    }
  };

  // Callback to get full booking data from NewScheduleSelection (DatePicker/TimePicker)
  const getFullBookingData = async (fullScheduleData) => {
    console.log("getFullBookingData: Received full schedule data:", fullScheduleData);
    setCurrentUserData(fullScheduleData);
    setCurrentPage('receipt');
  };

  // CONFIRM BOOKING TRANSACTION LOGIC (Client-side, no Cloud Functions)
  const confirmBooking = async (currentUserData) => {
    console.log("confirmBooking: Initiating booking for:", currentUserData);

    setFirestoreLimitHit(false); // Reset any previous limit flags
    setRegistrationError(null);  // Clear any previous errors

    const selectedDate = currentUserData.datePicked;
    const selectedTimeSlot = currentUserData.timePicked; // Ensure TimePicker passes this as 'timePicked'
    const studentNumber = currentUserData.studentNumber; // Get student number for doc ID

    // Document reference for the daily slot availability (e.g., DailySlotsAvailability/Jul-04-2025)
    const dailySlotDocId = selectedDate; // Document ID is the formatted date string
    const dailySlotDocRef = doc(db, "DailySlotsAvailability", dailySlotDocId);
    console.log("confirmBooking: Daily Slot Document Reference:", dailySlotDocRef.path);

    // Collection reference for individual user bookings (now "Schedules")
    const userBookingsCollectionRef = collection(db, "Schedules"); 
    console.log("confirmBooking: User Bookings Collection Reference:", userBookingsCollectionRef.path);

    // Data for the individual user's booking record
    const userBookingData = {
      studentNumber: studentNumber, // Ensure studentNumber is explicitly included
      fullName: currentUserData.fullName,
      dateBooked: selectedDate,
      timeSlotBooked: selectedTimeSlot,
      timestamp: serverTimestamp(), // Use serverTimestamp for accurate server time
    };
    console.log("confirmBooking: User Booking Data prepared:", userBookingData);

    const MAX_RETRIES = 5; // Max attempts for transaction retries
    let lastError = null;

    // --- Firestore Transaction with Client-Side Retries ---
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      console.log(`confirmBooking: Attempting transaction... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
      try {
        await runTransaction(db, async (transaction) => {
          // 1. READ the current state of the daily slot document
          console.log("Transaction: Getting daily slot document...");
          const dailySlotDoc = await transaction.get(dailySlotDocRef); // <-- READ OPERATION (part of transaction)

          if (!dailySlotDoc.exists) {
            // This indicates a problem if DatePicker was supposed to create it.
            // This can happen if user navigates to a new date, then quickly books before DatePicker's useEffect finishes.
            console.error("Transaction Error: Daily slot document does not exist:", dailySlotDocId);
            throw new Error(`Schedule for ${dailySlotDocId} not found. Please re-select date.`);
          }

          // Access the specific time slot's data from the document's 'slots' map
          const slotsData = dailySlotDoc.data().slots || {}; // Ensure 'slots' field exists and is an object
          const selectedSlotDetails = slotsData[selectedTimeSlot];

          console.log("Transaction: Daily slot document data:", dailySlotDoc.data());
          console.log("Transaction: Selected Time Slot:", selectedTimeSlot);
          console.log("Transaction: Details for selected slot:", selectedSlotDetails);

          // Validate selected slot details
          if (!selectedSlotDetails || typeof selectedSlotDetails.maxCapacity !== 'number' || selectedSlotDetails.maxCapacity <= 0) {
            console.error("Transaction Error: Selected time slot details incomplete or invalid.", selectedSlotDetails);
            throw new Error("Selected time slot details are incomplete or unavailable. Please choose another.");
          }

          const currentBookedCount = selectedSlotDetails.bookedCount || 0;
          const maxCapacity = selectedSlotDetails.maxCapacity;

          console.log(`Transaction: Current booked count: ${currentBookedCount}, Max capacity: ${maxCapacity}`);

          // 2. CHECK capacity and perform update
          if (currentBookedCount < maxCapacity) {
            const newBookedCount = currentBookedCount + 1;
            const updatePath = `slots.${selectedTimeSlot}.bookedCount`; // Path to update nested field
            console.log(`Transaction: Updating ${updatePath} to ${newBookedCount}`);

            transaction.update(dailySlotDocRef, {
              [updatePath]: newBookedCount // <-- WRITE OPERATION (part of transaction)
            });

            // 3. ADD a new document to the "Schedules" collection for the user's booking
            // --- FIX: Use studentNumber as the document ID for the user's booking ---
            const userBookingDocRef = doc(userBookingsCollectionRef, studentNumber); 
            console.log("Transaction: Setting new user booking document in Schedules with ID:", studentNumber);
            transaction.set(userBookingDocRef, userBookingData); // <-- WRITE OPERATION (part of transaction)

          } else {
            console.warn(`Transaction Warning: Slot ${selectedTimeSlot} is full (Count: ${currentBookedCount}, Max: ${maxCapacity}).`);
            throw new Error("This slot is now full. Please select another."); // Slot is full
          }
        });

        // If transaction succeeds, this code runs
        console.log("confirmBooking: Booking transaction succeeded! Redirecting to End Page.");
        setCurrentUserData(null); // Clear data after successful booking
        setCurrentPage('end');
        localStorage.removeItem('currentUserData'); // Clear local storage after successful booking
        localStorage.removeItem('currentPage');
        return; // Exit the retry loop and function

      } catch (e) {
        lastError = e; // Store the last error encountered
        console.error("confirmBooking: Transaction attempt failed:", e.code, e.message);

        // Check if the error is an 'aborted' error (due to contention) and if retries are left
        if (e.code === 'aborted' && attempt < MAX_RETRIES - 1) {
          console.warn(`confirmBooking: Transaction aborted, retrying (${attempt + 1}/${MAX_RETRIES})...`);
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms, etc.
          const jitter = Math.random() * baseDelay * 0.5; // Add randomness
          const totalDelay = baseDelay + jitter;
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        } else {
          // If not an 'aborted' error, or max retries reached, handle it as a final failure
          console.error("confirmBooking: Final transaction failure or non-retryable error.");
          handleFirestoreError(e); // Pass error to centralized handler
          // Ensure data is cleared and page is reset even on final failure
          setCurrentUserData(null);
          localStorage.removeItem('currentUserData');
          localStorage.removeItem('currentPage');
          return; // Exit the function
        }
      }
    }
    // If the loop completes without 'return', it means all retries failed
    console.error("confirmBooking: Booking failed after all retries due to persistent contention. Final error:", lastError);
    lastError = lastError || new Error("Booking failed due to too many simultaneous requests. Please try again in a moment.");
    handleFirestoreError(lastError); // Show error to user
    setCurrentUserData(null);
    localStorage.removeItem('currentUserData');
    localStorage.removeItem('currentPage');
  };


  return (
    <div className="w-screen h-screen">
      {/* RENDER LOGIC: Prioritize LimitPage for quota errors */}
      {firestoreLimitHit ? (
        <LimitPage />
      ) : currentPage === 'register' ? (
        <RegistrationForm onSubmitRegistration={handleRegistrationSubmit} registrationError={registrationError} />
      ) : currentPage === 'schedule' ? (
        // Pass handleFirestoreError down to NewScheduleSelection (and then DatePicker)
        <NewScheduleSelection userData={currentUserData} getFullBookingData={getFullBookingData} handleFirestoreError={handleFirestoreError} />
      ) : currentPage === 'receipt' ? (
        <ScheduleReceipt userData={currentUserData} confirmBooking={confirmBooking} />
      ) : currentPage === 'end' ? (
        <EndPage />
      ) : currentPage === "error" ? ( // Display NotFoundPage for generic errors
        <NotFoundPage />
      ) : null}
    </div>
  );
}
