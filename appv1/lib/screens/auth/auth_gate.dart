import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../controllers/auth_controller.dart';
import '../map_screen.dart';
import '../splash_screen.dart';
import 'login_screen.dart';
import 'region_selection_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthController>().tryRestoreSession();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthController>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return const SplashScreen();
        }
        if (!auth.isLoggedIn) {
          return const LoginScreen();
        }
        if (auth.needsRegionSelection) {
          return const RegionSelectionScreen();
        }
        return const MapScreen();
      },
    );
  }
}
