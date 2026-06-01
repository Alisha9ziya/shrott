import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/location_search_result.dart';

class LocationSearchService {
  static const _endpoint = 'https://nominatim.openstreetmap.org/search';
  static const _reverseEndpoint = 'https://nominatim.openstreetmap.org/reverse';

  static Future<List<LocationSearchResult>> search(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return [];

    final uri = Uri.parse(_endpoint).replace(
      queryParameters: {
        'q': trimmed,
        'format': 'jsonv2',
        'addressdetails': '1',
        'limit': '5',
      },
    );

    final response = await http
        .get(
          uri,
          headers: const {
            'Accept': 'application/json',
            'User-Agent': 'Shrot Flutter app',
          },
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw Exception('Location search failed');
    }

    final decoded = json.decode(response.body);
    if (decoded is! List) return [];
    return decoded
        .whereType<Map<String, dynamic>>()
        .map(LocationSearchResult.fromJson)
        .where((r) => r.latitude != 0 || r.longitude != 0)
        .toList();
  }

  static Future<LocationSearchResult?> reverse({
    required double latitude,
    required double longitude,
  }) async {
    final uri = Uri.parse(_reverseEndpoint).replace(
      queryParameters: {
        'lat': latitude.toString(),
        'lon': longitude.toString(),
        'format': 'jsonv2',
        'addressdetails': '1',
      },
    );

    final response = await http
        .get(
          uri,
          headers: const {
            'Accept': 'application/json',
            'User-Agent': 'Shrot Flutter app',
          },
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw Exception('Location lookup failed');
    }

    final decoded = json.decode(response.body);
    if (decoded is! Map<String, dynamic>) return null;
    final result = LocationSearchResult.fromJson(decoded);
    if (result.latitude == 0 && result.longitude == 0) return null;
    return result;
  }
}
