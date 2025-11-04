import React, { useState, useEffect } from 'react';
import { FaBars, FaBell } from 'react-icons/fa';
import { Outlet } from 'react-router-dom';
import UserSidebar from '../sidebar/UserSideBar';
import { useAuthStore } from '../../store/authstore';

const UserLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { user } = useAuthStore();

  const handleSidebarCollapse = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  useEffect(() => {
    const timer = setTimeout(() => {}, 0);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsSidebarCollapsed(false);
  }, []);

  return (
    <>
      {/* Layout Background */}
      <div style={{ backgroundColor: "var(--user-dashboard-bg-color, #f8f9fa)", height: "100vh" }}>
        
        {/* Sidebar (Desktop) */}
        <div className="d-none d-md-block position-fixed">
          <UserSidebar
            key="desktop-sidebar"
            isOpen={true}
            onCollapse={handleSidebarCollapse}
          />
        </div>

        {/* Sidebar (Mobile) */}
        {isSidebarOpen && (
          <>
            <UserSidebar
              key="mobile-sidebar"
              isOpen={true}
              toggleSidebar={toggleSidebar}
            />
            <div
              className="position-fixed top-0 start-0 w-100 h-100"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
              onClick={toggleSidebar}
            />
          </>
        )}

        {/* Topbar (Mobile only) */}
        <div
          className="d-md-none px-3 py-2 d-flex justify-content-between align-items-center"
          style={{
            backgroundColor: "#ffffff",
            color: "#333333",
            borderBottom: "1px solid #ddd",
          }}
        >
          {/* Left: Sidebar Toggle */}
          <button
            className="btn p-0 m-0 d-flex align-items-center justify-content-center"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar menu"
            aria-expanded={isSidebarOpen}
            style={{
              color: "#333333",
              fontSize: "1.2rem",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              backgroundColor: "#f1f1f1",
              cursor: "pointer",
              transition: "0.15s",
            }}
          >
            <FaBars size={20} />
          </button>

          {/* Center: Title */}
          <span className="fw-semibold text-uppercase small">User Panel</span>

          {/* Right: Bell + Profile */}
          <div className="d-flex align-items-center gap-3">
            <div className="position-relative">
              <FaBell size={20} style={{ color: "#333333" }} />
              <span
                className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                style={{ width: "10px", height: "10px" }}
              ></span>
            </div>

            <img
              src={user?.profile || '/assets/images/dummyUser.jpeg'}
              alt="Profile"
              className="rounded-circle"
              style={{ width: "32px", height: "32px", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Page Content */}
        <div
          className="p-0 p-md-3"
          style={{
            marginLeft: windowWidth >= 768 ? (isSidebarCollapsed ? '60px' : '250px') : '0px',
            transition: 'margin-left 0.3s ease, width 0.3s ease',
            minHeight: '100vh',
            position: 'relative',
            zIndex: 1,
            width: windowWidth >= 768 ? `calc(100% - ${isSidebarCollapsed ? '60px' : '250px'})` : '100%',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default UserLayout;
