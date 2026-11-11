import * as FileSystem from 'expo-file-system';
import { api, HAS_API, ApiError } from './client';
const BASE = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/,'');
export async function saveMobileVideo(user, file, language, segments) {
  if (!HAS_API || !user?.token) throw new ApiError('net');
  const info = await FileSystem.getInfoAsync(file.uri);
  const size = file.size || info.size;
  if (!Number.isSafeInteger(size) || size<=0 || size>150*1024*1024) throw new ApiError('too_large');
  const mimeType = file.mimeType || (file.name?.endsWith('.webm') ? 'video/webm' : file.name?.endsWith('.mov') ? 'video/quicktime' : 'video/mp4');
  const {video} = await api.createVideo(user.token,{title:file.name || 'Video',fileName:file.name || 'video.mp4',size,mimeType,originalLanguage:language});
  const upload = await FileSystem.uploadAsync(BASE+`/api/videos/${video.id}/file`,file.uri,{
    httpMethod:'PUT',uploadType:FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers:{Authorization:'Bearer '+user.token,'Content-Type':'application/octet-stream'},
  });
  if(upload.status!==201) throw new ApiError('upload_failed');
  await api.saveResults(user.token,video.id,segments);
  return video.id;
}
