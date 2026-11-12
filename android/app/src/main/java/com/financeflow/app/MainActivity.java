package com.financeflow.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Activity principal do FinanceFlow Android.
 *
 * O app inteiro e uma pagina web (index.html + css + js) embutida em
 * assets/, servida via WebViewAssetLoader com a origem
 * https://appassets.androidplatform.net/ - a mesma origem usada pelo APK
 * antigo, o que mantem o localStorage (dados do usuario) com o mesmo
 * comportamento.
 *
 * Alem do carregamento da pagina, esta Activity implementa o que a WebView
 * nao faz sozinha e que os botoes do app exigem:
 *   - Exportar: <a download> nao funciona no Android -> ponte
 *     JavascriptInterface (AndroidBridge.saveFile) que salva o JSON em
 *     Download/, com fallback via setDownloadListener.
 *   - Importar: <input type="file"> nao abre nada -> WebChromeClient
 *     .onShowFileChooser com seletor de arquivos filtrado por JSON.
 *   - confirm()/prompt(): nao existem no Android -> dialogs nativos.
 */
public class MainActivity extends Activity {

    private static final String TAG = "FinanceFlow";
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_HOST + "/index.html";

    private static final int REQ_FILE_CHOOSER = 1001;
    private static final int REQ_WRITE_STORAGE = 1002;

    private WebView webView;

    // Callback do seletor de arquivos (importacao)
    private ValueCallback<Uri[]> filePathCallback;

    // Download pendente aguardando permissao de escrita (somente API < 29)
    private String pendingFileName;
    private byte[] pendingFileBytes;
    private String pendingMimeType;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        // JavaScript e localStorage sao obrigatorios: o app guarda todas as
        // transacoes em localStorage.
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setLoadWithOverviewMode(true);
        webView.getSettings().setSupportZoom(false);

