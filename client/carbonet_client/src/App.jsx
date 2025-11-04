import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import pages
import LandingPage from './Pages/LandingPage';
import SignupPage from './Pages/SignupPage';
import LoginPage from './Pages/LoginPage';

import UserDashboard from './dashboard/UserDashboard';
import UserProfile from './dashboard/UserProfile';
import UserSetting from './dashboard/UserSetting';
import UserAnalytics from './dashboard/UserAnalytics';

// Import layouts / components
import UserLayout from './layout/UserLayout'; // ✅ path depends on your folder structure
// (for example, if it's in src/layout/UserLayout.jsx)

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home / Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Signup page */}
        <Route path="/signup" element={<SignupPage />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* User Layout with Nested Routes */}
        <Route path="/user" element={<UserLayout />}>
          {/* Dashboard page will render inside UserLayout’s <Outlet /> */}
          <Route index element={<UserDashboard />} />
          <Route path="setting" element={<UserSetting />} />
          <Route path="analytics" element={<UserAnalytics />} />
          <Route path="profile" element={<UserProfile />} />

        </Route>

        {/* Optional 404 page */}
        <Route path="*" element={<h2 className="text-center mt-5">404 - Page Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
