import test from 'node:test';
import assert from 'node:assert/strict';
import { validMediaLines, validateFeedback, mediaTransitionError } from '../src/adminPolicy.js';

test('đoạn phụ đề/thuyết minh phải có thứ tự, không chồng lấn',()=>{
  assert.equal(validMediaLines([{start:0,end:2,text:'Xin chào'},{start:2,end:4,text:'Thế giới'}]),true);
  assert.equal(validMediaLines([{start:0,end:2,text:'A'},{start:1,end:4,text:'B'}]),false);
  assert.equal(validMediaLines([{start:2,end:2,text:'A'}]),false);
  assert.equal(validMediaLines([{start:-1,end:2,text:'A'}]),false);
  assert.equal(validMediaLines([{start:0,end:2,text:' '}]),false);
});
test('chỉ xuất bản nội dung đã chờ duyệt, không sửa khi xuất bản',()=>{
  const draft={status:'draft',content:'[]'};
  const review={status:'reviewing',content:'[]'};
  const published={status:'published',content:'[]'};
  assert.equal(mediaTransitionError(draft,'published','[]'),'review_required');
  assert.equal(mediaTransitionError(review,'published','[]'),null);
  assert.equal(mediaTransitionError(review,'published','[1]'),'review_required');
  assert.equal(mediaTransitionError(published,'reviewing','[1]'),'reopen_required');
  assert.equal(mediaTransitionError(published,'draft','[1]'),null);
});
test('giải quyết phản hồi bắt buộc có câu trả lời',()=>{
  assert.equal(validateFeedback({status:'resolved',priority:'high',reply:''}),false);
  assert.equal(validateFeedback({status:'resolved',priority:'high',reply:'Đã kiểm tra và xử lý'}),true);
  assert.equal(validateFeedback({status:'reviewing',priority:'normal',reply:''}),true);
  assert.equal(validateFeedback({status:'new',priority:'unknown',reply:'abc'}),false);
});
