import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/water_source.dart';
import 'water_details_sheet.dart';

Marker buildWaterMarker(BuildContext context, WaterSource src) {
  return Marker(
    width: 50,
    height: 50,
    point: LatLng(src.latitude, src.longitude),
    child: GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        builder: (_) => WaterDetailsSheet(source: src),
      ),
      child: Icon(Icons.water_drop, color: Colors.blue, size: 30),
    ),
  );
}