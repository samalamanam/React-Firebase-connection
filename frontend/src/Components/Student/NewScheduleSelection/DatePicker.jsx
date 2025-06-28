import React, { useState, useEffect, useCallback } from 'react';
import { addDays, subDays, format, nextTuesday, previousTuesday, isToday, set } from 'date-fns';

function DatePicker({userData, onSubmitDate})
{
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
  {

    const today = new Date();
    const dayOfWeek = today.getDay();
    

    if (dayOfWeek === 2)
    { // Tuesday
      return today;
    } else if (dayOfWeek < 2 || dayOfWeek === 6)
    { // Monday or Sunday
      return nextTuesday(today);
    } else
    { // Wednesday, Thursday, Friday, Saturday
      return previousTuesday(today);
    }
  });

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

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
  }, [currentWeekStart, selectedDate]);

  // Recalculate dates whenever currentWeekStart changes
  useEffect(() =>
  {
    calculateWeekDays();
  }, [currentWeekStart, calculateWeekDays]);

  const handleNextWeek = () =>
  {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7)); // Add 7 days 
  };

  const handlePrevWeek = () =>
  {
    const prevWeekStart = subDays(currentWeekStart, 7);
    const today = new Date();
    const prevWeekStartDate = new Date(prevWeekStart.getFullYear(), prevWeekStart.getMonth(), prevWeekStart.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (prevWeekStartDate >= todayDate) {
      setCurrentWeekStart(prevWeekStart);
    }
  };

  const handleDateSelect = async (date) =>
  {
    setSelectedDate(date);
   const pickedDate = format(date, 'MMM-dd-yyyy');
    const addDateData = {
      ...userData, 
      datePicked: pickedDate,
    };
    await onSubmitDate(addDateData);
  };

  

  return (
    <div className='flex-col flex justify-center items-center gap-y-8 w-full lg:w-fit md:mt-5'>

      <h1 className='font-bold text-4xl text-gray-600 league-font'>
        Pick a date
      </h1>

      <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full lg:w-fit">

        <button
          onClick={handlePrevWeek}
          className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 
        transition-colors duration-200 ease-in-out rounded-full hover:bg-gray-200 
        focus:outline-none focus:ring-2 focus:ring-gray-300">

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
            const isCurrentDay = isToday(date);
            // Disable if date is before today
            const today = new Date();
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = dateOnly < todayOnly;

            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                className={`league-font flex flex-col items-center justify-between w-1/4 sm:h-35 md:h-45 lg:w-40 xl:h-60 bg-gray-100 transition-all duration-200 ease-in-out border border-gray-300 ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleDateSelect(date)}
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
          className="p-2 sm:p-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 ease-in-out rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default DatePicker;