# Afghan IT Academy mobile

This Flutter client uses the deployed Nest API and keeps the catalog available through `shared_preferences` when connectivity drops. Pass a different API host with `flutter run --dart-define=API_BASE=...`.

Run with Flutter installed:

```sh
flutter pub get
flutter analyze
flutter test
flutter run
```
