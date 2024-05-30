import logo from './logo.svg';
import './App.css';
import { LoginPage } from './pages/loginPage';
import { SignUpPage } from './pages/signUpPage';
import { ChatScreen } from './pages/chatScreen';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';


const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token'); // Check for authentication (e.g., token in localStorage)

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path = "/" element = {<LoginPage />}/>
          <Route path = "/signup" element = {<SignUpPage />}/>
          <Route element={<PrivateRoute />}> {/* Wrap chat route with PrivateRoute */}
            <Route path="/chat" element={<ChatScreen />} />
          </Route>

        </Routes>
      </Router>

    </div>
  );
}

export default App;
