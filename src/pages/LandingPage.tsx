import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Shield, 
  Globe, 
  Users, 
  BarChart, 
  Clock,
  ChevronRight,
  Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <MapPin className="h-6 w-6 text-green-700" />,
      title: 'Real-time Location Tracking',
      description: 'Track locations in real-time with precise accuracy and detailed information.'
    },
    {
      icon: <Shield className="h-6 w-6 text-green-700" />,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with end-to-end encryption for all your data.'
    },
    {
      icon: <Globe className="h-6 w-6 text-green-700" />,
      title: 'Global Coverage',
      description: 'Track locations anywhere in the world with our comprehensive global coverage.'
    },
    {
      icon: <Users className="h-6 w-6 text-green-700" />,
      title: 'Team Management',
      description: 'Manage multiple users and control access levels with ease.'
    },
    {
      icon: <BarChart className="h-6 w-6 text-green-700" />,
      title: 'Advanced Analytics',
      description: 'Get detailed insights and analytics about your tracking data.'
    },
    {
      icon: <Clock className="h-6 w-6 text-green-700" />,
      title: '24/7 Support',
      description: 'Round-the-clock support to help you with any questions or issues.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Welcome to Addrify
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
              The Intelligent Location Tracking Platform
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-700 hover:bg-green-600 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to track locations
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Powerful features to help you manage and analyze location data effectively.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="absolute -top-4 left-4 bg-indigo-100 rounded-lg p-3">
                  {feature.icon}
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};