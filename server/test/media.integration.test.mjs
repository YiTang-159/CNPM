import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { produceVoiceover } from '../src/audioExport.js';

function command(program,args){const p=spawnSync(program,args,{encoding:'utf8',timeout:60000});
  assert.equal(p.status,0,`Command ${program} ${args[0]} failed: ${p.stderr||p.error}`);
  return p.stdout.trim();
}
test('REAL ffmpeg + espeak-ng renders VI/EN/ZH MP3 and muxes MP4', {skip:process.env.MEDIA_INTEGRATION!=='true',timeout:180000}, async()=>{
  const dir=await mkdtemp(join(tmpdir(),'dubchef-media-ci-'));
  try {
    const video=join(dir,'sample.mp4');
    command('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=black:s=320x240:r=10:d=4',
      '-c:v','libx264','-pix_fmt','yuv420p',video]);
    for(const [language,text] of [['vi','Xin chào'],['en','Hello'],['zh','你好']]){
      const out=await produceVoiceover({content:[{start:0,end:4,text}],language,format:'mp3'});
      try {assert.ok((await stat(out.output)).size>200);
        assert.equal(command('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name',
          '-of','default=noprint_wrappers=1:nokey=1',out.output]),'mp3');}
      finally {await rm(out.directory,{recursive:true,force:true});}
    }
    const output=await produceVoiceover({content:[{start:0,end:4,text:'Hello'}],language:'en',format:'mp4',sourceVideo:video});
    try {assert.ok((await stat(output.output)).size>1000);
      assert.equal(command('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name',
        '-of','default=noprint_wrappers=1:nokey=1',output.output]),'aac');
      assert.equal(command('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name',
        '-of','default=noprint_wrappers=1:nokey=1',output.output]),'h264');}
    finally {await rm(output.directory,{recursive:true,force:true});}
  }finally{await rm(dir,{recursive:true,force:true});}
});
