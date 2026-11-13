শিরোনাম পত্র Helper — আপডেট করা ফাইল

- index.html, style.css, script.js, main.js: আপডেট করা সোর্স ফাইল।
- Roll digit count হিসেবে ৬ বা ১০ বেছে Save চাপুন। এরপর প্রতিটি roll ঠিক সেই দৈর্ঘ্যের না হলে Process হবে না; duplicate roll-ও জানাবে। ১০ digit বাছলে প্রিন্ট শিটের roll box ৬ digit-এর চেয়ে চওড়া হবে; roll নম্বরগুলোর মাঝে gap রাখা আছে যাতে তারা লেগে না যায়। প্রিন্ট শিটের উপরের header ও section spacing কমানো হয়েছে, যাতে roll-এর জন্য বেশি জায়গা থাকে।
- পরীক্ষার তারিখ অ্যাপ খোলার সময় কম্পিউটারের স্থানীয় বর্তমান তারিখে সেট হয়। পরীক্ষা অন্য দিনে হলে date picker থেকে বেছে নিন; বাংলা তারিখ ও বার স্বয়ংক্রিয়ভাবে বদলাবে। সময়ও time picker থেকে সম্পাদনা করা যায় এবং শিটে বাংলা সময় হিসেবে দেখাবে।
- স্ক্রিনে Present, Absent, OMR এবং প্রিন্ট শিটের তিনটি roll area-র উচ্চতা drag করে পরিবর্তন করা যায়।
- কেন্দ্র, বিষয় ও বিষয় কোড শিটে ক্লিক করে Print-এর আগে সম্পাদনা করা যায়।
- Font stack: Nikosh → NikoshBan → SutonnyMJ → Times New Roman → Noto Serif Bengali. ডিভাইসে font install করা থাকতে হবে; CSS font stack প্রথম উপলভ্য font ব্যবহার করে।
- SutonnyMJ সাধারণত legacy Bijoy encoding-এর font; Unicode বাংলা লেখা হলে এটি সবসময় ঠিকমতো render নাও হতে পারে। Unicode support-এর জন্য Nikosh/NikoshBan ব্যবহার করুন।
- package.json বা font files দেওয়া হয়নি; Electron install/run script ও bundled font এই ZIP-এ অন্তর্ভুক্ত নয়।
