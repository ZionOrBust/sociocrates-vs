import React, { useState, useEffect } from 'react';
import { useAuth, useApi } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toaster';
import { formatDateTime } from '../lib/utils';
import { Users, Settings, Plus, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'participant' | 'observer';
  isActive: boolean;
  createdAt: string;
}

interface Circle {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'circles'>('users');

  // Circle creation form
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [creatingCircle, setCreatingCircle] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [usersData, circlesData] = await Promise.all([
        apiCall('/admin/users'),
        apiCall('/circles')
      ]);
      setUsers(usersData);
      setCircles(circlesData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast({
        title: 'Failed to load data',
        description: 'Could not load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'participant' | 'observer') => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      
      toast({
        title: 'User role updated',
        description: 'User role has been successfully updated',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update user role',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      
      setUsers(users.map(u => u.id === userId ? { ...u, isActive } : u));
      
      toast({
        title: `User ${isActive ? 'activated' : 'deactivated'}`,
        description: `User has been successfully ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update user status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCircle(true);

    try {
      const circle = await apiCall('/circles', {
        method: 'POST',
        body: JSON.stringify({
          name: newCircleName,
          description: newCircleDescription,
        }),
      });

      setCircles([...circles, circle]);
      setNewCircleName('');
      setNewCircleDescription('');
      
      toast({
        title: 'Circle created',
        description: 'New circle has been created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create circle',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreatingCircle(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">You need administrator privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage users, circles, and system settings
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users ({users.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('circles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'circles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Circles ({circles.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((userData) => (
                  <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{userData.name}</h3>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {formatDateTime(userData.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            userData.role === 'participant' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {userData.role}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userData.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={userData.role}
                        onChange={(e) => updateUserRole(userData.id, e.target.value as any)}
                        className="border rounded-md px-2 py-1 text-sm"
                        disabled={userData.id === user?.id}
                      >
                        <option value="observer">Observer</option>
                        <option value="participant">Participant</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <Button
                        size="sm"
                        variant={userData.isActive ? "destructive" : "default"}
                        onClick={() => toggleUserStatus(userData.id, !userData.isActive)}
                        disabled={userData.id === user?.id}
                      >
                        {userData.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Circles Tab */}
      {activeTab === 'circles' && (
        <div className="space-y-6">
          {/* Create Circle Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create New Circle</span>
              </CardTitle>
              <CardDescription>
                Create a new circle for decision-making
              </CardDescription>
            </CardHeader>
            <form onSubmit={createCircle}>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Circle Name
                  </label>
                  <Input
                    value={newCircleName}
                    onChange={(e) => setNewCircleName(e.target.value)}
                    placeholder="Enter circle name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCircleDescription}
                    onChange={(e) => setNewCircleDescription(e.target.value)}
                    placeholder="Describe the circle's purpose"
                    className="w-full border rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={creatingCircle || !newCircleName.trim()}
                >
                  {creatingCircle ? 'Creating...' : 'Create Circle'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Existing Circles */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Circles</CardTitle>
              <CardDescription>
                Manage existing circles and their members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {circles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No circles created yet
                  </p>
                ) : (
                  circles.map((circle) => (
                    <div key={circle.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{circle.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{circle.description}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Created {formatDateTime(circle.createdAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Manage Members
                          </Button>
                          <Button size="sm" variant="outline">
                            Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
