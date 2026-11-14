import { localTranslate, getOllamaStatus } from '../src/localTranslate.js';
const status=await getOllamaStatus();
console.log('Ollama reachable:',status.reachable,'model downloaded:',status.modelReady);
if(!status.reachable||!status.modelReady){
  console.error('OLLAMA_NOT_READY: xem docker compose logs ollama-init; docker compose exec ollama ollama list');
  process.exit(1);
}
const trials=[
  ['vi','en','Thêm 2 muỗng đường vào nồi.'],
  ['en','vi','Boil the water for five minutes.'],
  ['vi','zh','Nấu gạo trong 20 phút.'],
  ['zh','vi','加入两勺盐。'],
  ['en','zh','Add one spoon of salt.'],
  ['zh','en','煮沸后加入牛奶。'],
];
let failures=0;
for(const [from,to,input] of trials){
  try {const result=await localTranslate(input,from,to);console.log(`${from}->${to}: ${input} => ${result}`);
    if(!result||result===input){console.error('Không xác nhận được kết quả dịch mới');failures++;}}
  catch(e){console.error(`${from}->${to}: FAILED ${e.code||e.message}`);failures++;}
}
if(failures){console.error('OLLAMA_TRANSLATION_TEST_FAILED',failures);process.exitCode=1;}
else console.log('OLLAMA_TRANSLATION_TEST_PASSED (6 chiều, model thực trong Docker)');
