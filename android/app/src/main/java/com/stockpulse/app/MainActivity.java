package com.stockpulse.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get the WebView from Capacitor's bridge
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Disable zoom completely
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(false);
            // Proper viewport
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            // Dark background to avoid white flash
            webView.setBackgroundColor(android.graphics.Color.parseColor("#09090b"));
        }
    }
}
