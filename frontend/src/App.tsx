import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/Login'
import WelcomePage from './pages/Home'
import RegisterPage from './pages/register'
import StudentDashboard from './pages/StudentView'
//import PropertyDashboard from './pages/landlordsView'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path ='/Login' element={<LoginPage />} />
        <Route path ='/Home' element={<WelcomePage />} />
        <Route path ='/Register' element={<RegisterPage />} />
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
        
        
      </Routes>
    </BrowserRouter>
  )
}

export default App