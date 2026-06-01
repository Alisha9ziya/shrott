# app_flutter_02
app of the jal sort (water source )

# Shrot - Water Source Mapping App

Shrot is a Flutter mobile app for discovering, viewing, and managing water sources across Indian regions. The app allows users to search locations, view nearby water sources on a map, and lets approved government users add or edit verified water source information.

## Features

- User authentication flow
- Region selection by state and district
- Interactive map view for water sources
- Location search support
- Water source markers with detail bottom sheets
- Add and edit water sources for approved users
- Source details such as name, type, latitude, longitude, and optional pH value
- Permission management screen
- Persistent user/session data

## Tech Stack

- Flutter
- Dart
- Provider for state management
- Material 3 UI
- flutter_map for map rendering
- latlong2 for geographic coordinates
- geolocator for location permissions and device location
- http for backend API communication
- shared_preferences for local persistence

## Project Structure

```text
appv1/
  lib/
    config/        API configuration
    controllers/   App state and business logic
    data/          Indian states and districts data
    models/        User, location, and water source models
    screens/       App screens and flows
    services/      API and location search services
    widgets/       Reusable map/detail UI widgets


Backend API
The app uses a hosted backend API:

https://flutter-app-backend-1.onrender.com/api
For local development, override the API URL using:

flutter run --dart-define=API_BASE_URL=http://localhost:YOUR_PORT/api


Getting Started
Clone the repository:

git clone <your-repository-url>
        cd app_flutter_02/appv1
Install dependencies:
        flutter pub get
Run the app:
        flutter run

User Roles -
    Normal users can view and search water sources.
    Government-approved users can add and edit water source data.

SCREEN SHOT - 