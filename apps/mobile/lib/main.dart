import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'https://afghan-it.vercel.app/api/v1');

class AcademyStore {
  AcademyStore(this.preferences);
  final SharedPreferences preferences;
  static const catalogKey = 'catalog';
  static const queueKey = 'progress_queue';

  List<dynamic> cachedCourses() => jsonDecode(preferences.getString(catalogKey) ?? '[]') as List<dynamic>;
  Future<void> cacheCourses(List<dynamic> value) => preferences.setString(catalogKey, jsonEncode(value));
  Future<void> queueProgress(String lessonId) async {
    final queue = [...(jsonDecode(preferences.getString(queueKey) ?? '[]') as List<dynamic>), {'lessonId': lessonId, 'percent': 100}];
    await preferences.setString(queueKey, jsonEncode(queue));
  }
  Future<void> clearQueue() => preferences.remove(queueKey);
}

class AcademyApi {
  AcademyApi(this.store);
  final AcademyStore store;
  Future<List<dynamic>> courses() async {
    try {
      final response = await http.get(Uri.parse('$apiBase/courses')).timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) throw Exception('catalog unavailable');
      final data = jsonDecode(response.body) as List<dynamic>;
      await store.cacheCourses(data);
      return data;
    } catch (_) {
      return store.cachedCourses();
    }
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  runApp(AfghanAcademy(api: AcademyApi(AcademyStore(preferences))));
}

class AfghanAcademy extends StatelessWidget {
  const AfghanAcademy({super.key, required this.api});
  final AcademyApi api;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Afghan IT Academy',
        theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff246baf)), useMaterial3: true),
        home: CatalogPage(api: api),
      );
}

class CatalogPage extends StatelessWidget {
  const CatalogPage({super.key, required this.api});
  final AcademyApi api;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Afghan IT Academy')),
        body: FutureBuilder<List<dynamic>>(
          future: api.courses(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            if (snapshot.data!.isEmpty) return const Center(child: Text('Connect once to download the course catalog.'));
            return RefreshIndicator(
              onRefresh: api.courses,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  final course = snapshot.data![index] as Map<String, dynamic>;
                  return Card(child: ListTile(title: Text(course['title'] as String? ?? 'Course'), subtitle: Text('${course['category']} · ${course['level']}'), trailing: const Icon(Icons.chevron_right)));
                },
              ),
            );
          },
        ),
      );
}
