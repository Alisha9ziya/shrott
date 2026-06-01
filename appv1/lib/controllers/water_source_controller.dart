import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/water_source.dart';
import '../services/api_service.dart';

class WaterSourceController extends ChangeNotifier {
  List<WaterSource> sources = [];
  LatLng? selectedPoint;
  bool isLoading = false;
  String? errorMessage;
  String? _activeDistrict;
  int _loadRequestId = 0;

  String? get activeDistrict => _activeDistrict;

  Future<void> loadSources({String? district}) async {
    _activeDistrict = district?.trim().isEmpty == true
        ? null
        : district?.trim();
    final requestId = ++_loadRequestId;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final fetched = await ApiService.getSources(district: _activeDistrict);
      if (requestId != _loadRequestId) {
        return;
      }
      sources = fetched.where(_matchesActiveFilter).toList();
    } catch (e) {
      if (requestId != _loadRequestId) {
        return;
      }
      errorMessage = e.toString();
    } finally {
      if (requestId == _loadRequestId) {
        isLoading = false;
        notifyListeners();
      }
    }
  }

  bool _matchesActiveFilter(WaterSource source) {
    if (_activeDistrict != null && _activeDistrict!.isNotEmpty) {
      final district = source.district?.trim();
      if (district == null ||
          district.isEmpty ||
          !_equalsIgnoreCase(district, _activeDistrict!)) {
        return false;
      }
    }

    return true;
  }

  bool _equalsIgnoreCase(String left, String right) =>
      left.toLowerCase() == right.toLowerCase();

  void selectPoint(LatLng point) {
    selectedPoint = point;
    notifyListeners();
  }

  Future<bool> addSource({
    required String token,
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String? state,
    String? district,
    String sourceType = 'well',
  }) async {
    if (name.trim().isEmpty) return false;
    errorMessage = null;
    notifyListeners();

    try {
      await ApiService.addSource(
        token: token,
        name: name.trim(),
        lat: lat,
        lng: lng,
        ph: ph,
        state: state,
        district: district,
        sourceType: sourceType,
      );
      selectedPoint = null;
      await loadSources(district: _activeDistrict);
      return true;
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addSourceAtSelectedPoint({
    required String token,
    required String name,
    double? ph,
    String sourceType = 'well',
  }) async {
    if (selectedPoint == null) return false;
    return addSource(
      token: token,
      name: name,
      lat: selectedPoint!.latitude,
      lng: selectedPoint!.longitude,
      ph: ph,
      sourceType: sourceType,
    );
  }

  Future<bool> updateSource({
    required String token,
    required String id,
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String? state,
    String? district,
    String sourceType = 'well',
  }) async {
    if (id.isEmpty || name.trim().isEmpty) return false;
    errorMessage = null;
    notifyListeners();

    try {
      await ApiService.updateSource(
        token: token,
        id: id,
        name: name.trim(),
        lat: lat,
        lng: lng,
        ph: ph,
        state: state,
        district: district,
        sourceType: sourceType,
      );
      selectedPoint = null;
      await loadSources(district: _activeDistrict);
      return true;
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearSelectedPoint() {
    selectedPoint = null;
    notifyListeners();
  }
}
