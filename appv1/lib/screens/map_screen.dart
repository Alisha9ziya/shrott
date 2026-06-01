import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../controllers/auth_controller.dart';
import '../controllers/water_source_controller.dart';
import '../models/location_search_result.dart';
import '../models/water_source.dart';
import '../services/location_search_service.dart';
import '../widgets/water_details_sheet.dart';
import '../widgets/water_marker.dart';
import 'add_source_screen.dart';
import 'auth/region_selection_screen.dart';
import 'manage_permissions_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  static const LatLng _defaultMapCenter = LatLng(22.5937, 78.9629);
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  final MapController _mapController = MapController();
  List<LocationSearchResult> _searchResults = [];
  LatLng? _searchedPoint;
  bool _searching = false;
  String? _searchError;
  String? _filterDistrict;
  LatLng _mapCenter = _defaultMapCenter;
  double _mapZoom = 5.5;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthController>().user;
      final district = user?.district.trim();
      _applySourceFilter(
        district: district != null && district.isNotEmpty ? district : null,
      );
      _moveToActiveRegion();
    });
  }

  @override
  void dispose() {
    _mapController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _openAddScreen([LatLng? point]) {
    final controller = context.read<WaterSourceController>();
    final selected = point ?? controller.selectedPoint;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddSourceScreen(
          initialLatitude: selected?.latitude,
          initialLongitude: selected?.longitude,
        ),
      ),
    );
  }

  Future<void> _searchLocation() async {
    final query = _searchController.text.trim();
    if (query.isEmpty || _searching) return;
    setState(() {
      _searching = true;
      _searchError = null;
      _searchResults = [];
    });
    try {
      final results = await LocationSearchService.search(query);
      if (!mounted) return;
      setState(() {
        _searchResults = results;
        _searchError = results.isEmpty ? 'No locations found' : null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _searchError = e.toString());
    } finally {
      if (mounted) {
        setState(() => _searching = false);
      }
    }
  }

  void _selectSearchResult(LocationSearchResult result) {
    _searchFocus.unfocus();
    _moveMap(result.point, zoom: 14);
    setState(() {
      _searchedPoint = result.point;
      _searchController.text = result.name;
      _searchResults = [];
      _searchError = null;
    });
    _applySourceFilter(district: result.district);
  }

  void _applySourceFilter({String? district}) {
    _filterDistrict = district;
    context.read<WaterSourceController>().loadSources(
      district: _filterDistrict,
    );
  }

  void _applyUserRegionAndMove() {
    final user = context.read<AuthController>().user;
    final district = user?.district.trim();
    _applySourceFilter(
      district: district != null && district.isNotEmpty ? district : null,
    );
    _moveToActiveRegion();
  }

  void _moveMap(LatLng point, {double? zoom}) {
    final nextZoom = (zoom ?? _mapZoom).clamp(3.0, 18.0);
    setState(() {
      _mapCenter = point;
      _mapZoom = nextZoom;
    });
    _mapController.move(point, nextZoom);
  }

  List<Marker> _buildMapMarkers(
    WaterSourceController controller,
    bool canManageSources,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final markers = <Marker>[
      for (final source in controller.sources)
        Marker(
          key: ValueKey('source-${source.id}'),
          point: source.point,
          width: 54,
          height: 54,
          alignment: Alignment.topCenter,
          child: GestureDetector(
            onTap: () => _openSourceDetails(source),
            child: buildMapPin(
              context,
              color: colorScheme.primary,
              icon: Icons.water_drop_rounded,
            ),
          ),
        ),
    ];

    if (canManageSources && controller.selectedPoint != null) {
      markers.add(
        Marker(
          key: const ValueKey('selected-point'),
          point: controller.selectedPoint!,
          width: 54,
          height: 54,
          alignment: Alignment.topCenter,
          child: buildMapPin(
            context,
            color: Colors.green.shade700,
            icon: Icons.add_location_alt_rounded,
          ),
        ),
      );
    }

    if (_searchedPoint != null) {
      markers.add(
        Marker(
          key: const ValueKey('searched-point'),
          point: _searchedPoint!,
          width: 54,
          height: 54,
          alignment: Alignment.topCenter,
          child: buildMapPin(
            context,
            color: Colors.deepPurple.shade500,
            icon: Icons.search_rounded,
          ),
        ),
      );
    }

    return markers;
  }

  void _openSourceDetails(WaterSource source) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => WaterDetailsSheet(source: source),
    );
  }

  Future<void> _moveToActiveRegion() async {
    final user = context.read<AuthController>().user;
    final state = user?.state.trim();
    final parts = [
      if (_filterDistrict != null && _filterDistrict!.trim().isNotEmpty)
        _filterDistrict!.trim(),
      if (state != null && state.isNotEmpty) state,
      'India',
    ];

    if (_filterDistrict == null || _filterDistrict!.trim().isEmpty) {
      if (!mounted) return;
      setState(() {
        _mapCenter = _defaultMapCenter;
        _mapZoom = 5.5;
      });
      return;
    }

    try {
      final results = await LocationSearchService.search(parts.join(', '));
      if (!mounted || results.isEmpty) return;
      final zoom = _filterDistrict != null && _filterDistrict!.trim().isNotEmpty
          ? 11.5
          : 7.0;
      _moveMap(results.first.point, zoom: zoom);
    } catch (_) {
      // Keep the current camera position if region lookup fails.
    }
  }

  void _openSourcesSheet(List<WaterSource> sources) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _SourcesListSheet(
        sources: sources,
        title: _filterDistrict != null && _filterDistrict!.isNotEmpty
            ? 'Sources in $_filterDistrict'
            : 'All sources',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthController>();
    final canManageSources = auth.canManageSources;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Shrot"),
        actions: [
          Consumer<AuthController>(
            builder: (context, auth, _) {
              final u = auth.user;
              if (u != null && u.state.isNotEmpty && u.district.isNotEmpty) {
                return Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 140),
                      child: Text(
                        '${u.district}, ${u.state}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.75,
                          ),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                      ),
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          IconButton(
            onPressed: () => context.read<WaterSourceController>().loadSources(
              district: _filterDistrict,
            ),
            icon: const Icon(Icons.refresh_rounded),
          ),
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'logout') {
                context.read<AuthController>().logout();
              } else if (value == 'permissions') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ManagePermissionsScreen(),
                  ),
                );
              } else if (value == 'region') {
                final updated = await Navigator.push<bool>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const RegionSelectionScreen(canPop: true),
                  ),
                );
                if (updated == true && context.mounted) {
                  setState(() {
                    _searchController.clear();
                    _searchResults = [];
                    _searchError = null;
                    _searchedPoint = null;
                  });
                  _applyUserRegionAndMove();
                }
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'region',
                child: Text('Change region'),
              ),
              if (auth.isGovernment)
                const PopupMenuItem(
                  value: 'permissions',
                  child: Text('Manage permissions'),
                ),
              const PopupMenuItem(value: 'logout', child: Text('Sign out')),
            ],
          ),
        ],
      ),
      body: Consumer<WaterSourceController>(
        builder: (context, controller, _) {
          return Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _mapCenter,
                    initialZoom: _mapZoom,
                    minZoom: 3,
                    maxZoom: 18,
                    onPositionChanged: (camera, _) {
                      _mapCenter = camera.center;
                      _mapZoom = camera.zoom;
                    },
                    onTap: (_, point) {
                      if (canManageSources) {
                        controller.selectPoint(point);
                      }
                    },
                    onLongPress: (_, point) {
                      if (!canManageSources) return;
                      controller.selectPoint(point);
                      _openAddScreen(point);
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.appv1',
                    ),
                    MarkerLayer(
                      markers: _buildMapMarkers(controller, canManageSources),
                    ),
                  ],
                ),
              ),
              Positioned(
                right: 12,
                bottom: 18,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 5,
                    ),
                    child: Text(
                      '© OpenStreetMap contributors',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.72,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 12,
                top: 92,
                child: Column(
                  children: [
                    _MapControlButton(
                      icon: Icons.add_rounded,
                      tooltip: 'Zoom in',
                      onPressed: () => _moveMap(_mapCenter, zoom: _mapZoom + 1),
                    ),
                    const SizedBox(height: 8),
                    _MapControlButton(
                      icon: Icons.remove_rounded,
                      tooltip: 'Zoom out',
                      onPressed: () => _moveMap(_mapCenter, zoom: _mapZoom - 1),
                    ),
                  ],
                ),
              ),
              if (controller.isLoading)
                const Positioned(
                  top: 92,
                  left: 16,
                  right: 16,
                  child: LinearProgressIndicator(),
                ),
              if (controller.errorMessage != null)
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 90,
                  child: Card(
                    color: Colors.red.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Text(
                        controller.errorMessage!,
                        style: TextStyle(color: Colors.red.shade800),
                      ),
                    ),
                  ),
                ),
              Positioned(
                top: 92,
                left: 12,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: controller.sources.isEmpty
                        ? null
                        : () => _openSourcesSheet(controller.sources),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.water_drop_rounded,
                              color: theme.colorScheme.primary,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "${controller.sources.length} sources",
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 12,
                left: 12,
                right: 12,
                child: _LocationSearchBox(
                  controller: _searchController,
                  focusNode: _searchFocus,
                  results: _searchResults,
                  error: _searchError,
                  isLoading: _searching,
                  onSearch: _searchLocation,
                  onSelected: _selectSearchResult,
                  onClear: () {
                    final user = context.read<AuthController>().user;
                    setState(() {
                      _searchController.clear();
                      _searchResults = [];
                      _searchError = null;
                      _searchedPoint = null;
                    });
                    _applySourceFilter(district: user?.district.trim());
                    _moveToActiveRegion();
                  },
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: canManageSources
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.small(
                  heroTag: 'add-at-pin',
                  onPressed: () => _openAddScreen(),
                  tooltip: 'Add at selected pin',
                  child: const Icon(Icons.add_location_alt_rounded),
                ),
                const SizedBox(height: 10),
                FloatingActionButton(
                  heroTag: 'add-manual',
                  onPressed: () => _openAddScreen(),
                  tooltip: 'Add source',
                  child: const Icon(Icons.add_rounded),
                ),
              ],
            )
          : null,
    );
  }
}

