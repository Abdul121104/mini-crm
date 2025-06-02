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
  TablePagination,
  TableSortLabel,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

function Customers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openAddOrder, setOpenAddOrder] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newOrder, setNewOrder] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ name: '', quantity: 1, price: '' }]
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, submittedSearchQuery, sortField, sortDirection, filterStatus]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        search: submittedSearchQuery,
        sort: sortField,
        direction: sortDirection,
        status: filterStatus
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers?${queryParams}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers);
      setTotalCustomers(data.totalCustomers);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async () => {
    try {
      const totalAmount = newOrder.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);

      const orderData = {
        amount: totalAmount,
        date: newOrder.date,
        items: newOrder.items.map(item => ({
          name: item.name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${selectedCustomer._id}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id')
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add order');
      }

      await fetchCustomers();
      setOpenAddOrder(false);
      setNewOrder({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ name: '', quantity: 1, price: '' }]
      });
    } catch (err) {
      setError(err.message || 'Failed to add order');
      console.error('Error adding order:', err);
    }
  };

  const handleAddItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddCustomer = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id')
        },
        body: JSON.stringify(newCustomer)
      });
      if (!response.ok) throw new Error('Failed to add customer');
      await fetchCustomers();
      setOpenAdd(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      });
    } catch (err) {
      setError('Failed to add customer');
      console.error('Error adding customer:', err);
    }
  };

  const handleViewDetails = async (customerId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers/${customerId}`, {
        headers: {
          'user-id': localStorage.getItem('user-id')
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setSelectedCustomer(data);
      setOpenDetails(true);
    } catch (err) {
      setError('Failed to load customer details');
      console.error('Error loading customer details:', err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setSubmittedSearchQuery(searchQuery);
      setPage(0);
    }
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
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        p: 3,
        minHeight: 'calc(100vh - 64px)',
        width: '100%'
      }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      minHeight: 'calc(100vh - 64px)',
      width: '100%',
      backgroundColor: 'background.default'
    }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" color='black'>
            Customers
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAdd(true)}
          >
            Add Customer
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'totalSpend'}
                    direction={sortField === 'totalSpend' ? sortDirection : 'asc'}
                    onClick={() => handleSort('totalSpend')}
                  >
                    Total Spend
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'visits'}
                    direction={sortField === 'visits' ? sortDirection : 'asc'}
                    onClick={() => handleSort('visits')}
                  >
                    Visits
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'lastActive'}
                    direction={sortField === 'lastActive' ? sortDirection : 'asc'}
                    onClick={() => handleSort('lastActive')}
                  >
                    Last Active
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>₹{customer.totalSpend?.toLocaleString() || 0}</TableCell>
                  <TableCell>{customer.visits || 0}</TableCell>
                  <TableCell>
                    {customer.lastActive ? new Date(customer.lastActive).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewDetails(customer._id)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => {
                      setSelectedCustomer(customer);
                      setOpenAddOrder(true);
                    }}>
                      <AddShoppingCartIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCustomers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Customer Details
            <IconButton
              aria-label="close"
              onClick={() => setOpenDetails(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedCustomer && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedCustomer.name}</Typography>
                  <Typography color="textSecondary">{selectedCustomer.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Contact Information</Typography>
                  <Typography>Phone: {selectedCustomer.phone}</Typography>
                  <Typography>Address: {selectedCustomer.address.street}</Typography>
                  <Typography>{selectedCustomer.address.city}, {selectedCustomer.address.state}</Typography>
                  <Typography>{selectedCustomer.address.country} - {selectedCustomer.address.zipCode}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1">Purchase History</Typography>
                  {selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0 ? (
                    selectedCustomer.purchaseHistory.map((purchase, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1 }}>
                        <Typography>Amount: ₹{purchase.amount}</Typography>
                        <Typography>Date: {new Date(purchase.date).toLocaleDateString()}</Typography>
                        <Typography>Items:</Typography>
                        {purchase.items.map((item, i) => (
                          <Typography key={i} variant="body2">
                            • {item.name} x {item.quantity} (₹{item.price} each)
                          </Typography>
                        ))}
                      </Paper>
                    ))
                  ) : (
                    <Typography color="textSecondary">No purchase history</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCustomer.tags && selectedCustomer.tags.length > 0 ? (
                      selectedCustomer.tags.map((tag, index) => (
                        <Chip key={index} label={tag} />
                      ))
                    ) : (
                      <Typography color="textSecondary">No tags</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={openAddOrder} onClose={() => setOpenAddOrder(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Add New Order
            <IconButton
              aria-label="close"
              onClick={() => setOpenAddOrder(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order Date"
                  type="date"
                  value={newOrder.date}
                  onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Items</Typography>
                {newOrder.items.map((item, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Item Name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Price"
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        fullWidth
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                        disabled={newOrder.items.length === 1}
                      >
                        Remove
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  onClick={handleAddItem}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddOrder(false)}>Cancel</Button>
            <Button onClick={handleAddOrder} variant="contained" color="primary">
              Add Order
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Add New Customer
            <IconButton
              aria-label="close"
              onClick={() => setOpenAdd(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street"
                  value={newCustomer.address.street}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address, street: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={newCustomer.address.city}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address, city: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={newCustomer.address.state}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address, state: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={newCustomer.address.country}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address, country: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={newCustomer.address.zipCode}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer,
                    address: { ...newCustomer.address, zipCode: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} variant="contained" color="primary">
              Add Customer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Customers;
