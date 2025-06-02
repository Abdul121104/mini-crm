import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, CircularProgress, 
  Chip, List, ListItem, ListItemText, Divider, Stack, 
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  TablePagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(3),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
  },
}));

const StatIcon = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  color: theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.2rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  margin: '8px 0',
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [stats, setStats] = useState({
    campaigns: {
      total: 0,
      active: 0,
      completed: 0,
    },
    customers: {
      total: 0,
      active: 0,
      new: 0,
    },
    segments: {
      total: 0,
      active: 0,
    },
    performance: {
      openRate: '0%',
      clickRate: '0%',
      conversionRate: '0%',
    },
  });
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const campaignsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns`, {
          headers: {
            'user-id': localStorage.getItem('user-id')
          }
        });
        if (!campaignsResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaignsData = await campaignsResponse.json();
        if (!Array.isArray(campaignsData)) throw new Error('Invalid campaigns data format');

        const customersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
          headers: {
            'user-id': localStorage.getItem('user-id')
          }
        });
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        const customers = Array.isArray(customersData) ? customersData : 
                         (customersData.customers || customersData.data || []);

        const segmentsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/segments`, {
          headers: {
            'user-id': localStorage.getItem('user-id')
          }
        });
        if (!segmentsResponse.ok) throw new Error('Failed to fetch segments');
        const segmentsData = await segmentsResponse.json();
        const segments = Array.isArray(segmentsData) ? segmentsData : 
                        (segmentsData.segments || segmentsData.data || []);

        const logsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/communication-logs`, {
          headers: {
            'user-id': localStorage.getItem('user-id')
          }
        });
        if (!logsResponse.ok) throw new Error('Failed to fetch communication logs');
        const logsData = await logsResponse.json();
        setCommunicationLogs(logsData);

        const activeCampaigns = campaignsData.filter(c => c.status === 'running').length;
        const completedCampaigns = campaignsData.filter(c => c.status === 'completed').length;
        
        const totalSent = campaignsData.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
        const totalOpened = campaignsData.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
        const totalClicked = campaignsData.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
        
        const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
        const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;
        const conversionRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0;

        setStats({
          campaigns: {
            total: campaignsData.length,
            active: activeCampaigns,
            completed: completedCampaigns,
          },
          customers: {
            total: customers.length,
            active: customers.filter(c => c.status === 'active').length,
            new: customers.filter(c => {
              if (!c.createdAt) return false;
              const createdDate = new Date(c.createdAt);
              const now = new Date();
              return createdDate.getMonth() === now.getMonth() && 
                     createdDate.getFullYear() === now.getFullYear();
            }).length,
          },
          segments: {
            total: segments.length,
            active: segments.filter(s => s.status === 'active').length,
          },
          performance: {
            openRate: `${openRate}%`,
            clickRate: `${clickRate}%`,
            conversionRate: `${conversionRate}%`,
          },
        });
        
        setCampaigns(campaignsData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleRecentActivityClick = () => {
    if (campaigns.length > 0) {
      navigate('/campaigns');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 64px)',
        width: '100%'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3,
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      width: '100%',
      backgroundColor: '#f8fafc',
      py: 4,
      px: { xs: 2, sm: 4 },
    }}>
      <Container maxWidth="xl" sx={{ margin: 'auto', py: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{
          fontWeight: 700,
          color: 'text.primary',
          mb: 4,
          fontSize: { xs: '1.8rem', sm: '2.2rem' }
        }}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Item>
              <Stack direction="row" alignItems="center">
                <StatIcon>
                  <CampaignIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <StatLabel>Total Campaigns</StatLabel>
                  <StatValue>{stats.campaigns.total}</StatValue>
                  <Typography variant="body2" color="text.secondary">
                    {stats.campaigns.active} Active
                  </Typography>
                </Box>
              </Stack>
            </Item>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Item>
              <Stack direction="row" alignItems="center">
                <StatIcon>
                  <PeopleIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <StatLabel>Total Customers</StatLabel>
                  <StatValue>{stats.customers.total}</StatValue>
                  <Typography variant="body2" color="text.secondary">
                    {stats.customers.new} New This Month
                  </Typography>
                </Box>
              </Stack>
            </Item>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Item>
              <Stack direction="row" alignItems="center">
                <StatIcon>
                  <CategoryIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <StatLabel>Customer Segments</StatLabel>
                  <StatValue>{stats.segments.total}</StatValue>
                  <Typography variant="body2" color="text.secondary">
                    {stats.segments.active} Active
                  </Typography>
                </Box>
              </Stack>
            </Item>
          </Grid>


          <Grid item xs={12} sm={6} md={2.4}>
             <Item onClick={handleRecentActivityClick} sx={{ cursor: campaigns.length > 0 ? 'pointer' : 'default' }}>
              <Stack direction="row" alignItems="center" mb={2}>
                 <StatIcon>
                   <CampaignIcon fontSize="large" />
                 </StatIcon>
                <Typography variant="h6" color="text.primary">Recent Activity</Typography>
              </Stack>
               <Divider sx={{ mb: 2 }} />
              {campaigns && campaigns.length > 0 ? (
                 <Box>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                    Latest Campaign:
                  </Typography>
                   <Typography variant="body1" fontWeight="medium" sx={{ lineHeight: 1.3 }}>
                     {campaigns[0].name}
                   </Typography>
                 </Box>
              ) : (
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                   <Typography variant="body2" color="text.secondary">
                     No recent activity
                   </Typography>
                 </Box>
               )}
             </Item>
           </Grid>
        </Grid>
        <Divider sx={{ mb: 5 }} />
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{
              p: 3,
              height: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" gutterBottom sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 2
              }}>
                Recent Communications
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {communicationLogs.length > 0 ? (
                <>
                  <TableContainer sx={{ flex: 1 }}>
                    <Table sx={{ minWidth: 650 }} size="medium" aria-label="communication logs table">
                      <TableHead>
                        <TableRow sx={{
                          backgroundColor: 'background.default',
                          '& th': { fontWeight: 600, py: 1.5 }
                        }}>
                          <TableCell>Campaign / Customer</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Sent At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {communicationLogs
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((log) => (
                            <TableRow
                              key={log._id}
                              sx={{
                                '&:last-child td': { border: 0 },
                                '&:hover': { backgroundColor: 'action.hover' },
                              }}
                            >
                              <TableCell>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {log.campaign?.name || 'Unknown Campaign'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {log.customer?.name || 'Unknown Customer'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {log.message}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.status}
                                  color={
                                    log.status === 'sent' ? 'info' :
                                      log.status === 'delivered' ? 'success' :
                                        'error'
                                  }
                                  size="small"
                                  sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(log.sentAt).toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={communicationLogs.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    sx={{
                      borderTop: 1,
                      borderColor: 'divider',
                      '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                        margin: 0
                      }
                    }}
                  />
                </>
              ) : (
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent communications to display
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Home;