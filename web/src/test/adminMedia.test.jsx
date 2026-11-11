import { beforeEach,describe,expect,it,vi } from 'vitest';
import { render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminMediaResults from '../pages/AdminMediaResults.jsx';
import SavedVideo from '../components/SavedVideo.jsx';
import { manageApi,workApi } from '../api/workflows.js';
vi.mock('../api/workflows.js',()=>({manageApi:{mediaIndex:vi.fn(),videos:vi.fn(),languages:vi.fn(),mediaDetail:vi.fn(),mediaHistory:vi.fn(),saveMedia:vi.fn()},workApi:{downloadVideo:vi.fn(),videoResults:vi.fn()}}));
beforeEach(()=>{
  vi.clearAllMocks();manageApi.mediaIndex.mockResolvedValue({items:[{id:9,videoId:1,title:'Phở',userEmail:'a@example.com',language:'vi',status:'draft',version:2}]});
  manageApi.videos.mockResolvedValue({videos:[{id:1,title:'Phở'}]});manageApi.languages.mockResolvedValue({languages:[{code:'vi',status:'active'}]});
  manageApi.mediaDetail.mockResolvedValue({item:{videoId:1,language:'vi',version:2,status:'draft',content:JSON.stringify([{text:'Đun nước',start:0,end:3}])}});
  manageApi.mediaHistory.mockResolvedValue({history:[{id:1,version:2,status:'draft',editor:'admin@example.com',changedAt:'2026-11-11T00:00:00Z'}]});manageApi.saveMedia.mockResolvedValue({version:3});
});
describe('Current Admin media workflow',()=>{
 it('opens SQL content and saves exact video language version and timeline',async()=>{
  const user=userEvent.setup();render(<AdminMediaResults kind="narrations"/>);
  await user.click(await screen.findByRole('button',{name:'Mở'}));
  expect(await screen.findByDisplayValue('Đun nước')).toBeInTheDocument();expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Nội dung dòng 1'));await user.type(screen.getByLabelText('Nội dung dòng 1'),'Lời mới');
  await user.click(screen.getByRole('button',{name:'Lưu vào SQL Server'}));
  expect(manageApi.saveMedia).toHaveBeenCalledWith('narrations',1,'vi',{version:2,status:'draft',lines:[{start:0,end:3,text:'Lời mới'}]});
 });
 it('invalid timing never sends a save request',async()=>{
  const user=userEvent.setup();render(<AdminMediaResults kind="subtitles"/>);await user.click(await screen.findByRole('button',{name:'Mở'}));
  const end=await screen.findByLabelText('Kết thúc dòng 1');await user.clear(end);await user.type(end,'0');
  await user.click(screen.getByRole('button',{name:'Lưu vào SQL Server'}));expect(manageApi.saveMedia).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('không chồng lấn');
 });
 it('version conflict preserves the unsaved editor and explains reload',async()=>{
  manageApi.saveMedia.mockRejectedValue(Object.assign(new Error('conflict'),{code:'conflict'}));
  const user=userEvent.setup();render(<AdminMediaResults kind="subtitles"/>);await user.click(await screen.findByRole('button',{name:'Mở'}));
  await screen.findByLabelText('Nội dung dòng 1');await user.click(screen.getByRole('button',{name:'Lưu vào SQL Server'}));
  expect(await screen.findByText(/Bản ghi đã được người khác sửa/)).toBeInTheDocument();expect(screen.getByLabelText('Nội dung dòng 1')).toHaveValue('Đun nước');
 });
 it('saved viewer loads protected file and SQL subtitles, reports download failure',async()=>{
  workApi.downloadVideo.mockRejectedValue(new Error('offline'));workApi.videoResults.mockResolvedValue({subtitles:[]});
  render(<SavedVideo video={{id:1,title:'Phở'}} onClose={()=>{}}/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không mở được');
  expect(workApi.downloadVideo).toHaveBeenCalledWith(1);expect(workApi.videoResults).toHaveBeenCalledWith(1);
 });
});
