import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/app_user.dart';

class AuthApiService {
  static String get _base => ApiConfig.baseUrl;
  static const Duration _requestTimeout = Duration(seconds: 60);

  static Map<String, String> _jsonHeaders(String? token) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      h['Authorization'] = 'Bearer $token';
    }
    return h;
  }

  static dynamic _decodeJson(http.Response res) {
    try {
      return res.body.isEmpty ? null : json.decode(res.body);
    } on FormatException {
      throw Exception(
        'Server returned an invalid response (${res.statusCode}). Check API URL: $_base',
      );
    }
  }

  static String _errorMessage(dynamic body, String fallback) {
    if (body is Map && body['error'] != null) {
      return body['error'].toString();
    }
    return fallback;
  }

  static Future<http.Response> _postJson(
    String path,
    Map<String, dynamic> payload,
  ) async {
    try {
      return await http
          .post(
            Uri.parse('$_base$path'),
            headers: _jsonHeaders(null),
            body: json.encode(payload),
          )
          .timeout(_requestTimeout);
    } on TimeoutException {
      throw Exception(
        'The server took too long to respond. Try again shortly.',
      );
    } on SocketException {
      throw Exception('Could not connect to the server at $_base');
    } on http.ClientException catch (e) {
      throw Exception('Could not reach the server at $_base: ${e.message}');
    }
  }

  static Future<({String token, AppUser user})> login({
    required String email,
    required String password,
  }) async {
    final res = await _postJson('/auth/login', {
      'email': email.trim(),
      'password': password,
    });
    final body = _decodeJson(res);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(body, 'Login failed'));
    }
    final token = body['token']?.toString();
    if (token == null || token.isEmpty) {
      throw Exception('Invalid server response');
    }
    final userMap = body['user'] as Map<String, dynamic>?;
    if (userMap == null) {
      throw Exception('Invalid server response');
    }
    return (token: token, user: AppUser.fromJson(userMap));
  }

  static Future<({String token, AppUser user})> register({
    required String email,
    required String password,
  }) async {
    final res = await _postJson('/auth/register', {
      'email': email.trim(),
      'password': password,
    });
    final body = _decodeJson(res);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(_errorMessage(body, 'Registration failed'));
    }
    final token = body['token']?.toString();
    if (token == null || token.isEmpty) {
      throw Exception('Invalid server response');
    }
    final userMap = body['user'] as Map<String, dynamic>?;
    if (userMap == null) {
      throw Exception('Invalid server response');
    }
    return (token: token, user: AppUser.fromJson(userMap));
  }

  static Future<AppUser> me(String token) async {
    final res = await http
        .get(Uri.parse('$_base/auth/me'), headers: _jsonHeaders(token))
        .timeout(_requestTimeout);
    final body = _decodeJson(res);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(body, 'Session expired'));
    }
    final userMap = body['user'] as Map<String, dynamic>?;
    if (userMap == null) {
      throw Exception('Invalid server response');
    }
    return AppUser.fromJson(userMap);
  }

  static Future<AppUser> updateRegion({
    required String token,
    required String state,
    required String district,
  }) async {
    final res = await http
        .patch(
          Uri.parse('$_base/auth/region'),
          headers: _jsonHeaders(token),
          body: json.encode({
            'state': state.trim(),
            'district': district.trim(),
          }),
        )
        .timeout(_requestTimeout);
    final body = _decodeJson(res);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(body, 'Could not save region'));
    }
    final userMap = body['user'] as Map<String, dynamic>?;
    if (userMap == null) {
      throw Exception('Invalid server response');
    }
    return AppUser.fromJson(userMap);
  }

  static Future<List<AppUser>> listUsers(String token) async {
    final res = await http
        .get(Uri.parse('$_base/auth/users'), headers: _jsonHeaders(token))
        .timeout(_requestTimeout);
    final body = _decodeJson(res);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(body, 'Could not load users'));
    }
    final users = body['users'];
    if (users is! List) {
      throw Exception('Invalid server response');
    }
    return users
        .whereType<Map<String, dynamic>>()
        .map(AppUser.fromJson)
        .toList();
  }

  static Future<AppUser> updateSourcePermission({
    required String token,
    required String userId,
    required bool canManageSources,
  }) async {
    final res = await http
        .patch(
          Uri.parse('$_base/auth/users/$userId/source-permission'),
          headers: _jsonHeaders(token),
          body: json.encode({'canManageSources': canManageSources}),
        )
        .timeout(_requestTimeout);
    final body = _decodeJson(res);
    if (res.statusCode != 200) {
      throw Exception(_errorMessage(body, 'Could not update permission'));
    }
    final userMap = body['user'] as Map<String, dynamic>?;
    if (userMap == null) {
      throw Exception('Invalid server response');
    }
    return AppUser.fromJson(userMap);
  }
}
