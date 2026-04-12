package com.ciney.tv;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView wv = getBridge().getWebView();

        // D-pad key events reach the WebView
        wv.requestFocus();

        // Force GPU compositing layer — eliminates software-render choppiness
        wv.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // No rubber-band overscroll bounce
        wv.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings ws = wv.getSettings();
        // Pre-raster tiles before they scroll into view → smoother scrolling
        ws.setOffscreenPreRaster(true);
        // Use as much memory as the device allows for the tile cache
        ws.setLoadsImagesAutomatically(true);
        ws.setMediaPlaybackRequiresUserGesture(false); // autoplay in player
    }
}
