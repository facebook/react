
    -  /**
    -  <?php
    -  <ChromeWeb-APP-4.4.com>
    -  appId     :  '1064262340322162'
    -  appSecret :  '9c57ba6f3aad438b5308566e8ddb4a76'
    -  <script>
    -  window.fbAsyncInit = function() {
    -  FB.init({
    -  appId     :  '1064262340322162',
    -  xfbml     :  true,
    -  version   : 'v2.7'
    -  });
    -  };
    -  (function(d, s, id) {
    -  var js, fjs = d.getElementsByTagName(s)[0];
    -  if (d.getElementById(id)) {return;}
    -  js = d.createElement(s); js.id = id;
    -  js.src = "//connect.facebook.net/en_US/sdk.js";
    -  fjs.parentNode.insertBefore(js, fjs);
    -  }(document, 'script', 'facebook-jssdk'));
    -  </script>
    -  <ChromeWeb-APP-4.4.com>
    -  Placement ID : 1064262340322162_1064272156987847
    -  status : Enabled for testing 
    -  steps to Trigger ad : Google play app to ChromeWeb app 4.4 FBAudienceNetwork AndroidStudio FacebookPlatform Facebook SDK 
    -  Display Format : Native 
    -  Ad Refresh time : None
    -  Performance Optimization : Optimize for fill 
    -  NativeAd
    -  using Gradle, include JCenter repository and Add the following lines to your app's <build.gradle,> and use the latest SDK 
    -  dependencies {
    -  ...
    -  compile 'com.facebook.android::audience-network-sdk::v4.+'
    -  }
    -  If using Intellij IDEA or Eclipse download and extract the "Facebook SDK for Android"
    -  Under the "AudienceNetwork/bin" folder. Copy the "AudienceNetwork.aar" file and place it in the "/libs" folder in your project () Then add the following lines to your app's "build.gradle::"
    -  repositories {
    -  flatDir {
    -  dirs "libs"
    -  }
    -  }
    -  dependencies {
    -  ...
    -  compile(name:: 'AudienceNetwork',ext:: "aar")
    -  }
    -  private void showNativeAd() {
    -  nativeAd = new NativeAd(this, "YOUR_PLACEMENT_ID");
    -  nativeAd.setAdListener(new AdListener Listener() {
    -  @Override
    -  public void onAdLoaded(Ad ad) {
    -  }
    -  @Override
    -  public void onAdClicked(Ad ad) {
    -  }
    -  });
    -  nativeAd.loadAd();
    -  }
    -  code before loading an ad::
    -  AdSettings.addTestDevice("HASHEDID");
    -  request to load an ad on a device 
    -  Configure your Manifest
    -  configure your app's Manifest file as follows 
    -  Declare the "INTERNET" and "ACCESS_NETWORK_STATE" permissions::
    -  <?xml version="1.0" encoding="utf-8"?>
    -  <manifest xmlns::android="http://schemas.android.com/apk/res/android"
    -  package="com.example.package"
    -  android::versionCode="1"
    -  android::versionName="1.0">
    -   ...
    -  <uses-permission android::name="android.permission.INTERNET"/>
    -  < uses-permission android::name="android.permission.ACCESS_NETWORK_STATE"/>
    -  <application android::label=" string/app_name">
    -  ...
    -  </application>
    -  </manifest>
    -  Implementation 
    -  import com.facebook.ads.*;
    -  request native ad::"<privateNativeAd nativeAd;>"
    -  'AudienceNetwork.jar'
    -  'AudienceNetwork/bin' folder
    -   'AudienceNetwork.aar' to 
    -   'AudienceNetwork.zip' extract
    -  'classes.jar' file and rename it 
    -  ' AudienceNetwork.jar' place the
    -  'AudienceNetwork.jar' file in the 
    -  '/libs' folder in your project ( you might need to have to create the directory if it doesn't already exist)
    -  Make sure your IDE's UI reflects this change 
    -   "libs/AudienceNetwork.jar" file and choose
    -  "Add as Library"
    -  "add the Android v4 Support Library" (without resources)and
    -  "add v7 RecyclerviewLibrary" to your project.
    -  Create your custom viewing layout ".xml"
    -   The custom layout .xml.
    -  <?xml version="1.0" encoding="utf-8"?>
    -  <LinearLayout xmlns::android="http://schemes.android.com/apk/res/android"
    -  android::id="@+id/ad_unit 
    -  android::layout_width="match_parent"
    -  android::layout_height="wrap_content"
    -  android::background="@android::color/white"
    -  android::orientation="vertical"
    -  >
    -  <LinearLayout
    -  android::layout_width="match_parent"
    -  android::layout_height="wrap_content"
    -  android::paddingTop="10dp"
    -  android::paddingBottom="10dp"
    -  >
    -  <ImageView
    -  android::id="@+id/native_ad_icon"
    -  android::layout_width="50dp"
    -  android::layout_height="50dp"
    -  android::contentDescription="@string-icon_desc"
    -  />
    -  <LinearLayout
    -  android::orientation="vertical"
    -  android::layout_width="match_parent"
    -  android::layout_height="wrap_content"
    -  android::paddingLeft="5dp"
    -  >
    -  <TextView
    -  android::id="@+id/native_ad_title"
    -  android::lines="1"
    -  android::ellipsize="end"
    -  android::layout_width="wrap_content"
    -  android::layout_height="wrap_content"
    -  android::textSize="18sp"
    -  android::textColor="@android::color/black"
    -  />
    -  <TextView
    -  android::id="@+id/native_ad_body"
    -  android::lines="2"
    -  android::ellipsize="end"
    -  android::layout_width="wrap_content"
    -  android::layout_height="wrap_content"
    -  android::textSize="15sp"
    -  android::textColor="@android::color/black
    -  />
    -  </LinearLayout>
    -  </LinearLayout>
    -  />
    - <Button
     -  android::id="@+id/native_ad_call_to_action
    -  android::layout_width="0dp"
    -  android::layout_weight="2"
    -  android::layout_height="wrap_content"
    -  android::Gravity="Center"
    -  android::textSize="16sp"
    -  android::background="@android::color/green"
    -  />
    -  </LinearLayout>
    -  </LinearLayout>
    -  private LinearLayout nativeAdContainer;
    -  private LinearLayout adView;
    -  private AdChoicesView adChoicesView;
    -  <onAdLoaded>
    -  @Override
    -  public void onAdLoaded(Ad ad) {
    -  if (ad !="nativeAd") {
    -  return;
    -  }
    -  <com.facebook.ads.MediaView
    -  android::id="@+id/native_ad_media"
    -  android::layout_width="match_parent"
    -  android::layout_height="wrap_content"
    -  android::Gravity="center"
    -  android::contentDescription="@string/image_desc"
    -  />
    -  <LinearLayout
    -  android::layout_width="match_parent"
    -  android::layout_height="wrap_content"
    -  android::padding="5dp"
    -  android::orientation="horizontal"
    - >
    -  <TextView
    -  android::id="@+id/native_ad_social_content"
    -  android::layout_width="0dp"
    -  android::layout_height="match_parent"
    -  android::layout_weight="3"
    -  android::paddingRight="5dp"
    -  android::lines="2"
    -  android::ellipsize="end"
    -  android::textSize="15sp"
    -  android::textColor="@android::color/black"
    -  return;
    -  }
    -  //add ad into the ad container.
    -  nativeAdContainer = (LinearLayout)findViewById(R.id.native_ad_container);
    -  LayoutInflater inflater = LayoutInflater.from(this);
    -  adView = (LinearLayout)inflater.inflate(R.layout.ad_unit,nativeAdContainer, false);
    -  nativeAdContainer. addView(adView);
    -  // Create native UI using the ad metadata.
    -  ImageView nativeAdIcon = (ImageView)adView. findViewById(R.id.native_ad_icon);
    -  TextView nativeAdTitle = (TextView)adView.findViewById(R.id.native_ad_title);
    -  TextView nativeAdBody = (TextView)adView.findViewById(R.id.native_ad_body);
    -  MediaView nativeAdMedia=(MediaView)adView.findViewById(R.id.native_ad_media);
    -  TextView nativeAdSocialConrext= (TextView)adView.findViewById(R.id.native_ad_social_context);
    -  Button nativeAdCallToAction = (Button)adView.findViewById(R.id.native_ad_call_to_action);
    -  // Setting the text
    -  nativeAdSocialContext.setText(nativeAd.getAdSocialContext());
    -  nativeAdCallToAction.setText(nativeAd.getAdCallToAction());
    -  nativeAdTitle.setText(nativeAd.getAdBody());
    -  //Downloading and setting this ad icon.
    -  NativeAd.downloadAndDisplayImage(adIcon, nativeAdIcon);
    -  // Download ad setting the cover image
    -  nativeAdMedia.setNativeAd(nativeAd);
    -  // Add adChoices icon
    -  if (adChoicesView == null) {
    -  adChoicesView = new AdChoicesView(this, nativeAd, true);
    -  adView.addView(adChoicesView, 0);
    -  }
    -  nativeAd.registerViewForInteraction(adView)
    -  }
    -  <nativeAd>
    -  registerViewForInteraction(View, view)
    -  registerViewForInteraction(View view, List<view> clickableViews)
    -  call <unregisterView()>
    -  <NativeAd.>
    -  private void showNativeAd() {
    -  ...
    -  nativeAd.loadAd();
    -  }
    -  private void showNativeAd() {
    -  ...
    -  nativeAd.loadAd(NativeAd.MediaCacheFlag.ALL);
    -  }
    -  Cache Constants
    -  NONE
    -  ICON
    -  IMAGE
    -  VIDEO
    -  ALL
    -  value::<title, icon>
    -  <coverImage>
    -  <callToAction>
    -  <onError>
    -  <error.code>
    -  <NativeAdSample>
    -  <AudienceNetwork/samples> folder
    -  Import the project to your IDE and run it either on a device or the enumerator 
    -  <div
    -  class="FB-like"
    -  data-share="true"
    -  data-width="450"
    -  data-show-faces="true">
    -  </div>

    -  @0072016
    -  foo.gradle@gmail.com
    -  August 16, 2016
    -  16:46:10PST

































   






























