import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  MapPin,
  Users,
  Settings,
  LayoutDashboard,
  LogOut,
  CreditCard,
  BarChart,
  Menu,
  X,
  BookUser,
  Bell,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Cpu,
  Search,
  UserRoundSearch
} from 'lucide-react';

interface BaseLink {
  icon: React.ReactElement;
  text: string;
}

interface StandardLink extends BaseLink {
  to: string;
  type?: undefined;
  items?: undefined;
}

interface DropdownLink extends BaseLink {
  type: 'dropdown';
  items: StandardLink[];
  to?: undefined;
}

type NavigationLink = StandardLink | DropdownLink;

export const Navigation: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [notifications] = React.useState([]);
  const [hoveredLink, setHoveredLink] = React.useState<string | null>(null);

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string | undefined) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const adminLinks: StandardLink[] = [
    {
      to: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      text: 'Dashboard'
    },
    {
      to: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      text: 'Users'
    },
    {
      to: '/admin/payments',
      icon: <CreditCard className="h-5 w-5" />,
      text: 'Payments'
    },
    {
      to: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />,
      text: 'Analytics'
    }
  ];

  const reverseAddressItems: StandardLink[] = [
    {
      to: '/reverse-address',
      icon: <UserRoundSearch className="h-5 w-5" />,
      text: 'Search'
    },
    {
      to: '/reverse-automation',
      icon: <Cpu className="h-5 w-5" />,
      text: 'Automation'
    },
    {
      to: '/reverse-results',
      icon: <FileSearch className="h-5 w-5" />,
      text: 'Results'
    }
  ];

  const clientLinks: NavigationLink[] = [
    {
      to: '/client',
      icon: <LayoutDashboard className="h-5 w-5" />,
      text: 'Dashboard'
    },
    {
      to: '/client/locations',
      icon: <MapPin className="h-5 w-5" />,
      text: 'Locations'
    },
    {
      to: '/client/analytics',
      icon: <BarChart className="h-5 w-5" />,
      text: 'Analytics'
    },
    {
      type: 'dropdown',
      icon: <BookUser className="h-5 w-5" />,
      text: 'Reverse Address',
      items: reverseAddressItems
    }
  ];
  const links = user.role === 'admin' ? adminLinks : clientLinks;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to={user.role === 'admin' ? '/admin' : '/client'} className="flex items-center space-x-2">
                <img src="/assets/addrify-logo-v2.png" alt="Addrify Logo" className="h-12" />
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => 
                link.type === 'dropdown' ? (
                  <div 
                    key={link.text} 
                    className="relative flex items-center group"
                    onMouseEnter={() => setHoveredLink(link.text)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    <button
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive(link.to)
                          ? 'border-green-600 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      {link.icon}
                      <span className="ml-2">{link.text}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    {hoveredLink === link.text && (
                      <div 
                        className="absolute top-full left-0 z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                        onMouseEnter={() => setHoveredLink(link.text)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        <div className="py-1">
                          {link.items.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {item.icon}
                              <span className="ml-2">{item.text}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive(link.to)
                        ? 'border-green-600 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.text}</span>
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user.role !== 'admin' && (
              <Link
                to="/subscription"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-600"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </Link>
            )}

            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              )}
            </button>

            <Link
              to="/settings"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500"
            >
              <Settings className="h-6 w-6" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {links.map((link) => 
              link.type === 'dropdown' ? (
                <div key={link.text}>
                  <button
                    onClick={() => setHoveredLink(link.text)}
                    className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {link.icon}
                    <span className="ml-2">{link.text}</span>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </button>
                  {hoveredLink === link.text && (
                    <div className="pl-4">
                      {link.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.icon}
                          <span className="ml-2">{item.text}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2 text-base font-medium ${
                    isActive(link.to)
                      ? 'bg-indigo-50 border-green-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span className="ml-2">{link.text}</span>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};