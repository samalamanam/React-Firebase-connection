import React from 'react'
import { useState } from 'react'

const RegistrationForm = ({onSubmitRegistration}) => {

     const [name, setName] = useState('');
     const [studentNumber, setStudentNumber] = useState('');

    const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !studentNumber) {
        alert("Please fill in both name and student number."); // You can replace with a prop-based message
        return;
    }
    // Call the prop function to pass data UP to App.jsx
    onSubmitRegistration({ name, studentNumber }); 
};

  return (
    <div className='flex flex-row justify-center items-center h-screen min-w-screen bg-gray-100'>

      <div className='min-w-2/12 min-h-fit bg-gray-300 border-8 rounded-4xl pt-12 pb-5 flex justify-center items-center flex-col'>
          <h1 className='mb-10 text-4xl'>Register</h1>

          <form onSubmit={handleSubmit} method="post" className='flex flex-col mb-4'>
            <label>Name:</label>
            <input type="text" className='bg-gray-500 p-1 rounded-sm' placeholder='Jane "Soldier" Doe' value={name} onChange={(e)=> setName(e.target.value)} />
            <label>Student Number:</label>
            <input type="text" className='bg-gray-500 p-1 rounded-sm' placeholder='2022300003' value={studentNumber} onChange={(e)=> setStudentNumber(e.target.value)} />
            <br />
            <button type="submit" className='border-2 w-fit self-center px-10 '>Schedule Date and Time</button>
          </form>
      </div>

    </div>
  )
}

export default RegistrationForm
