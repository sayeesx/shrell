import { useState, useEffect, useRef, useCallback } from 'react';

export interface PostalPincodeData {
  pincode: string;
  city: string;
  state: string;
  district: string;
  postOffices: string[];
  isFallback: boolean;
}

export interface UsePostalPincodeOptions {
  onLookupSuccess?: (data: { city: string; state: string; district: string; isFallback: boolean }) => void;
  debounceMs?: number;
}

export interface UsePostalPincodeResult {
  data: PostalPincodeData | null;
  loading: boolean;
  error: string | null;
  lookupPincode: (pin: string) => Promise<PostalPincodeData | null>;
}

// In-memory cache for fast, zero-duplicate lookups
const pincodeCache = new Map<string, PostalPincodeData>();

/**
 * High-coverage fallback dictionary mapping Indian PIN 2-digit prefixes to State & Primary City Hub.
 * Used instantly when api.postalpincode.in is offline, times out, or experiences network interruptions.
 */
export const INDIAN_PIN_PREFIX_FALLBACK: Record<string, { state: string; city: string; district: string }> = {
  // Delhi & NCR (11)
  '11': { state: 'Delhi', city: 'New Delhi', district: 'New Delhi' },
  // Haryana (12, 13)
  '12': { state: 'Haryana', city: 'Gurugram', district: 'Gurugram' },
  '13': { state: 'Haryana', city: 'Ambala', district: 'Ambala' },
  // Punjab & Chandigarh (14, 15, 16)
  '14': { state: 'Punjab', city: 'Ludhiana', district: 'Ludhiana' },
  '15': { state: 'Punjab', city: 'Bathinda', district: 'Bathinda' },
  '16': { state: 'Chandigarh', city: 'Chandigarh', district: 'Chandigarh' },
  // Himachal Pradesh (17)
  '17': { state: 'Himachal Pradesh', city: 'Shimla', district: 'Shimla' },
  // Jammu & Kashmir & Ladakh (18, 19)
  '18': { state: 'Jammu and Kashmir', city: 'Jammu', district: 'Jammu' },
  '19': { state: 'Jammu and Kashmir', city: 'Srinagar', district: 'Srinagar' },
  // Uttar Pradesh (20 to 28)
  '20': { state: 'Uttar Pradesh', city: 'Aligarh', district: 'Aligarh' },
  '21': { state: 'Uttar Pradesh', city: 'Prayagraj', district: 'Prayagraj' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow', district: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', city: 'Varanasi', district: 'Varanasi' },
  '24': { state: 'Uttarakhand', city: 'Dehradun', district: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', city: 'Meerut', district: 'Meerut' },
  '26': { state: 'Uttarakhand', city: 'Haldwani', district: 'Nainital' },
  '27': { state: 'Uttar Pradesh', city: 'Gorakhpur', district: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', city: 'Agra', district: 'Agra' },
  // Rajasthan (30 to 34)
  '30': { state: 'Rajasthan', city: 'Jaipur', district: 'Jaipur' },
  '31': { state: 'Rajasthan', city: 'Udaipur', district: 'Udaipur' },
  '32': { state: 'Rajasthan', city: 'Kota', district: 'Kota' },
  '33': { state: 'Rajasthan', city: 'Bikaner', district: 'Bikaner' },
  '34': { state: 'Rajasthan', city: 'Jodhpur', district: 'Jodhpur' },
  // Gujarat, Daman & Diu, Dadra & Nagar Haveli (36 to 39)
  '36': { state: 'Gujarat', city: 'Rajkot', district: 'Rajkot' },
  '37': { state: 'Gujarat', city: 'Bhuj', district: 'Kutch' },
  '38': { state: 'Gujarat', city: 'Ahmedabad', district: 'Ahmedabad' },
  '39': { state: 'Gujarat', city: 'Surat', district: 'Surat' },
  // Maharashtra & Goa (40 to 44)
  '40': { state: 'Maharashtra', city: 'Mumbai', district: 'Mumbai' },
  '41': { state: 'Maharashtra', city: 'Pune', district: 'Pune' },
  '42': { state: 'Maharashtra', city: 'Nashik', district: 'Nashik' },
  '43': { state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar', district: 'Aurangabad' },
  '44': { state: 'Maharashtra', city: 'Nagpur', district: 'Nagpur' },
  // Madhya Pradesh & Chhattisgarh (45 to 49)
  '45': { state: 'Madhya Pradesh', city: 'Indore', district: 'Indore' },
  '46': { state: 'Madhya Pradesh', city: 'Bhopal', district: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', city: 'Gwalior', district: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', city: 'Jabalpur', district: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', city: 'Raipur', district: 'Raipur' },
  // Andhra Pradesh & Telangana (50 to 53)
  '50': { state: 'Telangana', city: 'Hyderabad', district: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati', district: 'Tirupati' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada', district: 'Krishna' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam', district: 'Visakhapatnam' },
  // Karnataka (56 to 59)
  '56': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban' },
  '57': { state: 'Karnataka', city: 'Mangaluru', district: 'Dakshina Kannada' },
  '58': { state: 'Karnataka', city: 'Hubballi', district: 'Dharwad' },
  '59': { state: 'Karnataka', city: 'Belagavi', district: 'Belagavi' },
  // Tamil Nadu & Puducherry (60 to 64)
  '60': { state: 'Tamil Nadu', city: 'Chennai', district: 'Chennai' },
  '61': { state: 'Tamil Nadu', city: 'Thanjavur', district: 'Thanjavur' },
  '62': { state: 'Tamil Nadu', city: 'Madurai', district: 'Madurai' },
  '63': { state: 'Tamil Nadu', city: 'Vellore', district: 'Vellore' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore', district: 'Coimbatore' },
  // Kerala & Lakshadweep (67 to 69)
  '67': { state: 'Kerala', city: 'Kozhikode', district: 'Kozhikode' },
  '68': { state: 'Kerala', city: 'Kochi', district: 'Ernakulam' },
  '69': { state: 'Kerala', city: 'Thiruvananthapuram', district: 'Thiruvananthapuram' },
  // West Bengal, Sikkim & Andaman (70 to 74)
  '70': { state: 'West Bengal', city: 'Kolkata', district: 'Kolkata' },
  '71': { state: 'West Bengal', city: 'Howrah', district: 'Howrah' },
  '72': { state: 'West Bengal', city: 'Midnapore', district: 'Paschim Medinipur' },
  '73': { state: 'West Bengal', city: 'Siliguri', district: 'Darjeeling' },
  '74': { state: 'West Bengal', city: 'North 24 Parganas', district: 'North 24 Parganas' },
  // Odisha (75 to 77)
  '75': { state: 'Odisha', city: 'Bhubaneswar', district: 'Khurda' },
  '76': { state: 'Odisha', city: 'Cuttack', district: 'Cuttack' },
  '77': { state: 'Odisha', city: 'Rourkela', district: 'Sundargarh' },
  // Assam & North-Eastern States (78, 79)
  '78': { state: 'Assam', city: 'Guwahati', district: 'Kamrup Metropolitan' },
  '79': { state: 'Assam', city: 'Dibrugarh', district: 'Dibrugarh' },
  // Bihar & Jharkhand (80 to 85)
  '80': { state: 'Bihar', city: 'Patna', district: 'Patna' },
  '81': { state: 'Bihar', city: 'Bhagalpur', district: 'Bhagalpur' },
  '82': { state: 'Bihar', city: 'Gaya', district: 'Gaya' },
  '83': { state: 'Jharkhand', city: 'Ranchi', district: 'Ranchi' },
  '84': { state: 'Bihar', city: 'Muzaffarpur', district: 'Muzaffarpur' },
  '85': { state: 'Jharkhand', city: 'Dhanbad', district: 'Dhanbad' },
};

/**
 * Resolves offline/fast fallback for a given 6-digit Indian PIN code.
 */
export function getFallbackFromPin(pin: string): { state: string; city: string; district: string } | null {
  const clean = pin.trim().replace(/[^0-9]/g, '');
  if (clean.length < 2) return null;
  const prefix = clean.slice(0, 2);
  return INDIAN_PIN_PREFIX_FALLBACK[prefix] || null;
}

/**
 * Non-blocking hook to lookup city, state, and district via api.postalpincode.in with
 * robust offline prefix fallback and in-memory caching.
 *
 * It NEVER blocks form input or disables fields. Users retain full manual editing power.
 */
export function usePostalPincode(
  pincode: string,
  options: UsePostalPincodeOptions = {}
): UsePostalPincodeResult {
  const { onLookupSuccess, debounceMs = 350 } = options;
  const [data, setData] = useState<PostalPincodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedPinRef = useRef<string>('');

  const lookupPincode = useCallback(
    async (pin: string): Promise<PostalPincodeData | null> => {
      const cleanPin = pin.trim().replace(/[^0-9]/g, '');

      // Indian PIN codes are strictly 6 digits beginning with 1-9
      if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
        setData(null);
        setError(cleanPin.length === 6 ? 'Invalid Indian PIN code format' : null);
        return null;
      }

      // Check cache first
      if (pincodeCache.has(cleanPin)) {
        const cached = pincodeCache.get(cleanPin)!;
        setData(cached);
        setError(null);
        if (onLookupSuccess) {
          onLookupSuccess({
            city: cached.city,
            state: cached.state,
            district: cached.district,
            isFallback: cached.isFallback,
          });
        }
        return cached;
      }

      // Abort ongoing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      // Timeout guard: 3.5 seconds before triggering instant fallback
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3500);

      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API returned HTTP ${response.status}`);
        }

        const json = await response.json();

        if (Array.isArray(json) && json[0]?.Status === 'Success' && Array.isArray(json[0]?.PostOffice) && json[0].PostOffice.length > 0) {
          const poList = json[0].PostOffice;
          const primaryPO = poList[0];

          const resolvedCity = primaryPO.District || primaryPO.Block || primaryPO.Name || '';
          const resolvedState = primaryPO.State || '';
          const resolvedDistrict = primaryPO.District || '';
          const postOffices = poList.map((po: any) => po.Name).filter(Boolean);

          const result: PostalPincodeData = {
            pincode: cleanPin,
            city: resolvedCity,
            state: resolvedState,
            district: resolvedDistrict,
            postOffices,
            isFallback: false,
          };

          pincodeCache.set(cleanPin, result);
          setData(result);
          setError(null);

          if (onLookupSuccess) {
            onLookupSuccess({
              city: resolvedCity,
              state: resolvedState,
              district: resolvedDistrict,
              isFallback: false,
            });
          }

          return result;
        }

        // If API returned "Error" or empty PostOffice list, use offline fallback
        throw new Error(json[0]?.Message || 'Pincode not found on central postal registry');
      } catch (err: any) {
        clearTimeout(timeoutId);

        // Don't flag aborted requests if user simply typed another digit
        if (err.name === 'AbortError' && cleanPin !== lastFetchedPinRef.current) {
          return null;
        }

        // Graceful non-blocking fallback
        const fallback = getFallbackFromPin(cleanPin);
        if (fallback) {
          const fallbackResult: PostalPincodeData = {
            pincode: cleanPin,
            city: fallback.city,
            state: fallback.state,
            district: fallback.district,
            postOffices: [fallback.city],
            isFallback: true,
          };

          pincodeCache.set(cleanPin, fallbackResult);
          setData(fallbackResult);
          setError(null);

          if (onLookupSuccess) {
            onLookupSuccess({
              city: fallback.city,
              state: fallback.state,
              district: fallback.district,
              isFallback: true,
            });
          }

          return fallbackResult;
        }

        setError('Unable to autofill location. Please enter city and state manually.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onLookupSuccess]
  );

  useEffect(() => {
    const cleanPin = pincode.trim().replace(/[^0-9]/g, '');

    if (cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setData(null);
      return;
    }

    if (cleanPin === lastFetchedPinRef.current) {
      return;
    }

    lastFetchedPinRef.current = cleanPin;

    const handler = setTimeout(() => {
      lookupPincode(cleanPin);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [pincode, debounceMs, lookupPincode]);

  return { data, loading, error, lookupPincode };
}