        // Ponte usada pelo Utils.downloadFile para EXPORTAR o backup.
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view,
                                                              WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view,
                                                    WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                boolean isWeb = "http".equals(scheme) || "https".equals(scheme);
                // Recursos internos (appassets...) continuam dentro do app;
                // links externos abrem no navegador do celular.
                if (isWeb && !APP_HOST.equals(uri.getHost())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }
        });

        // Dialogos nativos (confirm/prompt/alert) + seletor de arquivos.
        webView.setWebChromeClient(new AppChromeClient());

        // Fallback de exportacao: se algum fluxo gerar um download direto
        // (blob:/data:), o AndroidBridge nao e usado.
        webView.setDownloadListener(this::handleDownload);

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    // =============================================================
    //  EXPORTAR
    // =============================================================

    /**
     * Ponte JavaScript -> Java. O Utils.downloadFile do app chama
     * AndroidBridge.saveFile(nome, conteudo, mime) quando roda no Android.
     */
    public class AndroidBridge {
        @JavascriptInterface
        public void saveFile(String filename, String content, String mimeType) {
            final String name = normalizeName(filename);
            final String mime = (mimeType == null || mimeType.isEmpty())
                    ? "application/json" : mimeType;
            final byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            runOnUiThread(() -> saveToDownloads(name, bytes, mime));
        }
    }

    /** Fallback para downloads que nao passam pela ponte (blob:/data:). */
    private void handleDownload(String url, String userAgent, String contentDisposition,
                                String mimeType, long contentLength) {
        if (url.startsWith("blob:")) {
            // O conteudo so esta acessivel dentro da pagina; la dentro o blob
            // e convertido em base64 e devolvido para a Activity.
            final String js = "(function(){return new Promise(function(resolve){"
                    + "fetch('" + url.replace("'", "") + "').then(function(r){return r.blob();})"
                    + ".then(function(b){var f=new FileReader();"
                    + "f.onload=function(){resolve(f.result)};"
                    + "f.onerror=function(){resolve('')};"
                    + "f.readAsDataURL(b);});});})()";
            webView.evaluateJavascript(js, value -> {
                String dataUrl = unquote(value);
                if (dataUrl == null || !dataUrl.startsWith("data:")) {
                    Log.e(TAG, "Falha ao ler blob de download");
                    return;
                }
                int comma = dataUrl.indexOf(',');
                String payload = dataUrl.substring(comma + 1);
                byte[] bytes;
                if (dataUrl.contains(";base64,")) {
                    bytes = Base64.decode(payload, Base64.DEFAULT);
                } else {
                    bytes = Uri.decode(payload).getBytes(StandardCharsets.UTF_8);
                }
                saveToDownloads(guessName(contentDisposition, mimeType), bytes,
                        mimeType != null ? mimeType : "application/json");
            });
        } else if (url.startsWith("data:")) {
            int comma = url.indexOf(',');
            String payload = url.substring(comma + 1);
            byte[] bytes = url.contains(";base64,")
                    ? Base64.decode(payload, Base64.DEFAULT)
                    : Uri.decode(payload).getBytes(StandardCharsets.UTF_8);
            saveToDownloads(guessName(contentDisposition, mimeType), bytes,
                    mimeType != null ? mimeType : "application/json");
        } else {
            // Download http(s) nao usado pelo app: abre no navegador.
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception e) {
                Log.e(TAG, "Nao foi possivel abrir " + url, e);
            }
        }
    }

    /** Escreve o arquivo em Download/ (MediaStore nas APIs novas). */
    private void saveToDownloads(final String name, final byte[] bytes, final String mime) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver resolver = getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS);
            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                toast("Erro ao salvar o backup");
                return;
            }
            try (OutputStream out = resolver.openOutputStream(uri)) {
                if (out == null) throw new IOException("stream nulo");
                out.write(bytes);
                toast("Backup salvo em Download/" + name);
            } catch (IOException e) {
                Log.e(TAG, "Erro ao gravar " + name, e);
                resolver.delete(uri, null, null);
                toast("Erro ao salvar o backup");
            }
        } else {
            // API 24-28: exige WRITE_EXTERNAL_STORAGE em tempo de execucao.
            if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                pendingFileName = name;
                pendingFileBytes = bytes;
                pendingMimeType = mime;
                requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                        REQ_WRITE_STORAGE);
                return;
            }
            writeLegacy(name, bytes, mime);
        }
    }

    /** Gravacao direta no Download/ (somente API < 29, com permissao concedida). */
    private void writeLegacy(String name, byte[] bytes, String mime) {
        File dir = Environment.getExternalStoragePublicDirectory(
                Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists() && !dir.mkdirs()) {
            toast("Nao foi possivel acessar a pasta Download");
            return;
        }
        File file = new File(dir, name);
        try (OutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
            toast("Backup salvo em Download/" + name);
        } catch (IOException e) {
            Log.e(TAG, "Erro ao gravar " + file, e);
            toast("Erro ao salvar o backup");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_WRITE_STORAGE) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED;
            if (granted && pendingFileBytes != null) {
                writeLegacy(pendingFileName, pendingFileBytes, pendingMimeType);
            } else if (!granted) {
                toast("Sem permissao de escrita: backup nao salvo");
            }
            pendingFileBytes = null;
        }
    }

    // =============================================================
    //  IMPORTAR
    // =============================================================

    /** Le o JSON escolhido no seletor e entrega ao app (app.importAll). */
    private void importFromUri(Uri uri) {
        String json;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new IOException("stream nulo");
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int n;
            while ((n = in.read(chunk)) != -1) buf.write(chunk, 0, n);
            json = new String(buf.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            Log.e(TAG, "Erro ao ler backup", e);
            toast("Erro ao ler arquivo");
            return;
        }
        // Remove BOM, se houver (JSON.parse falharia com ela).
        if (!json.isEmpty() && json.charAt(0) == '\uFEFF') json = json.substring(1);

        // Reproduz o evento do <input type="file"> para rodar exatamente o
        // mesmo fluxo do app (validacao, confirmacao e toasts).
        final String js = "(function(j){try{"
                + "var f=new File([j],'backup.json',{type:'application/json'});"
                + "app.importAll({target:{files:[f],value:''}});"
                + "}catch(e){console.error('import',e);}})("
                + JSONObject.quote(json) + ")";
        webView.evaluateJavascript(js, null);
    }

    // =============================================================
    //  ChromeClient: dialogs + seletor de arquivos
    // =============================================================

    private class AppChromeClient extends WebChromeClient {

        @Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("FinanceFlow")
                    .setMessage(message)
                    .setCancelable(false)
                    .setPositiveButton("OK", (d, w) -> result.confirm())
                    .show();
            return true;
        }

        @Override
        public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("FinanceFlow")
                    .setMessage(message)
                    .setCancelable(false)
                    .setPositiveButton("OK", (d, w) -> result.confirm())
                    .setNegativeButton("Cancelar", (d, w) -> result.cancel())
                    .show();
            return true;
        }

        @Override
        public boolean onJsPrompt(WebView view, String url, String message,
                                  String defaultValue, JsPromptResult result) {
            final EditText input = new EditText(MainActivity.this);
            input.setText(defaultValue == null ? "" : defaultValue);
            input.setSelectAllOnFocus(true);
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("FinanceFlow")
                    .setMessage(message)
                    .setView(input)
                    .setCancelable(false)
                    .setPositiveButton("OK", (d, w) -> result.confirm(input.getText().toString()))
                    .setNegativeButton("Cancelar", (d, w) -> result.cancel())
                    .show();
            return true;
        }

        @Override
        public boolean onShowFileChooser(WebView view,
                                         ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;

            // O input do app e <input type="file" accept=".json">: abre o
            // seletor de arquivos do Android filtrado por JSON.
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES,
                    new String[]{"application/json", "text/json"});
            startActivityForResult(
                    Intent.createChooser(intent, "Selecionar backup (.json)"),
                    REQ_FILE_CHOOSER);
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE_CHOOSER) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(result);
                filePathCallback = null;
            }
            if (result != null) {
                importFromUri(result[0]);
            }
        }
    }

    // =============================================================
    //  Ciclo de vida / utilitarios
    // =============================================================

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private String normalizeName(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return defaultBackupName();
        }
        String name = filename.replace('/', '_').replace('\\', '_').trim();
        if (!name.toLowerCase(Locale.ROOT).endsWith(".json")) {
            name = name + ".json";
        }
        return name;
    }

    private String guessName(String contentDisposition, String mimeType) {
        if (contentDisposition != null) {
            int idx = contentDisposition.toLowerCase(Locale.ROOT).indexOf("filename=");
            if (idx >= 0) {
                String raw = contentDisposition.substring(idx + 9).trim();
                if (raw.startsWith("\"") && raw.endsWith("\"") && raw.length() > 1) {
                    raw = raw.substring(1, raw.length() - 1);
                }
                if (!raw.isEmpty()) return normalizeName(raw);
            }
        }
        String guessed = URLUtil.guessFileName("download", contentDisposition, mimeType);
        if (guessed != null && guessed.toLowerCase(Locale.ROOT).endsWith(".json")) {
            return guessed;
        }
        return defaultBackupName();
    }

    private String defaultBackupName() {
        String date = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        return "financecontrol_backup_" + date + ".json";
    }

    private String unquote(String value) {
        if (value == null || "null".equals(value)) return null;
        String v = value.trim();
        if (v.length() >= 2 && v.startsWith("\"") && v.endsWith("\"")) {
            try {
                return new JSONObject("{\"v\":" + v + "}").getString("v");
            } catch (Exception e) {
                return v.substring(1, v.length() - 1);
            }
        }
        return v;
    }

    private void toast(final String message) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, message,
                Toast.LENGTH_LONG).show());
    }
}
