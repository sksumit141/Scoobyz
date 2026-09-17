import { Platform } from 'react-native';
import { File } from 'expo-file-system';

const MIME_TYPES = {
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const getFileName = (uri, fallbackName) => {
  const cleanUri = String(uri).split(/[?#]/)[0];
  const encodedName = cleanUri.split('/').pop();

  if (!encodedName) return fallbackName;

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return encodedName;
  }
};

const getMimeType = (fileName, fallbackType) => {
  if (fallbackType) return fallbackType;
  const extension = fileName.split('.').pop()?.toLowerCase();
  return MIME_TYPES[extension] || 'image/jpeg';
};

/**
 * Appends an image in the format supported by Expo's fetch implementation.
 * Expo SDK 57 no longer serializes React Native's legacy { uri, name, type }
 * FormData part, so native uploads must expose the file bytes instead.
 */
export const appendImageToFormData = async (
  formData,
  fieldName,
  uri,
  { fileName, mimeType, fallbackName = 'photo.jpg' } = {}
) => {
  if (!uri) return;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Unable to read the selected image.');
    }
    const blob = await response.blob();
    const resolvedName = fileName || getFileName(uri, fallbackName);
    formData.append(fieldName, blob, resolvedName);
    return;
  }

  const file = new File(uri);
  const resolvedName = fileName || file.name || getFileName(uri, fallbackName);
  const resolvedType = getMimeType(resolvedName, mimeType || file.type);

  formData.append(fieldName, {
    name: resolvedName,
    type: resolvedType,
    bytes: () => file.bytes(),
  });
};
