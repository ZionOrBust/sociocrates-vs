import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Proposal from './pages/Proposal';
import Admin from './pages/Admin';
import CreateProposal from './pages/CreateProposal';
import Navigation from './components/Navigation';
import { Toaster } from './components/ui/toaster';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/register" component={Register} />
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/proposal/:id" component={Proposal} />
          <Route path="/create-proposal" component={CreateProposal} />
          {user.role === 'admin' && <Route path="/admin" component={Admin} />}
          <Route>
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
