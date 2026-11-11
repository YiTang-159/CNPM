import * as FileSystem from 'expo-file-system';
import { api } from '../api/client';
import { saveMobileVideo } from '../api/video';
jest.mock('expo-file-system',()=>({getInfoAsync:jest.fn(),uploadAsync:jest.fn(),FileSystemUploadType:{BINARY_CONTENT:0}}));
jest.mock('../api/client',()=>({HAS_API:true,ApiError:class extends Error{},api:{createVideo:jest.fn(),saveResults:jest.fn()}}));
const user={token:'real-token'},file={uri:'file:///video.mp4',name:'video.mp4',size:5,mimeType:'video/mp4'};
beforeEach(()=>{jest.clearAllMocks();FileSystem.getInfoAsync.mockResolvedValue({size:5});api.createVideo.mockResolvedValue({video:{id:7}});FileSystem.uploadAsync.mockResolvedValue({status:201});api.saveResults.mockResolvedValue({ok:true});});
test('mobile saves metadata then binary file then results with same authenticated video id',async()=>{
  const lines=[{vi:'Xin chào',start:0,end:2}];
  expect(await saveMobileVideo(user,file,'vi',lines)).toBe(7);
  expect(api.createVideo).toHaveBeenCalledWith('real-token',expect.objectContaining({fileName:'video.mp4',size:5}));
  expect(FileSystem.uploadAsync).toHaveBeenCalledWith(expect.stringContaining('/api/videos/7/file'),'file:///video.mp4',expect.objectContaining({httpMethod:'PUT',headers:expect.objectContaining({Authorization:'Bearer real-token'})}));
  expect(api.saveResults).toHaveBeenCalledWith('real-token',7,lines);
});
test('failed binary upload must not report saved results',async()=>{
  FileSystem.uploadAsync.mockResolvedValue({status:500});
  await expect(saveMobileVideo(user,file,'vi',[])).rejects.toThrow();
  expect(api.saveResults).not.toHaveBeenCalled();
});
test('guest cannot save and oversized video is rejected before metadata creation',async()=>{
  await expect(saveMobileVideo(null,file,'vi',[])).rejects.toThrow();
  await expect(saveMobileVideo(user,{...file,size:151*1024*1024},'vi',[])).rejects.toThrow();
  expect(api.createVideo).not.toHaveBeenCalled();
});
