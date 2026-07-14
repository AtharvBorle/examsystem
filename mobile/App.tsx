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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { APP_URL } from './config';

function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);

  // Handle hardware back button navigation within WebView
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevent default back action (exit)
      }
      return false; // Exit app if cannot go back
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [canGoBack]);

  const handleReload = () => {
    setIsError(false);
    webViewRef.current?.reload();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1a30" />
      {isError ? (
        renderErrorView()
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onError={() => setIsError(true)}
          startInLoadingState={true}
          renderLoading={renderLoadingView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          mixedContentMode="always"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1a30',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b1a30',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default App;
