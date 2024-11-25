(function () {
  // Configuration
  const BACKEND_URL = 'https://zggqodvdlofupzqbdgzv.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ3FvZHZkbG9mdXB6cWJkZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MTkyNDQsImV4cCI6MjA0NzE5NTI0NH0.ZjBAhbdyh79LpMXuRreSTX2ubjExdaD2vR9K9WOTTDo';
  const GOOGLE_MAPS_API_KEY = 'AIzaSyDhxNCafamGLliFy6kCQ3K_tJSbTRmUUUE';

  // State management
  let state = {
    startTime: Date.now(),
    pageViews: new Set([window.location.pathname]),
    clickCount: 0,
    currentPage: window.location.pathname,
    userId: null,
    isTracking: false,
    lastUpdate: null,
    updateInterval: 5 * 60 * 1000, // 5 minutes
    minimumTimeBetweenUpdates: 30 * 1000 // 30 seconds
  };

  // Get current script
  const getCurrentScript = () => {
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
      if (script.src.includes('tracker.js') && script.getAttribute('data-user-id')) {
        return script;
      }
    }
    return null;
  };

  // Initialize tracker
  const initialize = () => {
    const script = getCurrentScript();
    if (!script) {
      console.error('Tracker initialization failed: data-user-id not found');
      return false;
    }

    state.userId = script.getAttribute('data-user-id');
    if (!state.userId) {
      console.error('Tracker initialization failed: invalid user ID');
      return false;
    }

    return true;
  };

  // Calculate engagement score
  const calculateEngagementScore = () => {
    const timeSpentSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    
    // Time score (T)
    let timeScore;
    if (timeSpentSeconds <= 30) timeScore = 1;
    else if (timeSpentSeconds <= 60) timeScore = 3;
    else if (timeSpentSeconds <= 90) timeScore = 6;
    else if (timeSpentSeconds <= 120) timeScore = 7;
    else if (timeSpentSeconds <= 180) timeScore = 9;
    else timeScore = 10;

    // Page views score (P)
    let pageViewScore;
    const pageViewCount = state.pageViews.size;
    if (pageViewCount === 1) pageViewScore = 1;
    else if (pageViewCount <= 3) pageViewScore = 5;
    else if (pageViewCount <= 5) pageViewScore = 6;
    else if (pageViewCount <= 7) pageViewScore = 7;
    else pageViewScore = 10;

    // Click score (C)
    let clickScore;
    if (state.clickCount === 0) clickScore = 1;
    else if (state.clickCount <= 2) clickScore = 5;
    else clickScore = 10;

    // Weights
    const w1 = 0.3; // Time weight
    const w2 = 0.4; // Page views weight
    const w3 = 0.3; // Click weight

    // Final engagement score
    return {
      total: Math.round((w1 * timeScore + w2 * pageViewScore + w3 * clickScore) * 10) / 10,
      details: {
        timeSpent: timeSpentSeconds,
        timeScore,
        pageViews: pageViewCount,
        pageViewScore,
        clicks: state.clickCount,
        clickScore
      }
    };
  };

  // Get address from coordinates
  async function getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=tr&result_type=street_address|premise`
      );
      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error(data.error_message);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('Address not found');
      }

      const result = data.results[0];
      let streetAddress = '';
      let city = '';
      let country = '';

      // Parse address components
      result.address_components.forEach((component) => {
        if (component.types.includes('street_number')) {
          streetAddress = component.long_name + ' ' + streetAddress;
        }
        if (component.types.includes('route')) {
          streetAddress = streetAddress + component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      });

      return {
        address: result.formatted_address,
        streetAddress: streetAddress.trim(),
        city,
        country
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        address: '',
        streetAddress: '',
        city: '',
        country: ''
      };
    }
  }

  // Send location data
  async function sendLocationData(locationData) {
    try {
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
        throw new Error(`Failed to send location data: ${response.statusText}`);
      }

      state.lastUpdate = Date.now();
    } catch (error) {
      console.error('Error sending location data:', error);
    }
  }

  // Track location
  async function trackLocation() {
    if (!state.userId || !state.isTracking) return;

    // Check if enough time has passed since last update
    if (state.lastUpdate && (Date.now() - state.lastUpdate) < state.minimumTimeBetweenUpdates) {
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const addressInfo = await getAddressFromCoordinates(latitude, longitude);
      const engagementScore = calculateEngagementScore();

      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
      };

      await sendLocationData({
        latitude,
        longitude,
        ...addressInfo,
        engagementData: engagementScore,
        deviceInfo
      });
    } catch (error) {
      console.error('Error tracking location:', error);
    }
  }

  // Event handlers
  const handlePageView = () => {
    state.pageViews.add(window.location.pathname);
    state.currentPage = window.location.pathname;
  };

  const handleClick = () => {
    state.clickCount++;
  };

  const handleBeforeUnload = () => {
    if (state.isTracking) {
      trackLocation();
    }
  };

  // Show permission prompt
  function showPermissionPrompt() {
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

    document.getElementById('acceptLocation').onclick = () => {
      promptDiv.remove();
      state.isTracking = true;
      trackLocation();
      setInterval(trackLocation, state.updateInterval);
    };

    document.getElementById('denyLocation').onclick = () => {
      promptDiv.remove();
      state.isTracking = false;
    };
  }

  // Initialize tracking
  if (initialize()) {
    // Set up event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle page navigation (for SPAs)
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      handlePageView();
    };
    
    window.addEventListener('popstate', handlePageView);

    // Start tracking
    showPermissionPrompt();
  }
})();