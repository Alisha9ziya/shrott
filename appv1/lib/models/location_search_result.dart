import 'package:latlong2/latlong.dart';

class LocationSearchResult {
  final String name;
  final double latitude;
  final double longitude;
  final String? state;
  final String? district;
  final double? south;
  final double? north;
  final double? west;
  final double? east;

  const LocationSearchResult({
    required this.name,
    required this.latitude,
    required this.longitude,
    this.state,
    this.district,
    this.south,
    this.north,
    this.west,
    this.east,
  });

  LatLng get point => LatLng(latitude, longitude);

  factory LocationSearchResult.fromJson(Map<String, dynamic> json) {
    final address = json['address'];
    final addressMap = address is Map<String, dynamic> ? address : const {};

    String? pick(List<String> keys) {
      for (final key in keys) {
        final value = addressMap[key];
        if (value != null && value.toString().trim().isNotEmpty) {
          return value.toString().trim();
        }
      }
      return null;
    }

    final bounds = json['boundingbox'];
    final south = bounds is List && bounds.isNotEmpty
        ? double.tryParse(bounds[0].toString())
        : null;
    final north = bounds is List && bounds.length > 1
        ? double.tryParse(bounds[1].toString())
        : null;
    final west = bounds is List && bounds.length > 2
        ? double.tryParse(bounds[2].toString())
        : null;
    final east = bounds is List && bounds.length > 3
        ? double.tryParse(bounds[3].toString())
        : null;

    return LocationSearchResult(
      name: json['display_name']?.toString() ?? 'Unknown location',
      latitude: double.tryParse(json['lat']?.toString() ?? '') ?? 0,
      longitude: double.tryParse(json['lon']?.toString() ?? '') ?? 0,
      state: pick(['state', 'union_territory']),
      district: pick(['city_district', 'state_district', 'district', 'county']),
      south: south,
      north: north,
      west: west,
      east: east,
    );
  }
}
