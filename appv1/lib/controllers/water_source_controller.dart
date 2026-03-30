import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/water_source.dart';
import '../services/api_service.dart';

class WaterSourceController extends ChangeNotifier {
  List<WaterSource> sources = [];
  LatLng? selectedPoint;
  bool isLoading = false;
  String? errorMessage;

  Future<void> loadSources() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      sources = await ApiService.getSources();
    } catch (e) {
      errorMessage = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void selectPoint(LatLng point) {
    selectedPoint = point;
    notifyListeners();
  }

  Future<bool> addSource({
    required String name,
    required double lat,
    required double lng,
    double? ph,
    String sourceType = 'well',
  }) async {
    if (name.trim().isEmpty) return false;
    errorMessage = null;
    notifyListeners();

    try {
      await ApiService.addSource(
        name: name.trim(),
        lat: lat,
        lng: lng,
        ph: ph,
        sourceType: sourceType,
      );
      selectedPoint = null;
      await loadSources();
      return true;
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addSourceAtSelectedPoint({
    required String name,
    double? ph,
    String sourceType = 'well',
  }) async {
    if (selectedPoint == null) return false;
    return addSource(
      name: name,
      lat: selectedPoint!.latitude,
      lng: selectedPoint!.longitude,
      ph: ph,
      sourceType: sourceType,
    );
  }

  void clearSelectedPoint() {
    selectedPoint = null;
    notifyListeners();
  }
}