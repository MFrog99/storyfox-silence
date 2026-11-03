package ru.storyfox.silence;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;

import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;

import org.json.JSONObject;

import java.io.File;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** WebView с общим интерфейсом + Python-сервис (Chaquopy) для Яндекс Музыки. */
public class MainActivity extends Activity {
    private WebView web;
    private PyObject service;
    private TextToSpeech tts;
    private boolean ttsReady;
    private final ExecutorService pool = Executors.newFixedThreadPool(3);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!Python.isStarted()) Python.start(new AndroidPlatform(this));
        service = Python.getInstance().getModule("ym_service");
        service.callAttr("init", new File(getFilesDir(), "data").getAbsolutePath());

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(new Locale("ru", "RU"));
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
                tts.setSpeechRate(0.88f);
                tts.setPitch(0.95f);
            }
        });

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0A0E13"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setTextZoom(100);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("(window.App && App.back()) ? 'y' : 'n'", value -> {
            if (value == null || !value.contains("y")) moveTaskToBack(true);
        });
    }

    @Override
    protected void onDestroy() {
        SessionService.stop(this);
        if (tts != null) tts.shutdown();
        pool.shutdownNow();
        web.destroy();
        super.onDestroy();
    }

    private void resolve(int id, String json) {
        runOnUiThread(() -> web.evaluateJavascript(
                "Native._resolve(" + id + "," + JSONObject.quote(json) + ")", null));
    }

    /** Методы, доступные из JS как window.AndroidBridge. */
    private class Bridge {
        @JavascriptInterface
        public void call(int id, String method, String argsJson) {
            pool.submit(() -> {
                String result;
                try {
                    result = service.callAttr("dispatch", method, argsJson).toString();
                } catch (Throwable e) {
                    result = "{\"ok\":false,\"code\":\"error\",\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
                }
                resolve(id, result);
            });
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (url != null && url.startsWith("https://")) {
                runOnUiThread(() -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
            }
        }

        @JavascriptInterface
        public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("code", text));
            });
        }

        @JavascriptInterface
        public void speak(String text) {
            if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_ADD, null, "p" + text.hashCode());
        }

        @JavascriptInterface
        public void stopSpeak() {
            if (tts != null) tts.stop();
        }

        @JavascriptInterface
        public void sessionState(boolean on, String title, boolean keepScreen) {
            runOnUiThread(() -> {
                if (on && keepScreen) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                if (on) {
                    // уведомление о практике; разрешение спрашиваем один раз, отказ не мешает работе
                    if (Build.VERSION.SDK_INT >= 33
                            && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                            && !getPreferences(MODE_PRIVATE).getBoolean("askedNotif", false)) {
                        getPreferences(MODE_PRIVATE).edit().putBoolean("askedNotif", true).apply();
                        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
                    }
                    try {
                        SessionService.start(MainActivity.this, title);
                    } catch (RuntimeException e) {
                        // ForegroundServiceStartNotAllowedException и т.п. — практика продолжится без службы
                    }
                } else {
                    SessionService.stop(MainActivity.this);
                }
            });
        }

        @JavascriptInterface
        public void setTheme(boolean dark) {
            runOnUiThread(() -> {
                Window w = getWindow();
                w.setStatusBarColor(Color.parseColor(dark ? "#0A0E13" : "#F7F4ED"));
                w.setNavigationBarColor(Color.parseColor(dark ? "#101820" : "#EDE8DE"));
                web.setBackgroundColor(Color.parseColor(dark ? "#0A0E13" : "#F7F4ED"));
                int flags = w.getDecorView().getSystemUiVisibility();
                int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= 26) light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                w.getDecorView().setSystemUiVisibility(dark ? (flags & ~light) : (flags | light));
            });
        }
    }
}
