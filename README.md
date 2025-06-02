# Mini CRM

A modern Customer Relationship Management system with intelligent customer segmentation, campaign management, and analytics capabilities.

## Features

- **Customer Management**: Track customer information, purchase history, and interactions
- **Intelligent Segmentation**: Create dynamic customer segments based on behavior and attributes
- **Campaign Management**: Design and execute targeted marketing campaigns
- **Analytics Dashboard**: Monitor campaign performance and customer engagement metrics
- **Communication Logs**: Track all customer interactions and campaign deliveries

##  Tech Stack

### Frontend
- React.js with Vite
- Material-UI (MUI) for modern UI components
- React Router for navigation
- Axios for API communication

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- CORS enabled for secure cross-origin requests

### AI/ML Tools
- Customer segmentation algorithms

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

##  Local Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mini-crm
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
   - Create `.env` file in the backend directory:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   ```
   - Create `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Architecture

The application follows a modern client-server architecture:
![deepseek_mermaid_20250601_e0f886](https://github.com/user-attachments/assets/67a4b000-f92d-434d-b865-c85f41118db3)
### Key Components:
- **Frontend**: Single Page Application (SPA) with component-based architecture
- **Backend**: RESTful API with MVC pattern
- **Database**: MongoDB collections for Customers, Campaigns, Segments, and Communication Logs

## Data Flow

1. **Customer Data Management**
   - Customer information storage and retrieval
   - Purchase history tracking
   - Interaction logging

2. **Campaign Workflow**
   - Segment creation and management
   - Campaign design and scheduling
   - Message delivery and tracking
   - Performance analytics

## Known Limitations

1. **Scalability**
   - Current implementation is optimized for small to medium-sized businesses
   - No batch wise Api Delivery  API hit

2. **Features**
   - Limited to email and SMS communications
   - Basic analytics capabilities
   - No real-time notifications

3. **Security**
   - Basic authentication implementation
   - No role-based access control
   - Limited API rate limiting

4. **Performance**
   - No caching implementation
   - Basic database indexing

## Assumptions

1. **Data Storage**
   - MongoDB is the primary database
   - No file storage requirements
   - Limited data retention policies

2. **User Management**
   - Single user per organization
   - Basic authentication requirements
   - No multi-tenant support

3. **Integration**
   - Basic email/SMS service integration
   - No third-party CRM integration
   - Very Time consuming Audience Size and Custermors Calculation Method
   - no pub-sub architecture using a message broker (Kafka , RabbitMQ, Redis Streams, etc.) 
