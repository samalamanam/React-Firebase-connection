import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SchedulePick from './components/SchedulePick.jsx'
import App from './components/App.jsx'
import RegistrationForm from './components/RegistrationForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App/>
  </StrictMode>,
)
