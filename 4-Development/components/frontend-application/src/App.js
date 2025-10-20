import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InputMethodSelection from './pages/InputMethodSelection';
import EstimationsList from './pages/EstimationsList';
import CostEstimation from './pages/CostEstimation';
import CostResults from './pages/CostResults';
import ExcelUpload from './pages/ExcelUpload';
import Documents from './pages/Documents';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App({ signOut, user }) {
  const { setUser } = useAuthStore();
  
  React.useEffect(() => {
    if (user) {
      setUser({
        id: user.attributes.sub,
        email: user.attributes.email,
        name: user.attributes.name || user.username,
        role: user.attributes['custom:role'] || 'user'
      });
    }
  }, [user, setUser]);

  return (
    <Layout signOut={signOut} user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-estimation" element={<InputMethodSelection />} />
        <Route path="/estimations" element={<EstimationsList />} />
        <Route path="/estimation" element={<CostEstimation />} />
        <Route path="/cost-results" element={<CostResults />} />
        <Route path="/excel-upload" element={<ExcelUpload />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Layout>
  );
}

export default withAuthenticator(App, {
  socialProviders: [],
  signUpAttributes: ['email', 'name'],
  loginMechanisms: ['email'],
  formFields: {
    signUp: {
      name: {
        order: 1,
        placeholder: 'Enter your full name',
        required: true,
      },
      email: {
        order: 2,
        placeholder: 'Enter your email address',
        required: true,
      },
      password: {
        order: 3,
        placeholder: 'Enter your password',
        required: true,
      },
      confirm_password: {
        order: 4,
        placeholder: 'Confirm your password',
        required: true,
      }
    }
  }
});