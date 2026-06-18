import { AppCustomizerOptions, AndroidFile } from '../types';

export function getAndroidProjectFiles(options: AppCustomizerOptions): AndroidFile[] {
  const {
    appName,
    packageName,
    primaryColor,
    backgroundColor,
    targetUrl,
    versionCode,
    versionName,
    orientation,
    keepScreenOn,
    cleartextTraffic
  } = options;

  // Derive folder path parts from package name (e.g. "com.apex.tv" -> "com/apex/tv")
  const packagePath = packageName.replace(/\./g, '/');

  const files: AndroidFile[] = [];

  // Helper to shorten file paths
  const addFile = (path: string, lang: AndroidFile['language'], desc: string, content: string) => {
    files.push({ path, language: lang, description: desc, content: content.trim() });
  };

  // 1. settings.gradle.kts
  addFile(
    'settings.gradle.kts',
    'kotlin',
    'Configurations au niveau du projet et référentiels de plugins.',
    `
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${appName}"
include(":app")
`
  );

  // 2. build.gradle.kts (root)
  addFile(
    'build.gradle.kts',
    'kotlin',
    'Fichier de build de premier niveau pour spécifier les versions des plugins Gradle.',
    `
// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`
  );

  // 3. gradle.properties
  addFile(
    'gradle.properties',
    'properties',
    'Paramètres globaux de compilation Gradle et JVM.',
    `
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  // 4. gradle-wrapper.properties
  addFile(
    'gradle/wrapper/gradle-wrapper.properties',
    'properties',
    'Spécifie la version exacte de Gradle à télécharger et utiliser.',
    `
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // 5. app/build.gradle.kts
  addFile(
    'app/build.gradle.kts',
    'kotlin',
    'Configurations de build pour l\'application : SDK, minSdk, dépendances et options Kotlin.',
    `
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = 21
        targetSdk = 34
        versionCode = ${versionCode}
        versionName = "${versionName}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.core:core-splashscreen:1.0.1")

    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
`
  );

  // 6. app/proguard-rules.pro
  addFile(
    'app/proguard-rules.pro',
    'proguard',
    'Protection et configuration de l\'obfuscation du code source de la WebView.',
    `
# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# WebView
-keep class ${packageName}.webview.** { *; }
`
  );

  // 7. AndroidManifest.xml
  addFile(
    'app/src/main/AndroidManifest.xml',
    'xml',
    'manifeste essentiel décrivant les autorisations (Internet) et les activités TV de l\'app.',
    `
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- Android TV : pas besoin d'écran tactile -->
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <!-- Android TV : déclarer le support Leanback -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="true" />

    <application
        android:name=".ApexApplication"
        android:allowBackup="true"
        android:banner="@drawable/tv_banner"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:networkSecurityConfig="@xml/network_security_config"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ApexTV"
        android:usesCleartextTraffic="${cleartextTraffic}"
        tools:targetApi="31">

        <!-- SplashActivity : entry point -->
        <activity
            android:name=".SplashActivity"
            android:exported="true"
            android:theme="@style/Theme.ApexTV.Splash">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- MainActivity : activité principale avec WebView -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden|uiMode|smallestScreenSize|screenLayout"
            android:exported="false"
            android:launchMode="singleTask"
            android:screenOrientation="${orientation}"
            android:theme="@style/Theme.ApexTV" />

    </application>

</manifest>
`
  );

  // 8. ApexApplication.kt
  addFile(
    `app/src/main/java/${packagePath}/ApexApplication.kt`,
    'kotlin',
    'Classe d\'Application personnalisée servant à initialiser les configurations globales.',
    `
package ${packageName}

import android.app.Application

/**
 * Classe Application d'${appName}.
 */
class ApexApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
`
  );

  // 9. SplashActivity.kt
  addFile(
    `app/src/main/java/${packagePath}/SplashActivity.kt`,
    'kotlin',
    'Activité de démarrage avec délai d\'attente avant d\'ouvrir l\'interface TV / Player.',
    `
package ${packageName}

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

/**
 * Écran de démarrage (splash screen) d'${appName}.
 * Affiche le logo pendant ~2 secondes avant de lancer MainActivity.
 */
class SplashActivity : AppCompatActivity() {

    companion object {
        private const val SPLASH_DURATION_MS = 2000L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        splashScreen.setKeepOnScreenCondition { false }

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, SPLASH_DURATION_MS)
    }
}
`
  );

  // 10. MainActivity.kt
  addFile(
    `app/src/main/java/${packagePath}/MainActivity.kt`,
    'kotlin',
    'Activité de la WebView principale. Gère le plein écran vidéo, l\'affichage, et la navigation TV.',
    `
package ${packageName}

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import ${packageName}.webview.AppWebView
import ${packageName}.webview.AppWebChromeClient
import ${packageName}.webview.AppWebViewClient

/**
 * Activité principale d'${appName}.
 * Affiche le site ${targetUrl} dans un WebView plein écran.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        // URL à charger au démarrage. Modifiez ici si besoin.
        private const val TARGET_URL = "${targetUrl}"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: View
    private lateinit var customViewContainer: FrameLayout
    private var customView: View? = null
    private var customViewCallback: android.webkit.WebChromeClient.CustomViewCallback? = null
    private var originalOrientation: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configuration plein écran / immersive
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ${keepScreenOn ? 'window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)' : ''}

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)
        customViewContainer = findViewById(R.id.customViewContainer)

        // Bouton "Réessayer" sur l'écran d'erreur
        findViewById<TextView>(R.id.btnRetry).setOnClickListener {
            errorLayout.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.reload()
        }

        // Configurer et charger le WebView
        setupWebView()
        webView.loadUrl(TARGET_URL)
    }

    /**
     * Configuration complète du WebView :
     * - JavaScript activé
     * - DOM storage activé
     * - Mixed content autorisé (flux TV HTTP/HTTPS)
     * - User-Agent Smart-TV (pour avoir la meilleure interface)
     * - Gère le plein écran de la vidéo HTML5
     * - Ouvre les liens externes dans le navigateur système
     */
    private fun setupWebView() {
        AppWebView.configure(
            context = this,
            webView = webView,
            progressBar = progressBar,
            errorLayout = errorLayout,
            webViewClient = AppWebViewClient(
                onError = { showError() },
                onPageStarted = { progressBar.visibility = View.VISIBLE },
                onPageFinished = { progressBar.visibility = View.GONE },
                shouldOverrideUrl = { url ->
                    // Liens externes : ouvrir dans le navigateur système
                    if (!url.contains("vavoo.to") && (url.startsWith("http://") || url.startsWith("https://"))) {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                            true
                        } catch (e: Exception) {
                            false
                        }
                    } else {
                        false
                    }
                }
            ),
            webChromeClient = AppWebChromeClient(
                onProgressChanged = { progress ->
                    progressBar.progress = progress
                    if (progress >= 100) progressBar.visibility = View.GONE
                },
                onShowCustomView = { view, callback -> enterFullscreenVideo(view, callback) },
                onHideCustomView = { exitFullscreenVideo() }
            )
        )
    }

    private fun enterFullscreenVideo(view: View?, callback: android.webkit.WebChromeClient.CustomViewCallback?) {
        if (view == null) return
        customView = view
        customViewCallback = callback
        originalOrientation = requestedOrientation

        // Cacher les barres système
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        // Ajouter la vue à plein écran
        customViewContainer.visibility = View.VISIBLE
        customViewContainer.addView(
            view,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
    }

    private fun exitFullscreenVideo() {
        WindowInsetsControllerCompat(window, window.decorView)
            .show(WindowInsetsCompat.Type.systemBars())
        if (customView != null) {
            customViewContainer.removeView(customView)
            customView = null
        }
        customViewContainer.visibility = View.GONE
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
        requestedOrientation = originalOrientation
    }

    private fun showError() {
        webView.visibility = View.GONE
        progressBar.visibility = View.GONE
        errorLayout.visibility = View.VISIBLE
    }

    /**
     * Gestion du bouton Retour (télécommande TV ou bouton retour physique mobile).
     */
    @Suppress("DEPRECATION")
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        when {
            customView != null -> exitFullscreenVideo()
            webView.canGoBack() -> webView.goBack()
            else -> {
                AlertDialog.Builder(this)
                    .setTitle(R.string.exit_title)
                    .setMessage(R.string.exit_message)
                    .setPositiveButton(R.string.exit_yes) { _, _ -> finish() }
                    .setNegativeButton(R.string.exit_no, null)
                    .show()
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER -> {
                webView.requestFocus()
                false
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
`
  );

  // 11. AppWebView.kt
  addFile(
    `app/src/main/java/${packagePath}/webview/AppWebView.kt`,
    'kotlin',
    'Configuration technique détaillée de la WebView (User Agent smart TV, DOM, accélération matérielle, etc.).',
    `
package ${packageName}.webview

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.ProgressBar

/**
 * Configuration complète d'un WebView pour ${appName}.
 */
object AppWebView {

    /**
     * User-Agent de type Desktop/Smart-TV.
     * CRITIQUE : sans cela, certains sites de diffusion affichent des lecteurs inadaptés ou bloqués.
     */
    private const val USER_AGENT =
        "Mozilla/5.0 (Linux; Android 13; SMART-TV) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    @SuppressLint("SetJavaScriptEnabled")
    fun configure(
        context: Context,
        webView: WebView,
        progressBar: ProgressBar,
        errorLayout: View,
        webViewClient: AppWebViewClient,
        webChromeClient: WebChromeClient
    ) {
        val settings: WebSettings = webView.settings

        // JavaScript & stockage
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // User-Agent Smart-TV
        settings.userAgentString = USER_AGENT

        // Accès fichiers & contenu
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true

        // Mixed content : OBLIGATOIRE car les flux TV de live streaming mixent HTTP et HTTPS
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Lecture automatique des vidéos (évite d'avoir à appuyer pour lancer sur TV)
        settings.mediaPlaybackRequiresUserGesture = false

        // Zoom & affichage
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.supportMultipleWindows = true

        // Activer la conservation des sessions et cookies tierces
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Affectation des clients
        webView.webViewClient = webViewClient
        webView.webChromeClient = webChromeClient

        // Activer la puissance matérielle (indispensable à la fluidité du flux 1080p/4K)
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // Configuration indispensable de la navigation TV (D-Pad télécommande)
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true
        webView.requestFocus(View.FOCUS_DOWN)
    }
}
`
  );

  // 12. AppWebViewClient.kt
  addFile(
    `app/src/main/java/${packagePath}/webview/AppWebViewClient.kt`,
    'kotlin',
    'Gestionnaire de navigation web : gestion des erreurs réseau / SSL et ouvertures système.',
    `
package ${packageName}.webview

import android.graphics.Bitmap
import android.net.http.SslError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.View

/**
 * WebViewClient personnalisé pour ${appName}.
 * - Gère les redirections vers le navigateur externe.
 * - Tolère les certificats SSL auto-signés très courants dans les flux IPTV.
 * - Signale les coupures réseau à l'activité pour l'écran de récupération.
 */
class AppWebViewClient(
    private val onError: () -> Unit,
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
    private val shouldOverrideUrl: (String) -> Boolean
) : WebViewClient() {

    @Suppress("DEPRECATION")
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        if (url == null) return false
        return shouldOverrideUrl(url)
    }

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val url = request?.url?.toString() ?: return false
        return shouldOverrideUrl(url)
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        onPageStarted()
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        onPageFinished()
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: android.webkit.WebResourceError?
    ) {
        super.onReceivedError(view, request, error)
        if (request?.isForMainFrame == true) {
            onError()
        }
    }

    @Suppress("DEPRECATION")
    override fun onReceivedError(
        view: WebView?,
        errorCode: Int,
        description: String?,
        failingUrl: String?
    ) {
        super.onReceivedError(view, errorCode, description, failingUrl)
        onError()
    }

    @Suppress("DEPRECATION")
    override fun onReceivedSslError(
        view: WebView?,
        handler: android.webkit.SslErrorHandler?,
        error: SslError?
    ) {
        // Procéder malgré les erreurs de certificats (crucial pour l'IPTV et les serveurs d'antenne locaux)
        handler?.proceed()
    }
}
`
  );

  // 13. AppWebChromeClient.kt
  addFile(
    `app/src/main/java/${packagePath}/webview/AppWebChromeClient.kt`,
    'kotlin',
    'Permet au site de diffuser en plein écran natif de l\'appareil en capturant le CustomView.',
    `
package ${packageName}.webview

import android.net.Uri
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebView

/**
 * WebChromeClient personnalisé d'${appName}.
 * - Synchronise la barre de progression de chargement.
 * - Ouvre l'espace HTML5 Fullscreen natif lors de la lecture d'un flux d'IPTV.
 */
class AppWebChromeClient(
    private val onProgressChanged: (Int) -> Unit,
    private val onShowCustomView: (View?, WebChromeClient.CustomViewCallback?) -> Unit,
    private val onHideCustomView: () -> Unit
) : WebChromeClient() {

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        onProgressChanged(newProgress)
    }

    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
        onShowCustomView(view, callback)
    }

    override fun onHideCustomView() {
        onHideCustomView()
    }

    override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: android.webkit.ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
    ): Boolean {
        return super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        return super.onConsoleMessage(consoleMessage)
    }
}
`
  );

  // 14. colors.xml
  addFile(
    'app/src/main/res/values/colors.xml',
    'xml',
    'Fichier de définition des codes couleurs du design de l\'app.',
    `
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Couleurs personnalisées ${appName} -->
    <color name="black">${backgroundColor}</color>
    <color name="white">#FFFFFF</color>
    <color name="gray">#9ED84F</color>
    <color name="apex_green">${primaryColor}</color>
    <color name="apex_green_dark">#121d05</color>
    <color name="apex_green_glow">${primaryColor}cc</color>
    <color name="apex_dark">#050505</color>
    <color name="apex_accent">${primaryColor}</color>

    <!-- Rétro-compatibilité -->
    <color name="apex_red">${primaryColor}</color>
</resources>
`
  );

  // 15. strings.xml
  addFile(
    'app/src/main/res/values/strings.xml',
    'xml',
    'Fichier des chaînes textuelles (Français standard) éditables de l\'application.',
    `
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
    <string name="error_title">Connexion impossible</string>
    <string name="error_message">Vérifiez votre connexion Internet ou la validité de l\'adresse de streaming, puis réessayez.</string>
    <string name="retry">Réessayer</string>
    <string name="exit_title">Quitter ${appName} ?</string>
    <string name="exit_message">Êtes-vous sûr de vouloir fermer l\'application ?</string>
    <string name="exit_yes">Quitter</string>
    <string name="exit_no">Annuler</string>
</resources>
`
  );

  // 16. themes.xml
  addFile(
    'app/src/main/res/values/themes.xml',
    'xml',
    'Thème graphique de l\'application gérant les interfaces sombres et le splash screen moderne.',
    `
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">

    <!-- Thème principal somptueux vert fluo sur fond sombre -->
    <style name="Theme.ApexTV" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/apex_green</item>
        <item name="colorPrimaryVariant">@color/apex_green</item>
        <item name="colorOnPrimary">@color/black</item>
        <item name="android:statusBarColor">@color/black</item>
        <item name="android:navigationBarColor">@color/black</item>
        <item name="android:windowBackground">@drawable/splash_background</item>
        <item name="android:colorBackground">@color/black</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>

    <!-- Thème d\'écran démarrage (Android 12+) -->
    <style name="Theme.ApexTV.Splash" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/black</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/ic_apex_logo_splash</item>
        <item name="postSplashScreenTheme">@style/Theme.ApexTV</item>
    </style>

</resources>
`
  );

  // 17. themes.xml (night)
  addFile(
    'app/src/main/res/values-night/themes.xml',
    'xml',
    'Thème sombre complémentaire d\'APEX TV.',
    `
<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.ApexTV" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/apex_green</item>
        <item name="colorPrimaryVariant">@color/apex_green</item>
        <item name="colorOnPrimary">@color/black</item>
        <item name="android:statusBarColor">@color/black</item>
        <item name="android:navigationBarColor">@color/black</item>
        <item name="android:windowBackground">@drawable/splash_background</item>
        <item name="android:colorBackground">@color/black</item>
    </style>
</resources>
`
  );

  // 18. activity_main.xml
  addFile(
    'app/src/main/res/layout/activity_main.xml',
    'xml',
    'Mise en page plein écran du lecteur WebView, de l\'écran d\'erreur et des repères vidéo.',
    `
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/black"
    tools:context=".MainActivity">

    <!-- WebView principal -->
    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/black" />

    <!-- Conteneur pour le mode plein écran vidéo HTML5 -->
    <FrameLayout
        android:id="@+id/customViewContainer"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/black"
        android:visibility="gone" />

    <!-- Barre de progression horizontale en haut -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:layout_gravity="top"
        android:max="100"
        android:progressTint="@color/apex_green"
        android:visibility="gone" />

    <!-- Écran d\'erreur si url injoignable -->
    <LinearLayout
        android:id="@+id/errorLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/black"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="32dp"
        android:visibility="gone">

        <ImageView
            android:layout_width="80dp"
            android:layout_height="80dp"
            android:contentDescription="@string/error_title"
            android:src="@drawable/ic_error"
            android:tint="@color/apex_green" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:text="@string/error_title"
            android:textColor="@color/white"
            android:textSize="22sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:gravity="center"
            android:text="@string/error_message"
            android:textColor="@color/gray"
            android:textSize="14sp" />

        <TextView
            android:id="@+id/btnRetry"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="32dp"
            android:background="@drawable/bg_button"
            android:focusable="true"
            android:clickable="true"
            android:paddingHorizontal="32dp"
            android:paddingVertical="12dp"
            android:text="@string/retry"
            android:textColor="@color/black"
            android:textSize="14sp"
            android:textStyle="bold" />

    </LinearLayout>

</FrameLayout>
`
  );

  // 19. ic_apex_logo_splash.xml
  addFile(
    'app/src/main/res/drawable/ic_apex_logo_splash.xml',
    'xml',
    'Icône vectorielle stylisée avec le logo A traversé par un éclair pour l\'animation de splash screen.',
    `
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="120dp"
    android:height="120dp"
    android:viewportWidth="120"
    android:viewportHeight="120">

    <!-- Triangle principal du "A" -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M60,15 L30,105 L48,105 L60,75 L72,105 L90,105 Z" />

    <!-- Barre transversale -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M52,80 L68,80 L64,68 L56,68 Z" />

    <!-- Éclair traversant -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M70,30 L55,60 L62,60 L50,95 L75,55 L68,55 L80,30 Z" />

</vector>
`
  );

  // 20. ic_apex_logo_foreground.xml
  addFile(
    'app/src/main/res/drawable/ic_apex_logo_foreground.xml',
    'xml',
    'Icône vectorielle de premier plan servant au lanceur adaptatif Android Oreo+.',
    `
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="120dp"
    android:height="120dp"
    android:viewportWidth="120"
    android:viewportHeight="120">

    <!-- Forme du "A" stylisé - triangle principal -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M30,105 L60,15 L90,105 L75,105 L60,55 L45,105 Z" />

    <!-- Barre transversale du A -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M48,75 L72,75 L68,87 L52,87 Z" />

    <!-- Éclair coupant à travers -->
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M75,40 L55,65 L65,65 L50,90 L80,55 L70,55 L85,40 Z" />

</vector>
`
  );

  // 21. ic_error.xml
  addFile(
    'app/src/main/res/drawable/ic_error.xml',
    'xml',
    'Icône vectorielle d\'erreur de chargement réseau ou protocole.',
    `
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="80dp"
    android:height="80dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="${primaryColor}"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM13,17h-2v-2h2v2zM13,13h-2L11,7h2v6z" />
</vector>
`
  );

  // 22. splash_background.xml
  addFile(
    'app/src/main/res/drawable/splash_background.xml',
    'xml',
    'Couche d\'fond gérant la superposition de l\'icône Splash de démarrage.',
    `
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="${backgroundColor}" />
        </shape>
    </item>
    <item
        android:gravity="center"
        android:width="150dp"
        android:height="150dp"
        android:drawable="@drawable/ic_apex_logo_splash" />
</layer-list>
`
  );

  // 23. bg_button.xml
  addFile(
    'app/src/main/res/drawable/bg_button.xml',
    'xml',
    'Fond du bouton de réessai, arrondi aux coins avec la couleur néon active.',
    `
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="${primaryColor}" />
    <corners android:radius="8dp" />
</shape>
`
  );

  // 24. ic_launcher.xml
  addFile(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'xml',
    'Entrée lanceur adaptative d\'icône.',
    `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/black" />
    <foreground android:drawable="@drawable/ic_apex_logo_foreground" />
</adaptive-icon>
`
  );

  // 25. ic_launcher_round.xml
  addFile(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    'xml',
    'Entrée lanceur adaptative d\'icône arrondie.',
    `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/black" />
    <foreground android:drawable="@drawable/ic_apex_logo_foreground" />
</adaptive-icon>
`
  );

  // 26. network_security_config.xml
  addFile(
    'app/src/main/res/xml/network_security_config.xml',
    'xml',
    'Exception sécurité pour autoriser le cleartext HTTP et les connexions tierces de flux IPTV.',
    `
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="${cleartextTraffic}">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`
  );

  return files;
}
