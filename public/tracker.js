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
    engagementSent: false,
    locationData: null,
  };

  const logError = (context, error) => {
    console.error(`[Hata - ${context}]`, error);
    if (error instanceof Error) {
      console.error(`[Detay - ${context}]`, error.message, error.stack);
    } else {
      console.error(`[Detay - ${context}]`, error);
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
      return true;
    } catch (error) {
      logError('initialize', error);
      return false;
    }
  };

  const calculateEngagementScore = () => {
    try {
      const timeSpentSeconds = Math.floor((Date.now() - state.startTime) / 1000);

      let timeScore = timeSpentSeconds <= 30 ? 1
        : timeSpentSeconds <= 60 ? 3
        : timeSpentSeconds <= 90 ? 6
        : timeSpentSeconds <= 120 ? 7
        : timeSpentSeconds <= 180 ? 9 : 10;

      let pageViewScore = state.pageViews.size === 1 ? 1
        : state.pageViews.size <= 3 ? 5
        : state.pageViews.size <= 5 ? 6
        : state.pageViews.size <= 7 ? 7 : 10;

      let clickScore = state.clickCount === 0 ? 1
        : state.clickCount <= 2 ? 5 : 10;

      const w1 = 0.3, w2 = 0.4, w3 = 0.3;

      return {
        total: Math.round((w1 * timeScore + w2 * pageViewScore + w3 * clickScore) * 10) / 10,
        details: {
          timeSpent: timeSpentSeconds,
          timeScore,
          pageViews: state.pageViews.size,
          pageViewScore,
          clicks: state.clickCount,
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
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=tr`
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
  
      // En iyi eşleşmeyi seç
      const result = data.results[0]; // İlk sonucu alın (en yüksek eşleşme)
  
      let streetAddress = '';
      let city = '';
      let country = '';
      let postalCode = '';
  
      result.address_components.forEach((component) => {
        if (component.types.includes('street_number')) {
          streetAddress = component.long_name + ' ' + streetAddress;
        }
        if (component.types.includes('route')) {
          streetAddress += component.long_name;
        }
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          city = component.long_name; // İlgili alanları doldurun
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });
  
      return {
        address: result.formatted_address,
        streetAddress: streetAddress.trim(),
        city,
        country,
        postalCode,
      };
    } catch (error) {
      logError('getAddressFromCoordinates', error);
      return { address: '', streetAddress: '', city: '', country: '', postalCode: '' };
    }
  }

  async function sendLocationData(locationData) {
    try {
      if (state.locationSent) return;

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
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          city: locationData.city,
          country: locationData.country,
          page_url: state.currentPage,
          engagement_data: locationData.engagementData,
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

  async function sendEngagementData(engagementData) {
    try {
      const response = await fetch(`${BACKEND_URL}/rest/v1/engagements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: state.userId,
          page_url: state.currentPage,
          engagement_data: engagementData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Supabase API error: ${errorDetails.message}`);
      }
    } catch (error) {
      logError('sendEngagementData', error);
    }
  }

  const handleBeforeUnload = async () => {
    try {
      if (!state.engagementSent) {
        const engagementScore = calculateEngagementScore();
        await sendEngagementData(engagementScore);
        state.engagementSent = true;
      }
    } catch (error) {
      logError('handleBeforeUnload', error);
    }
  };

  async function trackInitialLocation() {
    if (state.locationSent) return;
  
    try {
      // Tarayıcı yerleşik iznini kullan
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
  
      if (permissionStatus.state === 'denied') {
        console.warn('Kullanıcı konum iznini reddetti.');
        return;
      }
  
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
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
  
      const engagementScore = calculateEngagementScore();
  
      state.locationData = {
        latitude,
        longitude,
        ...addressInfo,
        deviceInfo,
        engagementData: engagementScore,
      };
  
      await sendLocationData(state.locationData);
    } catch (error) {
      logError('trackInitialLocation', error);
    }
  }
  
  // Kullanıcıdan izni yalnızca tarayıcı sormakla ilgilenin.
  if (initialize()) {
    try {
      document.addEventListener('click', () => state.clickCount++);
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      const originalPushState = history.pushState;
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        state.pageViews.add(window.location.pathname);
        state.currentPage = window.location.pathname;
        state.engagementSent = false;
        const engagementScore = calculateEngagementScore();
        sendEngagementData(engagementScore);
      };
  
      window.addEventListener('popstate', () => {
        state.pageViews.add(window.location.pathname);
        state.currentPage = window.location.pathname;
        state.engagementSent = false;
        const engagementScore = calculateEngagementScore();
        sendEngagementData(engagementScore);
      });
  
      // Popup göstermek yerine doğrudan konum izlemeyi başlat
      trackInitialLocation();
    } catch (error) {
      logError('mainInitialization', error);
    }
  }

  /*
  function showPermissionPrompt() {
    try {
      const hasPermissionPrompted = localStorage.getItem('locationPermissionGranted');
      if (hasPermissionPrompted) return;

      const promptDiv = document.createElement('div');
      promptDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;

      promptDiv.innerHTML = `
        <div>
          <p style="margin: 0 0 5px 0; font-weight: 500;">Konum İzni</p>
          <p style="margin: 0; font-size: 14px; color: #666;">
            Size daha iyi hizmet verebilmek için konum bilginize ihtiyacımız var.
          </p>
        </div>
        <button id="acceptLocation" style="
          background: #4F46E5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        ">İzin Ver</button>
        <button id="denyLocation" style="
          background: #EEE;
          color: #333;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        ">Reddet</button>
      `;

      document.body.appendChild(promptDiv);

      document.getElementById('acceptLocation').onclick = async () => {
        localStorage.setItem('locationPermissionGranted', 'true');
        promptDiv.remove();
        state.isTracking = true;
        await trackInitialLocation();
      };

      document.getElementById('denyLocation').onclick = () => {
        localStorage.setItem('locationPermissionGranted', 'false');
        promptDiv.remove();
        state.isTracking = false;
      };
    } catch (error) {
      logError('showPermissionPrompt', error);
    }
  } */

  if (initialize()) {
    try {
      document.addEventListener('click', () => state.clickCount++);
      window.addEventListener('beforeunload', handleBeforeUnload);

      const originalPushState = history.pushState;
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        state.pageViews.add(window.location.pathname);
        state.currentPage = window.location.pathname;
        state.engagementSent = false;
        const engagementScore = calculateEngagementScore();
        sendEngagementData(engagementScore);
      };

      window.addEventListener('popstate', () => {
        state.pageViews.add(window.location.pathname);
        state.currentPage = window.location.pathname;
        state.engagementSent = false;
        const engagementScore = calculateEngagementScore();
        sendEngagementData(engagementScore);
      });

      showPermissionPrompt();
    } catch (error) {
      logError('mainInitialization', error);
    }
  }
})();