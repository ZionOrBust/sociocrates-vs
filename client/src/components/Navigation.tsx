import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, Settings, Users, FileText, Plus } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path || location.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Sociocrates
              </span>
            </Link>
            
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Link href="/dashboard">
                <Button 
                  variant={isActive('/dashboard') || location === '/' ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link href="/create-proposal">
                <Button 
                  variant={isActive('/create-proposal') ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Proposal</span>
                </Button>
              </Link>
              
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button 
                    variant={isActive('/admin') ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex md:items-center md:space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden border-t bg-gray-50 px-4 py-2">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-gray-600">
            {user?.name} ({user?.role})
          </span>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard">
            <Button 
              variant={isActive('/dashboard') || location === '/' ? "default" : "ghost"}
              size="sm"
            >
              Dashboard
            </Button>
          </Link>
          
          <Link href="/create-proposal">
            <Button 
              variant={isActive('/create-proposal') ? "default" : "ghost"}
              size="sm"
            >
              New Proposal
            </Button>
          </Link>
          
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button 
                variant={isActive('/admin') ? "default" : "ghost"}
                size="sm"
              >
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
