import 'package:appv1/controllers/water_source_controller.dart';
import 'package:flutter/material.dart';
import 'screens/map_screen.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => WaterSourceController(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Water Mapper',
      home: MapScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}