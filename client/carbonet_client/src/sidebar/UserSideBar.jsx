import React, { useState } from 'react';
import {
  FaHome,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaClipboardList,
  FaHeadset,
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authstore';

export default function UserSidebar({ isOpen = true, toggleSidebar, onCollapse }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore(); // ✅ Get user info (name, profile)

  // Handle collapse toggle
  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapse) onCollapse(newState);
  };

  // Sidebar menu items with routes
  const menuItems = [
    { icon: <FaHome />, label: 'Dashboard', path: '/user' },
    { icon: <FaUser />, label: 'Profile', path: '/user/profile' },
    { icon: <FaChartBar />, label: 'Analytics', path: '/user/analytics' },
    { icon: <FaCog />, label: 'Settings', path: '/user/setting' },
  ];

  // Future links (dummy placeholders)
  const futureLinks = [
    { icon: <FaEnvelope />, label: 'Messages' },
    { icon: <FaClipboardList />, label: 'Tasks' },
    { icon: <FaHeadset />, label: 'Support' },
  ];

  return (
    <div
      className="d-flex flex-column justify-content-between text-white"
      style={{
        width: isCollapsed ? '60px' : '250px',
        height: '100vh',
        backgroundColor: '#0d6efd',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1050,
      }}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-bottom border-primary d-flex flex-column align-items-center text-center">
        {/* Profile Image + Username */}
        <img
          src={user?.profile || '/assets/images/dummyUser.jpeg'}
          alt="User Profile"
          className="rounded-circle mb-2"
          style={{
            width: isCollapsed ? '36px' : '70px',
            height: isCollapsed ? '36px' : '70px',
            objectFit: 'cover',
            border: '2px solid white',
            transition: 'width 0.3s, height 0.3s',
          }}
        />
        {!isCollapsed && (
          <>
            <h6 className="m-0">{user?.name || 'Guest User'}</h6>
            <small className="text-light-50">{user?.email || 'user@example.com'}</small>
          </>
        )}

        {/* Collapse Button */}
        <button
          className="btn btn-sm btn-outline-light mt-2 d-flex align-items-center justify-content-center"
          onClick={handleCollapse}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
          }}
        >
          {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
        </button>
      </div>

      {/* Sidebar Menu */}
      <div className="flex-grow-1 mt-3">
        {menuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={idx}
              className="d-flex align-items-center px-3 py-2 sidebar-item"
              style={{
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                transition: 'background-color 0.2s ease',
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = isActive
                  ? 'rgba(255,255,255,0.2)'
                  : 'transparent')
              }
            >
              <div style={{ width: '30px', textAlign: 'center' }}>{item.icon}</div>
              {!isCollapsed && <span className="ms-2">{item.label}</span>}
            </div>
          );
        })}

        {/* Divider */}
        <hr className="border-light my-2 mx-3" />

        {/* Future Links Section */}
        {futureLinks.map((item, idx) => (
          <div
            key={idx}
            className="d-flex align-items-center px-3 py-2 sidebar-item"
            style={{
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.9)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            <div style={{ width: '30px', textAlign: 'center' }}>{item.icon}</div>
            {!isCollapsed && <span className="ms-2">{item.label}</span>}
          </div>
        ))}
      </div>

      {/* Sidebar Footer (Logout) */}
      <div className="p-3 border-top border-primary">
        <div
          className="d-flex align-items-center sidebar-item"
          style={{
            cursor: 'pointer',
            color: 'white',
          }}
          onClick={() => {
            alert('Logging out (mock)');
            navigate('/login');
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffc107')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
        >
          <div style={{ width: '30px', textAlign: 'center' }}>
            <FaSignOutAlt />
          </div>
          {!isCollapsed && <span className="ms-2">Logout</span>}
        </div>
      </div>
    </div>
  );
}
