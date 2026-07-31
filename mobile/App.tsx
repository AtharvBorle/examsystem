import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  BackHandler,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Share,
  Dimensions,
  ImageBackground,
  ScrollView,
  Image,
  NativeModules,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { APP_URL, SPLASH_SCREEN_VERSION } from './config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SLIDES_OLD = [
  {
    key: '1',
    title: 'Practice. Improve. Achieve.',
    subtitle: 'Explore thousands of GK questions with an interactive learning experience.',
    image: require('./imges/first.png'),
  },
  {
    key: '2',
    title: 'Practice Anytime, Anywhere',
    subtitle: 'Take mock exams, improve accuracy, and track your performance.',
    image: require('./imges/second.jpeg'),
  },
  {
    key: '3',
    title: 'Knowledge Today. Success Tomorrow.',
    subtitle: 'Build knowledge, boost confidence, and achieve your goals.',
    image: require('./imges/third.jpeg'),
  },
];

const SLIDES_NEW = [
  {
    key: '1',
    image: require('./imges/rss_1.png'),
  },
  {
    key: '2',
    image: require('./imges/rss_2.png'),
  },
  {
    key: '3',
    image: require('./imges/rss_3.png'),
  },
];

const SLIDES = SPLASH_SCREEN_VERSION === 'new' ? SLIDES_NEW : SLIDES_OLD;

