// NGUỒN DUY NHẤT của nội dung 3 ngôn ngữ. Sửa ở đây rồi chạy: npm run sync
export const LANGS=['vi','en','zh'];
export const I={
skip:["Bỏ qua đến nội dung","Skip to content","跳到正文"],
menu:["Mở menu","Open menu","打开菜单"],
navlabel:["Điều hướng chính","Main navigation","主导航"],
langlabel:["Ngôn ngữ giao diện","Interface language","界面语言"],
nav_features:["Tính năng","Features","功能"],
nav_demo:["Trải nghiệm","Demo","体验"],
nav_pricing:["Bảng giá","Pricing","价格"],
pr_title:["Bảng giá đơn giản","Simple pricing","简单透明的价格"],
pr_sub:["Giá dưới đây mang tính minh họa cho đồ án.","Prices below are illustrative for this course project.","以下价格仅为课程项目的示例。"],
pr_monthly:["Theo tháng","Monthly","按月"],
pr_yearly:["Theo năm (giảm 20%)","Yearly (20% off)","按年（八折）"],
pr_per:["/tháng","/month","/月"],
nav_about:["Giới thiệu","About","关于"],
nav_faq:["Câu hỏi thường gặp","FAQ","常见问题"],
nav_contact:["Liên hệ","Contact","联系"],
nav_login:["Đăng nhập","Log in","登录"],
nav_register:["Dùng thử miễn phí","Try it free","免费试用"],

pt_home:["Lồng tiếng tự động cho video nấu ăn","Automatic dubbing for cooking videos","烹饪视频自动配音"],
h_title:["Một video nấu ăn, ba giọng đọc.","One cooking video, three voices.","一个烹饪视频，三种配音。"],
h_sub:["Dubchef nghe lời hướng dẫn trong video, dịch sang tiếng Việt, tiếng Anh và tiếng Trung, rồi đọc lại bằng giọng tự nhiên, khớp với từng bước nấu.","Dubchef listens to the instructions in your video, translates them into Vietnamese, English and Chinese, then reads them back in a natural voice, timed to each cooking step.","Dubchef 会听取视频中的讲解，翻译成越南语、英语和中文，再用自然的声音朗读，并与每个烹饪步骤对齐。"],
h_cta1:["Thử với video mẫu","Try the sample video","试试示例视频"],
h_cta2:["Xem tính năng","See features","查看功能"],
rec_name:["Trứng xào cà chua","Tomato and egg stir-fry","番茄炒蛋"],
step:["Bước","Step","步骤"],
how_title:["Từ video gốc đến bản lồng tiếng trong bốn bước","From original video to dubbed version in four steps","从原视频到配音版，只需四步"],
s1t:["Tải video lên","Upload your video","上传视频"],
s1d:["Chọn tệp hoặc dán liên kết video nấu ăn của bạn.","Choose a file or paste the link to your cooking video.","选择文件或粘贴你的烹饪视频链接。"],
s2t:["Nhận dạng giọng nói","Recognize speech","识别语音"],
s2d:["Lời nói được chuyển thành văn bản và tách theo từng câu hướng dẫn.","Speech becomes text, split into one line per instruction.","语音转成文字，并按每条讲解拆分。"],
s3t:["Dịch thuật","Translate","翻译"],
s3d:["Từng câu được dịch sang ba ngôn ngữ, giữ đúng tên nguyên liệu và định lượng.","Each line is translated into three languages, keeping ingredient names and quantities intact.","每句话被翻译成三种语言，并保留食材名称和用量。"],
s4t:["Lồng tiếng và xuất bản","Dub and export","配音并导出"],
s4d:["Giọng đọc được ghép vào video kèm phụ đề, sẵn sàng để tải xuống.","The voice is placed on the video with subtitles, ready to download.","配音与字幕合成到视频中，可直接下载。"],
p3:["Tổng hợp giọng đọc","Generate voices","合成配音"],
langs_title:["Dịch đúng theo cách mỗi nơi nấu ăn","Translated the way each place cooks","按各地的烹饪习惯来翻译"],
l_vi_d:["Giữ đúng các kỹ thuật như xào, kho, om và chiên giòn thay vì dịch theo nghĩa đen.","Keeps techniques such as xào (stir-fry), kho (braise) and om (slow-simmer) instead of translating them literally.","保留 xào（炒）、kho（红烧式炖煮）、om（焖）等越南烹饪技法的叫法，不做生硬直译。"],
l_en_d:["Đổi đơn vị sang thìa canh, cốc và độ F khi cần, để người xem ở Mỹ nấu theo được ngay.","Converts to tablespoons, cups and °F when needed, so viewers in the US can follow along right away.","必要时换算成汤匙、杯和华氏度，让美国观众可以直接照做。"],
l_zh_d:["Dùng đúng thuật ngữ như 爆炒, 焖, 勾芡 bằng chữ giản thể, dễ đọc trên màn hình.","Uses the right terms such as 爆炒 (high-heat stir-fry), 焖 (braise) and 勾芡 (thicken with starch slurry), in Simplified Chinese.","使用爆炒、焖、勾芡等准确术语，采用简体中文，屏幕上清晰易读。"],
cta_title:["Sẵn sàng cho công thức của bạn đi xa hơn?","Ready to take your recipes further?","准备让你的食谱走得更远吗？"],
cta_sub:["Tạo tài khoản miễn phí và lồng tiếng video đầu tiên trong vài phút.","Create a free account and dub your first video in minutes.","创建免费账户，几分钟内完成第一个视频的配音。"],
cta_btn:["Tạo tài khoản miễn phí","Create a free account","创建免费账户"],

ft_title:["Mọi thứ để lồng tiếng một video nấu ăn","Everything you need to dub a cooking video","为烹饪视频配音所需的一切"],
ft_sub:["Từ lời nói trong video đến tệp MP4 có giọng đọc mới.","From spoken words in the video to an MP4 with a new voice track.","从视频里的口语讲解，到带有新配音的 MP4 文件。"],
fa_t:["Nhận dạng giọng nói","Speech recognition","语音识别"],
fa_d:["Nhận lời hướng dẫn ngay cả khi có tiếng dầu xèo xèo và quạt hút ở nền.","Picks up instructions even over sizzling oil and a running extractor fan.","即使有油炸声和抽油烟机的噪音，也能识别讲解内容。"],
fb_t:["Dịch theo ngữ cảnh nấu ăn","Cooking-aware translation","懂烹饪的翻译"],
fb_d:["Hiểu rằng xào, sauté và 炒 là cùng một kỹ thuật thay vì dịch từng chữ.","Knows that xào, sauté and 炒 are the same technique instead of translating word by word.","知道 xào、sauté 和炒是同一种技法，而不是逐字翻译。"],
fc_t:["Giọng đọc tự nhiên","Natural voices","自然的配音"],
fc_d:["Chọn giọng nam hoặc nữ và giảm tốc độ cho người mới tập nấu.","Choose a male or female voice and slow the pace down for beginner cooks.","可选男声或女声，并为烹饪新手放慢语速。"],
fd_t:["Khớp thời gian","Timed to the video","与画面对齐"],
fd_d:["Mỗi câu đọc được căn theo đúng khoảnh khắc trong video, không bị trôi sang bước sau.","Each line is aligned to its moment in the video so it never drifts into the next step.","每句配音都对齐到视频中的对应时刻，不会拖到下一步。"],
fe_t:["Phụ đề song ngữ","Bilingual subtitles","双语字幕"],
fe_d:["Hiển thị một hoặc nhiều ngôn ngữ cùng lúc và xuất tệp SRT để đăng lên YouTube.","Show one or several languages at once and export SRT files for YouTube.","可同时显示一种或多种语言，并导出 SRT 文件用于 YouTube。"],
ff_t:["Danh sách nguyên liệu","Ingredient list","食材清单"],
ff_d:["Tự trích nguyên liệu và định lượng từ lời nói, trình bày ở cả ba ngôn ngữ.","Pulls ingredients and quantities out of the narration and lists them in all three languages.","自动从讲解中提取食材和用量，并以三种语言列出。"],
ex_title:["Tệp bạn nhận được","What you get","你将获得"],
ex_mp4:["MP4: video đã lồng tiếng, giữ nguyên hình ảnh gốc","MP4: the dubbed video with the original picture","MP4：已配音的视频，保留原画面"],
ex_srt:["SRT: phụ đề cho từng ngôn ngữ","SRT: subtitles for each language","SRT：每种语言的字幕"],
ex_mp3:["MP3: chỉ có phần thuyết minh, dùng cho podcast hoặc video ngắn","MP3: narration only, for podcasts or short clips","MP3：仅旁白音频，可用于播客或短视频"],

d_title:["Trải nghiệm lồng tiếng","Try the dubbing","体验配音"],
d_sub:["Tải video của bạn lên rồi bấm Lồng tiếng: hệ thống tự nghe lời thoại trong video, giọng đọc sẽ đọc liền mạch và phụ đề chạy theo. Muốn dịch sang ngôn ngữ khác thì bật tuỳ chọn dịch.", "Upload your video and press Dub: the system listens to the speech in your video, reads it back continuously and syncs the subtitles. Turn on translation to get other languages.", "上传视频后点击配音：系统会自动识别视频中的语音，连续朗读并同步字幕。开启翻译即可获得其他语言。"],
d_drop:["Kéo thả video vào đây hoặc bấm để chọn tệp","Drop a video here or click to choose a file","将视频拖到此处，或点击选择文件"],
d_change:["Bấm hoặc kéo thả video khác để đổi","Click or drop another video to change it","点击或拖入其他视频即可更换"],
d_url:["Hoặc dán liên kết video","Or paste a video link","或粘贴视频链接"],
d_start:["Bắt đầu dịch","Start translating","开始翻译"],
d_chosen:["Đã chọn: ","Selected: ","已选择："],
d_need:["Hãy chọn một tệp video trước.", "Choose a video file first.", "请先选择视频文件。"],
d_need_script:["Video dán bằng liên kết cần tự nhập lời thoại (trình duyệt không nghe được âm thanh từ liên kết ngoài). Hãy nhập lời thoại, hoặc tải file video lên máy để tự động nhận diện giọng nói.","A video added by link needs the script typed in — the browser can't listen to audio from an external link. Enter the script, or upload the video file instead for automatic speech recognition.","粘贴链接的视频需要手动输入台词——浏览器无法读取外部链接的音频。请输入台词，或改为上传视频文件以自动识别语音。"],
d_done:["Hoàn tất. Bản dịch bên dưới là bản dịch thật cho lời thoại trong video của bạn.", "Done. The translation below is a real translation of the speech in your video.", "完成。下方是你视频中语音的真实翻译。"],
st_wait:["Đang chờ","Waiting","等待中"],
st_run:["Đang xử lý","Working","处理中"],
st_done:["Xong","Done","完成"],
d_sample:["Video của bạn: ","Your video: ","你的视频："],
d_voice:["Giọng đọc","Voice","配音"],
d_off:["Tắt tiếng","Muted","静音"],
d_subs:["Phụ đề","Subtitles","字幕"],
d_speed:["Tốc độ","Speed","语速"],
d_play:["Phát","Play","播放"],
d_fullscreen:["Toàn màn hình","Full screen","全屏"],
d_pause:["Tạm dừng","Pause","暂停"],
d_replay:["Phát lại","Replay","重播"],
d_steps:["Các bước trong video","Steps in the video","视频中的步骤"],
d_script_label:["Lời thoại của video (mỗi dòng một câu) — để trống để tự nhận diện","Video script (one sentence per line) — leave empty to auto-transcribe","视频台词（每行一句）——留空可自动识别"],
d_script_placeholder:["Để trống nếu đã tải file video lên: hệ thống sẽ tự nghe và nhận diện lời thoại.\n\nHoặc tự gõ, ví dụ:\nĐập ba quả trứng vào bát, thêm chút muối.\nLàm nóng chảo với hai thìa dầu.","Leave empty if you uploaded a video file: speech will be recognized automatically.\n\nOr type it yourself, e.g.:\nCrack three eggs into a bowl, add a pinch of salt.\nHeat two tablespoons of oil in the pan.","如果已上传视频文件可留空：系统会自动识别语音。\n\n或自行输入，例如：\n把三个鸡蛋打入碗中，加一点盐。\n锅里加两勺油烧热。"],
d_auto_hint:["Mô hình nhận diện giọng nói chạy ngay trong trình duyệt của bạn, video không được gửi lên server nào.", "The speech recognition model runs right in your browser; your video is not sent to any server.", "语音识别模型直接在你的浏览器中运行，视频不会上传到任何服务器。"],
d_source_lang:["Ngôn ngữ trong video","Language spoken in the video","视频中使用的语言"],
d_translate_btn:["Dịch","Translate","翻译"],
d_translating:["Đang dịch…","Translating…","翻译中…"],
d_dub_btn:["Lồng tiếng","Dub","配音"],
d_dubbing:["Đang xử lý…","Working…","处理中…"],
d_opt_translate:["Dịch sang ngôn ngữ khác (EN, 中文) — tắt thì chỉ lồng tiếng đúng ngôn ngữ gốc","Translate to other languages (EN, 中文) — off = dub in the original language only","翻译成其他语言（EN、中文）——关闭则仅用原语言配音"],
d_done_dub:["Hoàn tất. Giọng đọc sẽ đọc liền mạch toàn bộ lời thoại, không dịch.","Done. The voice will read the whole script continuously, without translating.","完成。配音将连续朗读全部台词，不做翻译。"],
d_translate_err:["Không dịch được lúc này. Kiểm tra API Dubchef và dịch vụ Ollama rồi thử lại.","Translation failed. Check the Dubchef API and Ollama service, then retry.","翻译失败，请检查 Dubchef API 和 Ollama 服务后重试。"],
d_translate_limit:["Máy chủ dịch đang bận. Hãy thử lại sau ít phút.","The translation server is busy. Please try again shortly.","翻译服务器正忙，请稍后重试。"],
d_translate_auth:["Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng dịch thuật.","Please sign in to use translation.","请登录后使用翻译功能。"],
d_translate_model:["Chưa cài mô hình dịch trong Ollama. Hãy tải mô hình trước khi dịch.","The translation model is missing in Ollama. Download the model first.","Ollama 中缺少翻译模型，请先下载模型。"],
d_translate_offline:["Không kết nối được máy chủ dịch Ollama. Kiểm tra Docker và kết nối API.","Cannot connect to the Ollama translation server. Check Docker and the API connection.","无法连接 Ollama 翻译服务器，请检查 Docker 和 API 连接。"],
d_translate_timeout:["Mô hình dịch phản hồi quá chậm. Hãy thử lại hoặc giảm độ dài video.","The translation model timed out. Try again or use a shorter video.","翻译模型响应超时，请重试或使用较短的视频。"],
d_preview_note:["Chỉ video tải lên từ máy mới chắc chắn xem trước được trong trang.","Only videos uploaded from your device are guaranteed to preview here.","只有从设备上传的视频才能保证在此预览。"],
dp0:["Nhận diện giọng nói","Recognize speech","识别语音"],
dp1:["Video sẵn sàng","Video ready","视频已就绪"],
dp2:["Dịch nội dung","Translate content","翻译内容"],
dp3:["Chuẩn bị giọng đọc","Prepare voices","准备配音"],
dp4:["Hoàn tất","Done","完成"],
d_stt_model:["Đang tải mô hình nhận diện giọng nói (chỉ lần đầu, cần mạng)…","Loading the speech recognition model (first time only, needs internet)…","正在加载语音识别模型（仅首次，需要联网）…"],
d_stt_listen:["Đang nghe và nhận diện lời thoại trong video…","Listening to the video and recognizing speech…","正在聆听视频并识别语音…"],
d_stt_err:["Không nhận diện được giọng nói. Có thể video không có tiếng nói rõ, hoặc thiết bị/trình duyệt này chưa hỗ trợ. Hãy thử video khác.", "Couldn't recognize speech. The video may have no clear speech, or this device/browser isn't supported. Try another video.", "无法识别语音。视频可能没有清晰的人声，或此设备/浏览器不受支持。请换一个视频试试。"],
d_stt_unavailable:["Bản build này của app chưa có sẵn tính năng tự nhận diện giọng nói (cần build app native, không chạy được qua Expo Go). Hãy nhập lời thoại bằng tay, hoặc hỏi nhóm BE/DevOps đã build bản có whisper.rn chưa.","This build of the app doesn't have on-device speech recognition yet (it needs a native build, not Expo Go). Please type the script by hand, or check with the team whether the whisper.rn build is ready.","此版本的应用还没有内置语音识别功能（需要原生构建，Expo Go 无法运行）。请手动输入台词，或询问团队是否已构建带有 whisper.rn 的版本。"],
d_mute_note:["Đã tắt tiếng gốc của video để phát giọng đọc.","Original video sound muted to play the narration voice.","已静音原视频声音，以播放配音。"],
d_nospeech:["Trình duyệt này chưa có giọng đọc cho ngôn ngữ đã chọn. Phụ đề vẫn chạy theo thời gian.","This browser has no speech voice for the selected language. Subtitles will still advance on a timer.","此浏览器没有所选语言的语音，字幕仍会按时间推进。"],
d_novoice_chip:["Máy này chưa có giọng đọc ngôn ngữ này","This device has no voice for this language","此设备没有此语言的语音"],
d_novoice_summary:["Máy bạn thiếu giọng đọc cho một số ngôn ngữ, nên các mục đó bị khoá ở trên. Vẫn xem được phụ đề bình thường.","Your device is missing voices for some languages, so those options are locked above. Subtitles still work normally.","您的设备缺少某些语言的语音，因此上面的选项已被锁定。字幕仍可正常显示。"],

pl1:["Miễn phí","Free","免费版"],
pl2:["Người sáng tạo","Creator","创作者版"],
pl3:["Xưởng phim","Studio","工作室版"],
pl1_1:["3 video mỗi tháng","3 videos per month","每月 3 个视频"],
pl1_2:["Tối đa 5 phút mỗi video","Up to 5 minutes per video","每个视频最长 5 分钟"],
pl1_3:["1 ngôn ngữ đích","1 target language","1 种目标语言"],
pl2_1:["30 video mỗi tháng","30 videos per month","每月 30 个视频"],
pl2_2:["Tối đa 20 phút mỗi video","Up to 20 minutes per video","每个视频最长 20 分钟"],
pl2_3:["Cả ba ngôn ngữ và xuất SRT","All three languages and SRT export","三种语言并可导出 SRT"],
pl3_1:["Không giới hạn số video","Unlimited videos","视频数量不限"],
pl3_2:["Tối đa 60 phút mỗi video","Up to 60 minutes per video","每个视频最长 60 分钟"],
pl3_3:["Giọng đọc tùy chỉnh và API","Custom voices and API access","自定义配音与 API"],
pl_pick:["Phổ biến nhất","Most popular","最受欢迎"],
pl_c1:["Bắt đầu miễn phí","Start free","免费开始"],
pl_c:["Chọn gói này","Choose this plan","选择此方案"],
pl_title:["Gói theo tháng","Monthly plans","月度方案"],
pc_title:["Tính giá theo số video","Price by number of videos","按视频数量计价"],
pc_sub:["Nhập số video bạn đăng lên và số video được dịch ra để xem giá tạm tính. Giá mang tính minh họa.","Enter how many videos you upload and how many translated videos you want to see an estimate. Prices are illustrative.","输入上传的视频数量和翻译输出的视频数量，即可查看估算价格。价格仅为示例。"],
pc_up:["Số video đăng lên","Videos uploaded","上传的视频数"],
pc_out:["Số video dịch ra","Videos translated out","翻译输出的视频数"],
pc_hint:["Mỗi video đăng lên được dịch ra tối đa 3 ngôn ngữ (Việt, Anh, Trung).","Each uploaded video can be translated into up to 3 languages (Vietnamese, English, Chinese).","每个上传的视频最多可翻译成 3 种语言（越南语、英语、中文）。"],
pc_bad:["Nhập số nguyên từ 0 đến 500.","Enter a whole number from 0 to 500.","请输入 0 到 500 之间的整数。"],
pc_over:["Số video dịch ra tối đa gấp 3 lần số video đăng lên.","Translated videos can be at most 3 times the uploaded videos.","翻译输出的视频数最多为上传视频数的 3 倍。"],
pc_row_up:["Phí đăng video","Upload fee","上传费"],
pc_row_out:["Phí dịch ra","Translation fee","翻译费"],
pc_qty:["Số lượng","Quantity","数量"],
pc_unit:["Đơn giá","Unit price","单价"],
pc_amount:["Thành tiền","Amount","金额"],
pc_total:["Tạm tính","Estimated total","估算合计"],
pk_title:["Sản phẩm mẫu cho người đăng video nấu ăn","Sample products for cooking-video creators","烹饪视频创作者示例方案"],
pk_sub:["Chọn một gói mẫu để điền sẵn vào phần tính giá ở trên. Giá mỗi gói được tính đúng theo công thức đó.","Pick a sample pack to pre-fill the calculator above. Each pack is priced with the same formula.","选择一个示例方案即可自动填入上方的计价器。每个方案都按同一公式计价。"],
pk1_n:["Bếp nhà","Home kitchen","家常小厨"],
pk1_d:["Vài món gia đình, mỗi video dịch ra một ngôn ngữ.","A few family dishes, each video translated into one language.","几道家常菜，每个视频翻译成一种语言。"],
pk2_n:["Blogger ẩm thực","Food blogger","美食博主"],
pk2_d:["Đăng đều mỗi tuần, mỗi video dịch ra hai ngôn ngữ.","Posts every week, each video translated into two languages.","每周更新，每个视频翻译成两种语言。"],
pk3_n:["Kênh ẩm thực","Food channel","美食频道"],
pk3_d:["Cả bộ sưu tập món ăn, mỗi video có đủ ba ngôn ngữ.","A full recipe collection, each video in all three languages.","完整的菜谱合集，每个视频提供三种语言。"],
pk4_n:["Nhà hàng và thương hiệu","Restaurant or brand","餐厅与品牌"],
pk4_d:["Thư viện video lớn cho khách trong và ngoài nước.","A large video library for local and international guests.","面向国内外顾客的大型视频库。"],
pk_vid:["video đăng lên","videos uploaded","个上传视频"],
pk_out:["video dịch ra","videos translated out","个翻译输出视频"],
pk_use:["Tính thử gói này","Try this pack","试算此方案"],
pk_filled:["Đã điền vào phần tính giá ở trên.","Filled into the calculator above.","已填入上方的计价器。"],

a_title:["Giúp công thức đi xa hơn ngôn ngữ của nó","Helping recipes travel beyond their language","让食谱跨越语言的界限"],
a_p1:["Dubchef bắt đầu như một đồ án môn Công nghệ phần mềm. Nhóm nhận ra rất nhiều kênh nấu ăn hay chỉ có một ngôn ngữ, trong khi người xem muốn nấu theo bằng tiếng mẹ đẻ.","Dubchef began as a software engineering course project. We noticed that many great cooking channels exist in a single language, while viewers want to cook along in their own.","Dubchef 始于一门软件工程课程的项目。我们发现许多优秀的烹饪频道只有一种语言，而观众希望用母语跟着做。"],
a_p2:["Hệ thống nối ba công nghệ: nhận dạng giọng nói, dịch máy và tổng hợp giọng nói, rồi ghép kết quả lại theo đúng thời gian của video.","The system chains three technologies, speech recognition, machine translation and speech synthesis, then places the result back on the video's timeline.","系统串联三项技术：语音识别、机器翻译和语音合成，再按视频时间线把结果合成回去。"],
a_v_title:["Nguyên tắc của chúng tôi","Our principles","我们的原则"],
v1_t:["Chính xác trước, nhanh sau","Accuracy first, speed second","先准确，后速度"],
v1_d:["Một sai sót về định lượng có thể làm hỏng cả món ăn, nên chúng tôi ưu tiên sự đúng đắn.","A wrong quantity can ruin a dish, so we favor getting it right.","用量出错可能毁掉一道菜，所以我们优先保证准确。"],
v2_t:["Tôn trọng món ăn","Respect the dish","尊重菜肴"],
v2_d:["Tên món và kỹ thuật riêng của từng vùng được giữ lại, kèm giải thích ngắn khi cần.","Regional dish names and techniques are kept, with a short explanation when needed.","保留各地菜名和技法，必要时附上简短说明。"],
v3_t:["Nói rõ đây là bản dịch máy","Be clear it is machine-made","注明这是机器翻译"],
v3_d:["Người xem luôn biết phần lồng tiếng do máy tạo, và người làm video được sửa trước khi đăng.","Viewers can always tell the dub is machine-made, and creators can edit before publishing.","观众能清楚知道配音由机器生成，创作者也能在发布前修改。"],
a_cta:["Thử demo","Try the demo","试试演示"],

fq_title:["Câu hỏi thường gặp","Frequently asked questions","常见问题"],
q1:["Dubchef hỗ trợ những ngôn ngữ nào?","Which languages does Dubchef support?","Dubchef 支持哪些语言？"],
a1:["Tiếng Việt, tiếng Anh và tiếng Trung giản thể. Bạn có thể dịch qua lại giữa cả ba.","Vietnamese, English and Simplified Chinese. You can translate in any direction between the three.","越南语、英语和简体中文，三者之间可以任意方向互译。"],
q2:["Video có cần lời thoại rõ ràng không?","Does the video need clear speech?","视频需要清晰的讲解吗？"],
a2:["Nên có. Giọng càng rõ thì kết quả càng chính xác; nhạc nền lớn hoặc tiếng ồn có thể làm giảm chất lượng.","Ideally yes. The clearer the voice, the better the result; loud music or noise can reduce quality.","最好是的。声音越清晰，结果越准确；过大的背景音乐或噪音会降低质量。"],
q3:["Tên nguyên liệu và định lượng có được dịch đúng không?","Are ingredients and quantities translated correctly?","食材和用量能翻译准确吗？"],
a3:["Hệ thống dùng từ điển nấu ăn riêng và đổi đơn vị khi cần. Dù vậy, bạn nên xem lại bản dịch trước khi đăng.","The system uses a dedicated cooking glossary and converts units when needed. Still, review the translation before publishing.","系统使用专门的烹饪词库，并在需要时换算单位。即便如此，发布前仍建议你检查译文。"],
q4:["Video của tôi có được lưu lại không?","Is my video stored?","我的视频会被保存吗？"],
a4:["Trong bản demo này, video không rời khỏi trình duyệt. Ở bản chính thức, bạn có thể xóa video bất cứ lúc nào.","In this demo the video never leaves your browser. In the full version you can delete a video at any time.","在此演示中，视频不会离开浏览器。正式版中，你可以随时删除视频。"],
q5:["Tôi có sửa được bản dịch không?","Can I edit the translation?","我可以修改译文吗？"],
a5:["Có. Bạn sửa từng câu trong trình chỉnh sửa rồi chỉ tạo lại giọng đọc cho câu đó.","Yes. Edit any line in the editor and regenerate the voice for just that line.","可以。在编辑器中修改任意一句，然后只重新生成该句的配音。"],
q6:["Tôi có dùng giọng đọc cho mục đích thương mại được không?","Can I use the voices commercially?","配音可以商用吗？"],
a6:["Được, với gói Người sáng tạo và Xưởng phim.","Yes, on the Creator and Studio plans.","可以，创作者版和工作室版均允许商用。"],
fq_more:["Vẫn còn thắc mắc?","Still have questions?","还有疑问？"],

c_title:["Liên hệ với chúng tôi","Contact us","联系我们"],
c_sub:["Gửi câu hỏi hoặc góp ý, chúng tôi sẽ trả lời qua email.","Send a question or feedback and we will reply by email.","发送问题或建议，我们会通过邮件回复。"],
f_name:["Họ và tên","Full name","姓名"],
f_email:["Email","Email","邮箱"],
f_msg:["Nội dung","Message","内容"],
c_send:["Gửi tin nhắn","Send message","发送消息"],
c_ok:["Đã gửi. Chúng tôi sẽ trả lời qua email trong vòng 2 ngày làm việc.","Sent. We will reply by email within 2 business days.","已发送。我们会在 2 个工作日内通过邮件回复。"],
e_name:["Nhập tên của bạn.","Enter your name.","请输入姓名。"],
e_email:["Email chưa đúng định dạng.","That email address is not valid.","邮箱格式不正确。"],
e_msg:["Nhập nội dung tin nhắn.","Enter a message.","请输入内容。"],
c_info_t:["Thông tin","Details","联系信息"],
c_hours:["Hỗ trợ: Thứ Hai đến Thứ Sáu, 9:00–17:00 (GMT+7)","Support: Monday to Friday, 9:00–17:00 (GMT+7)","客服时间：周一至周五，9:00–17:00（GMT+7）"],

li_title:["Đăng nhập","Log in","登录"],
li_sub:["Chào mừng bạn quay lại.","Welcome back.","欢迎回来。"],
f_pass:["Mật khẩu","Password","密码"],
e_pass:["Mật khẩu cần ít nhất 8 ký tự.","Password needs at least 8 characters.","密码至少需要 8 个字符。"],
li_no:["Chưa có tài khoản?","No account yet?","还没有账户？"],
li_ok:["Đăng nhập thành công.","Logged in successfully.","登录成功。"],
rg_title:["Tạo tài khoản","Create an account","创建账户"],
rg_sub:["Miễn phí, không cần thẻ thanh toán.","Free, no payment card needed.","免费，无需绑定银行卡。"],
f_pass2:["Nhập lại mật khẩu","Confirm password","确认密码"],
e_pass2:["Mật khẩu nhập lại chưa khớp.","Passwords do not match.","两次输入的密码不一致。"],
f_agree:["Tôi đồng ý với","I agree to the","我同意"],
e_agree:["Bạn cần đồng ý với điều khoản.","You need to accept the terms.","你需要同意条款。"],
rg_btn:["Tạo tài khoản","Create account","创建账户"],
rg_have:["Đã có tài khoản?","Already have an account?","已有账户？"],
rg_ok:["Tạo tài khoản thành công.","Account created.","账户创建成功。"],

upd:["Cập nhật lần cuối: 19/09/2026","Last updated: 19 September 2026","最后更新：2026 年 9 月 19 日"],
tm_title:["Điều khoản sử dụng","Terms of use","使用条款"],
tm1_t:["Sử dụng dịch vụ","Using the service","使用服务"],
tm1_d:["Bạn chỉ tải lên video mà bạn có quyền sử dụng và chia sẻ.","Only upload videos you have the right to use and share.","只上传你有权使用和分享的视频。"],
tm2_t:["Nội dung dịch tự động","Automatic translation","自动翻译内容"],
tm2_d:["Bản dịch và giọng đọc do máy tạo ra. Bạn chịu trách nhiệm kiểm tra trước khi đăng công khai.","Translations and voices are generated by machine. You are responsible for reviewing them before publishing.","译文和配音由机器生成，公开发布前请自行检查。"],
tm3_t:["Tài khoản","Your account","账户"],
tm3_d:["Hãy giữ bí mật mật khẩu và báo cho chúng tôi nếu nghi ngờ bị truy cập trái phép.","Keep your password private and tell us if you suspect unauthorized access.","请妥善保管密码，如怀疑被未授权访问，请告知我们。"],
tm4_t:["Thay đổi điều khoản","Changes to these terms","条款变更"],
tm4_d:["Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email.","We will email you about any significant changes.","如有重大变更，我们会通过邮件通知你。"],
pv_title:["Chính sách bảo mật","Privacy policy","隐私政策"],
pv1_t:["Dữ liệu chúng tôi thu thập","What we collect","我们收集的数据"],
pv1_d:["Tên, email và các video bạn tải lên để xử lý.","Your name, email and the videos you upload for processing.","姓名、邮箱以及你上传用于处理的视频。"],
pv2_t:["Cách chúng tôi dùng dữ liệu","How we use it","使用方式"],
pv2_d:["Chỉ để cung cấp dịch vụ. Chúng tôi không bán dữ liệu cho bên thứ ba.","Only to provide the service. We do not sell data to third parties.","仅用于提供服务，我们不会向第三方出售数据。"],
pv3_t:["Lưu trữ và xóa","Storage and deletion","存储与删除"],
pv3_d:["Bạn có thể xóa video và tài khoản của mình bất cứ lúc nào.","You can delete your videos and your account at any time.","你可以随时删除视频和账户。"],
pv4_t:["Liên hệ về quyền riêng tư","Privacy contact","隐私联系方式"],
pv4_d:["Gửi câu hỏi tới privacy@dubchef.example.","Send questions to privacy@dubchef.example.","请将问题发送至 privacy@dubchef.example。"],

nf_title:["Không tìm thấy trang","Page not found","找不到页面"],
nf_d:["Liên kết có thể đã thay đổi hoặc bị gõ sai.","The link may have changed or been mistyped.","链接可能已更改或输入有误。"],
nf_btn:["Về trang chủ","Back to home","返回首页"],

ft_tag:["Lồng tiếng tự động cho video nấu ăn bằng tiếng Việt, Anh và Trung.","Automatic dubbing for cooking videos in Vietnamese, English and Chinese.","为烹饪视频提供越南语、英语和中文自动配音。"],
ft_product:["Sản phẩm","Product","产品"],
ft_company:["Công ty","Company","公司"],
ft_legal:["Pháp lý","Legal","法律"],
ft_copy:["© 2026 Dubchef. Đồ án môn Công nghệ phần mềm.","© 2026 Dubchef. A software engineering course project.","© 2026 Dubchef。软件工程课程项目。"],
hello:["Xin chào","Hello","你好"],
logout:["Đăng xuất","Log out","退出登录"],
e_exists:["Email này đã được đăng ký.","This email is already registered.","该邮箱已被注册。"],
e_login:["Email hoặc mật khẩu không đúng.","Incorrect email or password.","邮箱或密码不正确。"],
e_net:["Không kết nối được máy chủ. Hãy thử lại sau.","Could not reach the server. Please try again later.","无法连接服务器，请稍后重试。"],
auth_demo:["Cần cấu hình kết nối Backend để đăng ký, đăng nhập và lưu dữ liệu dùng chung.","Configure a backend connection to register, sign in and save shared data.","请配置后端连接以注册、登录和保存共享数据。"],
tab_home:["Trang chủ","Home","首页"],
tab_info:["Thông tin","Info","信息"],
tab_account:["Tài khoản","Account","账户"],
acc_videos:["Video của tôi","My videos","我的视频"],
acc_orders:["Đơn hàng của tôi","My orders","我的订单"],
acc_feedback:["Phản hồi","Feedback","反馈"],
acc_fb_label:["Gửi phản hồi cho quản trị viên","Send feedback to the admin","向管理员发送反馈"],
acc_fb_send:["Gửi phản hồi","Send feedback","发送反馈"],
acc_fb_ok:["Đã gửi phản hồi.","Feedback sent.","反馈已发送。"],
acc_reply:["Quản trị viên trả lời:","Admin reply:","管理员回复："],
acc_no_videos:["Chưa có video.","No videos yet.","暂无视频。"],
acc_no_orders:["Chưa có đơn hàng.","No orders yet.","暂无订单。"],
acc_no_fb:["Chưa có phản hồi.","No feedback yet.","暂无反馈。"],
acc_load_err:["Không tải được dữ liệu tài khoản. Hãy thử lại.","Could not load your account data. Please try again.","无法加载账户数据，请重试。"],
acc_refresh:["Làm mới","Refresh","刷新"],
m_pick:["Chọn video từ điện thoại","Choose a video from your phone","从手机选择视频"],
d_sub_m:["Xử lý video trên thiết bị. Khi đăng nhập và kết nối Backend, video và kết quả được lưu vào máy chủ.","Process video on your device. When signed in with a backend connection, the video and results are saved to the server.","在设备上处理视频。登录并连接后端后，视频和结果会保存到服务器。"],
nav_admin:["Quản trị","Admin","管理"],
ad_brand:["Quản trị Dubchef","Dubchef Admin","Dubchef 管理后台"],
ad_menu:["Menu quản trị","Admin menu","管理菜单"],
ad_nav_overview:["Tổng quan","Overview","总览"],
ad_nav_users:["Người dùng","Users","用户"],
ad_back:["Về trang web","Back to site","返回网站"],
ad_title:["Thống kê truy cập","Traffic analytics","访问数据分析"],
ad_sub:["Số người truy cập hệ thống theo ngày và so với kỳ trước.","Visitors to the system by day, compared with the previous period.","按日统计访问系统的人数，并与上一周期对比。"],
ad_users_title:["Quản lý người dùng","User management","用户管理"],
ad_users_sub:["Xem, tìm kiếm, khóa hoặc xóa người dùng đã đăng ký.","View, search, lock or delete registered users.","查看、搜索、锁定或删除已注册用户。"],
ad_need_login:["Bạn cần đăng nhập bằng tài khoản quản trị để xem trang này.","Log in with the admin account to see this page.","请使用管理员账号登录后查看此页面。"],
ad_denied:["Tài khoản của bạn không có quyền quản trị.","Your account does not have admin access.","你的账号没有管理权限。"],
ad_hint:["Tài khoản quản trị có sẵn. Email:","Built-in admin account. Email:","内置管理员账号。邮箱："],
ad_pass:["Mật khẩu:","Password:","密码："],
ad_local:["Chưa kết nối máy chủ: số liệu chỉ đếm các lượt truy cập từ trình duyệt này.","No server connected: figures only count visits from this browser.","尚未连接服务器：数据只统计本浏览器的访问。"],
ad_now:["Đang truy cập","Online now","当前在线"],
ad_now_d:["trong 5 phút gần nhất","in the last 5 minutes","最近 5 分钟"],
ad_today:["Hôm nay","Today","今天"],
ad_period:["Trong kỳ","This period","本周期"],
ad_total:["Tổng cộng","All time","累计"],
ad_views:["lượt xem","page views","浏览量"],
ad_vs_yday:["so với hôm qua","vs yesterday","较昨日"],
ad_vs_prev:["so với kỳ trước","vs previous period","较上一周期"],
ad_range:["Khoảng thời gian","Time range","时间范围"],
ad_r7:["7 ngày","7 days","7 天"],
ad_r14:["14 ngày","14 days","14 天"],
ad_r30:["30 ngày","30 days","30 天"],
ad_chart:["Người truy cập theo ngày","Visitors by day","每日访客"],
ad_legend_v:["Người truy cập","Visitors","访客"],
ad_legend_p:["Lượt xem","Page views","浏览量"],
ad_peak:["Ngày cao nhất","Peak day","最高日"],
ad_date:["Ngày","Date","日期"],
ad_people:["người truy cập","visitors","访客"],
ad_users_total:["Tổng người dùng","Total users","用户总数"],
ad_users_new:["Mới trong kỳ","New this period","本周期新增"],
ad_name:["Họ tên","Name","姓名"],
ad_email:["Email","Email","邮箱"],
ad_joined:["Ngày đăng ký","Registered","注册日期"],
ad_status:["Trạng thái","Status","状态"],
ad_active:["Hoạt động","Active","正常"],
ad_locked:["Đã khóa","Locked","已锁定"],
ad_action:["Thao tác","Actions","操作"],
ad_lock:["Khóa","Lock","锁定"],
ad_unlock:["Mở khóa","Unlock","解锁"],
ad_delete:["Xóa","Delete","删除"],
ad_confirm_del:["Xóa người dùng này?","Delete this user?","删除此用户？"],
ad_cancel:["Hủy","Cancel","取消"],
ad_search:["Tìm theo tên hoặc email","Search by name or email","按姓名或邮箱搜索"],
ad_sort:["Sắp xếp","Sort by","排序"],
ad_sort_new:["Mới nhất","Newest","最新"],
ad_sort_name:["Tên A–Z","Name A–Z","姓名 A–Z"],
ad_export:["Xuất CSV","Export CSV","导出 CSV"],
ad_prev:["Trước","Previous","上一页"],
ad_next:["Sau","Next","下一页"],
ad_no_match:["Không có người dùng phù hợp.","No matching users.","没有符合条件的用户。"],
ad_refresh:["Làm mới","Refresh","刷新"],
ad_seed:["Nạp dữ liệu mẫu","Load sample data","载入示例数据"],
ad_reset:["Xóa dữ liệu mẫu và số liệu","Clear sample data and figures","清除示例数据与统计"],
ad_loading:["Đang tải số liệu…","Loading figures…","正在加载数据…"],
ad_fail:["Không tải được số liệu. Hãy thử lại.","Could not load the figures. Please try again.","无法加载数据，请重试。"],
e_locked:["Tài khoản này đã bị khóa. Hãy liên hệ quản trị viên.","This account is locked. Please contact an administrator.","该账号已被锁定，请联系管理员。"],
co_btn:["Thanh toán","Pay now","立即支付"],
co_demo_note:["Đây là thanh toán mô phỏng phục vụ demo, chưa xác minh tiền thật.","This is a demo payment simulation; real funds are not verified.","这是演示用模拟付款，尚未验证真实资金。"],
co_title:["Thanh toán đơn hàng","Pay for your order","订单支付"],
co_need_login:["Bạn cần đăng nhập để thanh toán.","Please log in to pay.","请先登录再支付。"],
co_resume:["Đăng nhập hoặc tạo tài khoản để tiếp tục thanh toán. Lựa chọn của bạn sẽ được giữ nguyên.","Log in or sign up to continue to payment. Your selection will be kept.","登录或注册后继续支付，您的选择会保留。"],
co_sum:["Đơn hàng","Order","订单"],
co_sum_line:["video đăng lên, dịch ra","videos uploaded, translated out","个上传视频，翻译输出"],
co_method:["Phương thức thanh toán","Payment method","支付方式"],
co_card:["Thẻ ngân hàng","Bank card","银行卡"],
co_momo:["Ví MoMo","MoMo wallet","MoMo 钱包"],
co_bank:["Chuyển khoản","Bank transfer","银行转账"],
co_demo:["Thanh toán giả lập để thử nghiệm: không nhập và không lưu thông tin thẻ thật.","Simulated payment for testing: no real card details are entered or stored.","模拟支付仅供测试：不会输入或保存真实银行卡信息。"],
co_local:["Chưa nối CSDL SQL Server: đơn hàng chỉ lưu trong trình duyệt này.","SQL Server is not connected: orders are only kept in this browser.","尚未连接 SQL Server：订单仅保存在本浏览器。"],
co_pay:["Xác nhận thanh toán","Confirm payment","确认支付"],
co_busy:["Đang xử lý…","Processing…","处理中…"],
co_ok:["Thanh toán thành công","Payment successful","支付成功"],
co_code:["Mã đơn","Order no.","订单号"],
co_ref:["Mã giao dịch","Transaction ref.","交易号"],
co_fail:["Không thanh toán được. Hãy kiểm tra lại và thử lại.","Payment failed. Please check and try again.","支付失败，请检查后重试。"],
co_close:["Đóng","Close","关闭"],
co_orders:["Đơn hàng gần đây","Recent orders","最近订单"],
co_paid:["Đã thanh toán","Paid","已支付"],
co_pending:["Chờ thanh toán","Pending","待支付"],
co_qr:["Quét mã QR","Scan QR code","扫码支付"],
co_qr_make:["Tạo mã QR","Generate QR code","生成二维码"],
co_qr_scan:["Mở ứng dụng ngân hàng hoặc ví điện tử và quét mã bên dưới để thanh toán.","Open your banking or e-wallet app and scan the code below to pay.","请打开银行或电子钱包应用，扫描下方二维码完成支付。"],
co_qr_alt:["Mã QR thanh toán đơn hàng","Order payment QR code","订单支付二维码"],
co_qr_memo:["Nội dung chuyển khoản","Transfer note","转账备注"],
co_qr_demo:["Mã QR giả lập, chưa kết nối ngân hàng thật. Sau khi quét, bấm nút bên dưới để xác nhận.","Simulated QR code, no real bank is connected. After scanning, press the button below to confirm.","模拟二维码，未连接真实银行。扫码后请点击下方按钮确认。"],
co_qr_done:["Xác nhận thanh toán mô phỏng","Confirm simulated payment","确认模拟付款"],
co_qr_back:["Đổi phương thức","Change method","更换支付方式"],
pt_guest:["Trải nghiệm với tư cách khách","Try it as a guest","以访客身份体验"],
gu_title:["Chào mừng bạn đến với Dubchef","Welcome to Dubchef","欢迎来到 Dubchef"],
gu_sub:["Bạn đang trải nghiệm với tư cách khách: không cần đăng nhập hay tạo tài khoản.","You are visiting as a guest: no login or account needed.","您正以访客身份体验：无需登录或注册账号。"],
gu_go:["Trải nghiệm ngay","Start the demo","立即体验"],
gu_signup:["Tạo tài khoản","Create an account","创建账号"],
qh_title:["Quét mã để trải nghiệm trên điện thoại","Scan to try it on your phone","扫码在手机上体验"],
qh_sub:["Không cần đăng nhập: quét mã QR để vào trang trải nghiệm với tư cách khách.","No login needed: scan the QR code to open the demo as a guest.","无需登录：扫描二维码，以访客身份进入体验页。"],
qh_alt:["Mã QR vào trang trải nghiệm dành cho khách","QR code for the guest demo","访客体验页二维码"],
ad_nav_qr:["Mã QR khách","Guest QR","访客二维码"],
aq_title:["Người quét mã QR","QR code scanners","二维码扫码统计"],
aq_sub:["Số khách quét mã QR để vào trải nghiệm web với tư cách khách.","Guests who scanned the QR code to try the site as a guest.","通过二维码以访客身份体验网站的人数。"],
aq_local:["Chưa kết nối máy chủ: chỉ đếm các lượt quét từ trình duyệt này.","No server connected: only scans from this browser are counted.","尚未连接服务器：仅统计本浏览器的扫码。"],
aq_today:["Người quét hôm nay","Scanners today","今日扫码人数"],
aq_period:["Người quét trong kỳ","Scanners this period","本周期扫码人数"],
aq_total:["Tổng người quét","Total scanners","累计扫码人数"],
aq_scans:["lượt quét","scans","次扫码"],
aq_now:["Vừa quét","Just scanned","刚刚扫码"],
aq_chart:["Người quét mã QR theo ngày","QR scanners by day","每日扫码人数"],
aq_legend_v:["Người quét","Scanners","扫码者"],
aq_legend_p:["Lượt quét","Scans","扫码次数"],
aq_people:["người quét","scanners","扫码者"],
aq_code_title:["Mã QR dành cho khách","Guest QR code","访客二维码"],
aq_code_d:["In hoặc trình chiếu mã này. Ai quét sẽ vào trang trải nghiệm với tư cách khách và được tính vào số liệu bên dưới.","Print or display this code. Anyone who scans it lands on the guest demo and is counted below.","打印或展示此二维码。扫码者将以访客身份进入体验页，并计入下方统计。"],
aq_link:["Đường dẫn trong mã","Link in the code","二维码中的链接"],
aq_copy:["Sao chép liên kết","Copy link","复制链接"],
aq_copied:["Đã sao chép","Copied","已复制"],
aq_download:["Tải mã (SVG)","Download (SVG)","下载二维码（SVG）"],
aq_localhost:["Địa chỉ này chỉ mở được trên máy bạn. Đặt VITE_PUBLIC_URL (địa chỉ web đã đăng) để điện thoại quét được.","This address only opens on your own computer. Set VITE_PUBLIC_URL (your deployed site) so phones can scan it.","此地址仅能在本机打开。请设置 VITE_PUBLIC_URL（已部署的网址），手机才能扫码访问。"],
  pwd_show: ["Hiện mật khẩu", "Show password", "显示密码"],
  pwd_hide: ["Ẩn mật khẩu", "Hide password", "隐藏密码"],
  pwd_show_short: ["Hiện", "Show", "显示"],
  pwd_hide_short: ["Ẩn", "Hide", "隐藏"],
};

