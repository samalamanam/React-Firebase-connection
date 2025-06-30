import React, { useState } from 'react';
import DatePicker from '../NewScheduleSelection/DatePicker';
import QueryPanel from '../NewScheduleSelection/QueryPanel';
import TimePicker from '../NewScheduleSelection/TimePicker';
// Removed 'set' import as it's not used here

// Accept the new handleFirestoreError prop
const NewScheduleSelection = ({userData, getFullBookingData, handleFirestoreError}) => // <-- ADD handleFirestoreError here
{
  const [dataWithDate, setdataWithDate] = useState(null);
  const [isDateSelected, setIsDateSelected] = useState(false);

  const onSubmitDate = async (addDateData) =>{
    setIsDateSelected(true);
    setdataWithDate(addDateData);
    console.log(addDateData)
  }

  const onDateSelectionChange = () => {
    setIsDateSelected(false);
    setdataWithDate(null);
  }

  const fullSchedSubmission = async (fullScheduleData) => {
    console.log(fullScheduleData)
    await getFullBookingData(fullScheduleData);
  }

  return (
    <div className='flex flex-col sm:flex-row-reverse justify-center items-center bg-[#E7E7E7]'>

      <div className='flex w-full sm:w-2/12 justify-end'>
        <QueryPanel />
      </div>

      <div className='flex flex-col justify-evenly items-center w-full sm:w-10/12 h-screen'>
        <DatePicker
          userData={userData}
          onSubmitDate={onSubmitDate}
          onDateSelectionChange={onDateSelectionChange}
          handleFirestoreError={handleFirestoreError} // <-- Pass the error handler down
        />

        {isDateSelected ? (
          <TimePicker dataWithDate={dataWithDate} onSubmitSchedule={fullSchedSubmission}/>
        ) : (
          <h1 className='text-xl font-bold text-red-500 league-font h-5/12'>Please select a date first.</h1>
        )}
      </div>
    </div>
  )
}

export default NewScheduleSelection