function App() {
  const webViewRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const timerRef = useRef<any>(null);

  // Vande Mataram Pledge Screen States & Refs
  const [showPledge, setShowPledge] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<any>(null);
  const pledgeScrollRef = useRef<ScrollView>(null);
  const pledgeScrollY = useRef(0);
  const isUserInteracting = useRef(false);
  const interactionTimeoutRef = useRef<any>(null);

  // Auto-scroll loop for the pledge text
  useEffect(() => {
    if (showPledge) {
      const timer = setInterval(() => {
        if (!isUserInteracting.current) {
          pledgeScrollY.current += 1.8; // Faster auto-scroll speed
          pledgeScrollRef.current?.scrollTo({
            y: pledgeScrollY.current,
            animated: true,
          });
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [showPledge]);

  const handlePledgeScroll = (event: any) => {
    pledgeScrollY.current = event.nativeEvent.contentOffset.y;
  };

  const handleInteractionStart = () => {
    isUserInteracting.current = true;
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
  };

  const handleInteractionEnd = () => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 2500); // Resume auto-scroll after 2.5s of touch inactivity
  };

  // Safety fallback: Hide loading indicator after 3.5 seconds maximum so app never gets stuck
  useEffect(() => {
    if (!showOnboarding && !showPledge && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, showPledge, isLoading]);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  const renderPledgeScreen = () => {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1a30' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Image 
          source={require('./imges/rss_00.png')} 
          style={{ position: 'absolute', width: screenWidth, height: screenHeight }} 
          resizeMode="cover" 
        />
        {/* Top Bar for Skip Button */}
          <View style={[styles.topBar, { 
            position: 'absolute', 
            top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24), 
            left: 0,
            right: 0, 
            zIndex: 10 
          }]}>
            <TouchableOpacity onPress={() => setShowPledge(false)} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Scrolling Content */}
          <ScrollView
            ref={pledgeScrollRef}
            style={{
              position: 'absolute',
              top: screenHeight * 0.26,
              height: screenHeight * 0.48,
              width: '100%',
              left: 0,
              zIndex: 5, // High zIndex so finger drag is intercepted correctly
            }}
            contentContainerStyle={{ 
              paddingTop: screenHeight * 0.08, 
              paddingBottom: screenHeight * 0.30, 
              paddingHorizontal: 24,
              alignItems: 'center' 
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handlePledgeScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleInteractionStart}
            onScrollEndDrag={handleInteractionEnd}
            onMomentumScrollBegin={handleInteractionStart}
            onMomentumScrollEnd={handleInteractionEnd}
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{
                fontSize: 16.5,
                lineHeight: 26,
                fontWeight: 'bold',
                color: '#e67300', // premium flag saffron color matching the image mockup
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
              }}>
                {`वन्दे मातरम्\n\nवन्दे मातरम् सुजलां सुफलां मलयजशीतलाम् शस्यश्यामलां\nमातरम्\nशुभ्रज्योत्स्नापुलकितयामिनीं फुल्लकुसुमितद्रुमदलशोभिनीं\nसुहासिनीं सुमधुर भाषिणीं सुखदां वरदां मातरम् । १\n\nवन्दे मातरम्\nकोटि-कोटि-कण्ठ-कल-कल-निनाद-कराले कोटि-कोटि-\nभुजैर्धृत-खरकरवाले, अबला केन मा एत बले\nबहुबलधारिणीं नमामि तारिणीं रिपुदलवारिणीं मातरम् । २\n\nवन्दे मातरम्\nतुमि विद्या, तुमि धर्म तुमि हृदि, तुमि मर्म त्वं हि प्राणा: शरीरे\nबाहुते तुमि मा शक्ति, हृदये तुमि मा भक्ति, तोमारई प्रतिमा\nगडि मन्दिरे-मन्दिरे मातरम् । ३\n\nत्वं हि दुर्गा दशप्रहरणधारिणी कमला कमलदलविहारिणी\nवाणी विद्यादायिनी । नमामि त्वां नमामि कमलां अमलां अतुलां\nसुजलां सुफलां मातरम् ॥ वन्दे मातरम् ॥\n\nश्यामलां सरलां सुस्मितां भूषितां धरणीं भरणीं मातरम् ॥\nवन्दे मातरम् ॥`}
              </Text>
            </View>
          </ScrollView>

          {/* Permanent Fixed Honor Text Banner */}
          <View style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 90 : 76,
            left: 20,
            right: 20,
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <View style={{
              backgroundColor: 'transparent',
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{
                fontSize: 14.5,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: 0.4,
                textShadowColor: 'rgba(0, 0, 0, 0.95)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 4
              }}>
                🇮🇳 Please stand in honour of the National Song.
              </Text>
            </View>
          </View>

          {/* Mute/Unmute Floating Button at Bottom Right */}
          <View style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 40 : 24,
            right: 24,
            zIndex: 10
          }}>
            <TouchableOpacity
              onPress={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                audioRef.current?.postMessage(nextMuted ? 'mute' : 'unmute');
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                borderColor: '#ffffff',
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5
              }}
            >
              <View style={{ position: 'relative', width: 26, height: 26, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={require('./imges/speaker.png')} 
                  style={{
                    width: '100%',
                    height: '100%',
                    tintColor: '#ffffff',
                  }}
                  resizeMode="contain"
                />
                {isMuted && (
                  <View style={{
                    position: 'absolute',
                    width: 30,
                    height: 2.5,
                    backgroundColor: '#ef4444',
                    transform: [{ rotate: '-45deg' }],
                    borderRadius: 1.5,
                  }} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Hidden Webview for Playing Audio */}
          <WebView
            ref={audioRef}
            style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }}
            source={{ html: `
              <html>
                <body>
                  <audio id="audio" loop autoplay src="file:///android_asset/www/vande.mp3.mpeg" onerror="this.src='https://bvpindia.org/oes/vande.mp3.mpeg'"></audio>
                  <script>
                    // Auto-unlock play restrictions inside WebView
                    document.addEventListener('touchstart', function() {
                      var audio = document.getElementById('audio');
                      if (audio && audio.paused) {
                        audio.play();
                      }
                    }, { once: true });
                    
                    document.addEventListener('message', function(e) {
                      var audio = document.getElementById('audio');
                      if (!audio) return;
                      if (e.data === 'mute') {
                        audio.muted = true;
                      } else if (e.data === 'unmute') {
                        audio.muted = false;
                        audio.play().catch(function(err){});
                      }
                    });
                    
                    window.addEventListener('message', function(e) {
                      var audio = document.getElementById('audio');
                      if (!audio) return;
                      if (e.data === 'mute') {
                        audio.muted = true;
                      } else if (e.data === 'unmute') {
                        audio.muted = false;
                        audio.play().catch(function(err){});
                      }
                    });
                  </script>
                </body>
              </html>
            ` }}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptEnabled={true}
            mediaPlaybackRequiresUserAction={false}
          />
      </View>
    );
  };

  const resetAutoplayTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (!showOnboarding) return;

    timerRef.current = setInterval(() => {
      setActiveSlideIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < 3) {
          scrollViewRef.current?.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
          return nextIndex;
        } else {
          clearInterval(timerRef.current);
          setShowOnboarding(false);
          return prevIndex;
        }
      });
    }, 1500);
  };

  // Start timer on active onboarding (only after pledge screen is dismissed)
  useEffect(() => {
    if (showOnboarding && !showPledge) {
      resetAutoplayTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showOnboarding, showPledge]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / screenWidth);
    setActiveSlideIndex(index);
  };

  const handleNext = () => {
    if (activeSlideIndex < 2) {
      scrollViewRef.current?.scrollTo({
        x: (activeSlideIndex + 1) * screenWidth,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };
 
  // Handle hardware back button navigation within WebView
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevent default back action (exit)
      }
      return false; // Exit app if cannot go back
    };
 
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
 
    return () => {
      subscription.remove();
    };
  }, [canGoBack]);

  const handleReload = () => {
    setIsError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const saveToCacheAndShare = async (base64Content: string, filename: string) => {
    try {
      const cachePath = `${RNFS.CachesDirectoryPath}/${filename}`;
      await RNFS.writeFile(cachePath, base64Content, 'base64');
      
      await Share.share({
        title: 'Share Certificate',
        url: Platform.OS === 'android' ? `file://${cachePath}` : cachePath,
        message: `Here is my Exam Certificate: ${filename.replace(/_/g, ' ')}`,
      });
    } catch (err) {
      Alert.alert('Share Failed', 'Could not open share menu for the certificate.');
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'OPEN_EXTERNAL_URL' && data.url) {
        Linking.openURL(data.url).catch((err) => console.log('Error opening external URL:', err));
        return;
      }
      if (data.type === 'DOWNLOAD_PDF') {
        const { pdfData, filename } = data;
        const base64Content = pdfData.split(';base64,')[1];

        if (Platform.OS === 'android') {
          const sdkVersion = Platform.Version;
          let hasPermission = true;

          // Request write permission for Android (SDK < 33)
          if (typeof sdkVersion === 'number' && sdkVersion < 33) {
            const checked = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            if (!checked) {
              const status = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                  title: 'Storage Permission Required',
                  message: 'This application needs storage permission to save the exam certificate directly to your Downloads folder.',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                }
              );
              hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;
            }
          }

          let savedSuccessfully = false;

          if (hasPermission) {
            try {
              // Call custom Kotlin FileSaver Native Module to save via MediaStore (supports Android 10, 11, 12, 13+)
              await NativeModules.FileSaver.saveBase64ToDownloads(base64Content, filename);
              savedSuccessfully = true;
              webViewRef.current?.injectJavaScript(`
                if (window.showCustomAlert) {
                  window.showCustomAlert("Certificate saved to Downloads folder:\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                } else if (window.alert) {
                  window.alert("Certificate saved to Downloads folder:\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                } else {
                  alert("Certificate saved to Downloads folder:\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                }
                true;
              `);
            } catch (writeErr) {
              // Fallback to ExternalDirectory
            }
          }

          if (!savedSuccessfully) {
            try {
              const fallbackPath = `${RNFS.ExternalDirectoryPath}/${filename}`;
              await RNFS.writeFile(fallbackPath, base64Content, 'base64');
              webViewRef.current?.injectJavaScript(`
                if (window.showCustomAlert) {
                  window.showCustomAlert("Certificate saved to Application Storage folder:\\nAndroid/data/com.onlineexamsystem.app/files/\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                } else if (window.alert) {
                  window.alert("Certificate saved to Application Storage folder:\\nAndroid/data/com.onlineexamsystem.app/files/\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                } else {
                  alert("Certificate saved to Application Storage folder:\\nAndroid/data/com.onlineexamsystem.app/files/\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/_/g, ' ')}");
                }
                true;
              `);
            } catch (fallbackErr) {
              webViewRef.current?.injectJavaScript(`
                if (window.showCustomAlert) {
                  window.showCustomAlert("Could not save certificate file to device storage.");
                } else if (window.alert) {
                  window.alert("Could not save certificate file to device storage.");
                } else {
                  alert("Could not save certificate file to device storage.");
                }
                true;
              `);
            }
          }
        } else {
          // iOS sharing
          await saveToCacheAndShare(base64Content, filename);
        }
      } else if (data.type === 'DOWNLOAD_FILE') {
        const { url, filename } = data;
        if (Platform.OS === 'android') {
          const tempPath = `${RNFS.CachesDirectoryPath}/${filename}`;
          try {
            const sdkVersion = Platform.Version;
            let hasPermission = true;
            if (typeof sdkVersion === 'number' && sdkVersion < 33) {
              const checked = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
              );
              if (!checked) {
                const status = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                  {
                    title: 'Storage Permission Required',
                    message: 'This application needs storage permission to save study resources to your Downloads folder.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                  }
                );
                hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;
              }
            }

            if (!hasPermission) {
              webViewRef.current?.injectJavaScript(`
                alert("Permission denied. Could not save file.");
                true;
              `);
              return;
            }

            const downloadResult = await RNFS.downloadFile({
              fromUrl: url,
              toFile: tempPath,
            }).promise;

            if (downloadResult.statusCode === 200) {
              const base64Content = await RNFS.readFile(tempPath, 'base64');
              let savedSuccessfully = false;
              try {
                await NativeModules.FileSaver.saveBase64ToDownloads(base64Content, filename);
                savedSuccessfully = true;
                webViewRef.current?.injectJavaScript(`
                  alert("File downloaded and saved to Downloads folder:\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"')}");
                  true;
                `);
              } catch (writeErr) {
                // Fallback to application files
              }

              if (!savedSuccessfully) {
                const fallbackPath = `${RNFS.ExternalDirectoryPath}/${filename}`;
                await RNFS.writeFile(fallbackPath, base64Content, 'base64');
                webViewRef.current?.injectJavaScript(`
                  alert("File saved to Application Storage:\\nAndroid/data/com.onlineexamsystem.app/files/\\n${filename.replace(/'/g, "\\'").replace(/"/g, '\\"')}");
                  true;
                `);
              }
            } else {
              webViewRef.current?.injectJavaScript(`
                alert("Download failed. Server returned status code: ${downloadResult.statusCode}");
                true;
              `);
            }
          } catch (downloadErr) {
            console.log(downloadErr);
            webViewRef.current?.injectJavaScript(`
              alert("Error downloading file: " + "${String(downloadErr).replace(/'/g, "\\'").replace(/"/g, '\\"')}");
              true;
            `);
          }
        } else {
          // iOS sharing
          const tempPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
          try {
            const downloadResult = await RNFS.downloadFile({
              fromUrl: url,
              toFile: tempPath,
            }).promise;
            if (downloadResult.statusCode === 200) {
              await Share.share({
                url: tempPath,
                title: filename,
              });
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    } catch (err) {
      webViewRef.current?.injectJavaScript(`
        if (window.showCustomAlert) {
          window.showCustomAlert("Unable to parse certificate download package.");
        } else if (window.alert) {
          window.alert("Unable to parse certificate download package.");
        } else {
          alert("Unable to parse certificate download package.");
        }
        true;
      `);
    }
  };

  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#c5a059" />
      <Text style={styles.loadingText}>Loading Exam Portal...</Text>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorSubtitle}>
          Unable to reach the examination portal. Please verify your internet connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showPledge) {
    return renderPledgeScreen();
  }

  if (showOnboarding) {
    const isNew = SPLASH_SCREEN_VERSION === 'new';

    return (
      <View style={{ flex: 1, backgroundColor: '#0b1a30' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {isNew ? (
          <View style={{ flex: 1 }}>
            {/* Slider Content for New Layout */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onScrollBeginDrag={resetAutoplayTimer}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
            >
              {SLIDES.map((slide) => (
                <View key={slide.key} style={{ width: screenWidth, height: screenHeight }}>
                  <Image 
                    source={slide.image} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                </View>
              ))}
            </ScrollView>

            {/* Float Skip Button on Top */}
            <View style={[
              styles.topBar, 
              { 
                position: 'absolute', 
                top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24), 
                left: 0, 
                right: 0, 
                zIndex: 10 
              }
            ]}>
              <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                <Text style={styles.skipText}>
                  {activeSlideIndex === 2 ? 'Done' : 'Skip'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Float Dots Container on Top */}
            <View style={[
              styles.footerContainer, 
              { 
                position: 'absolute', 
                bottom: Platform.OS === 'ios' ? 40 : 24, 
                left: 0, 
                right: 0, 
                zIndex: 10 
              }
            ]}>
              <View style={styles.dotsContainer}>
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeSlideIndex === index ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          <ImageBackground
            source={require('./imges/bg.png')}
            style={styles.onboardingBackground}
            resizeMode="cover"
          >
            {/* Top Bar for Skip Button */}
            <View style={[styles.topBar, { marginTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) }]}>
              <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                <Text style={styles.skipText}>
                  {activeSlideIndex === 2 ? 'Done' : 'Skip'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Slider Content */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              onScrollBeginDrag={resetAutoplayTimer}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {SLIDES.map((slide) => (
                <View key={slide.key} style={styles.slideWrapper}>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                  <View style={styles.cardContainer}>
                    <Image source={slide.image} style={styles.cardImage} resizeMode="contain" />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer Area with Dots & Next Button & Text */}
            <View style={styles.footerContainer}>
              <View style={styles.dotsContainer}>
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeSlideIndex === index ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.footerText}>Online School Exam Management System</Text>
            </View>
          </ImageBackground>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1a30" />
      {isError ? (
        renderErrorView()
      ) : (
        <View style={{ flex: 1, position: 'relative' }}>
          <WebView
            ref={webViewRef}
            source={
              Platform.OS === 'android'
                ? { uri: 'file:///android_asset/www/index.html' }
                : require('./www/index.html')
            }
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            style={styles.webview}
            onNavigationStateChange={(navState: any) => {
              setCanGoBack(navState.canGoBack);
            }}
            onError={() => {
              setIsError(true);
              setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
            onLoadEnd={() => setIsLoading(false)}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (
                url.startsWith('file://') ||
                url.startsWith('about:') ||
                url.includes('android_asset')
              ) {
                return true;
              }
              if (
                url.startsWith('http://') ||
                url.startsWith('https://') ||
                url.startsWith('mailto:') ||
                url.startsWith('tel:') ||
                url.startsWith('sms:') ||
                url.startsWith('intent:')
              ) {
                Linking.openURL(url).catch((err) => console.log('Error opening external URL:', err));
                return false;
              }
              return true;
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            mixedContentMode="always"
          />
          {isLoading && renderLoadingView()}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1a30',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0b1a30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 15,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'serif',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0b1a30',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#16253b',
    borderRadius: 12,
    padding: 25,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c5a059',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  retryButton: {
    backgroundColor: '#c5a059',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#0b1a30',
    fontWeight: 'bold',
    fontSize: 15,
    textTransform: 'uppercase',
  },
  onboardingBackground: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#0b1a30',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    overflow: 'hidden',
  },
  slideWrapper: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#4a5568',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: screenWidth * 0.82,
    height: screenHeight * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  footerContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  nextButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  nextButtonText: {
    color: '#0b1a30',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    opacity: 0.9,
  },
});

export default App;
