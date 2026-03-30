import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../controllers/water_source_controller.dart';

class AddSourceScreen extends StatefulWidget {
  final double? initialLatitude;
  final double? initialLongitude;

  const AddSourceScreen({
    super.key,
    this.initialLatitude,
    this.initialLongitude,
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
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    if (widget.initialLatitude != null) {
      _latController.text = widget.initialLatitude!.toStringAsFixed(6);
    }
    if (widget.initialLongitude != null) {
      _lngController.text = widget.initialLongitude!.toStringAsFixed(6);
    }
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
    final controller = Provider.of<WaterSourceController>(context, listen: false);

    return Scaffold(
      appBar: AppBar(title: Text("Add Water Source")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: "Source Name"),
                validator: (value) => (value == null || value.trim().isEmpty)
                    ? "Enter source name"
                    : null,
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _latController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: InputDecoration(
                  labelText: "Latitude",
                  helperText: "Enter manually or tap map then use Add button",
                ),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').trim());
                  if (parsed == null) return "Invalid latitude";
                  if (parsed < -90 || parsed > 90) return "Latitude must be -90 to 90";
                  return null;
                },
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _lngController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: InputDecoration(labelText: "Longitude"),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').trim());
                  if (parsed == null) return "Invalid longitude";
                  if (parsed < -180 || parsed > 180) {
                    return "Longitude must be -180 to 180";
                  }
                  return null;
                },
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _sourceTypeController,
                decoration: InputDecoration(labelText: "Source Type"),
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _phController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: "pH (optional)",
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  if (!_formKey.currentState!.validate()) return;

                  final success = await controller.addSource(
                    name: _nameController.text,
                    lat: double.parse(_latController.text.trim()),
                    lng: double.parse(_lngController.text.trim()),
                    ph: _phController.text.trim().isEmpty
                        ? null
                        : double.tryParse(_phController.text.trim()),
                    sourceType: _sourceTypeController.text.trim().isEmpty
                        ? 'well'
                        : _sourceTypeController.text.trim(),
                  );

                  if (!context.mounted) return;

                  if (success) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text("Water source added")),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(controller.errorMessage ?? "Failed to add source"),
                      ),
                    );
                  }
                },
                child: Text("Save"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}