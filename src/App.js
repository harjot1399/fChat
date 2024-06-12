import logo from './logo.svg';
import './App.css';
import { LoginPage } from './pages/loginPage';
import { SignUpPage } from './pages/signUpPage';
import { ChatScreen } from './pages/chatScreen';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HomePage } from './pages/homePage';
import { ForgotPassword } from './pages/forgotPassword';


const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token'); 
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path = "/" element = {<LoginPage />}/>
          <Route path = "/signup" element = {<SignUpPage />}/>
          <Route path = "/forgotpassword" element = {<ForgotPassword />}/>
          <Route element={<PrivateRoute />}> 
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/home" element={<HomePage />} />
          </Route>

        </Routes>
      </Router>

    </div>
  );
}

export default App;
