import React, { useState, useEffect, useCallback } from 'react';
import { addDays, subDays, format, nextTuesday, previousTuesday, isToday, set } from 'date-fns';
import { db } from '../../../db/firebase'; // Adjust the import path as necessary
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import getDoc and setDoc

// Helper function to get the Tuesday of the week for any given date
const getTuesdayOfWeek = (date) => {
  const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  if (dayOfWeek === 2) { // Already Tuesday
    return date;
  } else if (dayOfWeek < 2 || dayOfWeek === 6) { // Monday (1), Sunday (0), Saturday (6)
    // If today is Mon/Sun/Sat, next Tuesday is this week's or next week's Tuesday
    return nextTuesday(date);
  } else { // Wednesday (3), Thursday (4), Friday (5)
    // If today is Wed/Thu/Fri, previous Tuesday is this week's Tuesday
    return previousTuesday(date);
  }
};

// Define default slots with fixed maxCapacity - STANDARDIZED FORMATS
// THESE STRINGS MUST EXACTLY MATCH THE VALUES IN TimePicker.jsx BUTTONS
const DEFAULT_SLOT_TIMES = [
    "8:00am - 9:00am",
    "9:00am - 10:00am",
    "10:00am - 11:00am",
    "11:00am - 12:00pm", // 12 PM is noon
    "1:00pm - 2:00pm",
    "2:00pm - 3:00pm",
    "3:00pm - 4:00pm",
    "4:00pm - 5:00pm"
];
const FIXED_MAX_CAPACITY = 30; // Your fixed max capacity for all slots

