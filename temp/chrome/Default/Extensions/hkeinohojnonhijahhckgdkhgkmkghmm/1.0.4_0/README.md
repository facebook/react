# VPNLess WWW

A chrome extension that installs a proxy PAC for filtering WWW-bound traffic into x2pagentd.

## Releasing

### Update version in manifest.json

```
-  "version": "1.0.1",
+  "version": "1.0.2",
```

### Get extension key

```
$ secrets_tool get VPNLESS_WWW
```

### Pack extension

Navigate to [chrome://extensions](chrome://extensions) and select "Pack Extension".
Provide path to `fbsource/fbcode/extensions/chrome/vpnless_www` dir and key file.

### Update www

Update `flib/intern/site/x/browser_extensions/XInternBrowserChromeExtensionUpdateXMLController.php` to contain new version

```
       shape(
         'name' => 'vpnless_www',
         'appid' => ChromeExtensionID::VPNLESS_WWW,
-        'version' => "1.0.1",
+        'version' => "1.0.2",
       ),
```

and copy the packed `vpnless_www.crx` to `html/unpublished/crx/vpnless_www.crx`.
