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
  Autocomplete,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

function Segments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const initialSegmentState = {
    name: '',
    description: '',
    criteria: {
      minSpend: 0,
      maxSpend: '',
      minVisits: 0,
      maxVisits: '',
      tags: [],
      lastActiveDays: '',
      purchaseFrequency: '',
      location: {
        countries: [],
        states: [],
        cities: []
      }
    },
    isActive: true
  };

  const [newSegment, setNewSegment] = useState(initialSegmentState);

  useEffect(() => {
    fetchSegments();
    fetchCustomers();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load segments');
      console.error('Error loading segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const initialResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/customers?limit=10`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!initialResponse.ok) throw new Error('Failed to fetch customers');
      const initialData = await initialResponse.json();

      let allCustomers = initialData.customers || [];
      const totalCustomers = initialData.totalCustomers || 0;
      const limit = initialData.limit || 10;
      const totalPages = Math.ceil(totalCustomers / limit);

      for (let page = 2; page <= totalPages; page++) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers?page=${page}&limit=${limit}`, {
          headers: {
            'user-id': localStorage.getItem('user-id')
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch customers page ${page}`);
        const data = await response.json();
        allCustomers = allCustomers.concat(data.customers || []);
      }

      setCustomers(allCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setCustomers([]);
    }
  };

  const handleAddSegment = async () => {
    try {
      if (!newSegment.name.trim()) {
        setError('Segment name is required');
        return;
      }

      const conditions = [];
      
      if (newSegment.criteria.minSpend > 0 || newSegment.criteria.maxSpend) {
        if (newSegment.criteria.minSpend > 0) {
          conditions.push({
            field: 'totalSpend',
            operator: '>=',
            value: Number(newSegment.criteria.minSpend)
          });
        }
        if (newSegment.criteria.maxSpend) {
          conditions.push({
            field: 'totalSpend',
            operator: '<=',
            value: Number(newSegment.criteria.maxSpend)
          });
        }
      }

      if (newSegment.criteria.minVisits > 0 || newSegment.criteria.maxVisits) {
        if (newSegment.criteria.minVisits > 0) {
          conditions.push({
            field: 'visits',
            operator: '>=',
            value: Number(newSegment.criteria.minVisits)
          });
        }
        if (newSegment.criteria.maxVisits) {
          conditions.push({
            field: 'visits',
            operator: '<=',
            value: Number(newSegment.criteria.maxVisits)
          });
        }
      }

      if (newSegment.criteria.tags.length > 0) {
        conditions.push({
          field: 'tags',
          operator: 'contains',
          value: newSegment.criteria.tags
        });
      }

      const segmentData = {
        name: newSegment.name,
        description: newSegment.description,
        rules: {
          operator: 'AND',
          conditions: conditions
        },
        isActive: newSegment.isActive
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id')
        },
        body: JSON.stringify(segmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add segment');
      }

      await fetchSegments();
      setOpenAdd(false);
      resetNewSegment();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to add segment');
      console.error('Error adding segment:', err);
    }
  };

  const handleEditSegment = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments/${selectedSegment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', 
          'user-id': localStorage.getItem('user-id')
        },
        body: JSON.stringify(selectedSegment)
      });
      if (!response.ok) throw new Error('Failed to update segment');
      await fetchSegments();
      setOpenEdit(false);
    } catch (err) {
      setError('Failed to update segment');
      console.error('Error updating segment:', err);
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm('Are you sure you want to delete this segment? This action cannot be undone.')) return;
    
    try {
      setError(null);
      const userId = localStorage.getItem('user-id');
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments/${segmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete segment');
      }

      setError('Segment deleted successfully');
      
      await fetchSegments();
    } catch (err) {
      console.error('Error deleting segment:', err);
      setError(err.message || 'Failed to delete segment. Please try again.');
    }
  };

  const handleViewDetails = async (segmentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/segments/${segmentId}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch segment details');
      const data = await response.json();
      setSelectedSegment(data);
      setOpenDetails(true);
    } catch (err) {
      setError('Failed to load segment details');
      console.error('Error loading segment details:', err);
    }
  };

  const resetNewSegment = () => {
    setNewSegment(initialSegmentState);
  };

  const handleInputChange = (field, value) => {
    setNewSegment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCriteriaChange = (field, value) => {
    setNewSegment(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [field]: value
      }
    }));
  };

  const evaluateCondition = (customer, condition) => {
    const { field, operator, value } = condition;
    let customerValue = customer[field];

    console.log(`Evaluating condition: Field=${field}, Operator=${operator}, Value=${value}, CustomerValue=${customerValue}, CustomerId=${customer._id}`);

    if (typeof customerValue === 'string' && (operator === '>=' || operator === '<=')) {
      customerValue = parseFloat(customerValue.replace(/[^0-9.-]+/g, ""));
      console.log(`  -> Cleaned CustomerValue for numeric comparison: ${customerValue}`);
    }

    if (customerValue === undefined || customerValue === null) {
      if (operator === 'contains' && (value === undefined || value.length === 0)) return true;
      console.log(`  -> Result: false (missing customer data for field ${field})`);
      return false;
    }

    let result = false;
    switch (operator) {
      case '>=':
        result = typeof customerValue === 'number' && typeof value === 'number' && customerValue >= value;
        break;
      case '<=':
        result = typeof customerValue === 'number' && typeof value === 'number' && customerValue <= value;
        break;
      case 'contains':
        result = Array.isArray(customerValue) && Array.isArray(value) && value.every(tag => customerValue.includes(tag));
        break;
      case '==':
        result = customerValue === value;
        break;
      case '!=':
        result = customerValue !== value;
        break;
      default:
        console.warn(`Unknown operator in segment rules: ${operator}`);
        result = false;
    }
    console.log(`  -> Result: ${result}`);
    return result;
  };

  const evaluateRules = (customer, rules) => {
    console.log(`Evaluating rules for customer ${customer._id || 'unknown'} with rules operator ${rules?.operator}`);
    if (!rules || !Array.isArray(rules.conditions) || rules.conditions.length === 0) {
       console.log(`  -> Result: true (no rules)`);
      return true;
    }

    const { operator, conditions } = rules;

    if (operator === 'AND') {
      const allMatch = conditions.every(condition => {
        if (condition.operator && Array.isArray(condition.conditions)) { 
          return evaluateRules(customer, condition);
        } else {
          return evaluateCondition(customer, condition);
        }
      });
      console.log(`  -> Result for AND: ${allMatch}`);
      return allMatch;
    } else if (operator === 'OR') {
      const anyMatch = conditions.some(condition => {
        if (condition.operator && Array.isArray(condition.conditions)) { 
          return evaluateRules(customer, condition);
        } else {
          return evaluateCondition(customer, condition);
        }
      });
      console.log(`  -> Result for OR: ${anyMatch}`);
      return anyMatch;
    } else {
      console.warn(`Unknown logical operator in segment rules: ${operator}`);
      return false;
    }
  };

  const getSegmentSize = (segment) => {
    if (!Array.isArray(customers) || !segment?.rules) return 0;

    return customers.filter(customer => evaluateRules(customer, segment.rules)).length;
  };
  const handleAISegment = async () => {
    try {
      setAiLoading(true);
      setAiError(null);

      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Convert this customer segmentation rule into JSON format with logical conditions: "${aiPrompt}". 
              The response should be a valid JSON object with this structure:
              {
                "name": "string",
                "description": "string",
                "rules": {
                  "operator": "AND",
                  "conditions": [
                    {
                      "field": "string",
                      "operator": "string",
                      "value": "any"
                    }
                  ]
                }
              }
              Use these field names: totalSpend, visits, lastActive, tags
              Use these operators: >=, <=, contains
              For time-based conditions, use lastActive field with days as value
              For spending conditions, use totalSpend field with numeric value
              For visit conditions, use visits field with numeric value
              For tags, use tags field with array of strings
              Return ONLY the raw JSON object, no markdown formatting, no code blocks, no additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 20,
            topP: 0.9,
            maxOutputTokens: 512,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate segment rules');
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from AI service');
      }

      const responseText = data.candidates[0].content.parts[0].text
        .replace(/```json\n?/g, '') // Remove ```json
        .replace(/```\n?/g, '')     // Remove ```
        .trim();

      let generatedRules;
      try {
        generatedRules = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse AI response as JSON');
      }

      if (!generatedRules.name || !generatedRules.rules?.conditions) {
        throw new Error('Invalid segment rules structure');
      }

      setNewSegment({
        ...initialSegmentState,
        name: generatedRules.name,
        description: generatedRules.description,
        criteria: {
          minSpend: generatedRules.rules.conditions.find(c => c.field === 'totalSpend' && c.operator === '>=')?.value || 0,
          maxSpend: generatedRules.rules.conditions.find(c => c.field === 'totalSpend' && c.operator === '<=')?.value || '',
          minVisits: generatedRules.rules.conditions.find(c => c.field === 'visits' && c.operator === '>=')?.value || 0,
          maxVisits: generatedRules.rules.conditions.find(c => c.field === 'visits' && c.operator === '<=')?.value || '',
          tags: generatedRules.rules.conditions.find(c => c.field === 'tags')?.value || [],
          lastActiveDays: generatedRules.rules.conditions.find(c => c.field === 'lastActive')?.value || '',
        }
      });

      setOpenAI(false);
      setOpenAdd(true);
    } catch (err) {
      setAiError(err.message || 'Failed to generate segment rules');
      console.error('Error generating segment rules:', err);
    } finally {
      setAiLoading(false);
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
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      py: 4
    }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 600,
              color: '#1a237e'
            }}>
              Customer Segments
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SmartToyIcon />}
                onClick={() => setOpenAI(true)}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                AI-Driven Segment
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenAdd(true)}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Create Segment
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon color="primary" />
                      <Typography variant="h6">Total Segments</Typography>
                    </Box>
                    <Typography variant="h3" color="primary">
                      {segments.length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="h6">Active Segments</Typography>
                    </Box>
                    <Typography variant="h3" color="primary">
                      {segments.filter(s => s.isActive).length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalOfferIcon color="primary" />
                      <Typography variant="h6">Total Tags</Typography>
                    </Box>
                    <Typography variant="h3" color="primary">
                      {new Set(segments.flatMap(s => 
                        s.rules.conditions
                          .filter(c => c.field === 'tags')
                          .flatMap(c => c.value)
                      )).size}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Criteria</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow 
                      key={segment._id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>{segment.name}</TableCell>
                      <TableCell>{segment.description}</TableCell>
                      <TableCell>{getSegmentSize(segment)} customers</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {segment.rules.conditions
                            .filter(condition => condition.field === 'tags')
                            .map((condition, index) => (
                              condition.value.map((tag, tagIndex) => (
                                <Chip 
                                  key={`${index}-${tagIndex}`} 
                                  label={tag} 
                                  size="small"
                                  sx={{ 
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText'
                                  }}
                                />
                              ))
                            ))}
                          {!segment.rules.conditions.some(condition => condition.field === 'tags') && 
                            <Typography variant="caption" color="text.secondary">No tags</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={segment.isActive ? 'Active' : 'Inactive'}
                          color={segment.isActive ? 'success' : 'default'}
                          size="small"
                          icon={segment.isActive ? <ToggleOnIcon /> : null}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            onClick={() => handleViewDetails(segment._id)}
                            size="small"
                            sx={{ 
                              backgroundColor: 'primary.light',
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'primary.main',
                                color: 'white'
                              }
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => {
                              setSelectedSegment(segment);
                              setOpenEdit(true);
                            }}
                            size="small"
                            sx={{ 
                              backgroundColor: 'info.light',
                              color: 'info.main',
                              '&:hover': {
                                backgroundColor: 'info.main',
                                color: 'white'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDeleteSegment(segment._id)}
                            size="small"
                            sx={{ 
                              backgroundColor: 'error.light',
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'error.main',
                                color: 'white'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>

        <Dialog 
          open={openDetails} 
          onClose={() => setOpenDetails(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            Segment Details
            <IconButton
              aria-label="close"
              onClick={() => setOpenDetails(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedSegment && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedSegment.name}</Typography>
                  <Typography color="textSecondary">{selectedSegment.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Segment Size</Typography>
                  <Typography variant="h4">{getSegmentSize(selectedSegment)}</Typography>
                  <Typography color="textSecondary">customers</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Status</Typography>
                  <Chip
                    label={selectedSegment.isActive ? 'Active' : 'Inactive'}
                    color={selectedSegment.isActive ? 'success' : 'default'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Criteria</Typography>
                
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {selectedSegment.rules.conditions.map((condition, index) => {
                        if (condition.field === 'totalSpend') {
                          return (
                            <Grid item xs={12} md={6} key={index}>
                          <Typography variant="subtitle2">Spending Range</Typography>
                          <Typography>
                                  {condition.operator === '>=' ? `₹${condition.value} - ` : ''}
                                  {condition.operator === '<=' ? `₹${condition.value}` : 'No limit'}
                          </Typography>
                        </Grid>
                          );
                        }
                        if (condition.field === 'visits') {
                          return (
                            <Grid item xs={12} md={6} key={index}>
                          <Typography variant="subtitle2">Visit Range</Typography>
                          <Typography>
                                  {condition.operator === '>=' ? `${condition.value} - ` : ''}
                                  {condition.operator === '<=' ? `${condition.value}` : 'No limit'} visits
                          </Typography>
                        </Grid>
                          );
                        }
                        if (condition.field === 'tags') {
                          return (
                            <Grid item xs={12} key={index}>
                          <Typography variant="subtitle2">Tags</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                  {condition.value.map((tag, tagIndex) => (
                                    <Chip key={tagIndex} label={tag} />
                            ))}
                          </Box>
                        </Grid>
                          );
                        }
                        return null;
                      })}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        <Dialog 
          open={openAI} 
          onClose={() => {
            setOpenAI(false);
            setAiError(null);
            setAiPrompt('');
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            AI-Driven Segment Creation
            <IconButton
              aria-label="close"
              onClick={() => {
                setOpenAI(false);
                setAiError(null);
                setAiPrompt('');
              }}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {aiError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {aiError}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Describe your segment in natural language
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Example: "People who haven't shopped in 6 months and spent over ₹5K"
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter your segment description..."
                disabled={aiLoading}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenAI(false);
                setAiError(null);
                setAiPrompt('');
              }}
              disabled={aiLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAISegment} 
              variant="contained" 
              color="primary"
              disabled={!aiPrompt.trim() || aiLoading}
              startIcon={aiLoading ? <CircularProgress size={20} /> : null}
            >
              {aiLoading ? 'Generating...' : 'Generate Segment'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openAdd || openEdit} 
          onClose={() => {
            setOpenAdd(false);
            setOpenEdit(false);
            setError(null);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle>
            {openAdd ? 'Create New Segment' : 'Edit Segment'}
            <IconButton
              aria-label="close"
              onClick={() => {
                setOpenAdd(false);
                setOpenEdit(false);
                setError(null);
              }}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Segment Name"
                  value={newSegment.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={newSegment.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Spend"
                  type="number"
                  value={newSegment.criteria.minSpend}
                  onChange={(e) => handleCriteriaChange('minSpend', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Spend"
                  type="number"
                  value={newSegment.criteria.maxSpend}
                  onChange={(e) => handleCriteriaChange('maxSpend', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Visits"
                  type="number"
                  value={newSegment.criteria.minVisits}
                  onChange={(e) => handleCriteriaChange('minVisits', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Visits"
                  type="number"
                  value={newSegment.criteria.maxVisits}
                  onChange={(e) => handleCriteriaChange('maxVisits', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={['VIP', 'Regular', 'New', 'Inactive', 'High Value', 'Loyal', 'At Risk']}
                  value={newSegment.criteria.tags}
                  onChange={(e, newValue) => handleCriteriaChange('tags', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Select tags"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newSegment.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenAdd(false);
              setOpenEdit(false);
              setError(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSegment} 
              variant="contained" 
              color="primary"
            >
              {openAdd ? 'Create Segment' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Segments;