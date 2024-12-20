(function () {
  const BACKEND_URL = 'https://zggqodvdlofupzqbdgzv.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3FvZHZkbG9mdXB6cWJkZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MTkyNDQsImV4cCI6MjA0NzE5NTI0NH0.ZjBAhbdyh79LpMXuRreSTX2ubjExdaD2vR9K9WOTTDo';
  const GOOGLE_MAPS_API_KEY = 'AIzaSyDhxNCafamGLliFy6kCQ3K_tJSbTRmUUUE';

  let state = {
    startTime: Date.now(),
    pageViews: new Set([window.location.pathname]),
    clickCount: 0,
    currentPage: window.location.pathname,
    userId: null,
    isTracking: false,
    locationSent: false,
    engagementData: {},
    locationData: null,
    permissionGranted: false,
    engagement_id: null,
    lastInteractionTime: Date.now(),
    lastClickCount: 0,
    lastPageViewCount: 0,
    trackingStartTime: Date.now(),
    currentInterval: null
  };

  const logError = (context, error) => {
    console.error(`[Error - ${context}]`, error);
    if (error instanceof Error) {
      console.error(`[Detail - ${context}]`, error.message, error.stack);
    } else {
      console.error(`[Detail - ${context}]`, error);
    }
  };

  const getCurrentScript = () => {
    try {
      const scripts = document.getElementsByTagName('script');
      for (let script of scripts) {
        if (script.src.includes('tracker.js') && script.getAttribute('data-user-id')) {
          return script;
        }
      }
    } catch (error) {
      logError('getCurrentScript', error);
    }
    return null;
  };

  const saveStateToLocalStorage = () => {
    try {
      const dataToSave = {
        pageViews: Array.from(state.pageViews),
        engagementData: state.engagementData,
        locationData: state.locationData,
        userId: state.userId,
        engagement_id: state.engagement_id,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`tracking_data_${state.userId}`, JSON.stringify(dataToSave));
    } catch (error) {
      logError('saveStateToLocalStorage', error);
    }
  };

  const loadStateFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(`tracking_data_${state.userId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        state.pageViews = new Set(parsedData.pageViews);
        state.engagementData = parsedData.engagementData;
        state.locationData = parsedData.locationData;
        state.engagement_id = parsedData.engagement_id;
      }
    } catch (error) {
      logError('loadStateFromLocalStorage', error);
    }
  };

  const initialize = () => {
    try {
      const script = getCurrentScript();
      if (!script) {
        console.error('[initialize] data-user-id not found in script tag.');
        return false;
      }

      state.userId = script.getAttribute('data-user-id');
      if (!state.userId) {
        console.error('[initialize] Invalid user ID.');
        return false;
      }

      // Kayıtlı verileri yükle
      loadStateFromLocalStorage();

      const permissionStatus = localStorage.getItem('locationPermissionGranted');
      if (permissionStatus === 'true') {
        state.permissionGranted = true;
      }

      return true;
    } catch (error) {
      logError('initialize', error);
      return false;
    }
  };

  const calculateEngagementScore = () => {
    try {
      // Local storage'dan verileri al
      const savedData = localStorage.getItem(`tracking_data_${state.userId}`);
      if (!savedData) {
        return { total: 0, details: {} };
      }

      const data = JSON.parse(savedData);
      
      // Tüm sayfaların toplam değerlerini hesapla
      let totalClicks = 0;
      let totalTimeSpent = 0;
      
      // Her sayfanın verilerini topla
      Object.values(data.engagementData || {}).forEach(pageData => {
        totalClicks += pageData.clicks || 0;
        totalTimeSpent += pageData.timeSpent || 0;
      });

      // Benzersiz sayfa sayısını Object.keys ile al
      const totalPageViews = Object.keys(data.engagementData || {}).length;

      // Skorları hesapla
      let timeScore = totalTimeSpent <= 30 ? 1
        : totalTimeSpent <= 60 ? 3
        : totalTimeSpent <= 90 ? 6
        : totalTimeSpent <= 120 ? 7
        : totalTimeSpent <= 180 ? 9 : 10;

      let pageViewScore = totalPageViews === 1 ? 1
        : totalPageViews <= 3 ? 3
        : totalPageViews <= 5 ? 6
        : totalPageViews <= 7 ? 8 : 10;

      let clickScore = totalClicks === 0 ? 1
        : totalClicks <= 2 ? 3
        : totalClicks <= 5 ? 6
        : totalClicks <= 10 ? 8 : 10;

      const w1 = 0.3, w2 = 0.4, w3 = 0.3;

      return {
        total: Math.round((w1 * timeScore + w2 * pageViewScore + w3 * clickScore) * 10) / 10,
        details: {
          timeSpent: totalTimeSpent,
          timeScore,
          pageViews: totalPageViews,
          pageViewScore,
          clicks: totalClicks,
          clickScore
        }
      };
    } catch (error) {
      logError('calculateEngagementScore', error);
      return { total: 0, details: {} };
    }
  };

  async function getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en&region=US&result_type=street_address`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error(data.error_message);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('Address not found');
      }

      // Get the most accurate result
      const result = data.results[0];
      let streetNumber = '';
      let route = '';
      let city = '';
      let country = '';
      let postalCode = '';

      result.address_components.forEach((component) => {
        if (component.types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (component.types.includes('route')) {
          route = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      const streetAddress = `${route} ${streetNumber}`.trim();

      return {
        address: result.formatted_address,
        streetAddress,
        city,
        country,
        postalCode,
      };
    } catch (error) {
      logError('getAddressFromCoordinates', error);
      return { address: '', streetAddress: '', city: '', country: '', postalCode: '' };
    }
  }

  const generateEngagementId = () => {
    return 'eng_' + Math.random().toString(36).substr(2, 9);
  };

  async function sendLocationData(locationData) {
    try {
      // Eğer zaten bir engagement_id varsa, sadece güncelleme yap
      if (state.engagement_id) {
        await updateEngagementData();
        return;
      }

      // İlk kez gönderiliyorsa yeni engagement_id oluştur
      state.engagement_id = generateEngagementId();
      saveStateToLocalStorage();

      // Tüm sayfaların toplam engagement skorunu hesapla
      const totalEngagement = calculateEngagementScore();

      const response = await fetch(`${BACKEND_URL}/rest/v1/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: state.userId,
          engagement_id: state.engagement_id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          city: locationData.city,
          country: locationData.country,
          page_url: state.currentPage,
          engagement_data: totalEngagement,
          device_info: locationData.deviceInfo,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Supabase API error: ${errorDetails.message}`);
      }

      state.locationSent = true;
    } catch (error) {
      logError('sendLocationData', error);
    }
  }

  async function updateEngagementData() {
    try {
      if (!state.engagement_id) {
        console.log('Güncelleme yapılmadı: engagement_id yok');
        return;
      }

      // Tüm sayfaların toplam engagement skorunu hesapla
      const totalEngagement = calculateEngagementScore();

      const requestBody = {
        engagement_data: totalEngagement,
        page_url: state.currentPage,
        timestamp: new Date().toISOString()
      };

      const updateUrl = `${BACKEND_URL}/rest/v1/locations?engagement_id=eq.${encodeURIComponent(state.engagement_id)}`;

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Supabase API error: ${errorDetails.message}`);
      }

    } catch (error) {
      logError('updateEngagementData', error);
    }
  }

  const handleBeforeUnload = async () => {
    try {
      if (!state.locationData || state.locationSent) return;

      // Send location data with final engagement metrics when user leaves
      await sendLocationData(state.locationData);
    } catch (error) {
      logError('handleBeforeUnload', error);
    }
  };

  async function trackLocation() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const addressInfo = await getAddressFromCoordinates(latitude, longitude);
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
      };

      // Initialize engagement data for current page
      if (!state.engagementData[state.currentPage]) {
        state.engagementData[state.currentPage] = {
          startTime: Date.now(),
          clicks: 0
        };
      }

      state.locationData = {
        latitude,
        longitude,
        ...addressInfo,
        deviceInfo
      };

      // Konum verilerini kaydet
      saveStateToLocalStorage();
      
      // Konum verilerini gönder veya güncelle
      await sendLocationData(state.locationData);
      
      localStorage.setItem('locationPermissionGranted', 'true');
      state.permissionGranted = true;
    } catch (error) {
      logError('trackLocation', error);
    }
  }

  // Sayfa süresini güncellemek için fonksiyon
  const updateTimeSpent = () => {
    try {
      const savedData = localStorage.getItem(`tracking_data_${state.userId}`);
      if (!savedData) return;

      const data = JSON.parse(savedData);
      const currentPage = state.currentPage;

      if (data.engagementData[currentPage]) {
        const currentTime = Date.now();
        const timeSpentSeconds = Math.floor((currentTime - data.engagementData[currentPage].startTime) / 1000);
        data.engagementData[currentPage].timeSpent = timeSpentSeconds;
        
        // Güncellenmiş veriyi local storage'a kaydet
        localStorage.setItem(`tracking_data_${state.userId}`, JSON.stringify(data));
        
        // State'i de güncelle
        state.engagementData = data.engagementData;
      }
    } catch (error) {
      logError('updateTimeSpent', error);
    }
  };

  // Sayfa değişikliği için güncellenmiş fonksiyonlar
  const handlePageChange = async () => {
    try {
      state.pageViews.add(window.location.pathname);
      state.currentPage = window.location.pathname;
      
      if (!state.engagementData[state.currentPage]) {
        state.engagementData[state.currentPage] = {
          startTime: Date.now(),
          clicks: 0,
          timeSpent: 0
        };
      }
      
      saveStateToLocalStorage();

      // Sadece engagement verilerini güncelle
      if (state.engagement_id) {
        await updateEngagementData();
      }
    } catch (error) {
      logError('handlePageChange', error);
    }
  };

  const hasRecentInteraction = () => {
    try {
      const currentClickCount = Object.values(state.engagementData).reduce((sum, page) => sum + (page.clicks || 0), 0);
      const currentPageViewCount = state.pageViews.size;
      
      const hasNewInteractions = currentClickCount > state.lastClickCount || 
                               currentPageViewCount > state.lastPageViewCount;

      if (hasNewInteractions) {
        state.lastInteractionTime = Date.now();
        state.lastClickCount = currentClickCount;
        state.lastPageViewCount = currentPageViewCount;
        return true;
      }

      return (Date.now() - state.lastInteractionTime) < 180000; // Son 3 dakika içinde
    } catch (error) {
      logError('hasRecentInteraction', error);
      return false;
    }
  };

  const updateTrackingInterval = () => {
    try {
      const elapsedMinutes = (Date.now() - state.trackingStartTime) / 60000;
      
      // Mevcut interval'ı temizle
      if (state.currentInterval) {
        clearInterval(state.currentInterval);
      }

      // Eğer son 3 dakikada etkileşim yoksa izlemeyi durdur
      if (elapsedMinutes >= 6 && !hasRecentInteraction()) {
        console.log('Tracking stopped due to inactivity');
        return;
      }

      // Zaman aralığına göre yeni interval ayarla
      let intervalTime;
      if (elapsedMinutes <= 1) {
        intervalTime = 10000; // İlk 1 dakika: 10 saniye
      } else if (elapsedMinutes <= 2) {
        intervalTime = 30000; // 2. dakika: 30 saniye
      } else {
        intervalTime = 60000; // 4. dakika ve sonrası: 1 dakika
      }

      state.currentInterval = setInterval(async () => {
        updateTimeSpent();
        if (state.engagement_id) {
          await updateEngagementData();
        }
        updateTrackingInterval(); // Her interval sonunda yeniden değerlendir
      }, intervalTime);

    } catch (error) {
      logError('updateTrackingInterval', error);
    }
  };

  if (initialize()) {
    try {
      // Click event listener
      document.addEventListener('click', () => {
        const savedData = localStorage.getItem(`tracking_data_${state.userId}`);
        if (!savedData) return;

        const data = JSON.parse(savedData);
        if (data.engagementData[state.currentPage]) {
          data.engagementData[state.currentPage].clicks++;
          localStorage.setItem(`tracking_data_${state.userId}`, JSON.stringify(data));
          state.engagementData = data.engagementData;
          state.lastInteractionTime = Date.now(); // Etkileşim zamanını güncelle
        }
      });

      // Sayfa değişikliği takibi
      const originalPushState = history.pushState;
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        handlePageChange();
      };

      window.addEventListener('popstate', handlePageChange);

      // Yeni tracking sistemini başlat
      updateTrackingInterval();

      // Konum izni kontrolünü sadece bir kez yap
      const locationChecked = localStorage.getItem('locationChecked');
      
      if (!locationChecked) {
        if (state.permissionGranted) {
          trackLocation();
        } else {
          navigator.permissions.query({ name: 'geolocation' })
            .then(async permissionStatus => {
              if (permissionStatus.state === 'granted') {
                state.permissionGranted = true;
                localStorage.setItem('locationPermissionGranted', 'true');
                await trackLocation();
              } else if (permissionStatus.state === 'prompt') {
                await trackLocation();
              }
            })
            .catch(error => {
              logError('permissionQuery', error);
            })
            .finally(() => {
              // Konum kontrolünün yapıldığını işaretle
              localStorage.setItem('locationChecked', 'true');
            });
        }
      }
    } catch (error) {
      logError('mainInitialization', error);
    }
  }
})();
