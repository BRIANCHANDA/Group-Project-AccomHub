import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/Login'
import WelcomePage from './pages/Home'
import RegisterPage from './pages/register'
import StudentDashboard from './pages/StudentView'
import LandlordDashboard from './pages/landlordsView'
import AdminDashboard from './pages/Admin'
import Inquiries from './pages/inquiries'
import PropertyDetailsPage from './pages/Details'
import InquiryPage from './pages/InquiryPage'
import AdminLogin from './pages/adminLogin'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<WelcomePage/>}/>
        <Route path ='/Login' element={<LoginPage />} />
        <Route path ='/Home' element={<WelcomePage />} />
        <Route path ='/Register' element={<RegisterPage />} />
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
        <Route path="/LandlordDashboard" element={<LandlordDashboard/>}/>
        <Route path='/Admindashboard' element={<AdminDashboard/>}/>
        
        <Route path='/Inquiries' element={<Inquiries/>} />
        <Route path='/PropertyDetailsPage' element={<PropertyDetailsPage/>}/>
        <Route path="/inquiry" element={<InquiryPage />} />
        <Route path='/adminLogin' element={<AdminLogin/>}/> 
        
        
        
      </Routes>
    </BrowserRouter>
  )
}

export default App