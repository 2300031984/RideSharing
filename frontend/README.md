# Ride Sharing Frontend

A modern React-based frontend application for a ride sharing platform with real-time ride tracking, user management, and interactive maps.

## Features

- **User Authentication**: Login/Signup for Riders and Drivers
- **Real-time Ride Tracking**: Live updates on ride status
- **Interactive Maps**: Mapbox integration for location selection
- **Dashboard**: Separate dashboards for Riders and Drivers
- **Wallet Management**: Digital wallet for payments
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Clean and intuitive user interface

## Tech Stack

- React 19.1.0
- Vite 7.0.4
- React Router DOM 7.7.0
- Mapbox GL JS 2.13.0
- Axios 1.10.0
- Tailwind CSS 4.1.11

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd Forntend/RideSharing
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   VITE_API_URL=http://localhost:8081
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Card, Badge, etc.)
│   ├── Navbar.jsx      # Navigation components
│   ├── RideCard.jsx    # Ride display component
│   └── ...
├── pages/              # Page components
│   ├── common/         # Shared pages (Login, Signup, etc.)
│   ├── user/           # User-specific pages
│   ├── driver/         # Driver-specific pages
│   └── admin/          # Admin pages
├── services/           # API service functions
├── context/            # React context providers
├── routes/             # Route configuration
└── Styles/             # CSS files
```

## Key Features

### For Riders
- **Book Rides**: Select pickup and dropoff locations
- **Track Rides**: Real-time ride status updates
- **Wallet**: Add funds and manage payments
- **Ride History**: View past rides
- **Profile Management**: Update personal information

### For Drivers
- **Accept Rides**: View and accept ride requests
- **Ride Management**: Start, complete, and track rides
- **Status Control**: Go online/offline
- **Earnings**: Track ride earnings

### For Admins
- **Dashboard**: System overview and analytics
- **User Management**: Manage riders and drivers
- **Ride Monitoring**: Monitor all rides

## API Integration

The frontend communicates with the Spring Boot backend through REST APIs:

- **Authentication**: JWT-based authentication
- **Real-time Updates**: Polling for ride status updates
- **Map Integration**: Mapbox for location services
- **Error Handling**: Comprehensive error handling and user feedback

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8081` |
| `VITE_MAPBOX_TOKEN` | Mapbox access token | Required for maps |
| `VITE_APP_NAME` | Application name | `RideSharing` |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration for code quality
- Consistent component structure
- Proper error handling
- Responsive design principles

## Deployment

### Docker

```bash
docker build -t ridesharing-frontend .
docker run -p 3000:80 ridesharing-frontend
```

### Static Hosting

The built files can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3
- GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.