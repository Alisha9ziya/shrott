import 'package:flutter/material.dart';
import '../models/water_source.dart';

class WaterDetailsSheet extends StatelessWidget {
  final WaterSource source;
  const WaterDetailsSheet({required this.source, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              source.name,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            ...source.detailFields().entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text("${entry.key}: ${entry.value}"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}