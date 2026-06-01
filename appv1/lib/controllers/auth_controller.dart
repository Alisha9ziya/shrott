import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_user.dart';
import '../services/auth_api_service.dart';

class AuthController extends ChangeNotifier {
  static const _kToken = 'shrot_auth_token';
  static const _kUserJson = 'shrot_auth_user';

  String? _token;
  AppUser? _user;
  bool _loading = true;
  String? _errorMessage;
  List<AppUser> _managedUsers = [];
  bool _usersLoading = false;

  String? get token => _token;
  AppUser? get user => _user;
  bool get isLoading => _loading;
  String? get errorMessage => _errorMessage;
  List<AppUser> get managedUsers => _managedUsers;
  bool get usersLoading => _usersLoading;

  bool get isLoggedIn => _token != null && _token!.isNotEmpty && _user != null;

  bool get needsRegionSelection =>
      isLoggedIn &&
      (!_user!.regionCompleted ||
          _user!.state.trim().isEmpty ||
          _user!.district.trim().isEmpty);

  bool get canManageSources => _user?.canManageSources == true;
  bool get isGovernment => _user?.isGovernment == true;

  Future<void> tryRestoreSession() async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedToken = prefs.getString(_kToken);
      final savedUser = prefs.getString(_kUserJson);
      if (savedToken == null ||
          savedToken.isEmpty ||
          savedUser == null ||
          savedUser.isEmpty) {
        _token = null;
        _user = null;
        return;
      }
      _token = savedToken;
      _user = AppUser.fromJson(json.decode(savedUser) as Map<String, dynamic>);
      final fresh = await AuthApiService.me(savedToken);
      _user = fresh;
      await _persistUser(fresh);
    } catch (_) {
      _token = null;
      _user = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kToken);
      await prefs.remove(_kUserJson);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _persistCredentials(String token, AppUser user) async {
    _token = token;
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token);
    await prefs.setString(_kUserJson, json.encode(user.toJson()));
    notifyListeners();
  }

  Future<void> _persistUser(AppUser user) async {
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kUserJson, json.encode(user.toJson()));
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await AuthApiService.login(
        email: email,
        password: password,
      );
      await _persistCredentials(result.token, result.user);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password) async {
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await AuthApiService.register(
        email: email,
        password: password,
      );
      await _persistCredentials(result.token, result.user);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> saveRegion(String state, String district) async {
    if (_token == null) return false;
    _errorMessage = null;
    notifyListeners();
    try {
      final updated = await AuthApiService.updateRegion(
        token: _token!,
        state: state,
        district: district,
      );
      await _persistUser(updated);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _errorMessage = null;
    _managedUsers = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kUserJson);
    notifyListeners();
  }

  Future<void> loadManagedUsers() async {
    if (_token == null || !isGovernment) return;
    _usersLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _managedUsers = await AuthApiService.listUsers(_token!);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _usersLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateSourcePermission(
    String userId,
    bool canManageSources,
  ) async {
    if (_token == null || !isGovernment) return false;
    _errorMessage = null;
    notifyListeners();
    try {
      final updated = await AuthApiService.updateSourcePermission(
        token: _token!,
        userId: userId,
        canManageSources: canManageSources,
      );
      _managedUsers = _managedUsers
          .map((u) => u.id == updated.id ? updated : u)
          .toList();
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
