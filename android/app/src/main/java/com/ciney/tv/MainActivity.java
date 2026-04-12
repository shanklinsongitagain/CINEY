package com.ciney.tv;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ensure the WebView captures hardware key events (D-pad) on Firestick / Android TV
        getBridge().getWebView().requestFocus();
    }
}