class _MapControlButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;

  const _MapControlButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.surface.withValues(alpha: 0.94),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: IconButton(
        tooltip: tooltip,
        onPressed: onPressed,
        icon: Icon(icon),
      ),
    );
  }
}

class _SourcesListSheet extends StatelessWidget {
  final List<WaterSource> sources;
  final String title;

  const _SourcesListSheet({required this.sources, required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.black12,
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${sources.length} source${sources.length == 1 ? '' : 's'}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 14),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: sources.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final source = sources[index];
                    final details = source.detailFields().entries.toList();
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F9FF),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            source.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 10),
                          ...details.map(
                            (entry) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    width: 118,
                                    child: Text(
                                      entry.key,
                                      style: TextStyle(
                                        color: Colors.grey.shade700,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      entry.value,
                                      textAlign: TextAlign.end,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationSearchBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final List<LocationSearchResult> results;
  final String? error;
  final bool isLoading;
  final VoidCallback onSearch;
  final ValueChanged<LocationSearchResult> onSelected;
  final VoidCallback onClear;

  const _LocationSearchBox({
    required this.controller,
    required this.focusNode,
    required this.results,
    required this.error,
    required this.isLoading,
    required this.onSearch,
    required this.onSelected,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: Card(
        margin: EdgeInsets.zero,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: controller,
              focusNode: focusNode,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => onSearch(),
              decoration: InputDecoration(
                hintText: 'Search location',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (controller.text.isNotEmpty)
                      IconButton(
                        tooltip: 'Clear',
                        onPressed: onClear,
                        icon: const Icon(Icons.close_rounded),
                      ),
                    IconButton(
                      tooltip: 'Search',
                      onPressed: isLoading ? null : onSearch,
                      icon: isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.arrow_forward_rounded),
                    ),
                  ],
                ),
              ),
            ),
            if (error != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    error!,
                    style: TextStyle(color: theme.colorScheme.error),
                  ),
                ),
              ),
            if (results.isNotEmpty)
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 240),
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.only(bottom: 8),
                  itemCount: results.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final result = results[index];
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.place_outlined),
                      title: Text(
                        result.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () => onSelected(result),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
