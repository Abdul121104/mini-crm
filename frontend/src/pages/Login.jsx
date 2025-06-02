import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CampaignIcon from '@mui/icons-material/Campaign';

const providers = [
  { id: 'google', name: 'Google' },
];


const signIn = async (provider) => {
  try {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'Failed to sign in' };
  }
};

export default function OAuthSignInPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userData = urlParams.get('user');
    
    if (userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user-id', user._id);
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/home', { replace: true });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setError('Failed to process login. Please try again.');
      }
    }

    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      navigate('/home', { replace: true });
    }
  }, [navigate, location]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn('google');
    } catch (err) {
      setError('Failed to initiate sign in. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 6 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}
            >
              <CampaignIcon
                sx={{
                  fontSize: 40,
                  color: theme.palette.primary.main
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  textAlign: 'center'
                }}
              >
                Mini CRM
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: theme.palette.text.secondary,
                mb: 4
              }}
            >
              Sign in to manage your customer relationships and campaigns
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  mb: 2
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: theme.palette.text.secondary,
                mt: 2
              }}
            >
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
