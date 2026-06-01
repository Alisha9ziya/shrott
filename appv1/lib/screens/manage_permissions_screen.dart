import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../controllers/auth_controller.dart';

class ManagePermissionsScreen extends StatefulWidget {
  const ManagePermissionsScreen({super.key});

  @override
  State<ManagePermissionsScreen> createState() =>
      _ManagePermissionsScreenState();
}

class _ManagePermissionsScreenState extends State<ManagePermissionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthController>().loadManagedUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Permissions')),
      body: Consumer<AuthController>(
        builder: (context, auth, _) {
          if (!auth.isGovernment) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Only government accounts can manage source permissions.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          if (auth.usersLoading && auth.managedUsers.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          if (auth.errorMessage != null && auth.managedUsers.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  auth.errorMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: theme.colorScheme.error),
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: auth.loadManagedUsers,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: auth.managedUsers.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final user = auth.managedUsers[index];
                final isCurrentUser = user.id == auth.user?.id;
                return Card(
                  child: SwitchListTile(
                    value: user.canManageSources,
                    onChanged: user.isGovernment || isCurrentUser
                        ? null
                        : (value) async {
                            final ok = await auth.updateSourcePermission(
                              user.id,
                              value,
                            );
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  ok
                                      ? 'Permission updated'
                                      : auth.errorMessage ??
                                            'Could not update permission',
                                ),
                              ),
                            );
                          },
                    title: Text(
                      user.email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      user.isGovernment
                          ? 'Government account'
                          : user.canManageSources
                          ? 'Can add and edit sources'
                          : 'View-only access',
                    ),
                    secondary: Icon(
                      user.isGovernment
                          ? Icons.account_balance_rounded
                          : Icons.person_outline_rounded,
                      color: user.canManageSources
                          ? theme.colorScheme.primary
                          : Colors.grey.shade600,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
