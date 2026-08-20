import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
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
  Future<File> saveVideo(String url, String name) async {
    final directory = await getApplicationDocumentsDirectory();
    final safeName = name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    final file = File('${directory.path}/$safeName.mp4');
    final response = await http.get(Uri.parse(url));
    if (response.statusCode != 200) throw Exception('video download failed');
    return file.writeAsBytes(response.bodyBytes, flush: true);
  }
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
  Future<Map<String, dynamic>> course(String id) async => jsonDecode((await http.get(Uri.parse('$apiBase/courses/$id'))).body) as Map<String, dynamic>;
  Future<File> downloadVideo(String url, String lessonId) => store.saveVideo(url, lessonId);
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
                  return Card(child: ListTile(onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CoursePage(api: api, course: course))), title: Text(course['title'] as String? ?? 'Course'), subtitle: Text('${course['category']} · ${course['level']}'), trailing: const Icon(Icons.chevron_right)));
                },
              ),
            );
          },
        ),
      );
}

class CoursePage extends StatelessWidget {
  const CoursePage({super.key, required this.api, required this.course});
  final AcademyApi api;
  final Map<String, dynamic> course;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(course['title'] as String? ?? 'Course')),
        body: FutureBuilder<Map<String, dynamic>>(
          future: api.course(course['id'] as String),
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            final modules = snapshot.data!['modules'] as List<dynamic>? ?? [];
            return ListView(padding: const EdgeInsets.all(16), children: [
              Text(snapshot.data!['description'] as String? ?? '', style: Theme.of(context).textTheme.bodyLarge),
              for (final module in modules) ...[
                const SizedBox(height: 16),
                Text((module as Map<String, dynamic>)['title'] as String? ?? 'Module', style: Theme.of(context).textTheme.titleLarge),
                for (final lesson in (module['lessons'] as List<dynamic>? ?? [])) Builder(builder: (context) {
                  final item = lesson as Map<String, dynamic>;
                  final mediaUrl = item['mediaUrl'] as String?;
                  return ListTile(title: Text(item['title'] as String? ?? 'Lesson'), subtitle: Text('${item['type']} · ${item['durationMinutes']} min'), trailing: mediaUrl == null ? null : IconButton(icon: const Icon(Icons.download), tooltip: 'Save video offline', onPressed: () async { await api.downloadVideo(mediaUrl, item['id'] as String); if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Video saved for offline viewing.'))); }));
                }),
              ],
            ]);
          },
        ),
      );
}
