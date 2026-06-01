/// Shared API base URL for water sources and auth.
class ApiConfig {
  static const String _fromEnv = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// Hosted API used by the app. Override with --dart-define for local dev.
  static const String _productionBase =
      'https://flutter-app-backend-1.onrender.com/api';

  static String get baseUrl {
    if (_fromEnv.isNotEmpty) {
      final v = _fromEnv.trim();
      return v.endsWith('/') ? v.substring(0, v.length - 1) : v;
    }

    return _productionBase;
  }
}
