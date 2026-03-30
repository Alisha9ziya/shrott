import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../controllers/water_source_controller.dart';
import '../widgets/water_marker.dart';
import 'add_source_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WaterSourceController>().loadSources();
    });
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Water Sources Map"),
        actions: [
          IconButton(
            onPressed: () => context.read<WaterSourceController>().loadSources(),
            icon: Icon(Icons.refresh),
          ),
        ],
      ),
      body: Consumer<WaterSourceController>(
        builder: (context, controller, _) {
          return Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(30.3165, 78.0322),
                  initialZoom: 13,
                  onTap: (tapPos, point) => controller.selectPoint(point),
                  onLongPress: (tapPos, point) {
                    controller.selectPoint(point);
                    _openAddScreen(point);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
                    subdomains: ['a', 'b', 'c'],
                    userAgentPackageName: 'com.example.water_map_app',
                  ),
                  MarkerLayer(
                    markers: controller.sources
                        .map((s) => buildWaterMarker(context, s))
                        .toList(),
                  ),
                  if (controller.selectedPoint != null)
                    MarkerLayer(
                      markers: [
                        Marker(
                          width: 50,
                          height: 50,
                          point: controller.selectedPoint!,
                          child: Icon(
                            Icons.location_pin,
                            color: Colors.red,
                            size: 35,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              if (controller.isLoading)
                const Positioned(
                  top: 16,
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
            ],
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.small(
            heroTag: 'add-at-pin',
            onPressed: () => _openAddScreen(),
            child: Icon(Icons.add_location_alt),
          ),
          const SizedBox(height: 10),
          FloatingActionButton(
            heroTag: 'add-manual',
            onPressed: () => _openAddScreen(),
            child: Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
