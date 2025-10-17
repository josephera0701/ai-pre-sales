import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  Link,
  CircularProgress,
  Container,
  Avatar
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { login, resetPassword } = useAuth();
  const { showNotification } = useNotification();

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showNotification('Please enter both email and password', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      showNotification('Login successful!', 'success');
    } catch (error) {
      console.error('Login error:', error);
      showNotification(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(resetEmail);
      showNotification('Password reset instructions sent to your email', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      showNotification(error.message || 'Password reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                  <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5">
                  Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleForgotPassword} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="resetEmail"
                  label="Email Address"
                  name="resetEmail"
                  autoComplete="email"
                  autoFocus
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
                </Button>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(false);
                    }}
                    disabled={loading}
                  >
                    Back to Login
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <LockOutlined />
              </Avatar>
              <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
                Sagesoft Solutions
              </Typography>
              <Typography component="h2" variant="h6" color="text.secondary">
                AWS Cost Estimation Platform
              </Typography>
              <Typography variant="h5" sx={{ mt: 2 }}>
                Welcome Back
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Remember me"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'LOGIN'}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(true);
                  }}
                  disabled={loading}
                >
                  Forgot Password?
                </Link>
              </Box>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Need help? Contact Support
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default LoginPage;