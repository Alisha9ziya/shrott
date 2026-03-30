import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/water_source.dart';

class ApiService {
  static const String _apiBaseUrlFromEnv =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get baseUrl {
    if (_apiBaseUrlFromEnv.isNotEmpty) {
      return _apiBaseUrlFromEnv;
    }

    if (Platform.isAndroid) {
      return "http://10.0.2.2:5000/api";
    }
    return "http://localhost:5000/api";
  }

  static Future<List<WaterSource>> getSources() async {
    final res = await http.get(Uri.parse("$baseUrl/water-sources"));
    if (res.statusCode == 200) {
      final decoded = json.decode(res.body);
      final List data = decoded is List
          ? decoded
          : (decoded is Map<String, dynamic> && decoded['data'] is List
              ? decoded['data'] as List
              : <dynamic>[]);
      return data.map((e) => WaterSource.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load sources");
    }
  }

  static Future<void> addSource({
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String sourceType = "well",
  }) async {
    final payload = <String, dynamic>{
      "name": name,
      "latitude": lat,
      "longitude": lng,
      "sourceType": sourceType,
    };
    if (ph != null) {
      payload["ph"] = ph;
    }

    final response = await http.post(
      Uri.parse("$baseUrl/water-sources/add"),
      headers: {"Content-Type": "application/json"},
      body: json.encode(payload),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception("Failed to add source: ${response.body}");
    }
  }
}