export const CUES=[
{vi:"Đập ba quả trứng vào bát, thêm một chút muối rồi đánh đều.",en:"Crack three eggs into a bowl, add a pinch of salt and whisk well.",zh:"把三个鸡蛋打入碗中，加一小撮盐，搅拌均匀。"},
{vi:"Làm nóng chảo với hai thìa dầu, đổ trứng vào xào đến khi vừa chín.",en:"Heat two tablespoons of oil in the pan, pour in the eggs and cook until just set.",zh:"锅里加两勺油烧热，倒入蛋液，炒至刚刚凝固。"},
{vi:"Cho cà chua thái múi cau vào, đảo đều cho ra nước.",en:"Add the tomato wedges and stir until they release their juices.",zh:"放入切好的番茄块，翻炒出汁。"},
{vi:"Nêm chút đường, trộn trứng lại, tắt bếp rồi bày ra đĩa.",en:"Season with a little sugar, fold the eggs back in, turn off the heat and plate up.",zh:"加少许糖调味，把鸡蛋倒回锅里拌匀，关火装盘。"}
];

/* Giá minh họa: [gói Miễn phí, Người sáng tạo, Xưởng phim] theo từng ngôn ngữ (VND, USD, CNY) */
export const PRICES=[[0,250000,750000],[0,10,30],[0,70,200]];
// Shared Admin UI translations (Vietnamese key -> [English, Simplified Chinese]).
// Preserve content coming from SQL Server and API: translate interface labels only.
export const ADMIN_TRANSLATIONS = {
  "Thống kê truy cập": [
    "Traffic analytics",
    "访问统计"
  ],
  "Theo dõi người truy cập và lượt xem theo thời gian. Dữ liệu vận hành, đơn hàng và công việc nằm tại Tổng quan hệ thống.": [
    "Track visitors and page views over time. Operations, orders and tasks are in System Overview.",
    "按时间跟踪访客和浏览量。运营、订单和任务数据请查看系统总览。"
  ],
  "Về tổng quan": [
    "Back to overview",
    "返回总览"
  ],
  "Không tải được thống kê. Kiểm tra kết nối API hoặc đăng nhập lại.": [
    "Unable to load analytics. Check the API connection or sign in again.",
    "无法加载统计数据。请检查 API 连接或重新登录。"
  ],
  "Trạng thái tài khoản": [
    "Account status",
    "账户状态"
  ],
  "Trạng thái video": [
    "Video status",
    "视频状态"
  ],
  "Lỗi API": [
    "API error",
    "API 错误"
  ],
  "Nhật ký quản trị": [
    "Admin activity log",
    "管理员操作日志"
  ],
  "Tra cứu ai đã thay đổi trạng thái tài khoản hoặc video, giá trị trước/sau và thời gian ghi nhận tại SQL Server. Chỉ Admin mới được xem.": [
    "See who changed an account or video status, before/after values, and timestamps recorded in SQL Server. Admin access only.",
    "查看谁更改了账户或视频状态、修改前后的值以及 SQL Server 记录的时间。仅管理员可访问。"
  ],
  "Làm mới": [
    "Refresh",
    "刷新"
  ],
  "Tìm người thực hiện hoặc đối tượng": [
    "Search actor or target",
    "搜索操作人或对象"
  ],
  "Email, mã video, trạng thái…": [
    "Email, video ID, status…",
    "邮箱、视频 ID、状态…"
  ],
  "Loại thao tác": [
    "Action type",
    "操作类型"
  ],
  "Tất cả": [
    "All",
    "全部"
  ],
  "Tài khoản": [
    "Account",
    "账户"
  ],
  "Hiển thị": [
    "Showing",
    "显示"
  ],
  "thao tác gần nhất (tối đa 200). Kiểm duyệt phụ đề, thuyết minh và phản hồi có lịch sử riêng tại trang tương ứng.": [
    "recent actions (up to 200). Subtitle, narration and feedback reviews have separate history on their respective pages.",
    "条最近的操作（最多 200 条）。字幕、配音和反馈审核记录可在相应页面查看。"
  ],
  "Đang tải nhật ký…": [
    "Loading activity log…",
    "正在加载操作日志…"
  ],
  "Thời gian (VN)": [
    "Time (Vietnam)",
    "时间（越南）"
  ],
  "Thao tác": [
    "Action",
    "操作"
  ],
  "Đối tượng": [
    "Target",
    "对象"
  ],
  "Người thực hiện": [
    "Performed by",
    "操作人"
  ],
  "Không tìm thấy thao tác phù hợp.": [
    "No matching actions found.",
    "未找到匹配的操作。"
  ],
  "Chưa có thay đổi được ghi nhận.": [
    "No changes recorded yet.",
    "尚无已记录的更改。"
  ],
  "Người dùng": [
    "Users",
    "用户"
  ],
  "Tài khoản đã tạo": [
    "Accounts created",
    "已创建账户"
  ],
  "Video đã tải lên": [
    "Videos uploaded",
    "已上传视频"
  ],
  "Thuyết minh": [
    "Narration",
    "配音"
  ],
  "Bản nội dung đã lưu": [
    "Saved scripts",
    "已保存脚本"
  ],
  "Phụ đề": [
    "Subtitles",
    "字幕"
  ],
  "Bản phụ đề đã lưu": [
    "Saved subtitle versions",
    "已保存字幕版本"
  ],
  "Phản hồi": [
    "Feedback",
    "反馈"
  ],
  "Gồm phản hồi và liên hệ": [
    "Includes feedback and contact requests",
    "包含反馈和联系请求"
  ],
  "Đơn hàng": [
    "Orders",
    "订单"
  ],
  "Bao gồm mọi trạng thái": [
    "All statuses included",
    "包含所有状态"
  ],
  "Ngôn ngữ": [
    "Languages",
    "语言"
  ],
  "Danh mục ngôn ngữ": [
    "Language catalog",
    "语言目录"
  ],
  "Lượt quét QR": [
    "QR scans",
    "二维码扫描"
  ],
  "Lượt quét ghi nhận": [
    "Scans recorded",
    "已记录扫描量"
  ],
  "Xem tất cả →": [
    "View all →",
    "查看全部 →"
  ],
  "Chưa có dữ liệu trong SQL Server.": [
    "No data in SQL Server.",
    "SQL Server 中暂无数据。"
  ],
  "Trang tổng hợp cần kết nối Backend SQL Server.": [
    "Overview requires a SQL Server backend connection.",
    "总览需要连接 SQL Server 后端。"
  ],
  "Vui lòng đăng nhập lại tài khoản Admin.": [
    "Please sign in to your Admin account again.",
    "请重新登录管理员账户。"
  ],
  "Phiên Admin không hợp lệ hoặc không đủ quyền.": [
    "Admin session is invalid or access is denied.",
    "管理员会话无效或无权访问。"
  ],
  "Lỗi kết nối máy chủ.": [
    "Server connection error.",
    "服务器连接错误。"
  ],
  "Tổng quan điều hành": [
    "Operations overview",
    "运营总览"
  ],
  "Số liệu vận hành từ SQL Server · Cập nhật:": [
    "Live data from SQL Server · Updated:",
    "来自 SQL Server 的实时数据 · 更新时间："
  ],
  "Việc cần xử lý": [
    "Action required",
    "待办事项"
  ],
  "Làm mới dữ liệu": [
    "Refresh data",
    "刷新数据"
  ],
  "Đang tải dữ liệu từ SQL Server…": [
    "Loading data from SQL Server…",
    "正在从 SQL Server 加载数据…"
  ],
  "Toàn cảnh hoạt động": [
    "Operations snapshot",
    "运营概览"
  ],
  "Chọn một chỉ số để đi đến trang quản lý tương ứng.": [
    "Select a metric to open its management page.",
    "选择指标以进入对应的管理页面。"
  ],
  "Xem việc cần xử lý →": [
    "View action items →",
    "查看待办事项 →"
  ],
  "Điều hành theo quy trình": [
    "Operations workflow",
    "运营流程"
  ],
  "Đi nhanh từ khách hàng đến giao dịch và nội dung": [
    "Navigate from customers to transactions and content",
    "从客户快速查看交易与内容"
  ],
  "Các quy trình quản trị": [
    "Admin workflows",
    "管理流程"
  ],
  "1. Khách hàng": [
    "1. Customers",
    "1. 客户"
  ],
  "Trạng thái và lịch sử liên quan": [
    "Status and related history",
    "状态及相关记录"
  ],
  "2. Gói & chính sách giá": [
    "2. Plans & pricing policy",
    "2. 套餐与定价政策"
  ],
  "Kiểm tra đơn giá đang áp dụng": [
    "Review current pricing",
    "查看当前价格"
  ],
  "3. Đơn hàng": [
    "3. Orders",
    "3. 订单"
  ],
  "Tra cứu và liên kết tài khoản": [
    "Search and link accounts",
    "查找并关联账户"
  ],
  "4. Đối soát": [
    "4. Reconciliation",
    "4. 对账"
  ],
  "Kiểm tra giao dịch mô phỏng": [
    "Review simulated transactions",
    "检查模拟交易"
  ],
  "5. Video & nội dung": [
    "5. Videos & content",
    "5. 视频与内容"
  ],
  "Biên tập, kiểm duyệt kết quả": [
    "Edit and review results",
    "编辑并审核结果"
  ],
  "Những việc cần chú ý": [
    "Items needing attention",
    "需要关注的事项"
  ],
  "Xem hàng đợi công việc →": [
    "View work queue →",
    "查看工作队列 →"
  ],
  "Phản hồi chưa giải quyết": [
    "Unresolved feedback",
    "未解决的反馈"
  ],
  "Video đang xử lý": [
    "Videos processing",
    "正在处理的视频"
  ],
  "Đơn hàng đang chờ": [
    "Pending orders",
    "待处理订单"
  ],
  "Thuyết minh / phụ đề chờ duyệt": [
    "Narration / subtitles awaiting review",
    "待审核的配音／字幕"
  ],
  "Phản hồi ưu tiên cao cần xử lý": [
    "High-priority feedback awaiting action",
    "待处理的高优先级反馈"
  ],
  "Đơn đã đánh dấu thanh toán theo loại tiền": [
    "Orders marked paid by currency",
    "按币种统计已标记付款的订单"
  ],
  "Quản lý đơn hàng →": [
    "Manage orders →",
    "管理订单 →"
  ],
  "đơn": [
    "orders",
    "笔订单"
  ],
  "Chưa có đơn nào được đánh dấu đã thanh toán.": [
    "No orders marked paid yet.",
    "暂无标记为已付款的订单。"
  ],
  "Người dùng mới": [
    "New users",
    "新用户"
  ],
  "Họ tên": [
    "Full name",
    "姓名"
  ],
  "Trạng thái": [
    "Status",
    "状态"
  ],
  "Thời điểm": [
    "Time",
    "时间"
  ],
  "Video mới tải": [
    "Recently uploaded videos",
    "最近上传的视频"
  ],
  "Chủ sở hữu": [
    "Owner",
    "所有者"
  ],
  "Kết quả": [
    "Results",
    "结果"
  ],
  "Phản hồi gần nhất": [
    "Recent feedback",
    "最新反馈"
  ],
  "Người gửi": [
    "Sender",
    "发送人"
  ],
  "Nội dung": [
    "Content",
    "内容"
  ],
  "Ngày": [
    "Date",
    "日期"
  ],
  "Đơn hàng mới nhất": [
    "Recent orders",
    "最新订单"
  ],
  "Khách hàng": [
    "Customer",
    "客户"
  ],
  "Số tiền": [
    "Amount",
    "金额"
  ],
  "Mỗi thông tin có trang quản lý chi tiết. Dashboard chỉ đọc và không thay đổi bản ghi.": [
    "Each item has a detailed management page. The dashboard is read-only.",
    "每项数据都有对应的管理页面。仪表盘仅供查看。"
  ],
  "Mới": [
    "New",
    "新建"
  ],
  "Đang xử lý": [
    "In progress",
    "处理中"
  ],
  "Đã giải quyết": [
    "Resolved",
    "已解决"
  ],
  "Thấp": [
    "Low",
    "低"
  ],
  "Bình thường": [
    "Normal",
    "普通"
  ],
  "Không lấy được phản hồi từ SQL Server: ": [
    "Could not fetch feedback from SQL Server: ",
    "无法从 SQL Server 获取反馈："
  ],
  "Cần nhập câu trả lời trước khi chuyển sang Đã giải quyết.": [
    "A reply is required before marking the request resolved.",
    "标记为已解决前必须填写回复。"
  ],
  "Không lưu được: ": [
    "Could not save: ",
    "无法保存："
  ],
  "Không đọc được lịch sử: ": [
    "Could not read history: ",
    "无法读取历史记录："
  ],
  "Trung tâm phản hồi & chăm sóc khách hàng": [
    "Feedback & customer support center",
    "反馈与客户支持中心"
  ],
  "Quản lý cả phản hồi tài khoản và liên hệ khách. Phân loại ưu tiên, theo dõi trạng thái, trả lời và ghi lịch sử xử lý vào SQL Server.": [
    "Manage account feedback and contact requests. Set priority, track status, reply, and record handling history in SQL Server.",
    "管理账户反馈和联系请求。设置优先级、跟踪状态、回复并将处理记录保存到 SQL Server。"
  ],
  "Tìm phản hồi": [
    "Search feedback",
    "搜索反馈"
  ],
  "Tên, email, nội dung": [
    "Name, email or message",
    "姓名、邮箱或内容"
  ],
  "Ưu tiên": [
    "Priority",
    "优先级"
  ],
  "yêu cầu · Chuyển Đã giải quyết bắt buộc có câu trả lời · Thao tác lưu có ghi người xử lý và lịch sử.": [
    "requests · A reply is required to mark a request resolved · Saved changes record the operator and history.",
    "条请求 · 标记已解决前必须回复 · 保存时记录操作人及历史。"
  ],
  "Trang liên hệ": [
    "Contact page",
    "联系页面"
  ],
  "Mở video liên quan →": [
    "Open related video →",
    "打开相关视频 →"
  ],
  "Gửi:": [
    "Sent:",
    "发送时间："
  ],
  "Độ ưu tiên": [
    "Priority level",
    "优先级"
  ],
  "Trả lời của Admin": [
    "Admin reply",
    "管理员回复"
  ],
  "Nhập phản hồi để gửi lại trong tài khoản khách hàng…": [
    "Enter a reply to send to the customer's account…",
    "输入要发送到客户账户的回复…"
  ],
  "Đang lưu…": [
    "Saving…",
    "正在保存…"
  ],
  "Lưu xử lý": [
    "Save changes",
    "保存处理结果"
  ],
  "Lịch sử": [
    "History",
    "历史记录"
  ],
  "Lịch sử xử lý": [
    "Handling history",
    "处理历史"
  ],
  "Chưa có lịch sử cập nhật.": [
    "No update history yet.",
    "暂无更新记录。"
  ],
  "Không có phản hồi phù hợp. Phản hồi mới của khách sẽ xuất hiện tại đây.": [
    "No matching feedback. New customer feedback appears here.",
    "没有匹配的反馈。新的客户反馈会显示在这里。"
  ],
  "Không thêm được ngôn ngữ: ": [
    "Could not add language: ",
    "无法添加语言："
  ],
  "Quản lý ngôn ngữ": [
    "Language management",
    "语言管理"
  ],
  "Tiếng Việt, Anh, Trung đã tích hợp. Ngôn ngữ mới chỉ được lưu vào danh mục ở trạng thái tạm ngưng cho đến khi có bộ xử lý thực tế.": [
    "Vietnamese, English and Chinese are integrated. New languages are listed as inactive until a processing engine is implemented.",
    "已集成越南语、英语和中文。新语言在处理引擎接入前仅列入目录并保持停用。"
  ],
  "Ngôn ngữ trong danh mục": [
    "Languages in catalog",
    "目录中的语言"
  ],
  "Đang hoạt động": [
    "Active",
    "已启用"
  ],
  "Đã tạm ngưng": [
    "Inactive",
    "已停用"
  ],
  "+ Thêm ngôn ngữ mới": [
    "+ Add language",
    "+ 添加语言"
  ],
  "Mã (vd: vi)": [
    "Code (e.g. vi)",
    "代码（例如 vi）"
  ],
  "Tên tiếng Việt": [
    "Vietnamese name",
    "越南语名称"
  ],
  "Tên tiếng Anh": [
    "English name",
    "英语名称"
  ],
  "Thêm": [
    "Add",
    "添加"
  ],
  "Tìm ngôn ngữ": [
    "Search languages",
    "搜索语言"
  ],
  "Mã hoặc tên ngôn ngữ": [
    "Code or language name",
    "代码或语言名称"
  ],
  "Tạm ngưng": [
    "Inactive",
    "停用"
  ],
  "Hiện": [
    "Showing",
    "显示"
  ],
  "ngôn ngữ. Chỉnh sửa trạng thái phải bấm Lưu để cập nhật SQL Server.": [
    "languages. Select Save to update their status in SQL Server.",
    "种语言。修改状态后请点击“保存”以更新 SQL Server。"
  ],
  "Mã": [
    "Code",
    "代码"
  ],
  "Khả năng xử lý": [
    "Processing support",
    "处理支持"
  ],
  "Đã hỗ trợ": [
    "Supported",
    "已支持"
  ],
  "Chưa tích hợp": [
    "Not integrated",
    "尚未集成"
  ],
  "Lưu": [
    "Save",
    "保存"
  ],
  "Hủy": [
    "Cancel",
    "取消"
  ],
  "Sửa": [
    "Edit",
    "编辑"
  ],
  "Không có ngôn ngữ phù hợp bộ lọc.": [
    "No languages match the filters.",
    "没有符合筛选条件的语言。"
  ],
  "Bản nháp": [
    "Draft",
    "草稿"
  ],
  "Chờ duyệt": [
    "Pending review",
    "待审核"
  ],
  "Đã xuất bản": [
    "Published",
    "已发布"
  ],
  "Bản ghi đã được người khác sửa. Hãy tải lại trước khi lưu.": [
    "Someone else changed this record. Reload before saving.",
    "其他人已修改此记录。请重新加载后保存。"
  ],
  "Cần chuyển sang Chờ duyệt trước khi xuất bản.": [
    "Move to Pending review before publishing.",
    "发布前请先将状态更改为“待审核”。"
  ],
  "Nội dung đã xuất bản cần được chuyển về Bản nháp trước khi sửa.": [
    "Return published content to Draft before editing.",
    "编辑已发布内容前请将其改回“草稿”。"
  ],
  "Có lỗi xảy ra": [
    "An error occurred",
    "发生错误"
  ],
  "Biên tập câu chữ, đồng bộ mốc thời gian và xuất SRT/VTT. Phiên bản và trạng thái kiểm duyệt lưu trong SQL Server.": [
    "Edit text, align timing, and export SRT/VTT. Versions and review status are stored in SQL Server.",
    "编辑文字、校准时间并导出 SRT/VTT。版本和审核状态保存在 SQL Server。"
  ],
  "Quản lý kịch bản lời đọc, nghe thử giọng đọc trình duyệt và kiểm duyệt nội dung. Phiên bản kịch bản lưu trong SQL Server.": [
    "Manage narration scripts, preview browser voices and review content. Script versions are stored in SQL Server.",
    "管理配音脚本、试听浏览器语音并审核内容。脚本版本保存在 SQL Server。"
  ],
  "Không tải được dữ liệu SQL: ": [
    "Could not load SQL data: ",
    "无法加载 SQL 数据："
  ],
  "Không mở được nội dung: ": [
    "Could not open content: ",
    "无法打开内容："
  ],
  "Hãy chọn video và ngôn ngữ hợp lệ.": [
    "Select a valid video and language.",
    "请选择有效的视频和语言。"
  ],
  "Video đã có bản ngôn ngữ này. Hãy chọn bản ghi để chỉnh sửa.": [
    "This video already has an entry for this language. Select it to edit.",
    "该视频已有此语言的记录。请选择现有记录进行编辑。"
  ],
  "Kiểm tra các dòng: phải có nội dung; thời gian bắt đầu không âm, kết thúc lớn hơn bắt đầu và không chồng lấn.": [
    "Check every line: content is required; start time cannot be negative; end must be after start, and intervals must not overlap.",
    "检查每行：内容不能为空；开始时间不可为负；结束时间须晚于开始且区间不可重叠。"
  ],
  "VĂN BẢN TRÊN VIDEO": [
    "VIDEO SUBTITLE TEXT",
    "视频字幕文本"
  ],
  "KỊCH BẢN GIỌNG ĐỌC": [
    "VOICE-OVER SCRIPT",
    "配音脚本"
  ],
  "Quản lý": [
    "Manage",
    "管理"
  ],
  "Qua thuyết minh": [
    "Go to narration",
    "转到配音"
  ],
  "Qua phụ đề": [
    "Go to subtitles",
    "转到字幕"
  ],
  "Quy trình phụ đề": [
    "Subtitle workflow",
    "字幕处理流程"
  ],
  "Quy trình thuyết minh": [
    "Narration workflow",
    "配音处理流程"
  ],
  "Đầu ra: văn bản có thời gian (.srt / .vtt)": [
    "Output: timed text (.srt / .vtt)",
    "输出：带时间轴的文本（.srt / .vtt）"
  ],
  "Đầu ra hiện tại: kịch bản lời đọc; nghe thử bằng trình duyệt": [
    "Current output: narration script; browser voice preview",
    "当前输出：配音脚本；浏览器语音试听"
  ],
  "Chọn video và ngôn ngữ": [
    "Choose video and language",
    "选择视频与语言"
  ],
  "Sửa câu chữ, kiểm tra mốc thời gian": [
    "Edit text and check timing",
    "编辑文字并检查时间轴"
  ],
  "Duyệt và xuất tệp phụ đề": [
    "Review and export subtitles",
    "审核并导出字幕"
  ],
  "Soạn kịch bản, nghe thử giọng đọc": [
    "Write script and preview voice",
    "编写脚本并试听配音"
  ],
  "Duyệt và lưu phiên bản nội dung": [
    "Review and save content version",
    "审核并保存内容版本"
  ],
  "Danh sách phụ đề theo video": [
    "Subtitle list by video",
    "按视频查看字幕"
  ],
  "Danh sách kịch bản thuyết minh": [
    "Narration script list",
    "配音脚本列表"
  ],
  "bản ghi (tối đa 500 bản gần nhất)": [
    "records (up to 500 most recent)",
    "条记录（最多最近 500 条）"
  ],
  "Tìm video / email": [
    "Search video / email",
    "搜索视频／邮箱"
  ],
  "Tên video, email hoặc mã video": [
    "Video title, email or video ID",
    "视频标题、邮箱或视频 ID"
  ],
  "Phiên bản": [
    "Version",
    "版本"
  ],
  "Cập nhật": [
    "Updated",
    "更新时间"
  ],
  "Khách hàng →": [
    "Customer →",
    "客户 →"
  ],
  "Biên tập phụ đề": [
    "Edit subtitles",
    "编辑字幕"
  ],
  "Mở kịch bản": [
    "Open script",
    "打开脚本"
  ],
  "Chưa có kết quả phù hợp. Hãy xử lý video từ trang User hoặc tạo bản mới bên dưới.": [
    "No matching results. Process a video on the customer site or create a new entry below.",
    "没有匹配的结果。请从客户页面处理视频或在下方新建记录。"
  ],
  "Tạo phụ đề cho video đã tải lên": [
    "Create subtitles for an uploaded video",
    "为已上传视频创建字幕"
  ],
  "Tạo kịch bản thuyết minh cho video đã tải lên": [
    "Create a narration script for an uploaded video",
    "为已上传视频创建配音脚本"
  ],
  "Khởi tạo bộ câu chữ cần hiển thị trên video và thời gian xuất hiện.": [
    "Create on-screen subtitle text with display times.",
    "创建屏幕字幕文本及显示时间。"
  ],
  "Khởi tạo kịch bản sẽ được dùng để thuyết minh bằng giọng nói. Chưa tạo tệp âm thanh.": [
    "Create a script for voice narration. No audio file will be generated.",
    "创建用于语音配音的脚本。此步骤不生成音频文件。"
  ],
  "-- Chọn video --": [
    "-- Select video --",
    "-- 选择视频 --"
  ],
  "Tạo bản nháp": [
    "Create draft",
    "创建草稿"
  ],
  "Chưa có video trong SQL Server. Khách hàng cần tải video trước khi biên tập nội dung.": [
    "No videos in SQL Server. A customer must upload a video before editing content.",
    "SQL Server 中暂无视频。客户需先上传视频才能编辑内容。"
  ],
  "Biên tập nội dung": [
    "Edit content",
    "编辑内容"
  ],
  "Biên tập": [
    "Editor",
    "编辑器"
  ],
  "· Phiên bản hiện tại: v": [
    "· Current version: v",
    "· 当前版本：v"
  ],
  " · Nếu sửa bản đã xuất bản, hãy chuyển về Bản nháp.": [
    " · To edit published content, return it to Draft.",
    " · 要编辑已发布内容，请先改回草稿。"
  ],
  "Đóng": [
    "Close",
    "关闭"
  ],
  "Trạng thái kiểm duyệt": [
    "Review status",
    "审核状态"
  ],
  "Xuất bản chỉ khi bản ghi đang ở trạng thái Chờ duyệt. Mọi lần lưu đều ghi lịch sử.": [
    "Publish only when the status is Pending review. Every save records history.",
    "仅在“待审核”状态下可以发布。每次保存都会记录历史。"
  ],
  "Lưu vào SQL Server": [
    "Save to SQL Server",
    "保存到 SQL Server"
  ],
  "Lịch sử chỉnh sửa": [
    "Edit history",
    "编辑历史"
  ],
  "Người sửa": [
    "Edited by",
    "修改人"
  ],
  "Thời gian": [
    "Time",
    "时间"
  ],
  "Chưa có lịch sử chỉnh sửa bằng Admin.": [
    "No Admin edit history yet.",
    "暂无管理员编辑记录。"
  ],
  "Đã duyệt": [
    "Approved",
    "已批准"
  ],
  "Nội dung thuyết minh": [
    "Narration content",
    "配音内容"
  ],
  "Lưu thuyết minh": [
    "Save narration",
    "保存配音"
  ],
  "Chỉnh sửa thuyết minh": [
    "Edit narration",
    "编辑配音"
  ],
  "Đã lưu nội dung vào SQL Server.": [
    "Content saved to SQL Server.",
    "内容已保存到 SQL Server。"
  ],
  "Quản lý thuyết minh": [
    "Narration management",
    "配音管理"
  ],
  "Chỉnh sửa và duyệt kịch bản thuyết minh của khách hàng. Phần này lưu văn bản, chưa tạo tệp âm thanh thu sẵn.": [
    "Edit and review customer narration scripts. This stores text only; no prerecorded audio file is generated.",
    "编辑和审核客户配音脚本。仅存储文本，不生成预录音频文件。"
  ],
  "Chờ thanh toán": [
    "Pending payment",
    "待付款"
  ],
  "Đã thanh toán": [
    "Paid",
    "已付款"
  ],
  "Đã hủy": [
    "Cancelled",
    "已取消"
  ],
  "Không đọc được đơn hàng: ": [
    "Could not load orders: ",
    "无法加载订单："
  ],
  "Lỗi kết nối": [
    "Connection error",
    "连接错误"
  ],
  "Quản lý đơn hàng": [
    "Order management",
    "订单管理"
  ],
  "Tra cứu đơn theo khách hàng, số tiền và trạng thái. Đối soát giao dịch được tách thành một trang riêng để không nhầm việc quản lý đơn với xác minh thanh toán.": [
    "Search orders by customer, amount and status. Reconciliation is on a separate page to avoid confusing order management with payment verification.",
    "按客户、金额和状态查询订单。对账使用独立页面，避免将订单管理与付款验证混淆。"
  ],
  "Đối soát thanh toán": [
    "Payment reconciliation",
    "付款对账"
  ],
  "Tổng đơn trong danh sách": [
    "Total orders in list",
    "列表订单总数"
  ],
  "Tra cứu đơn hàng": [
    "Search orders",
    "搜索订单"
  ],
  "Mã đơn, tên, email, mã giao dịch…": [
    "Order ID, name, email, transaction ID…",
    "订单 ID、姓名、邮箱、交易 ID…"
  ],
  "Tất cả trạng thái": [
    "All statuses",
    "所有状态"
  ],
  "đơn trong phạm vi API trả về (tối đa 500 đơn gần nhất).": [
    "orders returned by API (up to 500 most recent).",
    "笔 API 返回的订单（最多最近 500 笔）。"
  ],
  "Đang tải đơn hàng…": [
    "Loading orders…",
    "正在加载订单…"
  ],
  "Mã đơn": [
    "Order ID",
    "订单 ID"
  ],
  "Liên kết tài khoản": [
    "Account link",
    "关联账户"
  ],
  "Thành tiền": [
    "Total amount",
    "订单金额"
  ],
  "Phương thức": [
    "Method",
    "方式"
  ],
  "Tham chiếu": [
    "Reference",
    "参考号"
  ],
  "Ngày tạo (VN)": [
    "Created (Vietnam)",
    "创建时间（越南）"
  ],
  "Chưa xác minh": [
    "Unverified",
    "未验证"
  ],
  "Chi tiết": [
    "Details",
    "详情"
  ],
  "Đơn hàng #": [
    "Order #",
    "订单 #"
  ],
  "Xem đối soát →": [
    "View reconciliation →",
    "查看对账 →"
  ],
  "Giá trị:": [
    "Value:",
    "金额："
  ],
  "· Trạng thái:": [
    "· Status:",
    "· 状态："
  ],
  "Mã người dùng:": [
    "User ID:",
    "用户 ID："
  ],
  "Chưa liên kết": [
    "Not linked",
    "未关联"
  ],
  "· Tham chiếu:": [
    "· Reference:",
    "· 参考号："
  ],
  "Chưa có": [
    "None",
    "无"
  ],
  "Không tìm thấy đơn hàng phù hợp bộ lọc.": [
    "No orders match the filters.",
    "没有符合筛选条件的订单。"
  ],
  "Chưa có đơn hàng.": [
    "No orders yet.",
    "暂无订单。"
  ],
  "Đơn đã hủy": [
    "Cancelled order",
    "已取消订单"
  ],
  "Trạng thái khác": [
    "Other status",
    "其他状态"
  ],
  "Đã thanh toán, thiếu tham chiếu": [
    "Paid, missing reference",
    "已付款，缺少参考号"
  ],
  "Đã thanh toán, chưa liên kết tài khoản": [
    "Paid, account not linked",
    "已付款，未关联账户"
  ],
  "Đã ghi giao dịch": [
    "Transaction recorded",
    "交易已记录"
  ],
  "Không tải được dữ liệu: ": [
    "Could not load data: ",
    "无法加载数据："
  ],
  "Kiểm tra tình trạng ghi nhận giao dịch và phát hiện dữ liệu cần xác minh. Không xử lý thanh toán thật trong trang này.": [
    "Review recorded transactions and detect records needing verification. Real payments are not processed here.",
    "检查已记录交易，找出需要核实的数据。本页面不处理真实付款。"
  ],
  "Thanh toán mô phỏng": [
    "Simulated payment",
    "模拟付款"
  ],
  "và mã tham chiếu": [
    "and reference ID",
    "及参考号"
  ],
  "chỉ phản ánh dữ liệu hệ thống; không có đối soát sao kê ngân hàng. Không được dùng những số liệu này làm bằng chứng đã nhận tiền thật.": [
    "only reflect system records; bank statements are not reconciled. Do not treat these values as proof of funds received.",
    "仅反映系统记录，不与银行账单对账。不可将这些数据作为实际收款凭证。"
  ],
  "Đơn trong danh sách API": [
    "Orders returned by API",
    "API 返回订单"
  ],
  "Đơn đánh dấu paid": [
    "Orders marked paid",
    "标记已付款的订单"
  ],
  "Cần rà soát dữ liệu": [
    "Records to review",
    "待核查数据"
  ],
  "Tìm mã đơn, email, mã tham chiếu": [
    "Search order ID, email or reference",
    "搜索订单 ID、邮箱或参考号"
  ],
  "Ví dụ: #4 hoặc email khách": [
    "E.g. #4 or customer email",
    "例如 #4 或客户邮箱"
  ],
  "Tình trạng kiểm tra": [
    "Review status",
    "核查状态"
  ],
  "bản ghi · API trả về tối đa 500 đơn gần nhất.": [
    "records · API returns up to 500 recent orders.",
    "条记录 · API 最多返回最近 500 笔订单。"
  ],
  "Đang tải dữ liệu…": [
    "Loading data…",
    "正在加载数据…"
  ],
  "Đơn": [
    "Order",
    "订单"
  ],
  "Giá trị": [
    "Value",
    "数值"
  ],
  "Rà soát": [
    "Review",
    "核查"
  ],
  "Không có giao dịch phù hợp bộ lọc.": [
    "No transactions match the filters.",
    "没有符合筛选条件的交易。"
  ],
  "Trạng thái đơn:": [
    "Order status:",
    "订单状态："
  ],
  "· Mã tài khoản:": [
    "· Account ID:",
    "· 账户 ID："
  ],
  "Mã tham chiếu:": [
    "Reference ID:",
    "参考号："
  ],
  "Chưa ghi nhận": [
    "Not recorded",
    "未记录"
  ],
  "· Phương thức:": [
    "· Method:",
    "· 方式："
  ],
  "Xem đơn gốc": [
    "View original order",
    "查看原订单"
  ],
  "Việt Nam (VND)": [
    "Vietnam (VND)",
    "越南（VND）"
  ],
  "Hoa Kỳ (USD)": [
    "United States (USD)",
    "美国（USD）"
  ],
  "Trung Quốc (CNY)": [
    "China (CNY)",
    "中国（CNY）"
  ],
  "Gói dịch vụ & bảng giá": [
    "Service plans & pricing",
    "服务套餐与价格"
  ],
  "Tra cứu chính sách giá mà khách hàng đang xem. Giá đặt hàng được API tính lại, không dựa vào số tiền khách gửi lên.": [
    "Review the pricing policy customers see. Order totals are recalculated by the API, not taken from client-submitted amounts.",
    "查看客户看到的定价政策。订单总额由 API 重新计算，不采用客户端提交的金额。"
  ],
  "Xem đơn hàng": [
    "View orders",
    "查看订单"
  ],
  "Chế độ xem cấu hình — chưa hỗ trợ sửa giá trong Admin.": [
    "Configuration view — editing prices in Admin is not supported yet.",
    "配置查看模式——尚不支持在管理后台修改价格。"
  ],
  "Hiện đơn giá nằm trong": [
    "Current unit prices are in",
    "当前单价位于"
  ],
  "và bảng giá định kỳ nằm trong": [
    "and recurring plans are in",
    "周期套餐价格位于"
  ],
  ". Sửa giá cần đồng bộ web, backend, mobile và kiểm thử trước khi công bố. Trang này không ghi thay đổi vào SQL Server.": [
    ". Changing prices requires synchronizing the web app, backend and mobile app, followed by testing before release. This page does not write to SQL Server.",
    "。修改价格需同步网站、后端和移动端，发布前必须测试。此页面不向 SQL Server 写入数据。"
  ],
  "Đơn giá theo video": [
    "Per-video pricing",
    "按视频定价"
  ],
  "Áp dụng cho bảng tính phí theo số lượng video và ngôn ngữ.": [
    "Used to calculate fees by the number of videos and target languages.",
    "用于按视频数量和目标语言计算费用。"
  ],
  "Tiền tệ": [
    "Currency",
    "币种"
  ],
  "Giá / video tải lên": [
    "Price / uploaded video",
    "每个上传视频的费用"
  ],
  "Giá / video dịch ra": [
    "Price / translated video",
    "每个译制视频的费用"
  ],
  "Tối đa video nhập mỗi lượt · tối đa": [
    "Maximum source videos per order · maximum",
    "每次订单最多上传视频数 · 最多"
  ],
  "bản dịch/video": [
    "translations/video",
    "种翻译／视频"
  ],
  "Gói mẫu trên trang khách hàng": [
    "Sample plans on the customer site",
    "客户网站的示例套餐"
  ],
  "Dữ liệu trực tiếp từ công thức tính phí dùng chung": [
    "Values from the shared pricing formula",
    "数据来自共享计费公式"
  ],
  "Video tải lên": [
    "Videos uploaded",
    "上传视频数"
  ],
  "Video dịch ra": [
    "Translated videos",
    "译制视频数"
  ],
  "Giá tính theo cấu hình": [
    "Configured price",
    "配置价格"
  ],
  "Đường dẫn nghiệp vụ": [
    "Related workflow",
    "相关业务流程"
  ],
  "Gói mẫu #": [
    "Sample plan #",
    "示例套餐 #"
  ],
  "Đơn hàng liên quan →": [
    "Related orders →",
    "相关订单 →"
  ],
  "Bảng giá định kỳ đang hiển thị": [
    "Displayed recurring plan prices",
    "当前显示的周期套餐价格"
  ],
  "Đây là thông tin giới thiệu gói dịch vụ; không tự động tạo thuê bao khi khách đặt đơn số lượng video.": [
    "These plans are informational. Ordering a number of videos does not automatically create a subscription.",
    "这些套餐仅供参考。客户按视频数量下单不会自动创建订阅。"
  ],
  "Theo tháng": [
    "Monthly",
    "按月"
  ],
  "Giá có giảm 20%": [
    "Price with 20% discount",
    "八折价格"
  ],
  "Giá trình bày trên trang Bảng giá": [
    "Price shown on Pricing page",
    "价格页面显示的价格"
  ],
  "Tên hiển thị phải từ 1 đến 100 ký tự.": [
    "Display name must be 1–100 characters.",
    "显示名称须为 1–100 个字符。"
  ],
  "Đã cập nhật thông tin quản trị viên trong SQL Server.": [
    "Admin profile saved in SQL Server.",
    "管理员资料已保存到 SQL Server。"
  ],
  "Không thể cập nhật hồ sơ. Hãy kiểm tra kết nối hoặc đăng nhập lại.": [
    "Could not update profile. Check the connection or sign in again.",
    "无法更新资料。请检查连接或重新登录。"
  ],
  "Mật khẩu mới cần từ 8 đến 200 ký tự và phải trùng với ô xác nhận.": [
    "New password must be 8–200 characters and match its confirmation.",
    "新密码须为 8–200 个字符，并与确认密码一致。"
  ],
  "Nhập mật khẩu hiện tại trước khi thay đổi.": [
    "Enter your current password first.",
    "请先输入当前密码。"
  ],
  "Đổi mật khẩu thành công. Hãy dùng mật khẩu mới trong lần đăng nhập sau.": [
    "Password changed successfully. Use the new password next time you sign in.",
    "密码修改成功。下次登录请使用新密码。"
  ],
  "Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại và kết nối API.": [
    "Could not change password. Check your current password and API connection.",
    "无法更改密码。请检查当前密码和 API 连接。"
  ],
  "Hồ sơ & bảo mật": [
    "Profile & security",
    "个人资料与安全"
  ],
  "Cập nhật thông tin đăng nhập quản trị. Thay đổi được lưu qua API và SQL Server.": [
    "Update Admin sign-in details. Changes are saved through the API to SQL Server.",
    "更新管理员登录资料。更改通过 API 保存到 SQL Server。"
  ],
  "Thông tin tài khoản": [
    "Account information",
    "账户信息"
  ],
  "Bạn đang đăng nhập với vai trò quản trị viên.": [
    "You are signed in as an administrator.",
    "您当前以管理员身份登录。"
  ],
  "Tên hiển thị": [
    "Display name",
    "显示名称"
  ],
  "Email đăng nhập": [
    "Sign-in email",
    "登录邮箱"
  ],
  "Email và vai trò quản trị không thể thay đổi tại đây.": [
    "Email and administrator role cannot be changed here.",
    "此处不能修改邮箱和管理员角色。"
  ],
  "Lưu thông tin": [
    "Save profile",
    "保存资料"
  ],
  "Đổi mật khẩu": [
    "Change password",
    "修改密码"
  ],
  "Chỉ thay đổi mật khẩu của tài khoản đang đăng nhập.": [
    "Only the current account's password can be changed.",
    "仅可修改当前登录账户的密码。"
  ],
  "Mật khẩu hiện tại": [
    "Current password",
    "当前密码"
  ],
  "Mật khẩu mới": [
    "New password",
    "新密码"
  ],
  "Xác nhận mật khẩu mới": [
    "Confirm new password",
    "确认新密码"
  ],
  "Cập nhật mật khẩu": [
    "Update password",
    "更新密码"
  ],
  "Phản hồi cần hỗ trợ": [
    "Feedback requiring support",
    "待处理反馈"
  ],
  "Yêu cầu mới hoặc đang xử lý": [
    "New or in-progress requests",
    "新请求或处理中请求"
  ],
  "Đơn đang chờ thanh toán": [
    "Orders awaiting payment",
    "待付款订单"
  ],
  "Kiểm tra giao dịch, không tự xác nhận đã thanh toán": [
    "Review transactions; do not automatically mark paid",
    "检查交易；不可自动确认付款"
  ],
  "Nội dung chờ duyệt": [
    "Content awaiting review",
    "待审核内容"
  ],
  "Phụ đề và thuyết minh chờ kiểm duyệt": [
    "Subtitles and narration awaiting approval",
    "待审核的字幕和配音"
  ],
  "Video cần kiểm tra": [
    "Videos requiring attention",
    "需要检查的视频"
  ],
  "Video có trạng thái xử lý thất bại": [
    "Videos with failed processing status",
    "处理失败的视频"
  ],
  "Một nơi để theo dõi việc đang chờ. Chọn từng mục để xử lý tại trang nghiệp vụ tương ứng.": [
    "Monitor pending tasks in one place. Select an item to handle it on its workflow page.",
    "集中查看待办任务。选择条目后前往对应业务页面处理。"
  ],
  "Đang tải…": [
    "Loading…",
    "正在加载…"
  ],
  "Một số dữ liệu chưa tải được:": [
    "Some data could not be loaded:",
    "部分数据加载失败："
  ],
  ". Các mục tương ứng có thể hiển thị thiếu; vui lòng thử làm mới.": [
    ". Some items may be missing; please refresh.",
    "。部分条目可能缺失，请尝试刷新。"
  ],
  "Dữ liệu lấy từ các danh sách gần nhất của API, không phải tổng số toàn hệ thống. Trang này chỉ đọc, không tự thay đổi trạng thái bản ghi.": [
    "Data comes from the latest API lists, not full system totals. This page is read-only and does not change record statuses.",
    "数据来自 API 最近记录列表，并非全系统总量。本页面只读，不会更改记录状态。"
  ],
  "Mở trang": [
    "Open page",
    "打开页面"
  ],
  "Xử lý →": [
    "Handle →",
    "处理 →"
  ],
  "Không có công việc nào trong nhóm này.": [
    "No tasks in this category.",
    "此类别暂无任务。"
  ],
  "Còn": [
    "Another",
    "还有"
  ],
  "việc khác. Vào trang nghiệp vụ để xem tất cả.": [
    "tasks. Open the workflow page to view all.",
    "项任务。进入业务页面查看全部。"
  ],
  "Nhập đủ thời gian bắt đầu và kết thúc; thời gian kết thúc phải lớn hơn bắt đầu.": [
    "Enter both start and end times; end must be later than start.",
    "请填写开始和结束时间，结束时间必须晚于开始时间。"
  ],
  "Chưa đặt thời gian": [
    "Timing not set",
    "未设置时间"
  ],
  "Nội dung phụ đề": [
    "Subtitle content",
    "字幕内容"
  ],
  "Bắt đầu (giây)": [
    "Start (seconds)",
    "开始（秒）"
  ],
  "Kết thúc (giây)": [
    "End (seconds)",
    "结束（秒）"
  ],
  "Có thể để trống cả hai mốc nếu chưa xác định thời gian.": [
    "Both times may be left blank if the timing is not known yet.",
    "若尚未确定时间，可将两项时间都留空。"
  ],
  "Lưu phụ đề": [
    "Save subtitles",
    "保存字幕"
  ],
  "Chỉnh sửa phụ đề": [
    "Edit subtitles",
    "编辑字幕"
  ],
  "Đã lưu phụ đề vào SQL Server.": [
    "Subtitles saved to SQL Server.",
    "字幕已保存到 SQL Server。"
  ],
  "Quản lý phụ đề": [
    "Subtitle management",
    "字幕管理"
  ],
  "Chỉnh nội dung theo ngôn ngữ và thời gian hiển thị. Thay đổi được lưu cho dự án của khách hàng.": [
    "Edit text by language and display time. Changes are saved to the customer's project.",
    "按语言和显示时间编辑内容。更改保存至客户项目。"
  ],
  "Không thể xóa tài khoản đang có dữ liệu liên kết. Hãy khóa tài khoản để bảo toàn video, đơn hàng và phản hồi.": [
    "Cannot delete an account with linked data. Lock it to preserve videos, orders and feedback.",
    "无法删除仍有关联数据的账户。请锁定账户以保留视频、订单和反馈。"
  ],
  "Không cập nhật được tài khoản trên máy chủ.": [
    "Could not update account on the server.",
    "无法在服务器上更新账户。"
  ],
  "Lọc trạng thái người dùng": [
    "Filter users by status",
    "按状态筛选用户"
  ],
  "Đã khóa": [
    "Locked",
    "已锁定"
  ],
  "người dùng · Chọn “Hồ sơ” để đi đến đơn hàng, video và phản hồi liên quan.": [
    "users · Select “Profile” to view related orders, videos and feedback.",
    "位用户 · 选择“资料”查看相关订单、视频和反馈。"
  ],
  "Hồ sơ": [
    "Profile",
    "资料"
  ],
  "Tra cứu dữ liệu của tài khoản": [
    "Browse account data",
    "查看账户数据"
  ],
  "Những đường dẫn này lọc theo email trong danh sách API. Không tự động thay đổi quyền, đơn hàng hoặc nội dung của khách.": [
    "These links filter API lists by email. They do not change the customer's permissions, orders or content.",
    "这些链接按邮箱筛选 API 列表，不会修改客户权限、订单或内容。"
  ],
  "Đã tải lên": [
    "Uploaded",
    "已上传"
  ],
  "Hoàn thành": [
    "Completed",
    "已完成"
  ],
  "Thất bại": [
    "Failed",
    "失败"
  ],
  "Đã ẩn": [
    "Hidden",
    "已隐藏"
  ],
  "Không đọc được SQL Server: ": [
    "Could not read SQL Server: ",
    "无法读取 SQL Server："
  ],
  "Thư viện video": [
    "Video library",
    "视频库"
  ],
  "Quản lý tệp đã tải lên, trạng thái xử lý và chuyển nhanh sang biên tập phụ đề hoặc thuyết minh.": [
    "Manage uploaded files and processing status, and quickly open subtitle or narration editing.",
    "管理已上传文件及处理状态，快速进入字幕或配音编辑。"
  ],
  "Video trong danh sách": [
    "Videos in list",
    "列表视频数"
  ],
  "Cần kiểm tra lỗi": [
    "Errors to review",
    "待检查错误"
  ],
  "Tìm video": [
    "Search videos",
    "搜索视频"
  ],
  "Mã, tiêu đề, email hoặc tệp…": [
    "ID, title, email or filename…",
    "ID、标题、邮箱或文件名…"
  ],
  "video · Đổi trạng thái rồi chọn “Lưu” để xác nhận thay đổi.": [
    "videos · Change the status and click “Save” to confirm.",
    "个视频 · 修改状态后点击“保存”确认。"
  ],
  "Đang tải video…": [
    "Loading videos…",
    "正在加载视频…"
  ],
  "Tiêu đề / Tệp": [
    "Title / File",
    "标题／文件"
  ],
  "Người tải": [
    "Uploaded by",
    "上传者"
  ],
  "Ngày tải (VN)": [
    "Uploaded (Vietnam)",
    "上传时间（越南）"
  ],
  "Xem khách hàng →": [
    "View customer →",
    "查看客户 →"
  ],
  "Liên kết": [
    "Link",
    "关联"
  ],
  "Xóa": [
    "Delete",
    "删除"
  ],
  "Biên tập thuyết minh": [
    "Edit narration",
    "编辑配音"
  ],
  "Không có video phù hợp bộ lọc.": [
    "No videos match the filters.",
    "没有符合筛选条件的视频。"
  ],
  "Chưa có video tải lên trong SQL Server.": [
    "No uploaded videos in SQL Server.",
    "SQL Server 中暂无上传的视频。"
  ],
  "Quản trị viên": [
    "Administrator",
    "管理员"
  ],
  "Tài khoản quản trị": [
    "Admin account",
    "管理员账户"
  ],
  "Xem website công khai": [
    "View public website",
    "查看公开网站"
  ],
  "Đăng xuất": [
    "Log out",
    "退出登录"
  ],
  "Đang tra cứu theo": [
    "Filtering by",
    "当前筛选条件"
  ],
  "Xem toàn bộ danh sách": [
    "Show all",
    "显示全部"
  ],
  "Liên kết nghiệp vụ": [
    "Related workflows",
    "相关业务"
  ],
  "Khách hàng:": [
    "Customer:",
    "客户："
  ],
  "中文": [
    "中文",
    "中文"
  ],
  "Chỉ tài khoản Admin hợp lệ trên SQL Server mới có quyền truy cập.": [
    "Only a valid Admin account in SQL Server can access this page.",
    "仅 SQL Server 中有效的管理员账户可访问本页面。"
  ],
  "Đóng menu quản trị": [
    "Close Admin menu",
    "关闭管理菜单"
  ],
  "Dubchef - Tổng quan quản trị": [
    "Dubchef - Admin overview",
    "Dubchef - 管理总览"
  ],
  "KHÔNG GIAN QUẢN TRỊ": [
    "ADMIN WORKSPACE",
    "管理工作台"
  ],
  "Đóng menu": [
    "Close menu",
    "关闭菜单"
  ],
  "Điều hướng quản trị": [
    "Admin navigation",
    "管理导航"
  ],
  "Dubchef · Không gian làm việc nội bộ": [
    "Dubchef · Internal workspace",
    "Dubchef · 内部工作台"
  ],
  "Mở menu quản trị": [
    "Open Admin menu",
    "打开管理菜单"
  ],
  "Quản trị": [
    "Admin",
    "管理后台"
  ],
  "Đi nhanh đến chức năng": [
    "Quick navigation",
    "快速导航"
  ],
  "Xem website dành cho khách hàng": [
    "View customer website",
    "查看客户网站"
  ],
  "Tìm chức năng quản trị": [
    "Find an Admin feature",
    "查找管理功能"
  ],
  "Ví dụ: thanh toán, phụ đề, phản hồi…": [
    "E.g. payments, subtitles, feedback…",
    "例如付款、字幕、反馈…"
  ],
  "Không tìm thấy chức năng phù hợp.": [
    "No matching features found.",
    "未找到匹配的功能。"
  ],
  "Đóng (Esc)": [
    "Close (Esc)",
    "关闭（Esc）"
  ],
  "Hãy hoàn thiện nội dung và các mốc thời gian trước khi xuất tệp phụ đề.": [
    "Complete all text and timestamps before exporting subtitles.",
    "导出字幕前请完善文本及时间轴。"
  ],
  "Biên tập dòng phụ đề": [
    "Edit subtitle lines",
    "编辑字幕行"
  ],
  "Chỉnh chính xác thời gian xuất hiện và câu chữ trên màn hình. Mỗi dòng có mốc thời gian riêng.": [
    "Fine-tune on-screen text and timing. Each line has its own timestamps.",
    "精确调整屏幕文字与时间。每行都有独立的时间点。"
  ],
  "Xuất SRT": [
    "Export SRT",
    "导出 SRT"
  ],
  "Xuất VTT": [
    "Export VTT",
    "导出 VTT"
  ],
  "Xem trước phụ đề theo thời gian": [
    "Timed subtitle preview",
    "按时间预览字幕"
  ],
  "XEM TRƯỚC PHỤ ĐỀ ·": [
    "SUBTITLE PREVIEW ·",
    "字幕预览 ·"
  ],
  "Chưa có phụ đề tại thời điểm này": [
    "No subtitles at this time",
    "此时暂无字幕"
  ],
  "Vị trí xem trước:": [
    "Preview position:",
    "预览位置："
  ],
  "Câu phụ đề": [
    "Subtitle line",
    "字幕行"
  ],
  "Tốc độ đọc": [
    "Reading speed",
    "阅读速度"
  ],
  "ký tự": [
    "characters",
    "字符"
  ],
  "ký tự/giây": [
    "characters/second",
    "字符／秒"
  ],
  "Nên rút ngắn câu hoặc tăng thời gian hiển thị.": [
    "Shorten the text or increase its display time.",
    "请缩短文本或延长显示时间。"
  ],
  "Xóa dòng": [
    "Delete line",
    "删除行"
  ],
  "+ Thêm dòng phụ đề": [
    "+ Add subtitle line",
    "+ 添加字幕行"
  ],
  "Trình duyệt này không hỗ trợ nghe thử bằng giọng đọc. Vui lòng thử Edge hoặc Chrome.": [
    "This browser does not support voice preview. Try Edge or Chrome.",
    "此浏览器不支持语音试听，请尝试 Edge 或 Chrome。"
  ],
  "Hãy nhập kịch bản trước khi nghe thử.": [
    "Enter a script before previewing.",
    "试听前请先输入脚本。"
  ],
  "Hãy nhập đủ nội dung trước khi xuất kịch bản.": [
    "Enter all content before exporting the script.",
    "导出脚本前请填写完整内容。"
  ],
  "Đã tạo tệp TXT chứa kịch bản đang mở. Đây không phải tệp âm thanh MP3.": [
    "A TXT script was exported. It is not an MP3 audio file.",
    "已导出 TXT 脚本文件，它不是 MP3 音频文件。"
  ],
  "Kịch bản giọng đọc": [
    "Narration script",
    "配音脚本"
  ],
  "Chỉnh lời thoại và nghe thử cách đọc.": [
    "Edit spoken text and preview the voice.",
    "编辑台词并试听配音。"
  ],
  "đoạn ·": [
    "segments ·",
    "段 ·"
  ],
  "từ.": [
    "words.",
    "个词。"
  ],
  "Xuất kịch bản TXT": [
    "Export TXT script",
    "导出 TXT 脚本"
  ],
  "Giọng nghe thử (trên máy này)": [
    "Preview voice (this device)",
    "试听语音（本设备）"
  ],
  "Tự động theo ngôn ngữ": [
    "Automatic for selected language",
    "按所选语言自动匹配"
  ],
  "Tốc độ nghe thử:": [
    "Preview speed:",
    "试听速度："
  ],
  "Tốc độ nghe thử": [
    "Preview speed",
    "试听速度"
  ],
  "Nghe toàn bộ": [
    "Play all",
    "全部播放"
  ],
  "Dừng nghe": [
    "Stop playback",
    "停止播放"
  ],
  "Nghe thử dùng giọng đọc có sẵn trong trình duyệt; chưa tạo hoặc lưu MP3 vào máy chủ. Giọng và tốc độ nghe thử không được ghi vào SQL.": [
    "Preview uses the browser's available voices; no MP3 is generated or saved to the server. Voice and preview speed are not saved in SQL.",
    "试听使用浏览器自带语音；不会生成或保存 MP3。语音及试听速度不会保存到 SQL。"
  ],
  "Đoạn thuyết minh": [
    "Narration segment",
    "配音片段"
  ],
  "từ ·": [
    "words ·",
    "词 ·"
  ],
  "Nghe đoạn": [
    "Play segment",
    "播放片段"
  ],
  "Xóa đoạn": [
    "Delete segment",
    "删除片段"
  ],
  "Lời thuyết minh": [
    "Narration text",
    "配音文本"
  ],
  "Nhập lời đọc cho đoạn video...": [
    "Enter narration for this video segment…",
    "请输入此视频片段的配音文字…"
  ],
  "Đồng bộ lời đọc với video (giây)": [
    "Align narration with video (seconds)",
    "将配音与视频对齐（秒）"
  ],
  "Bắt đầu": [
    "Start",
    "开始"
  ],
  "Kết thúc": [
    "End",
    "结束"
  ],
  "+ Thêm đoạn thuyết minh": [
    "+ Add narration segment",
    "+ 添加配音片段"
  ],
  "ĐIỀU HÀNH": [
    "OPERATIONS",
    "运营管理"
  ],
  "Tổng quan": [
    "Overview",
    "总览"
  ],
  "Toàn cảnh hoạt động và cảnh báo": [
    "Operations snapshot and alerts",
    "运营概况及提醒"
  ],
  "Danh sách công việc theo mức ưu tiên": [
    "Prioritized task list",
    "按优先级排序的任务列表"
  ],
  "KHÁCH HÀNG": [
    "CUSTOMERS",
    "客户管理"
  ],
  "Tài khoản, trạng thái và hoạt động liên quan": [
    "Accounts, status and related activity",
    "账户、状态和相关活动"
  ],
  "Phản hồi & hỗ trợ": [
    "Feedback & support",
    "反馈与支持"
  ],
  "Tiếp nhận, phản hồi, xử lý yêu cầu": [
    "Receive, reply to and resolve requests",
    "接收、回复并解决请求"
  ],
  "Chính sách giá và gói mẫu hiện áp dụng (chỉ xem)": [
    "Current pricing policy and sample plans (read-only)",
    "当前定价政策与示例套餐（只读）"
  ],
  "Đơn mua, khách hàng và trạng thái": [
    "Orders, customers and statuses",
    "订单、客户及状态"
  ],
  "Kiểm tra dấu hiệu thanh toán mô phỏng, không xác nhận ngân hàng": [
    "Review simulated payments; no bank confirmation",
    "检查模拟付款；不进行银行确认"
  ],
  "SẢN XUẤT NỘI DUNG": [
    "CONTENT PRODUCTION",
    "内容制作"
  ],
  "Video theo khách hàng và trạng thái": [
    "Videos by customer and status",
    "按客户和状态查看视频"
  ],
  "Chỉnh mốc thời gian, văn bản, duyệt phụ đề": [
    "Edit subtitle timing and text, review output",
    "编辑字幕时间与文字并审核输出"
  ],
  "Kịch bản lời đọc, nghe thử và kiểm duyệt": [
    "Narration scripts, voice previews and review",
    "配音脚本、语音试听与审核"
  ],
  "Danh mục ngôn ngữ và khả năng hỗ trợ": [
    "Language catalog and processing support",
    "语言目录及处理支持"
  ],
  "BÁO CÁO & HỆ THỐNG": [
    "REPORTS & SYSTEM",
    "报表与系统"
  ],
  "Khách truy cập và biểu đồ theo thời gian": [
    "Visitors and charts over time",
    "访客及趋势图"
  ],
  "Báo cáo lượt quét QR": [
    "QR scan report",
    "二维码扫描报表"
  ],
  "Số liệu quét mã QR": [
    "QR scan statistics",
    "二维码扫描统计"
  ],
  "Ai đổi trạng thái người dùng và video": [
    "Who changed user or video status",
    "谁更改了用户或视频状态"
  ],
  "Tiếng Việt": [
    "Vietnamese",
    "越南语"
  ],
  "Tìm kiếm": [
    "Search",
    "搜索"
  ],
  "Tên, email hoặc nội dung": [
    "Name, email or content",
    "姓名、邮箱或内容"
  ],
  "Làm mới danh sách": [
    "Refresh list",
    "刷新列表"
  ],
  "Chưa có dữ liệu phù hợp.": [
    "No matching data.",
    "无匹配数据。"
  ],
  "Cao": ["High", "高"],
  "Trước": ["Previous", "上一页"],
  "Xem website": ["View website", "查看网站"],
  "Xem video": ["View video", "查看视频"],
  "Xem": ["View", "查看"],
  "Xử lý bởi": ["Handled by", "处理人"],
  "Đã lưu": ["Saved", "已保存"],
  "Chờ": ["Pending", "待处理"],
  "Đã lưu và ghi lịch sử yêu cầu ": ["Saved request and history ", "已保存请求及历史记录 "],
  "Giá trị sau": ["After", "修改后"],
  "Gói": ["Plan", "套餐"],
  "Trạng thái paid trong dự án hiện là thanh toán mô phỏng, không xác minh tiền thật.": ["Paid status in this project indicates a simulated payment, not verified funds.", "本项目中的已付款状态仅表示模拟付款，并未核实实际到账。"],
  "Đã tạo tệp ": ["Created file ", "已生成文件 "],
  "Sau": ["Next", "下一页"],
  "Không đọc được SQL Server (HTTP ": ["Could not read SQL Server (HTTP ", "无法读取 SQL Server（HTTP "],
  "Không lưu được thay đổi: ": ["Could not save changes: ", "无法保存更改："],
  "Không tải được nhật ký: ": ["Could not load activity log: ", "无法加载操作日志："],
  "Không đọc được dữ liệu: ": ["Could not read data: ", "无法读取数据："],
  "Video": ["Video", "视频"],
  "Video #": ["Video #", "视频 #"],
  "Email": ["Email", "邮箱"],
  "Gửi tin nhắn": ["Send message", "发送消息"],
  "giây": ["seconds", "秒"],
  "Bắt đầu dòng": ["Line start", "行开始时间"],
  "Kết thúc dòng": ["Line end", "行结束时间"],
  "Nội dung dòng": ["Line text", "行内容"],
  "Chi tiết đơn hàng": ["Order details", "订单详情"],
  "Chi tiết đối soát đơn": ["Order reconciliation details", "订单对账详情"],
  "Hoạt động khách hàng": ["Customer activity", "客户活动"],
  "Chọn trạng thái video": ["Select video status", "选择视频状态"],
  "Liên kết video": ["Related video", "关联视频"],
  "Xóa video": ["Delete video", "删除视频"],
  "và dữ liệu phụ đề/thuyết minh liên quan? Thao tác này không thể hoàn tác.": ["and related subtitle/narration data? This action cannot be undone.", "及关联的字幕／配音数据？此操作无法撤销。"],
  "vào SQL, có ghi lịch sử phiên bản.": ["to SQL, including version history.", "到 SQL，并记录版本历史。"],
  "Quản lý kịch bản lời đọc, duyệt nội dung, rồi xuất MP3/MP4 thực tế bằng máy chủ. Phiên bản lưu trong SQL Server.": ["Manage spoken scripts, review content, then export actual server-generated MP3/MP4. Versions are stored in SQL Server.", "管理配音脚本、审核内容，然后在服务器生成真实的 MP3/MP4。版本保存在 SQL Server。"],
  "Lỗi xử lý âm thanh": ["Audio processing error", "音频处理错误"],
  "Tải MP3 giọng đọc": ["Download spoken MP3", "下载配音 MP3"],
  "Tải MP4 đã lồng tiếng": ["Download dubbed MP4", "下载配音 MP4"],
  "Hãy duyệt và xuất bản kịch bản đã lưu trước khi tạo MP3/MP4.": ["Review and publish the saved script before exporting MP3/MP4.", "导出 MP3/MP4 前，请先审核并发布已保存的脚本。"],
  "Đã tạo tệp âm thanh/video có lời thuyết minh thực tế.": ["Created actual voice-over audio/video file.", "已生成真实的配音音频／视频文件。"],
  "Không thể xuất tệp": ["Could not export file", "无法导出文件"],
  "Kịch bản chưa được xuất bản.": ["The script has not been published.", "脚本尚未发布。"],
  "Kịch bản chưa có mốc thời gian hợp lệ.": ["Script timing is invalid.", "脚本时间轴无效。"],
  "Có câu đọc quá dài so với thời gian. Hãy kéo dài đoạn hoặc rút ngắn câu.": ["Speech is too long for its time slot. Extend the slot or shorten the text.", "语音内容超出时间段，请延长时间段或缩短文本。"],
  "Mốc thời gian vượt quá độ dài video gốc.": ["Timeline exceeds the original video duration.", "时间轴超过原视频长度。"],
  "Máy chủ đang xuất tệp khác. Vui lòng thử lại.": ["The server is exporting another file. Please retry.", "服务器正在导出其他文件，请重试。"],
  "Máy chủ chưa cài FFmpeg hoặc công cụ giọng đọc.": ["FFmpeg or the speech engine is not installed on the server.", "服务器尚未安装 FFmpeg 或语音引擎。"],
  "Không tìm thấy tệp video gốc để ghép tiếng.": ["Original video file not found for dubbing.", "找不到要配音的原视频。"],
  "Giọng nghe thử lấy từ trình duyệt. Để tải MP3 hoặc MP4 thật, hãy lưu, chuyển sang Chờ duyệt, rồi Xuất bản và mở lại bản ghi. Máy chủ dùng giọng tổng hợp cục bộ (chất lượng demo) để tạo tệp; các chỉnh sửa chưa lưu không được đưa vào bản xuất.": ["Browser voices are for preview. To download real MP3 or MP4, save, move to Review, publish, and reopen. The server uses local synthetic demo-quality voices; unsaved edits are excluded.", "浏览器语音仅供试听。要下载真实 MP3 或 MP4，请保存、提交审核、发布并重新打开。服务器使用本地合成的演示级声音，未保存的修改不会导出。"],
  "Đầu ra: MP3 giọng đọc và MP4 đã ghép lời đọc khi xuất bản": ["Output: spoken MP3 and dubbed MP4 once published", "发布后可输出配音 MP3 和 MP4"],
  "Duyệt, xuất bản và tải MP3/MP4": ["Review, publish and download MP3/MP4", "审核、发布并下载 MP3/MP4"],
  "Khởi tạo kịch bản; sau khi duyệt và xuất bản có thể tạo MP3/MP4 trên máy chủ.": ["Create a script; after review and publishing, generate MP3/MP4 on the server.", "创建脚本，审核并发布后可在服务器生成 MP3/MP4。"],

  "Nguồn xác nhận thanh toán": ["Payment verification source", "支付验证来源"],
  "Nguồn xác nhận": ["Verification source", "验证来源"],
  "Mô phỏng hoặc chưa rõ nguồn": ["Demo or unverified legacy payment", "模拟或历史未核实支付"],
  "payOS đã xác minh": ["Verified by payOS", "已由 payOS 验证"],
  "Các đơn paid có thể gồm dữ liệu mô phỏng và payOS. Chỉ giao dịch có NguonXacNhan=payos mới được xác minh qua webhook.": ["Paid orders can include demo and payOS data. Only NguonXacNhan=payos identifies a verified webhook.", "已付款订单可能包含演示及 payOS 数据。只有 NguonXacNhan=payos 表示已通过 webhook 验证。"],
  "phải kiểm tra NguonXacNhan: payos (webhook đã xác minh), demo (mô phỏng) hoặc legacy_unknown (dữ liệu cũ). Không coi demo/dữ liệu cũ là tiền ngân hàng đã nhận.": ["must be checked against NguonXacNhan: payos (verified webhook), demo (simulation) or legacy_unknown (historical). Never treat demo/legacy records as confirmed bank funds.", "必须检查 NguonXacNhan：payos（已验证 webhook）、demo（模拟）或 legacy_unknown（历史记录）。不得将模拟或历史记录视为实际到账。"],

};
