import 'package:latlong2/latlong.dart';

class WaterSource {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double? ph;
  final String? sourceType;
  final String? qualityStatus;
  final String? address;
  final String? village;
  final String? district;
  final String? state;
  final String? notes;
  final bool? isPotable;
  final bool? seasonal;
  final int? usersPerDay;
  final String? condition;
  final DateTime? createdAt;
  final Map<String, dynamic> raw;

  WaterSource({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.ph,
    this.sourceType,
    this.qualityStatus,
    this.address,
    this.village,
    this.district,
    this.state,
    this.notes,
    this.isPotable,
    this.seasonal,
    this.usersPerDay,
    this.condition,
    this.createdAt,
    this.raw = const {},
  });

  LatLng get point => LatLng(latitude, longitude);

  factory WaterSource.fromJson(Map<String, dynamic> json) {
    final location = json['location'];
    final coordinates = location is Map<String, dynamic>
        ? location['coordinates']
        : null;

    final double longitude = coordinates is List && coordinates.isNotEmpty
        ? (coordinates[0] as num).toDouble()
        : (json['longitude'] as num?)?.toDouble() ?? 0;

    final double latitude = coordinates is List && coordinates.length > 1
        ? (coordinates[1] as num).toDouble()
        : (json['latitude'] as num?)?.toDouble() ?? 0;

    return WaterSource(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? 'Unnamed source').toString(),
      longitude: longitude,
      latitude: latitude,
      ph: (json['ph'] as num?)?.toDouble(),
      sourceType: json['sourceType']?.toString(),
      qualityStatus: json['qualityStatus']?.toString(),
      address: json['address']?.toString(),
      village: json['village']?.toString(),
      district: json['district']?.toString(),
      state: json['state']?.toString(),
      notes: json['notes']?.toString(),
      isPotable: json['isPotable'] as bool?,
      seasonal: json['seasonal'] as bool?,
      usersPerDay: (json['usersPerDay'] as num?)?.toInt(),
      condition: json['condition']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      raw: Map<String, dynamic>.from(json),
    );
  }

  Map<String, String> detailFields() {
    return {
      'ID': id,
      'Name': name,
      'Latitude': latitude.toStringAsFixed(6),
      'Longitude': longitude.toStringAsFixed(6),
      'pH': ph?.toString() ?? 'N/A',
      'Source Type': sourceType ?? 'N/A',
      'Village': village ?? 'N/A',
      'District': district ?? 'N/A',
      'State': state ?? 'N/A',
      'Potable': isPotable == null ? 'N/A' : (isPotable! ? 'Yes' : 'No'),
      'Seasonal': seasonal == null ? 'N/A' : (seasonal! ? 'Yes' : 'No'),
      'Users / Day': usersPerDay?.toString() ?? 'N/A',
      'Condition': condition ?? 'N/A',
      'Quality Status': qualityStatus ?? 'N/A',
      'Address': address ?? 'N/A',
      'Notes': notes ?? 'N/A',
      'Created At': createdAt?.toIso8601String() ?? 'N/A',
    };
  }
}
