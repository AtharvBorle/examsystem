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
} from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { APP_URL } from './config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SLIDES = [
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

function App() {
  const webViewRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const timerRef = useRef<any>(null);

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
    }, 3500);
  };

  // Start timer on active onboarding
  useEffect(() => {
    if (showOnboarding) {
      resetAutoplayTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showOnboarding]);

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
      if (data.type === 'DOWNLOAD_PDF') {
        const { pdfData, filename } = data;
        const base64Content = pdfData.split(';base64,')[1];

        if (Platform.OS === 'android') {
          const sdkVersion = Platform.Version;
          let hasPermission = true;

          // Request write permission for Android 9 and below
          if (typeof sdkVersion === 'number' && sdkVersion < 29) {
            const checked = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            if (!checked) {
              const status = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
              );
              hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;
            }
          }

          if (!hasPermission) {
            await saveToCacheAndShare(base64Content, filename);
            return;
          }

          try {
            const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;
            await RNFS.writeFile(destPath, base64Content, 'base64');
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
            // Fallback to cache and share sheet if public path fails (e.g. Scoped Storage)
            await saveToCacheAndShare(base64Content, filename);
          }
        } else {
          // iOS sharing
          await saveToCacheAndShare(base64Content, filename);
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

  if (showOnboarding) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
            source={{ uri: APP_URL }}
            style={styles.webview}
            onNavigationStateChange={(navState: any) => {
              setCanGoBack(navState.canGoBack);
            }}
            onError={() => {
              setIsError(true);
              setIsLoading(false);
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onMessage={handleMessage}
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
