import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import '../models/water_source.dart';
import 'water_details_sheet.dart';

Widget buildMapPin(
  BuildContext context, {
  required Color color,
  required IconData icon,
  double size = 54,
}) {
  final pinBodySize = size * 0.72;

  return SizedBox(
    width: size,
    height: size,
    child: Stack(
      alignment: Alignment.topCenter,
      children: [
        Positioned(
          bottom: size * 0.04,
          child: Container(
            width: size * 0.34,
            height: size * 0.12,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(999),
            ),
          ),
        ),
        Positioned(
          top: size * 0.26,
          child: Transform.rotate(
            angle: 0.785398,
            child: Container(
              width: pinBodySize,
              height: pinBodySize,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(size * 0.18),
                border: Border.all(color: Colors.white, width: 2.4),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          top: 0,
          child: Container(
            width: pinBodySize,
            height: pinBodySize,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2.8),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.34),
                  blurRadius: 14,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: size * 0.42),
          ),
        ),
      ],
    ),
  );
}

Marker buildWaterMarker(BuildContext context, WaterSource src) {
  return Marker(
    key: ValueKey('source-${src.id}'),
    point: src.point,
    width: 54,
    height: 54,
    alignment: Alignment.topCenter,
    child: GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        builder: (_) => WaterDetailsSheet(source: src),
      ),
      child: buildMapPin(
        context,
        color: Theme.of(context).colorScheme.primary,
        icon: Icons.water_drop_rounded,
      ),
    ),
  );
}
