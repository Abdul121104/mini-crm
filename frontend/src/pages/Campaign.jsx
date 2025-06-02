import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Box,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LabelIcon from '@mui/icons-material/Label';
import EditIcon from '@mui/icons-material/Edit';

function Campaigns() {
  const [loading, setLoading] = useState(true);
  const [sendingCampaign, setSendingCampaign] = useState(null);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
    targetAudience: {
      segmentId: '',
      filters: {
        minSpend: 0,
        maxSpend: null,
        minVisits: 0,
        maxVisits: null,
        tags: []
      }
    },
    content: {
      subject: '',
      body: '',
      template: ''
    },
    schedule: {
      startDate: '',
      endDate: '',
      frequency: 'once'
    }
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
    } catch (err) {
      console.error('Error loading segments:', err);
      setError('Failed to load segments');
    }
  };

  const handleAddCampaign = async () => {
    try {
      if (!newCampaign.name.trim()) {
        setError('Campaign name is required');
        return;
      }

      if (!newCampaign.targetAudience.segmentId) {
        setError('Please select a segment');
        return;
      }

      if (!newCampaign.content.subject.trim()) {
        setError('Subject is required');
        return;
      }

      if (!newCampaign.content.body.trim()) {
        setError('Message body is required');
        return;
      }

      const campaignData = {
        name: newCampaign.name.trim(),
        description: newCampaign.description.trim(),
        segment: newCampaign.targetAudience.segmentId,
        message: {
          subject: newCampaign.content.subject.trim(),
          content: newCampaign.content.body.trim(),
          template: newCampaign.type
        },
        schedule: {
          startDate: newCampaign.schedule.startDate || null,
          endDate: newCampaign.schedule.endDate || null
        }
      };

      console.log('Sending campaign data:', campaignData);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id')
        },
        body: JSON.stringify(campaignData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add campaign');
      }

      await fetchCampaigns();
      setOpenAdd(false);
      setNewCampaign({
        name: '',
        description: '',
        type: 'email',
        status: 'draft',
        targetAudience: {
          segmentId: '',
          filters: {
            minSpend: 0,
            maxSpend: null,
            minVisits: 0,
            maxVisits: null,
            tags: []
          }
        },
        content: {
          subject: '',
          body: '',
          template: ''
        },
        schedule: {
          startDate: '',
          endDate: '',
          frequency: 'once'
        }
      });
      setError(null);
    } catch (err) {
      console.error('Campaign creation error:', err);
      setError(err.message || 'Failed to add campaign');
    }
  };

  const fetchCommunicationLogs = async (campaignId) => {
    try {
      setLoadingLogs(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}/logs`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch communication logs');
      const data = await response.json();
      setCommunicationLogs(data);
    } catch (err) {
      console.error('Error loading communication logs:', err);
      setError('Failed to load communication logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewDetails = async (campaignId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch campaign details');
      const data = await response.json();
      setSelectedSegment(data);
      setOpenDetails(true);
      fetchCommunicationLogs(campaignId);
    } catch (err) {
      setError('Failed to load campaign details');
      console.error('Error loading campaign details:', err);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      if (sendingCampaign === campaignId) {
        return;
      }

      setError(null);
      setSendingCampaign(campaignId);

      const checkResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });

      if (!checkResponse.ok) {
        throw new Error('Campaign not found');
      }

      const campaignData = await checkResponse.json();
      if (campaignData.status !== 'draft') {
        throw new Error(`Campaign cannot be sent. Current status: ${campaignData.status}`);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id')
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send campaign');
      }

      setError('Campaign sent successfully!');
      
      await fetchCampaigns();
    } catch (err) {
      console.error('Error sending campaign:', err);
      setError(err.message || 'Failed to send campaign');
    } finally {
      setSendingCampaign(null);
    }
  };

  const handleSegmentChange = async (segmentId) => {
    try {
      if (!segmentId) {
        setNewCampaign(prev => ({
          ...prev,
          targetAudience: {
            ...prev.targetAudience,
            segmentId: '',
            filters: {
              minSpend: 0,
              maxSpend: null,
              minVisits: 0,
              maxVisits: null,
              tags: []
            }
          }
        }));
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments/${segmentId}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch segment details');
      const segment = await response.json();

      const filters = {
        minSpend: 0,
        maxSpend: null,
        minVisits: 0,
        maxVisits: null,
        tags: []
      };

      segment.rules.conditions.forEach(condition => {
        if (condition.field === 'totalSpend') {
          if (condition.operator === '>=') {
            filters.minSpend = condition.value;
          } else if (condition.operator === '<=') {
            filters.maxSpend = condition.value;
          }
        } else if (condition.field === 'visits') {
          if (condition.operator === '>=') {
            filters.minVisits = condition.value;
          } else if (condition.operator === '<=') {
            filters.maxVisits = condition.value;
          }
        } else if (condition.field === 'tags') {
          filters.tags = condition.value;
        }
      });

      setNewCampaign(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          segmentId,
          filters
        }
      }));
    } catch (err) {
      console.error('Error fetching segment details:', err);
      setError('Failed to load segment details');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        backgroundColor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Campaigns
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            px: 3
          }}
        >
          Create Campaign
        </Button>
      </Box>

      {error && (
        <Alert 
          severity={error.includes('successfully') ? 'success' : 'error'} 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Target Audience</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Delivery Stats</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign._id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>
                  <Chip 
                    label={campaign.status} 
                    color={
                      campaign.status === 'draft' ? 'default' :
                      campaign.status === 'scheduled' ? 'info' :
                      campaign.status === 'active' ? 'success' :
                      campaign.status === 'completed' ? 'primary' : 'error'
                    }
                  />
                </TableCell>
                <TableCell>
                  {campaign.targetAudience?.segments?.length || 0} segments
                </TableCell>
                <TableCell>
                  {campaign.schedule?.startDate ? new Date(campaign.schedule.startDate).toLocaleDateString() : 'Not scheduled'}
                </TableCell>
                <TableCell>
                  {campaign.stats ? (
                    <>
                      Sent: {campaign.stats.sent || 0}<br />
                      Opened: {campaign.stats.opened || 0}<br />
                      Clicked: {campaign.stats.clicked || 0}<br />
                      Failed: {campaign.stats.failed || 0}
                    </>
                  ) : 'Not sent yet'}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewDetails(campaign._id)}>
                    <VisibilityIcon />
                  </IconButton>
                  {campaign.status === 'draft' && (
                    <IconButton 
                      onClick={() => handleSendCampaign(campaign._id)}
                      disabled={sendingCampaign === campaign._id}
                    >
                      {sendingCampaign === campaign._id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Campaign Details
          <IconButton
            aria-label="close"
            onClick={() => setOpenDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Campaign Info" />
            <Tab label="Communication Logs" />
          </Tabs>

          {selectedTab === 0 && selectedSegment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedSegment.name}</Typography>
                <Typography color="textSecondary">{selectedSegment.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Campaign Details</Typography>
                <Typography>Type: {selectedSegment.type}</Typography>
                <Typography>Status: {selectedSegment.status}</Typography>
                <Typography>Start Date: {selectedSegment.schedule?.startDate ? new Date(selectedSegment.schedule.startDate).toLocaleDateString() : 'Not scheduled'}</Typography>
                <Typography>End Date: {selectedSegment.schedule?.endDate ? new Date(selectedSegment.schedule.endDate).toLocaleDateString() : 'Not scheduled'}</Typography>
                <Typography>Frequency: {selectedSegment.schedule?.frequency || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Target Audience</Typography>
                <Typography>Segments: {selectedSegment.targetAudience?.segments?.join(', ') || 'No segments selected'}</Typography>
                <Typography>Filters:</Typography>
                <Typography>Min Spend: ₹{selectedSegment.targetAudience?.filters?.minSpend || 0}</Typography>
                <Typography>Max Spend: ₹{selectedSegment.targetAudience?.filters?.maxSpend || 'No limit'}</Typography>
                <Typography>Min Visits: {selectedSegment.targetAudience?.filters?.minVisits || 0}</Typography>
                <Typography>Max Visits: {selectedSegment.targetAudience?.filters?.maxVisits || 'No limit'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Content</Typography>
                <Typography>Subject: {selectedSegment.content?.subject || 'Not set'}</Typography>
                <Typography>Template: {selectedSegment.content?.template || 'Not set'}</Typography>
                <Paper sx={{ p: 2, mt: 1 }}>
                  <Typography>Body:</Typography>
                  <Typography>{selectedSegment.content?.body || 'No content'}</Typography>
                </Paper>
              </Grid>
              {selectedSegment.stats && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Delivery Statistics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{selectedSegment.stats.sent || 0}</Typography>
                        <Typography>Sent</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{selectedSegment.stats.opened || 0}</Typography>
                        <Typography>Opened</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{selectedSegment.stats.clicked || 0}</Typography>
                        <Typography>Clicked</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{communicationLogs.filter(log => log.status === 'failed').length}</Typography>
                        <Typography>Failed</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}

          {selectedTab === 1 && (
            <Box sx={{ mt: 2 }}>
              {loadingLogs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sent At</TableCell>
                        <TableCell>Delivered At</TableCell>
                        <TableCell>Opened At</TableCell>
                        <TableCell>Clicked At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {communicationLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>{log.customer?.name || 'Unknown'}</TableCell>
                          <TableCell>{log.message}</TableCell>
                          <TableCell>
                            <Chip 
                              label={log.status} 
                              color={
                                log.status === 'sent' ? 'info' :
                                log.status === 'delivered' ? 'success' :
                                log.status === 'failed' ? 'error' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</TableCell>
                          <TableCell>{log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : '-'}</TableCell>
                          <TableCell>{log.openedAt ? new Date(log.openedAt).toLocaleString() : '-'}</TableCell>
                          <TableCell>{log.clickedAt ? new Date(log.clickedAt).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                      {communicationLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No communication logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog 
        open={openAdd} 
        onClose={() => setOpenAdd(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AddIcon color="primary" />
          Create New Campaign
          <IconButton
            aria-label="close"
            onClick={() => setOpenAdd(false)}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 1,
                '& .MuiAlert-icon': {
                  alignItems: 'center'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="primary" />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Campaign Name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SendIcon color="primary" />
                  Campaign Type & Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Campaign Type</InputLabel>
                      <Select
                        value={newCampaign.type}
                        label="Campaign Type"
                        onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                        sx={{
                          borderRadius: 1
                        }}
                      >
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="sms">SMS</MenuItem>
                        <MenuItem value="push">Push Notification</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={newCampaign.schedule.frequency}
                        label="Frequency"
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          schedule: { ...newCampaign.schedule, frequency: e.target.value }
                        })}
                        sx={{
                          borderRadius: 1
                        }}
                      >
                        <MenuItem value="once">Once</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="datetime-local"
                      value={newCampaign.schedule.startDate}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        schedule: { ...newCampaign.schedule, startDate: e.target.value }
                      })}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="datetime-local"
                      value={newCampaign.schedule.endDate}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        schedule: { ...newCampaign.schedule, endDate: e.target.value }
                      })}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="primary" />
                  Target Audience
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Segment</InputLabel>
                      <Select
                        value={newCampaign.targetAudience.segmentId || ''}
                        label="Select Segment"
                        onChange={(e) => handleSegmentChange(e.target.value)}
                        required
                        sx={{
                          borderRadius: 1,
                          '& .MuiSelect-select': {
                            py: 1.5
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              '& .MuiMenuItem-root': {
                                py: 1.5,
                                px: 2
                              }
                            }
                          }
                        }}
                      >
                        {segments.map((segment) => (
                          <MenuItem 
                            key={segment._id} 
                            value={segment._id}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: 0.5
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {segment.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {segment.description || 'No description'}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {newCampaign.targetAudience.segmentId && (
                    <Grid item xs={12}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          mt: 1,
                          backgroundColor: 'action.hover',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Segment Criteria
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalOfferIcon color="action" fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Spending Range</Typography>
                                <Typography variant="body1">
                                  {newCampaign.targetAudience.filters.minSpend > 0 ? `₹${newCampaign.targetAudience.filters.minSpend} - ` : ''}
                                  {newCampaign.targetAudience.filters.maxSpend ? `₹${newCampaign.targetAudience.filters.maxSpend}` : 'No limit'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <VisibilityIcon color="action" fontSize="small" />
                              <Box>
                                <Typography variant="body2" color="text.secondary">Visit Range</Typography>
                                <Typography variant="body1">
                                  {newCampaign.targetAudience.filters.minVisits > 0 ? `${newCampaign.targetAudience.filters.minVisits} - ` : ''}
                                  {newCampaign.targetAudience.filters.maxVisits ? `${newCampaign.targetAudience.filters.maxVisits}` : 'No limit'} visits
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          {newCampaign.targetAudience.filters.tags.length > 0 && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LabelIcon color="action" fontSize="small" />
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>Tags</Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {newCampaign.targetAudience.filters.tags.map((tag, index) => (
                                      <Chip 
                                        key={index} 
                                        label={tag} 
                                        size="small"
                                        sx={{ 
                                          backgroundColor: 'primary.light',
                                          color: 'primary.contrastText'
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  backgroundColor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EditIcon color="primary" />
                  Campaign Content
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      value={newCampaign.content.subject}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        content: { ...newCampaign.content, subject: e.target.value }
                      })}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message Body"
                      multiline
                      rows={4}
                      value={newCampaign.content.body}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        content: { ...newCampaign.content, body: e.target.value }
                      })}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Template"
                      value={newCampaign.content.template}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        content: { ...newCampaign.content, template: e.target.value }
                      })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setOpenAdd(false)}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCampaign} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              px: 3
            }}
          >
            Create Campaign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Campaigns;
