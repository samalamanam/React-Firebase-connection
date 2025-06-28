import RegistrationForm from "./Components/Student/Pages/RegistrationForm";
import ScheduleReceipt from "./Components/Student/Pages/ScheduleReceipt";
import ScheduleSelection from "./Components/Student/Pages/ScheduleSelection";
import AdminPage from "./Components/Admin/AdminPage";
import QueryPanel from "./Components/Student/NewScheduleSelection/QueryPanel";
import TimePicker from "./Components/Student/NewScheduleSelection/TimePicker";
import NotFound from "./Components/Error/NotFound";
import kuruKuru from './Components/public/kurukuru-kururing.gif';
import EndPage from "./Components/Student/Pages/EndPage";
import NewScheduleSelection from "./Components/Student/Pages/NewScheduleSelection";
import { useEffect, useState, useRef } from "react";


export default function App()
{
     const [currentUserData, setCurrentUserData] = useState(null);
     const [currentPage, setCurrentPage] = useState('register');

       const handleRegistrationSubmit = (data) =>{ // after masubmit ng registration
        setCurrentUserData(data);
        setCurrentPage('schedule')
        console.log(data)
     }

      const getFullBookingData = async (fullScheduleData) => {
        
        setCurrentUserData(fullScheduleData);
        console.log(fullScheduleData);
        setCurrentPage('receipt');
      }

      const confirmBooking = async (currentUserData) => {
        console.log(Object.values(currentUserData));
        console.log("YOU HAVE CONFIRMED YOUR BOOKING");
        setCurrentPage('end');
      }

  return (
      <div className="w-screen h-screen">
            {currentPage === 'register' &&(
            <RegistrationForm onSubmitRegistration={handleRegistrationSubmit} /> 
        )}

        {currentPage === 'schedule' && (
            <NewScheduleSelection userData={currentUserData}
            getFullBookingData={getFullBookingData} />
        )}

        {currentPage === 'receipt' && (
            <ScheduleReceipt userData={currentUserData} confirmBooking={confirmBooking}/>
        )}

        {currentPage === 'end' && (
            <EndPage />
        )}
      </div>

  );
}