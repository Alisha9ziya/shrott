import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../controllers/auth_controller.dart';
import '../controllers/water_source_controller.dart';
import '../models/water_source.dart';

class AddSourceScreen extends StatefulWidget {
  final double? initialLatitude;
  final double? initialLongitude;
  final WaterSource? source;

  const AddSourceScreen({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
    this.source,
  });

  @override
  State<AddSourceScreen> createState() => _AddSourceScreenState();
}

class _AddSourceScreenState extends State<AddSourceScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _latController = TextEditingController();
  final TextEditingController _lngController = TextEditingController();
  final TextEditingController _phController = TextEditingController();
  final TextEditingController _sourceTypeController = TextEditingController(
    text: 'well',
  );
  String _selectedSourceType = 'well';
  final List<String> _sourceTypes = const [
    'well',
    'borewell',
    'river',
    'pond',
    'spring',
    'tap',
  ];
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    final source = widget.source;
    if (source != null) {
      _nameController.text = source.name;
      _latController.text = source.latitude.toStringAsFixed(6);
      _lngController.text = source.longitude.toStringAsFixed(6);
      if (source.ph != null) {
        _phController.text = source.ph!.toString();
      }
      _sourceTypeController.text = source.sourceType ?? 'well';
    } else if (widget.initialLatitude != null) {
      _latController.text = widget.initialLatitude!.toStringAsFixed(6);
    }
    if (source == null && widget.initialLongitude != null) {
      _lngController.text = widget.initialLongitude!.toStringAsFixed(6);
    }
    _selectedSourceType = _sourceTypes.contains(_sourceTypeController.text)
        ? _sourceTypeController.text
        : 'well';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _latController.dispose();
    _lngController.dispose();
    _phController.dispose();
    _sourceTypeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = Provider.of<WaterSourceController>(
      context,
      listen: false,
    );
    final auth = context.watch<AuthController>();
    final theme = Theme.of(context);
    final isEditing = widget.source != null;

    if (!auth.canManageSources || auth.token == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Source Access")),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              "Only government-approved users can add or edit water sources.",
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(isEditing ? "Edit Source" : "Add Source")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              Text(
                isEditing
                    ? "Edit this water source"
                    : "Add a new water source to Shrot",
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                isEditing
                    ? "Update verified source details."
                    : "Use map-picked coordinates or enter manually.",
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: "Source Name",
                        ),
                        validator: (value) =>
                            (value == null || value.trim().isEmpty)
                            ? "Enter source name"
                            : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedSourceType,
                        decoration: const InputDecoration(
                          labelText: "Source Type",
                        ),
                        items: _sourceTypes
                            .map(
                              (type) => DropdownMenuItem(
                                value: type,
                                child: Text(type),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _selectedSourceType = value;
                              _sourceTypeController.text = value;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _latController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: "Latitude",
                          helperText: "Tap map and press + to pre-fill",
                        ),
                        validator: (value) {
                          final parsed = double.tryParse((value ?? '').trim());
                          if (parsed == null) return "Invalid latitude";
                          if (parsed < -90 || parsed > 90) {
                            return "Latitude must be -90 to 90";
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _lngController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: "Longitude",
                        ),
                        validator: (value) {
                          final parsed = double.tryParse((value ?? '').trim());
                          if (parsed == null) return "Invalid longitude";
                          if (parsed < -180 || parsed > 180) {
                            return "Longitude must be -180 to 180";
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _phController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: "pH (optional)",
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () async {
                  if (!_formKey.currentState!.validate()) return;

                  final ph = _phController.text.trim().isEmpty
                      ? null
                      : double.tryParse(_phController.text.trim());
                  final sourceType = _sourceTypeController.text.trim().isEmpty
                      ? 'well'
                      : _sourceTypeController.text.trim();
                  final success = isEditing
                      ? await controller.updateSource(
                          token: auth.token!,
                          id: widget.source!.id,
                          name: _nameController.text,
                          lat: double.parse(_latController.text.trim()),
                          lng: double.parse(_lngController.text.trim()),
                          ph: ph,
                          state: auth.user?.state,
                          district: auth.user?.district,
                          sourceType: sourceType,
                        )
                      : await controller.addSource(
                          token: auth.token!,
                          name: _nameController.text,
                          lat: double.parse(_latController.text.trim()),
                          lng: double.parse(_lngController.text.trim()),
                          ph: ph,
                          state: auth.user?.state,
                          district: auth.user?.district,
                          sourceType: sourceType,
                        );

                  if (!context.mounted) return;

                  if (success) {
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(context);
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text(
                          isEditing
                              ? "Water source updated"
                              : "Water source added",
                        ),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          controller.errorMessage ?? "Failed to save source",
                        ),
                      ),
                    );
                  }
                },
                child: Text(isEditing ? "Update Source" : "Save Source"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
