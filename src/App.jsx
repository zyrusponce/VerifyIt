import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Learn from './pages/Learn'
import LessonDetail from './pages/LessonDetail'
import InvestigationLab from './pages/InvestigationLab'
import InvestigationCase from './pages/InvestigationCase'
import Quiz from './pages/Quiz'
import QuizCategory from './pages/QuizCategory'
import Results from './pages/Results'
import Toolkit from './pages/Toolkit'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import Certificate from './pages/Certificate'
import VerifyCertificate from './pages/VerifyCertificate'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:lessonId" element={<LessonDetail />} />
        <Route path="lab" element={<InvestigationLab />} />
        <Route path="lab/:caseId" element={<InvestigationCase />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="quiz/:categoryId" element={<QuizCategory />} />
        <Route path="toolkit" element={<Toolkit />} />
        <Route path="results" element={<Results />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="account" element={<Account />} />
        <Route path="certificate" element={<Certificate />} />
        <Route path="verify-certificate" element={<VerifyCertificate />} />
        <Route path="verify-certificate/:certificateNumber" element={<VerifyCertificate />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
