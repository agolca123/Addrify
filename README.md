# Location Tracking System

A web application for tracking and visualizing location data.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your credentials:

- `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., https://your-project.supabase.co)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Make sure your Supabase URL includes the full protocol (https://) and domain. For example:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## Features

- User location tracking
- Google Maps integration
- Real-time location updates
- User management
- Location history visualization

## Troubleshooting

If you encounter any errors:

1. Ensure your Supabase URL starts with `https://`
2. Verify that your environment variables are properly set
3. Check that your Supabase and Google Maps API keys are valid