package com.ciney.tv;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String PREFS_NAME = "ciney_player_progress";
    private static final long SAVE_THROTTLE_MS = 7000L;
    private static final String LOG_TAG = "CineyWeb";

    private WebView webView;
    private long lastSavedAtMs = 0L;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setBackgroundDrawable(new ColorDrawable(Color.BLACK));

        webView = getBridge().getWebView();
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
        webView.setKeepScreenOn(true);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.BLACK);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(false);
        }
        settings.setLoadsImagesAutomatically(true);
        settings.setOffscreenPreRaster(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.addJavascriptInterface(new PlayerBridge(this), "CineyNative");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                if (consoleMessage != null) {
                    Log.e(
                        LOG_TAG,
                        "JS "
                            + consoleMessage.messageLevel()
                            + " "
                            + consoleMessage.sourceId()
                            + ":"
                            + consoleMessage.lineNumber()
                            + " - "
                            + consoleMessage.message()
                    );
                }
                return super.onConsoleMessage(consoleMessage);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                view.setBackgroundColor(Color.BLACK);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectMessageBridge();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    showConnectionFallback(view, "Network error while starting Ciney.");
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 400) {
                    showConnectionFallback(view, "Unable to load app content. Retrying may help.");
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });
    }

    private void injectMessageBridge() {
        String script = "(function(){"
            + "if(window.__cineyBridgeInstalled){return;}"
            + "window.__cineyBridgeInstalled=true;"
            + "window.addEventListener('message', function(event){"
            + "  try{"
            + "    var payload = event.data;"
            + "    if(typeof payload==='string'){try{payload=JSON.parse(payload);}catch(_){payload=null;}}"
            + "    if(!payload || payload.type!=='PLAYER_EVENT'){return;}"
            + "    var data = payload.data || {};"
            + "    var eventType = data.event || data.eventType || 'unknown';"
            + "    var currentTime = Number(data.currentTime || 0);"
            + "    var duration = Number(data.duration || 0);"
            + "    var body = JSON.stringify({"
            + "      id: data.id || data.mediaId || null,"
            + "      mediaType: data.mediaType || null,"
            + "      season: data.season || null,"
            + "      episode: data.episode || null,"
            + "      currentTime: Number.isFinite(currentTime) ? currentTime : 0,"
            + "      duration: Number.isFinite(duration) ? duration : 0,"
            + "      eventType: String(eventType),"
            + "      origin: event.origin || ''"
            + "    });"
            + "    if(window.CineyNative && window.CineyNative.saveProgress){window.CineyNative.saveProgress(body);}"
            + "  }catch(err){"
            + "    if(window.CineyNative && window.CineyNative.reportBridgeError){window.CineyNative.reportBridgeError(String(err));}"
            + "  }"
            + "}, true);"
            + "window.__cineyExitFullscreen = function(){"
            + "  try{"
            + "    if(document.fullscreenElement){document.exitFullscreen();return true;}"
            + "    return false;"
            + "  }catch(_){return false;}"
            + "};"
            + "window.CineyNativeBridge = window.CineyNativeBridge || {};"
            + "window.CineyNativeBridge.exitFullscreen = function(){ return window.__cineyExitFullscreen(); };"
            + "})();";

        webView.evaluateJavascript(script, null);
    }

    private void showConnectionFallback(WebView view, String message) {
        String safeMessage = message == null ? "Connection Error" : message.replace("'", "&#39;");
        String html = "<html><body style='margin:0;background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;'><div style='text-align:center;padding:24px;'><h2 style='margin:0 0 12px;'>Ciney Startup Error</h2><p style='opacity:.85;margin:0 0 16px;'>" + safeMessage + "</p><button onclick='location.reload()' style='background:#1ce783;border:0;border-radius:999px;padding:10px 16px;font-weight:700;'>Retry</button></div></body></html>";
        view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (webView != null) {
            webView.requestFocus();
        }
    }

    private class PlayerBridge {
        private final SharedPreferences prefs;

        PlayerBridge(Context context) {
            prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        }

        @JavascriptInterface
        public void saveProgress(String data) {
            if (data == null || data.isEmpty()) {
                return;
            }

            try {
                JSONObject payload = new JSONObject(data);
                String eventType = payload.optString("eventType", "unknown");
                if (!"timeupdate".equals(eventType) && !"pause".equals(eventType) && !"ended".equals(eventType)) {
                    return;
                }

                long now = SystemClock.elapsedRealtime();
                if ("timeupdate".equals(eventType) && now - lastSavedAtMs < SAVE_THROTTLE_MS) {
                    return;
                }

                String id = payload.optString("id", "");
                String mediaType = payload.optString("mediaType", "movie");
                int season = payload.optInt("season", 1);
                int episode = payload.optInt("episode", 1);
                double currentTime = payload.optDouble("currentTime", 0);
                double duration = payload.optDouble("duration", 0);

                if (id.isEmpty() || currentTime < 0) {
                    return;
                }

                String key = "tv".equals(mediaType)
                    ? "progress_tv_" + id + "_s" + season + "_e" + episode
                    : "progress_movie_" + id;

                prefs.edit()
                    .putFloat(key, (float) currentTime)
                    .putFloat(key + "_duration", (float) Math.max(duration, 0))
                    .putLong(key + "_updatedAt", System.currentTimeMillis())
                    .apply();

                lastSavedAtMs = now;
            } catch (Exception ignored) {
                // ignore malformed payloads
            }
        }

        @JavascriptInterface
        public void reportBridgeError(String ignored) {
            // no-op
        }
    }
}
