import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface NativeDirectory {
  uri: string;
  create: (options: { intermediates: boolean; idempotent: boolean }) => void;
}
interface NativeFile { uri: string; copy: (destination: NativeFile) => void }
interface CompatibleFileSystem {
  File?: new (...paths: (string | NativeDirectory)[]) => NativeFile;
  Directory?: new (...paths: (string | NativeDirectory)[]) => NativeDirectory;
  Paths?: { document: NativeDirectory };
  documentDirectory?: string | null;
  makeDirectoryAsync?: (path: string, options: { intermediates: boolean }) => Promise<void>;
  copyAsync?: (options: { from: string; to: string }) => Promise<void>;
}
// SDK 53 uses the original API; newer SDKs expose File/Directory at this same import.
const fileSystem = FileSystem as unknown as CompatibleFileSystem;

// Device-local profile images: durable native files; compressed data URLs on web.
export type ProfilePhotoSource = 'library' | 'files' | 'camera';
export async function selectProfilePhoto(source: ProfilePhotoSource = 'library'): Promise<string | null> {
  let uri: string;
  if (source === 'files') {
    const document = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true, multiple: false });
    if (document.canceled || !document.assets[0]) return null;
    if ((document.assets[0].size ?? 0) > 10 * 1024 * 1024) throw new Error('photo_size');
    uri = document.assets[0].uri;
  } else {
    if (Platform.OS !== 'web') {
      const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error(source === 'camera' ? 'camera_permission' : 'photo_permission');
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 };
    const selected = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (selected.canceled || !selected.assets[0]) return null;
    uri = selected.assets[0].uri;
  }
  const image = await ImageManipulator.manipulateAsync(
    uri, [{ resize: { width: 512 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: Platform.OS === 'web' },
  );
  if (Platform.OS === 'web') {
    if (!image.base64) throw new Error('photo_error');
    return `data:image/jpeg;base64,${image.base64}`;
  }
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  if (fileSystem.File && fileSystem.Directory && fileSystem.Paths?.document) {
    const directory = new fileSystem.Directory(fileSystem.Paths.document, 'profile-photos');
    directory.create({ intermediates: true, idempotent: true });
    const destination = new fileSystem.File(directory, filename);
    new fileSystem.File(image.uri).copy(destination);
    return destination.uri;
  }
  if (!fileSystem.documentDirectory || !fileSystem.makeDirectoryAsync || !fileSystem.copyAsync) throw new Error('photo_error');
  const directory = `${fileSystem.documentDirectory}profile-photos/`;
  await fileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${filename}`;
  await fileSystem.copyAsync({ from: image.uri, to: destination });
  return destination;
}
