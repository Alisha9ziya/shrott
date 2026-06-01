import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../controllers/auth_controller.dart';
import '../../data/india_districts.dart';
import '../../data/indian_states.dart';
import '../../services/location_search_service.dart';

class RegionSelectionScreen extends StatefulWidget {
  final bool canPop;

  const RegionSelectionScreen({super.key, this.canPop = false});

  @override
  State<RegionSelectionScreen> createState() => _RegionSelectionScreenState();
}

class _RegionSelectionScreenState extends State<RegionSelectionScreen> {
  String? _state;
  final _districtManual = TextEditingController();
  final _districtFocus = FocusNode();
  bool _submitting = false;
  bool _locationLoading = false;
  bool _autoLocationTried = false;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthController>().user;
    if (user != null) {
      _state = user.state.trim().isEmpty ? null : user.state;
      _districtManual.text = user.district;
    }
    if (!widget.canPop &&
        (_state == null || _districtManual.text.trim().isEmpty)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _useCurrentLocation(automatic: true);
      });
    }
  }

  @override
  void dispose() {
    _districtManual.dispose();
    _districtFocus.dispose();
    super.dispose();
  }

  List<String> get _districtSuggestions =>
      _state == null ? const [] : districtsForState(_state!);

  Future<void> _continue() async {
    final state = _state?.trim();
    final district = _districtManual.text.trim();
    if (state == null || state.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a state or union territory')),
      );
      return;
    }
    if (!isValidIndianState(state)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Invalid state selection')));
      return;
    }
    if (district.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Enter your district')));
      return;
    }

    await _saveRegion(state, district);
  }

  Future<void> _saveRegion(String state, String district) async {
    setState(() => _submitting = true);
    final auth = context.read<AuthController>();
    auth.clearError();
    final ok = await auth.saveRegion(state, district);
    if (!mounted) return;
    setState(() => _submitting = false);
    if (!ok && auth.errorMessage != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(auth.errorMessage!)));
    } else if (ok && widget.canPop) {
      Navigator.pop(context, true);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Region updated')));
    }
  }

  Future<void> _useCurrentLocation({bool automatic = false}) async {
    if (_locationLoading) return;
    if (automatic && _autoLocationTried) return;
    _autoLocationTried = true;

    setState(() {
      _locationLoading = true;
      _locationError = null;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Turn on device location to detect your region');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission was denied');
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Enable location permission from system settings');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 15),
        ),
      );
      final result = await LocationSearchService.reverse(
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (!mounted) return;
      final state = _normaliseIndianState(result?.state);
      final district = result?.district?.trim();
      if (state == null || district == null || district.isEmpty) {
        throw Exception('Could not identify your district from this location');
      }

      setState(() {
        _state = state;
        _districtManual.text = district;
      });
      await _saveRegion(state, district);
    } catch (e) {
      if (!mounted) return;
      final message = _cleanError(e);
      setState(() => _locationError = message);
      if (!automatic) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } finally {
      if (mounted) {
        setState(() => _locationLoading = false);
      }
    }
  }

  String? _normaliseIndianState(String? raw) {
    final value = raw?.trim();
    if (value == null || value.isEmpty) return null;

    final lower = value.toLowerCase();
    if (lower.contains('delhi')) return 'Delhi';
    if (lower == 'orissa') return 'Odisha';

    for (final state in kIndianStatesAndUTs) {
      if (state.toLowerCase() == lower) return state;
    }
    return null;
  }

  String _cleanError(Object error) {
    final text = error.toString();
    return text.startsWith('Exception: ') ? text.substring(11) : text;
  }

  Future<void> _pickState() async {
    final controller = TextEditingController();
    String query = '';
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = kIndianStatesAndUTs
                .where((s) => s.toLowerCase().contains(query.toLowerCase()))
                .toList();
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 12,
                bottom: MediaQuery.viewInsetsOf(context).bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.black12,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  Text(
                    'Select state / UT',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: controller,
                    decoration: InputDecoration(
                      hintText: 'Search',
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      fillColor: const Color(0xFFF0F9FF),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (v) => setModalState(() => query = v),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.5,
                    child: ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, i) {
                        final s = filtered[i];
                        return ListTile(
                          title: Text(s),
                          onTap: () => Navigator.pop(ctx, s),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
    if (picked != null) {
      setState(() {
        _state = picked;
        _districtManual.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final suggestions = _districtSuggestions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your region'),
        actions: [
          if (!widget.canPop)
            TextButton(
              onPressed: () => context.read<AuthController>().logout(),
              child: const Text('Sign out'),
            ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          children: [
            const SizedBox(height: 8),
            Text(
              'Where are you working?',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'We use this to personalise your map context. You can change it from the app menu whenever needed.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade700,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: _locationLoading || _submitting
                  ? null
                  : () => _useCurrentLocation(),
              icon: _locationLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.my_location_rounded),
              label: Text(
                _locationLoading
                    ? 'Detecting location...'
                    : 'Use current location',
              ),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            if (_locationError != null) ...[
              const SizedBox(height: 10),
              Text(
                _locationError!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ],
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: scheme.primaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.public_rounded,
                            color: scheme.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'State or union territory',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _pickState,
                      icon: const Icon(Icons.expand_more_rounded),
                      label: Text(
                        _state ?? 'Tap to choose',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: _state == null
                              ? Colors.grey.shade600
                              : scheme.onSurface,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 18,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: scheme.secondaryContainer,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.map_rounded,
                            color: scheme.secondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'District',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _districtManual,
                      focusNode: _districtFocus,
                      decoration: InputDecoration(
                        hintText: suggestions.isEmpty
                            ? 'District name'
                            : 'Type or pick a suggestion below',
                        prefixIcon: const Icon(Icons.location_on_outlined),
                      ),
                    ),
                    if (suggestions.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Suggestions',
                          style: theme.textTheme.labelLarge?.copyWith(
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: suggestions
                            .take(12)
                            .map(
                              (d) => ActionChip(
                                label: Text(d),
                                onPressed: () {
                                  setState(() {
                                    _districtManual.text = d;
                                  });
                                },
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    if (suggestions.isEmpty && _state != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Type your district name. We will add more suggestions for this state soon.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submitting ? null : _continue,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(widget.canPop ? 'Save region' : 'Continue to map'),
            ),
          ],
        ),
      ),
    );
  }
}
