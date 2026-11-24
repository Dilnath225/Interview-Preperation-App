import { Platform } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const PRESET_CANDIDATE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
];

export const PRESET_COMPANY_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80', // Futuristic Gradient
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&auto=format&fit=crop&q=80', // Tech Monogram
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80', // Enterprise FinTech
  'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=400&auto=format&fit=crop&q=80', // Cyber Modern
  'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400&auto=format&fit=crop&q=80', // AI Cloud
];

// Helper to safely load expo-image-picker
export const getExpoImagePicker = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker');
  } catch (e) {
    console.warn('expo-image-picker is unavailable in this environment:', e);
    return null;
  }
};

/**
 * Universal safe image URL resolver
 */
export const resolveImageUrl = (raw?: string | null): { uri: string } | null => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed === 'data:image/jpeg;base64,undefined' ||
    trimmed === 'data:image/png;base64,undefined' ||
    trimmed === 'null' ||
    trimmed === 'undefined'
  ) {
    return null;
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { uri: trimmed };
  }
  const base = API_BASE_URL.replace(/\/api$/, '');
  return { uri: `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}` };
};

/**
 * Compress an image file/blob to a lightweight base64 data URL in web browser
 */
const compressWebImage = (file: File | Blob, maxSize = 256, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Pick image from gallery / file dialog across Web, iOS, and Android
 * Returns { dataUrl, asset, file }
 */
export const pickImageUniversal = async (
  options?: { maxSize?: number; quality?: number }
): Promise<{ dataUrl: string; asset?: any; file?: any } | null> => {
  const maxSize = options?.maxSize || 256;
  const quality = options?.quality || 0.82;

  // Web platform fallback using native input element
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/jpg';
      input.style.display = 'none';

      input.onchange = async (event: any) => {
        const file = event.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const dataUrl = await compressWebImage(file, maxSize, quality);
          resolve({ dataUrl, file });
        } catch (err) {
          console.warn('Web image compression error:', err);
          resolve(null);
        } finally {
          document.body.removeChild(input);
        }
      };

      input.onerror = () => {
        resolve(null);
        try {
          document.body.removeChild(input);
        } catch (_) {}
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  // Native iOS / Android or fallback to expo-image-picker
  const picker = getExpoImagePicker();
  if (!picker) {
    throw new Error('Image picker module is not available.');
  }

  const { status } = await picker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera roll permissions are required to select a photo.');
  }

  const result = await picker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const dataUrl = asset.base64
    ? `data:image/jpeg;base64,${asset.base64}`
    : asset.uri;

  return { dataUrl, asset };
};

/**
 * Capture photo from camera
 */
export const captureCameraUniversal = async (): Promise<{ dataUrl: string; asset?: any } | null> => {
  const picker = getExpoImagePicker();
  if (!picker) {
    throw new Error('Camera module is not available.');
  }

  const { status } = await picker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission is required to capture a photo.');
  }

  const result = await picker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const dataUrl = asset.base64
    ? `data:image/jpeg;base64,${asset.base64}`
    : asset.uri;

  return { dataUrl, asset };
};
