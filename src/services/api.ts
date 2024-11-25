const TRESTLEIQ_API_KEY = import.meta.env.VITE_TRESTLEIQ_API_KEY;
const TRESTLEIQ_API_URL = 'https://api.trestleiq.com/v1';

export const reverseAddressLookup = async (latitude: number, longitude: number): Promise<any> => {
  try {
    const response = await fetch(`${TRESTLEIQ_API_URL}/reverse-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRESTLEIQ_API_KEY}`
      },
      body: JSON.stringify({
        latitude,
        longitude,
        include_user_data: true
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Reverse address lookup error:', error);
    throw error;
  }
};