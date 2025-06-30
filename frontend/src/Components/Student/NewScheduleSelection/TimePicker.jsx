import React, { useState, useEffect } from 'react';
import { db } from '../../../db/firebase'; // Adjust the import path as necessary
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc and doc

const TimePicker = ({dataWithDate, onSubmitSchedule, handleFirestoreError}) => // Added handleFirestoreError prop
{

    const [isAM, setIsAm] = useState(true);
    const [bookedCountDisplay, setBookedCountDisplay] = useState(0); // State for booked count to display
    const [maxCapacityDisplay, setMaxCapacityDisplay] = useState(0); // State for max capacity to display
    const [selectedTime, setSelectedTime] = useState(null);
    const [fetchedDailySlots, setFetchedDailySlots] = useState(null); // To store the 'slots' map from Firestore

    // Effect to fetch daily slot data when dataWithDate (datePicked) changes
    useEffect(() => {
        const fetchDailySlots = async () => {
            if (!dataWithDate || !dataWithDate.datePicked) {
                // Reset display if no date is selected
                setFetchedDailySlots(null);
                setBookedCountDisplay(0);
                setMaxCapacityDisplay(0);
                setSelectedTime(null);
                return;
            }

            const dailySlotDocId = dataWithDate.datePicked;
            const dailySlotDocRef = doc(db, "DailySlotsAvailability", dailySlotDocId);

            try {
                console.log(`TimePicker: Attempting to fetch daily slot document for: ${dailySlotDocId}`);
                const docSnap = await getDoc(dailySlotDocRef); // <-- READ OPERATION

                if (docSnap.exists()) {
                    const slotsData = docSnap.data().slots;
                    console.log("TimePicker: Fetched daily slots data:", slotsData);
                    setFetchedDailySlots(slotsData);

                    // Optionally, set initial display to a default slot or just max capacity
                    // For now, we'll reset and wait for a user to pick a time
                    setBookedCountDisplay(0);
                    setMaxCapacityDisplay(0); // This will be updated when a specific time is chosen
                    setSelectedTime(null); // Clear selected time when date changes

                    // If you want to show a default slot's availability on date load:
                    // const defaultSlotKey = isAM ? "8:00am - 9:00am" : "1:00pm - 2:00pm"; // Or any other default
                    // if (slotsData && slotsData[defaultSlotKey]) {
                    //     setBookedCountDisplay(slotsData[defaultSlotKey].bookedCount);
                    //     setMaxCapacityDisplay(slotsData[defaultSlotKey].maxCapacity);
                    //     setSelectedTime(defaultSlotKey); // Auto-select the default time
                    // } else if (slotsData) { // If default slot not found, but slots exist, maybe show total capacity
                    //     // Calculate total max capacity from all slots
                    //     let totalMax = 0;
                    //     Object.values(slotsData).forEach(slot => totalMax += slot.maxCapacity);
                    //     setMaxCapacityDisplay(totalMax);
                    //     setBookedCountDisplay(0); // Or sum all booked counts if desired
                    // }

                } else {
                    console.warn(`TimePicker: Daily slot document for ${dailySlotDocId} does not exist.`);
                    setFetchedDailySlots(null);
                    setBookedCountDisplay(0);
                    setMaxCapacityDisplay(0);
                    setSelectedTime(null);
                    // DatePicker should have created this, so if it's missing, it's an issue.
                    // No need to call handleFirestoreError here, as DatePicker should ensure existence.
                }
            } catch (e) {
                console.error("TimePicker: Error fetching daily slots:", e);
                if (handleFirestoreError) {
                    handleFirestoreError(e); // Propagate error to centralized handler
                }
                setFetchedDailySlots(null);
                setBookedCountDisplay(0);
                setMaxCapacityDisplay(0);
                setSelectedTime(null);
            }
        };

        fetchDailySlots();
    }, [dataWithDate, handleFirestoreError]); // Re-run when selected date changes

    const handleChangePeriod = () =>
    {
        setIsAm(!isAM)
        setSelectedTime(null) // Clear selected time when switching AM/PM
        setBookedCountDisplay(0); // Reset display
        setMaxCapacityDisplay(0);
    }

    const handleChooseTime = (e) =>
    {
        const chosenTime = e.target.value;
        setSelectedTime(chosenTime);

        if (fetchedDailySlots && fetchedDailySlots[chosenTime]) {
            const slotDetails = fetchedDailySlots[chosenTime];
            setBookedCountDisplay(slotDetails.bookedCount);
            setMaxCapacityDisplay(slotDetails.maxCapacity);
        } else {
            // Fallback if data isn't immediately available or slot is missing
            setBookedCountDisplay(0);
            setMaxCapacityDisplay(0); // Or a default max capacity like 30
            console.warn(`TimePicker: Details for selected time slot ${chosenTime} not found in fetched data.`);
        }
    }

    const handleSubmitSchedule = async() =>
    {
        if (selectedTime === null)
        {
            alert("Please select a time slot."); // Will be replaced by custom modal later
            return;
        }

        const fullScheduleData = {
            ...dataWithDate,
            timePicked: selectedTime,
        };

       await onSubmitSchedule(fullScheduleData);
    }

    return (
        <div className='flex flex-col justify-center items-center gap-y-5 w-fit md:mx-10'>

            <h1 className='league-font text-[#686868] text-3xl font-medium'>
                Choose your Availability
            </h1>

            <div className='flex h-fit league-font w-full justify-between text-sm sm:text-md'>

                <button onClick={handleChangePeriod} className='bg-[#BDBDBD] flex transition-all duration-300 rounded-lg shadow-md'>
                    <div className={`font-bold rounded-l-lg px-4 pt-2 transition-all duration-200 ${isAM ? 'bg-[#CE9D31] text-white' : 'bg-[#BDBDBD] text-[#BDBDBD]  '}`}>
                        AM
                    </div>
                    <div className={`font-bold rounded-r-lg px-4 pt-2 transition-all duration-300 ${!isAM ? 'bg-purple-400 text-white' : 'bg-[#BDBDBD] text-[#BDBDBD] '}`}>
                        PM
                    </div>
                </button>

                <div className='text-lg sm:text-2xl border rounded-lg  border-[#A3A3A3] shadow-md flex justify-between w-fit'>
                    <div className={`w-3 h-full rounded-l-lg ${bookedCountDisplay >= maxCapacityDisplay * 0.75 ? 'bg-[#b11616]' : bookedCountDisplay >= maxCapacityDisplay * 0.5 ? 'bg-[#d7e427]' : 'bg-[#27732A]'} `}>
                        {/* Dynamic color based on booked count percentage */}
                    </div>
                    <h1 className='mx-2'>Slots {maxCapacityDisplay-bookedCountDisplay}/{maxCapacityDisplay}</h1> {/* Dynamic display */}
                </div>
            </div>

            <div className='flex-col flex gap-y-8 text-xs md:text-lg lg:text-xl'>

                <div className='flex martian-font gap-x-8'>

                    <button value={isAM ? "8:00am - 9:00am" : "1:00pm - 2:00pm"}
                        onClick={(e) => handleChooseTime(e)}
                        className={` shadow-md rounded-lg transition-all py-5 p-2 sm:px-10 duration-200 border-2 ${selectedTime === (isAM ? "8:00am - 9:00am" : "1:00pm - 2:00pm")
                            ? isAM ? 'bg-[#E1A500] border-[#C68C10] text-white' : ' text-white bg-purple-400 border-purple-500' :
                            'bg-[#EBEBEB] text-[#7B7B7B] border-[#D4D4D4]'}`}>

                        {isAM ? "8:00am - 9:00am" : "1:00pm - 2:00pm"}
                    </button>

                    <button value={isAM ? "9:00am - 10:00am" : "2:00pm - 3:00pm"}
                        onClick={(e) => handleChooseTime(e)}
                        className={`shadow-md rounded-lg transition-all duration-200 py-5 p-2 sm:px-10 border-2 ${selectedTime === (isAM ? "9:00am - 10:00am" : "2:00pm - 3:00pm")
                            ? isAM ? 'bg-[#E1A500] border-[#C68C10] text-white' : ' text-white bg-purple-400 border-purple-500' :
                            'bg-[#EBEBEB] text-[#7B7B7B] border-[#D4D4D4]'} ${isAM ? '' : ''}`}>

                        {isAM ? "9:00am - 10:00am" : "2:00pm - 3:00pm"}
                    </button>

                </div>

                <div className='flex martian-font gap-x-8'>

                    <button value={isAM ? "10:00am - 11:00am" : "3:00pm - 4:00pm"}
                        onClick={(e) => handleChooseTime(e)}
                        className={`shadow-md rounded-lg transition-all duration-200  ${selectedTime === (isAM ? "10:00am - 11:00am" : "3:00pm - 4:00pm")
                            ? isAM ? 'bg-[#E1A500] border-[#C68C10] text-white' : ' text-white bg-purple-400 border-purple-500' :
                            'bg-[#EBEBEB] text-[#7B7B7B] border-[#D4D4D4]'} ${isAM ? 'sm:px-7 border-2 py-5' : 'py-5 p-2 sm:px-10 border-2'}`}>

                        {isAM ? "10:00am - 11:00am" : "3:00pm - 4:00pm"}
                    </button>

                    <button value={isAM ? "11:00am - 12:00pm" : "4:00pm - 5:00pm"}
                        onClick={(e) => handleChooseTime(e)}
                        className={`shadow-md rounded-lg transition-all duration-200  ${selectedTime === (isAM ? "11:00am - 12:00pm" : "4:00pm - 5:00pm")
                            ? isAM ? 'bg-[#E1A500] border-[#C68C10] text-white' : ' text-white bg-purple-400 border-purple-500' :
                            'bg-[#EBEBEB] text-[#7B7B7B] border-[#D4D4D4]'} ${isAM ? 'sm:px-8 border-2 py-5' : 'py-5 p-2 sm:px-10 border-2'}`}>

                        {isAM ? "11:00am - 12:00pm" : "4:00pm - 5:00pm"}
                    </button>

                </div>

            </div>

            <button className='bg-[#E1A500] border-[#C68C10] league-font text-lg sm:text-2xl px-13 py-2 sm:py-3 font-bold border-2 text-white rounded-lg hover:bg-amber-600 duration-200' onClick={handleSubmitSchedule}>
                {/* <Link to='/receipt'> */}Schedule{/* </Link> */}
            </button>

        </div>
    )
}

export default TimePicker
