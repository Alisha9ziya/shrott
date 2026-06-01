class AppUser {
  final String id;
  final String email;
  final String state;
  final String district;
  final bool regionCompleted;
  final String role;
  final bool canManageSources;

  AppUser({
    required this.id,
    required this.email,
    required this.state,
    required this.district,
    required this.regionCompleted,
    required this.role,
    required this.canManageSources,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      district: json['district']?.toString() ?? '',
      regionCompleted: json['regionCompleted'] == true,
      role: json['role']?.toString() ?? 'public',
      canManageSources:
          json['role']?.toString() == 'government' ||
          json['canManageSources'] == true,
    );
  }

  bool get isGovernment => role == 'government';

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'state': state,
    'district': district,
    'regionCompleted': regionCompleted,
    'role': role,
    'canManageSources': canManageSources,
  };

  AppUser copyWith({
    String? id,
    String? email,
    String? state,
    String? district,
    bool? regionCompleted,
    String? role,
    bool? canManageSources,
  }) {
    return AppUser(
      id: id ?? this.id,
      email: email ?? this.email,
      state: state ?? this.state,
      district: district ?? this.district,
      regionCompleted: regionCompleted ?? this.regionCompleted,
      role: role ?? this.role,
      canManageSources: canManageSources ?? this.canManageSources,
    );
  }
}
