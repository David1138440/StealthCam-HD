# StealthCam HD - Native Android Application (Kotlin & Android SDK)

Esta es la versión nativa para Android construida con **Kotlin**, **Jetpack Compose**, **CameraX** y **Android SDK 34**.

## Arquitectura del Proyecto

- **Lenguaje:** Kotlin 2.0+
- **Interfaz de Usuario:** Jetpack Compose (Material 3)
- **Motor de Cámara:** AndroidX CameraX (`camera-video`, `camera-camera2`, `camera-lifecycle`)
- **Procesamiento en Vivo:** ImageAnalysis con submuestreo de luminancia para detección de movimiento sigilosa
- **Almacenamiento:** Directorio privado de la aplicación con soporte para compartir seguro vía `FileProvider`

## Estructura de Archivos

```
android/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts
    └── src/
        └── main/
            ├── AndroidManifest.xml
            ├── java/com/stealthcam/app/
            │   ├── MainActivity.kt
            │   ├── camera/
            │   │   └── CameraManager.kt
            │   ├── detection/
            │   │   └── MotionDetector.kt
            │   └── ui/
            │       ├── StealthCamScreen.kt
            │       └── theme/
            │           ├── Color.kt
            │           └── Theme.kt
            └── res/
                ├── values/
                │   ├── colors.xml
                │   ├── strings.xml
                │   └── themes.xml
                └── xml/
                    ├── backup_rules.xml
                    └── data_extraction_rules.xml
```

## Cómo compilar y ejecutar en Android Studio

1. Abre **Android Studio** (Hedgehog, Iguana, Koala o superior).
2. Selecciona **File -> Open...** y elige la carpeta `android/`.
3. Espera a que Gradle sincronice las dependencias (`ProcessCameraProvider`, `Compose BOM 2024.06.00`).
4. Conecta tu dispositivo Android (o inicia un emulador con cámara virtual habilitada).
5. Haz clic en **Run 'app'** (`Shift + F10`) o compila el APK con:
   ```bash
   ./gradlew assembleDebug
   ```
6. El archivo APK generado estará en: `app/build/outputs/apk/debug/app-debug.apk`.
