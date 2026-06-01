import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/water_source.dart';

class ApiService {
  static String get baseUrl => ApiConfig.baseUrl;

  static Future<List<WaterSource>> getSources({String? district}) async {
    final query = <String, String>{};
    if (district != null && district.trim().isNotEmpty) {
      query['district'] = district.trim();
    }

    final uri = Uri.parse(
      "$baseUrl/water-sources",
    ).replace(queryParameters: query.isEmpty ? null : query);
    final res = await http.get(uri);
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
    required String token,
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String? state,
    String? district,
    String sourceType = "well",
  }) async {
    final payload = <String, dynamic>{
      "name": name,
      "latitude": lat,
      "longitude": lng,
      "sourceType": sourceType,
    };
    if (state != null && state.trim().isNotEmpty) {
      payload["state"] = state.trim();
    }
    if (district != null && district.trim().isNotEmpty) {
      payload["district"] = district.trim();
    }
    if (ph != null) {
      payload["ph"] = ph;
    }

    final response = await http.post(
      Uri.parse("$baseUrl/water-sources/add"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: json.encode(payload),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception("Failed to add source: ${response.body}");
    }
  }

  static Future<void> updateSource({
    required String token,
    required String id,
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String? state,
    String? district,
    String sourceType = "well",
  }) async {
    final payload = <String, dynamic>{
      "name": name,
      "latitude": lat,
      "longitude": lng,
      "sourceType": sourceType,
    };
    if (state != null && state.trim().isNotEmpty) {
      payload["state"] = state.trim();
    }
    if (district != null && district.trim().isNotEmpty) {
      payload["district"] = district.trim();
    }
    if (ph != null) {
      payload["ph"] = ph;
    }

    final response = await http.patch(
      Uri.parse("$baseUrl/water-sources/$id"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: json.encode(payload),
    );

    if (response.statusCode != 200) {
      throw Exception("Failed to update source: ${response.body}");
    }
  }
}