// Accept the handleFirestoreError prop
function DatePicker({userData, onSubmitDate, onDateSelectionChange, handleFirestoreError})
{
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return getTuesdayOfWeek(today); // Start from Tuesday of current week
  });

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateToConfirm, setDateToConfirm] = useState(null); // State for the date waiting for confirmation

  // Calculate the start of the current actual week (Tuesday)
  const actualTodayWeekStart = getTuesdayOfWeek(new Date());

  // Calculate the maximum allowed week start (Tuesday 3 weeks from actualTodayWeekStart)
  // This means current week + 3 full weeks = 4 weeks total visibility
  const maxAllowedWeekStart = addDays(actualTodayWeekStart, 3 * 7);


  // Function to calculate the four days (Tuesday to Friday)
  const calculateWeekDays = useCallback(() =>
  {
    const dates = [];
    let currentDate = currentWeekStart;
    for (let i = 0; i < 4; i++)
    { // Loop 4 times
      dates.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    setAvailableDates(dates);
  }, [currentWeekStart]);


  useEffect(() =>
  {
    calculateWeekDays();
  }, [currentWeekStart, calculateWeekDays]);


  // --- LOGIC: Slot Generation for the displayed week (RE-INTRODUCED) ---
  // This ensures the daily slot documents exist in Firestore when a week is viewed
  useEffect(() => {
    const ensureWeekSlotsExist = async () => {
      // Check only the first day of the currently displayed week (currentWeekStart)
      // We assume if one day of the week exists, the others do too.
      // If not, we'll create all 4 days (Tues-Fri) for this week.

      const firstDayOfWeekFormatted = format(currentWeekStart, 'MMM-dd-yyyy');
      const firstDayDocRef = doc(db, "DailySlotsAvailability", firstDayOfWeekFormatted);

      try {
        console.log(`DatePicker: Checking if week starting ${firstDayOfWeekFormatted} exists...`);
        const docSnap = await getDoc(firstDayDocRef); // <-- 1 READ OPERATION

        if (!docSnap.exists()) {
          console.log(`DatePicker: Week starting ${firstDayOfWeekFormatted} does not exist. Attempting to create all 4 days...`);

          // Prepare the default slot data for creation
          const defaultSlotsForDay = {};
          DEFAULT_SLOT_TIMES.forEach(time => {
            defaultSlotsForDay[time] = { bookedCount: 0, maxCapacity: FIXED_MAX_CAPACITY };
          });

          // Create documents for Tuesday, Wednesday, Thursday, Friday of this week
          const creationPromises = [];
          for (let i = 0; i < 4; i++) { // For Tuesday, Wednesday, Thursday, Friday
            const currentDayDate = addDays(currentWeekStart, i);
            const currentDayId = format(currentDayDate, 'MMM-dd-yyyy');
            const newDayDocRef = doc(db, "DailySlotsAvailability", currentDayId);

            // Using setDoc directly (not a transaction) means there's a race condition risk
            // if multiple users try to create the same document simultaneously.
            // Only one will succeed, others will fail with ALREADY_EXISTS.
            // This is the accepted compromise for Spark plan without Cloud Functions.
            creationPromises.push(setDoc(newDayDocRef, { date: currentDayId, slots: defaultSlotsForDay })); // <-- 1 WRITE PER DAY
          }
          await Promise.allSettled(creationPromises); // Use allSettled to see results of all promises
          console.log("DatePicker: New week creation attempts completed.");
          // Note: Some setDoc might fail if another client created them simultaneously.
          // The TimePicker will simply read the newly created doc on next fetch.

        } else {
            console.log(`DatePicker: Week starting ${firstDayOfWeekFormatted} already exists.`);
        }
      } catch (e) {
        console.error("DatePicker: Error during week slot generation:", e);
        // Propagate the error up to App.jsx for global error handling (LimitPage)
        if (handleFirestoreError) { // Ensure prop exists before calling
            handleFirestoreError(e);
        }
      }
    };

    // Only run this when currentWeekStart changes, or initially.
    // And only for weeks that are within the allowed range to prevent unnecessary creation attempts far into the future.
    // Compare formatted dates to avoid time-of-day issues in comparison
    if (format(currentWeekStart, 'yyyy-MM-dd') <= format(maxAllowedWeekStart, 'yyyy-MM-dd')) {
        ensureWeekSlotsExist();
    }

  }, [currentWeekStart, maxAllowedWeekStart, handleFirestoreError]); // Added handleFirestoreError to deps


  const handleNextWeek = () =>
  {
    const nextWeekDate = addDays(currentWeekStart, 7);
    // Only allow navigation if nextWeekDate is NOT beyond the maxAllowedWeekStart
    if (format(nextWeekDate, 'yyyy-MM-dd') <= format(maxAllowedWeekStart, 'yyyy-MM-dd')) { // Compare formatted dates to avoid time issues
      setSelectedDate(null); // Clear selected date when changing week
      setDateToConfirm(null); // Clear date to confirm
      onDateSelectionChange(); // Inform parent that date selection has changed/cleared
      setCurrentWeekStart(nextWeekDate);
    } else {
      console.log("Cannot navigate beyond the 4-week limit.");
    }
  };

  const handlePrevWeek = () =>
  {
    const prevWeekDate = subDays(currentWeekStart, 7);
    // Only allow navigation if prevWeekDate is NOT before the actualTodayWeekStart
    // Use format to compare only date parts, ignoring time
    if (format(prevWeekDate, 'yyyy-MM-dd') >= format(actualTodayWeekStart, 'yyyy-MM-dd')) {
      setSelectedDate(null); // Clear selected date when changing week
      setDateToConfirm(null); // Clear date to confirm
      onDateSelectionChange(); // Inform parent that date selection has changed/cleared
      setCurrentWeekStart(prevWeekDate);
    } else {
      console.log("Cannot navigate to weeks before the current week.");
    }
  };

  // When a date is clicked, just mark it as selected and ready for confirmation
  const handleDateClick = (date) =>
  {
    setSelectedDate(date);
    setDateToConfirm(date); // Set the date to be confirmed
    onDateSelectionChange(); // Inform parent that a new date is clicked (TimePicker should hide)
  };

  // This function is called when the user clicks the "View Slots" button
  const handleConfirmDate = async () => {
    if (dateToConfirm) {
      const pickedDate = format(dateToConfirm, 'MMM-dd-yyyy');
      const addDateData = {
        ...userData,
        datePicked: pickedDate,
      };
      await onSubmitDate(addDateData); // Call parent's onSubmitDate (this will cause TimePicker to show)
      setDateToConfirm(null); // Clear dateToConfirm so button hides after confirmation
    }
  };

  // Determine if the Next Week button should be disabled
  const isNextWeekDisabled = format(currentWeekStart, 'yyyy-MM-dd') >= format(maxAllowedWeekStart, 'yyyy-MM-dd');
  // Determine if the Prev Week button should be disabled
  const isPrevWeekDisabled = format(currentWeekStart, 'yyyy-MM-dd') <= format(actualTodayWeekStart, 'yyyy-MM-dd');


  return (
    <div className='flex-col flex justify-center items-center gap-y-8 w-full lg:w-fit md:mt-5'>

      <h1 className='font-bold text-4xl text-gray-600 league-font'>
        Pick a date
      </h1>

      <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full lg:w-fit">

        <button
          onClick={handlePrevWeek}
          disabled={isPrevWeekDisabled} // Disable button
          className={`p-2 sm:p-3 text-gray-500 hover:text-gray-700
            transition-colors duration-200 ease-in-out rounded-full hover:bg-gray-200
            focus:outline-none focus:ring-2 focus:ring-gray-300 ${isPrevWeekDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}>

          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>

        </button>

        {/* Date Display */}
        <div className="flex flex-wrap justify-center sm:justify-start shadow-lg shadow-gray-300 w-full sm:w-full ">
          {availableDates.map((date) =>
          {
            const dayOfWeek = format(date, 'EEE');
            const dayOfMonth = format(date, 'dd');
            const month = format(date, 'MMM');
            const year = format(date, "yyyy")
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

            const today = new Date();
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = dateOnly < todayOnly; // Disable past dates

            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                className={`league-font flex flex-col items-center justify-between w-1/4 sm:h-35 md:h-45 lg:w-40 xl:h-60 bg-gray-100 transition-all duration-200 ease-in-out border border-gray-300 ${isPast ? 'opacity-50 cursor-not-allowed' : ''} `}
                onClick={() => handleDateClick(date)}
                disabled={isPast}
              >
                <div className='text-md sm:text-xl pt-3 font-semibold text-gray-600 mb-3 border-gray-400 w-full h-4/12 flex justify-center items-center bg-neutral-200'>
                  {dayOfWeek}
                </div>
                <div className={`text-3xl md:text-4xl lg:text-5xl font-bold flex items-end h-5/12 ${isSelected ? 'text-red-900' : 'text-neutral-500'}`}>
                  {dayOfMonth}
                </div>
                <div className={`text-sm md:text-xl lg:text-2xl font-mono uppercase h-3/12 ${isSelected ? 'text-red-900' : 'text-gray-500'}`}>
                  {month}
                </div>
                <div className={`text-sm md:text-lg lg:text-xl font-mono uppercase h-3/12 ${isSelected ? 'text-red-900' : 'text-gray-400'}`}>
                  {year}
                </div>
              </button>
            );
          })}
        </div>

        {/* Next Week Button */}
        <button
          onClick={handleNextWeek}
          disabled={isNextWeekDisabled} // Disable button based on 4-week limit
          className={`p-2 sm:p-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 ease-in-out rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${isNextWeekDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Confirmation Button - Only show if a date is selected and ready to confirm */}
      {dateToConfirm && (
        <button
          onClick={handleConfirmDate}
          className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Slots for {format(dateToConfirm, 'MMM dd,yyyy')}
        </button>
      )}
    </div>
  );
}

export default DatePicker;
