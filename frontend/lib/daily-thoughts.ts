export type DailyThought = {
  id: number
  theme:
    | 'rest'
    | 'self-compassion'
    | 'boundaries'
    | 'progress'
    | 'uncertainty'
    | 'acceptance'
    | 'small-steps'
    | 'asking-for-support'
    | 'difficult-days'
    | 'personal-growth'
  en: string
  hi: string
  hinglish: string
}

export const DAILY_THOUGHTS_LIBRARY: DailyThought[] = [
  // 1. Rest
  {
    id: 1,
    theme: 'rest',
    en: 'You can rest without falling behind.',
    hi: 'आप पीछे छूटे बिना भी विश्राम कर सकते हैं।',
    hinglish: 'Aap bina peeche chhoote bhi aaram kar sakte hain.',
  },
  {
    id: 2,
    theme: 'rest',
    en: 'Rest is not a reward you earn; it is a human need you honor.',
    hi: 'आराम कोई इनाम नहीं जो कमाना पड़े, यह एक बुनियादी ज़रूरत है।',
    hinglish: 'Rest koi reward nahi jo earn karna pade, yeh ek zaroorat hai.',
  },
  {
    id: 3,
    theme: 'rest',
    en: 'Soft days still count as days.',
    hi: 'धीमे और शांत दिन भी जीवन का हिस्सा हैं।',
    hinglish: 'Dheeme aur shaant din bhi utne hi zaroori hain.',
  },
  {
    id: 4,
    theme: 'rest',
    en: 'Giving your mind permission to soften is an act of quiet strength.',
    hi: 'अपने मन को शांत होने की अनुमति देना भी आंतरिक शक्ति है।',
    hinglish: 'Apne mann ko relax hone ki permission dena bhi ek taaqat hai.',
  },
  {
    id: 5,
    theme: 'rest',
    en: 'You do not have to fill every silence with productivity.',
    hi: 'हर शांत पल को काम से भरना ज़रूरी नहीं है।',
    hinglish: 'Har shaant pal ko productivity se bharna zaroori nahi hai.',
  },
  {
    id: 6,
    theme: 'rest',
    en: 'Sleep and stillness are where your resilience rebuilds.',
    hi: 'नींद और ठहराव में ही आपका हौसला दोबारा बनता है।',
    hinglish: 'Neend aur shaanti mein hi aapka hausla rebuild hota hai.',
  },
  {
    id: 7,
    theme: 'rest',
    en: 'It is okay to put your phone down and let the world wait for an hour.',
    hi: 'फोन को रखकर दुनिया को कुछ देर इंतज़ार करने देना बिल्कुल ठीक है।',
    hinglish: 'Phone rakh kar duniya ko thodi der wait karne dena bilkul theek hai.',
  },
  {
    id: 8,
    theme: 'rest',
    en: 'A quiet pause is still progress.',
    hi: 'एक शांत ठहराव भी आगे बढ़ने का ही हिस्सा है।',
    hinglish: 'Ek shaant pause bhi progress ka hi hissa hai.',
  },
  {
    id: 9,
    theme: 'rest',
    en: 'Dropping your shoulders right now is a real step toward calm.',
    hi: 'अभी अपने कंधों को ढीला छोड़ना भी शांति की ओर एक कदम है।',
    hinglish: 'Abhi apne shoulders ko drop karke saans chhodna bhi calm ki taraf ek kadam hai.',
  },
  {
    id: 10,
    theme: 'rest',
    en: 'Unclench your jaw. Take a slow, honest breath.',
    hi: 'तनाव छोड़िए। एक गहरी और सच्ची सांस लीजिए।',
    hinglish: 'Tension chhodiye. Ek gehri aur sachhi saans lijiye.',
  },

  // 2. Self-Compassion
  {
    id: 11,
    theme: 'self-compassion',
    en: 'Kindness toward yourself is never wasted effort.',
    hi: 'खुद के प्रति दयालु होना कभी व्यर्थ नहीं जाता।',
    hinglish: 'Khud ke prati kind hona kabhi waste nahi hota.',
  },
  {
    id: 12,
    theme: 'self-compassion',
    en: 'You deserve the warmth and patience you so freely give to others.',
    hi: 'आप भी उसी धैर्य और प्यार के हकदार हैं जो आप दूसरों को देते हैं।',
    hinglish: 'Aap bhi usi patience aur pyaar ke haqdaar hain jo aap doosron ko dete hain.',
  },
  {
    id: 13,
    theme: 'self-compassion',
    en: 'Speak to yourself the way you would speak to a friend who is hurting.',
    hi: 'खुद से वैसे बात कीजिए जैसे किसी उदास दोस्त से करते हैं।',
    hinglish: 'Khud se waise baat kijiye jaise kisi dost se karte hain jo pareshan ho.',
  },
  {
    id: 14,
    theme: 'self-compassion',
    en: 'You do not have to be proud of everything to be gentle with yourself.',
    hi: 'खुद के साथ सौम्य होने के लिए हर चीज़ का सही होना ज़रूरी नहीं है।',
    hinglish: 'Khud ke saath gentle hone ke liye har cheez perfect hona zaroori nahi hai.',
  },
  {
    id: 15,
    theme: 'self-compassion',
    en: 'Honor how hard you have been trying, even on days with little to show.',
    hi: 'अपनी कोशिशों का सम्मान कीजिए, भले ही आज परिणाम छोटा दिखा हो।',
    hinglish: 'Apni koshishon ko respect dijiye, chahe aaj result chhota hi kyu na ho.',
  },
  {
    id: 16,
    theme: 'self-compassion',
    en: 'Forgive yourself for not knowing earlier what you only learned today.',
    hi: 'जो बात आज समझ आई, उसके पहले न जानने के लिए खुद को माफ कीजिए।',
    hinglish: 'Jo baat aaj samajh aayi, uske pehle na pata hone ke liye khud ko maaf kijiye.',
  },
  {
    id: 17,
    theme: 'self-compassion',
    en: 'Your worth is not measured by your output today.',
    hi: 'आपका मूल्य इस बात से तय नहीं होता कि आज आपने कितना काम किया।',
    hinglish: 'Aapki value is baat se decide nahi hoti ki aaj aapne kitna kaam kiya.',
  },
  {
    id: 18,
    theme: 'self-compassion',
    en: 'It is okay to simply exist today without fixing anything.',
    hi: 'आज बिना कुछ सुधारे बस मौजूद रहना भी काफी है।',
    hinglish: 'Aaj bina kuch fix kiye bas present rehna bhi kaafi hai.',
  },
  {
    id: 19,
    theme: 'self-compassion',
    en: 'You are allowed to have flaws while still being worthy of love.',
    hi: 'कमियों के बावजूद आप प्यार और सम्मान के पूरे हकदार हैं।',
    hinglish: 'Flaws hone ke bawajood aap respect aur care ke poore haqdaar hain.',
  },
  {
    id: 20,
    theme: 'self-compassion',
    en: 'Holding yourself with care is not self-indulgence; it is self-respect.',
    hi: 'खुद की देखभाल करना स्वार्थ नहीं, बल्कि आत्म-सम्मान है।',
    hinglish: 'Apna khayaal rakhna selfish hona nahi, self-respect hai.',
  },

  // 3. Boundaries
  {
    id: 21,
    theme: 'boundaries',
    en: 'A gentle "no" is an act of care toward your own capacity.',
    hi: 'शालीनता से "ना" कहना अपनी ऊर्जा की रक्षा करना है।',
    hinglish: 'Shaanti se "no" kehna apni energy aur capacity ko protect karna hai.',
  },
  {
    id: 22,
    theme: 'boundaries',
    en: 'You do not owe anyone an immediate reply when your cup is empty.',
    hi: 'जब आप खुद थके हों, तो तुरंत जवाब देना आपकी मजबूरी नहीं है।',
    hinglish: 'Jab aap thake hue hon, toh turant reply karna zaroori nahi hota.',
  },
  {
    id: 23,
    theme: 'boundaries',
    en: 'Protecting your peace is not cold; it is necessary.',
    hi: 'अपनी मानसिक शांति की रक्षा करना कोई कठोरता नहीं, ज़रूरत है।',
    hinglish: 'Apni mental peace protect karna koi galat baat nahi, zaroorat hai.',
  },
  {
    id: 24,
    theme: 'boundaries',
    en: 'You are allowed to step away from conversations that drain your spirit.',
    hi: 'उन बातचीतों से पीछे हटने की अनुमति आपको है जो आपको थका देती हैं।',
    hinglish: 'Aisi baaton se door rehna theek hai jo aapki mental peace drain karti hain.',
  },
  {
    id: 25,
    theme: 'boundaries',
    en: 'Boundaries teach others how to love you sustainably.',
    hi: 'सीमाएं दूसरों को सिखाती हैं कि आपका सम्मान कैसे किया जाए।',
    hinglish: 'Boundaries doosron ko sikhaati hain ki aapko sustainably kaise respect karein.',
  },
  {
    id: 26,
    theme: 'boundaries',
    en: 'It is okay if someone is disappointed when you choose your health.',
    hi: 'अगर आपकी सेहत चुनने से कोई नाराज़ होता है, तो भी आपका फैसला सही है।',
    hinglish: 'Agar apni health choose karne se koi upset hota hai, tab bhi aapka decision theek hai.',
  },
  {
    id: 27,
    theme: 'boundaries',
    en: 'Your time and emotional energy have real, precious value.',
    hi: 'आपका समय और मानसिक ऊर्जा बेहद अनमोल हैं।',
    hinglish: 'Aapka time aur mental energy bahut precious hain.',
  },
  {
    id: 28,
    theme: 'boundaries',
    en: 'You do not need an excuse to take space for yourself.',
    hi: 'खुद के लिए समय निकालने के लिए किसी बहाने की ज़रूरत नहीं होती।',
    hinglish: 'Khud ke liye space lene ke liye kisi bahaane ki zaroorat nahi hai.',
  },
  {
    id: 29,
    theme: 'boundaries',
    en: 'Saying yes to yourself often begins with saying no to overload.',
    hi: 'खुद को हां कहने की शुरुआत अक्सर अतिरिक्त बोझ को ना कहने से होती है।',
    hinglish: 'Khud ko yes kehne ki shuruat overload ko no kehne se hoti hai.',
  },
  {
    id: 30,
    theme: 'boundaries',
    en: 'You can love people and still need distance to breathe.',
    hi: 'आप लोगों से प्यार करते हुए भी सांस लेने के लिए दूरी रख सकते हैं।',
    hinglish: 'Aap logon ki care karte hue bhi distance maintain kar sakte hain.',
  },

  // 4. Progress
  {
    id: 31,
    theme: 'progress',
    en: 'Progress is not a straight line; curving is part of growing.',
    hi: 'तरक्की हमेशा सीधी रेखा में नहीं होती, मोड़ भी विकास का हिस्सा हैं।',
    hinglish: 'Progress hamesha straight line nahi hoti, ups and downs growth ka hissa hain.',
  },
  {
    id: 32,
    theme: 'progress',
    en: 'Small steps taken consistently travel surprising distances.',
    hi: 'लगातार उठाए गए छोटे कदम बहुत दूर तक ले जाते हैं।',
    hinglish: 'Consistency se liye gaye chhote kadam surprising dooriyan tay karte hain.',
  },
  {
    id: 33,
    theme: 'progress',
    en: 'A setback is a pause in the sentence, not the end of the chapter.',
    hi: 'एक झटका केवल एक अल्पविराम है, कहानी का अंत नहीं।',
    hinglish: 'Ek setback bas ek pause hai, chapter ka end nahi.',
  },
  {
    id: 34,
    theme: 'progress',
    en: 'Notice how much you have survived to arrive at this very moment.',
    hi: 'देखिए कि आप कितना कुछ सहकर आज इस पल तक पहुंचे हैं।',
    hinglish: 'Notice kijiye ki aap kitna survive karke aaj is moment tak pahuche hain.',
  },
  {
    id: 35,
    theme: 'progress',
    en: 'Growth often happens in the quietest, unnoticed moments.',
    hi: 'सच्चा बदलाव अक्सर सबसे शांत और अनदेखे पलों में होता है।',
    hinglish: 'Growth aksar sabse shaant aur unnoticed moments mein hoti hai.',
  },
  {
    id: 36,
    theme: 'progress',
    en: 'You do not have to arrive today; staying on the path is enough.',
    hi: 'आज ही मंज़िल पर पहुंचना ज़रूरी नहीं, रास्ते पर बने रहना ही काफी है।',
    hinglish: 'Aaj hi manzil tak pahuchna zaroori nahi, raaste par rehna hi kaafi hai.',
  },
  {
    id: 37,
    theme: 'progress',
    en: 'Celebrate the quiet victories nobody else was in the room to see.',
    hi: 'उन छोटी जीतों का जश्न मनाइए जिन्हें देखने कमरे में कोई और नहीं था।',
    hinglish: 'Un chhoti jeeton ko appreciate kijiye jo sirf aapne dekhi hain.',
  },
  {
    id: 38,
    theme: 'progress',
    en: 'Getting through a heavy morning is already a meaningful triumph.',
    hi: 'एक मुश्किल सुबह को पार कर लेना भी एक बड़ी जीत है।',
    hinglish: 'Ek mushkil subah ko paar kar lena bhi ek badi victory hai.',
  },
  {
    id: 39,
    theme: 'progress',
    en: 'Comparison steals the joy of your own unique pace.',
    hi: 'दूसरों से तुलना आपकी अपनी अनोखी गति की खुशी छीन लेती है।',
    hinglish: 'Doosron se comparison aapki apni pace ka sukoon chheen leta hai.',
  },
  {
    id: 40,
    theme: 'progress',
    en: 'You are learning, unlearning, and showing up. That is real progress.',
    hi: 'आप सीख रहे हैं, पुरानी आदतें छोड़ रहे हैं, और लगे हुए हैं। यही प्रगति है।',
    hinglish: 'Aap seekh rahe hain, grow kar rahe hain, aur lage hue hain. Yahi real progress hai.',
  },

  // 5. Uncertainty
  {
    id: 41,
    theme: 'uncertainty',
    en: 'Not knowing the next five steps does not stop you from taking this one.',
    hi: 'आगे के पांच कदम न जानना आपको यह एक कदम लेने से नहीं रोकता।',
    hinglish: 'Aage ke 5 steps na pata hona aapko yeh ek step lene se nahi rokta.',
  },
  {
    id: 42,
    theme: 'uncertainty',
    en: 'Peace begins with releasing what you cannot predict or control today.',
    hi: 'शांति की शुरुआत उस चीज़ को छोड़ने से होती है जिसे आप बदल नहीं सकते।',
    hinglish: 'Peace un cheezon ko chhodne se aati hai jo aapke control mein nahi hain.',
  },
  {
    id: 43,
    theme: 'uncertainty',
    en: 'Foggy paths still lead forward one footprint at a time.',
    hi: 'धुंध भरा रास्ता भी एक-एक कदम चलकर ही पार होता है।',
    hinglish: 'Dhundh bhara rasta bhi ek-ek kadam chalkar hi paar hota hai.',
  },
  {
    id: 44,
    theme: 'uncertainty',
    en: 'You have figured things out before; trust that you will again.',
    hi: 'आपने पहले भी रास्ते निकाले हैं; विश्वास रखिए, आगे भी निकाल लेंगे।',
    hinglish: 'Aapne pehle bhi raste nikale hain; trust rakhiye, aage bhi nikaal lenge.',
  },
  {
    id: 45,
    theme: 'uncertainty',
    en: 'Uncertainty feels uncomfortable, but it is also where possibilities live.',
    hi: 'अनिश्चितता कठिन लगती है, पर नए अवसरों का जन्म भी यहीं होता है।',
    hinglish: 'Uncertainty uncomfortable lagti hai, par nayi possibilities bhi yahi se aati hain.',
  },
  {
    id: 46,
    theme: 'uncertainty',
    en: 'You do not need all the answers before you give yourself permission to breathe.',
    hi: 'सांस लेने और शांत होने के लिए सारे जवाब होना ज़रूरी नहीं है।',
    hinglish: 'Saans lene aur shaant hone ke liye saare answers hona zaroori nahi hai.',
  },
  {
    id: 47,
    theme: 'uncertainty',
    en: 'Let today be what it is, without forcing tomorrow into it.',
    hi: 'आज को आज रहने दीजिए, कल की चिंताओं को इसमें मत खींचिए।',
    hinglish: 'Aaj ko aaj rehne dijiye, kal ki chintaon ko ismein mat ghasitiye.',
  },
  {
    id: 48,
    theme: 'uncertainty',
    en: 'Living in the present moment is the antidote to future worry.',
    hi: 'वर्तमान में जीना ही भविष्य की चिंता का सबसे सच्चा इलाज है।',
    hinglish: 'Present moment mein jeena hi future ki chinta ka sabse achha hal hai.',
  },
  {
    id: 49,
    theme: 'uncertainty',
    en: 'It is okay to say: "I do not know yet, and that is alright."',
    hi: 'यह कहना ठीक है: "मुझे अभी नहीं पता, और यह बिल्कुल ठीक है।"',
    hinglish: 'Yeh kehna theek hai: "Mujhe abhi nahi pata, aur yeh bilkul okay hai."',
  },
  {
    id: 50,
    theme: 'uncertainty',
    en: 'Clarity arrives in motion, not in standing still and overthinking.',
    hi: 'स्पष्टता ज्यादा सोचने से नहीं, बल्कि धीरे-धीरे आगे बढ़ने से आती है।',
    hinglish: 'Clarity overthinking se nahi, balki dheere-dheere aage badhne se aati hai.',
  },

  // 6. Emotional Acceptance
  {
    id: 51,
    theme: 'acceptance',
    en: 'You do not have to tidy the feeling before you feel it.',
    hi: 'महसूस करने से पहले भावना को व्यवस्थित करना ज़रूरी नहीं है।',
    hinglish: 'Feel karne se pehle emotion ko tidy up karna zaroori nahi hai.',
  },
  {
    id: 52,
    theme: 'acceptance',
    en: 'Your feelings make sense, even when they feel tangled or heavy.',
    hi: 'आपकी भावनाएं स्वाभाविक हैं, भले ही वे उलझी हुई क्यों न लगें।',
    hinglish: 'Aapki feelings natural hain, chahe wo thodi uljhi hui kyu na hon.',
  },
  {
    id: 53,
    theme: 'acceptance',
    en: 'No difficult emotion lasts forever. Waves rise, crest, and pass.',
    hi: 'कोई भी कठिन भावना हमेशा नहीं रहती। लहरें उठती हैं और ढल जाती हैं।',
    hinglish: 'Koi bhi mushkil emotion hamesha nahi rehta. Lehren aati hain aur guzar jaati hain.',
  },
  {
    id: 54,
    theme: 'acceptance',
    en: 'Sadness and joy can share the same heart on the same afternoon.',
    hi: 'उदास मन और हल्की मुस्कान एक ही समय में साथ रह सकते हैं।',
    hinglish: 'Udaasi aur halki muskaan ek hi time par saath reh sakte hain.',
  },
  {
    id: 55,
    theme: 'acceptance',
    en: 'Crying is not giving up; it is your nervous system letting go of pressure.',
    hi: 'रोना हार मान लेना नहीं है; यह मन का बोझ हल्का करने का तरीका है।',
    hinglish: 'Rona haar maan lena nahi hai; yeh pressure release karne ka natural tareeqa hai.',
  },
  {
    id: 56,
    theme: 'acceptance',
    en: 'Fighting what you feel only adds exhaustion to pain.',
    hi: 'भावनाओं से लड़ना दर्द में केवल और थकान जोड़ता है।',
    hinglish: 'Feelings se ladna dard mein bas thakaan add karta hai.',
  },
  {
    id: 57,
    theme: 'acceptance',
    en: 'Sit with yourself like you would sit with a quiet rain.',
    hi: 'खुद के साथ वैसे बैठिए जैसे धीमी बारिश को खिड़की से देखते हैं।',
    hinglish: 'Khud ke saath waise baithiye jaise kisi shaant baarish ko dekhte hain.',
  },
  {
    id: 58,
    theme: 'acceptance',
    en: 'You do not have to pretend to be cheerful to be acceptable.',
    hi: 'स्वीकार्य होने के लिए हर वक्त खुश दिखने का ढोंग करना ज़रूरी नहीं है।',
    hinglish: 'Acceptable hone ke liye har waqt khush dikhne ka pretend karna zaroori nahi.',
  },
  {
    id: 59,
    theme: 'acceptance',
    en: 'There is room for all of your feelings in this space.',
    hi: 'आपके हर अहसास के लिए यहां एक सुरक्षित जगह है।',
    hinglish: 'Aapke har ehsaas ke liye yahan ek safe jagah hai.',
  },
  {
    id: 60,
    theme: 'acceptance',
    en: 'Acceptance does not mean giving up; it means seeing clearly from where you stand.',
    hi: 'स्वीकार करने का मतलब हारना नहीं, बल्कि स्थिति को साफ देखना है।',
    hinglish: 'Acceptance ka matlab give up karna nahi, reality ko clearly dekhna hai.',
  },

  // 7. Small Steps
  {
    id: 61,
    theme: 'small-steps',
    en: 'Small steps matter. Take your time.',
    hi: 'छोटे कदम भी मायने रखते हैं। अपना समय लीजिए।',
    hinglish: 'Chhote kadam bhi matter karte hain. Apna time lijiye.',
  },
  {
    id: 62,
    theme: 'small-steps',
    en: 'Drink a glass of water. Open the window. Start that small.',
    hi: 'एक घूंट पानी पीजिए। खिड़की खोलिए। शुरुआत इतनी छोटी भी हो सकती है।',
    hinglish: 'Ek glass paani pijiye. Khidki kholiye. Shuruat itni chhoti bhi ho sakti hai.',
  },
  {
    id: 63,
    theme: 'small-steps',
    en: 'You do not have to conquer the whole mountain today; just step over one pebble.',
    hi: 'आज पूरा पहाड़ चढ़ना ज़रूरी नहीं; बस एक पत्थर पार कर लीजिए।',
    hinglish: 'Aaj poora pahaad chadhna zaroori nahi; bas ek kadam aage badha lijiye.',
  },
  {
    id: 64,
    theme: 'small-steps',
    en: 'One honest sentence written in a journal can release an ocean of tension.',
    hi: 'डायरी में लिखा एक सच्चा वाक्य मन का गहरा तनाव हल्का कर सकता है।',
    hinglish: 'Journal mein likha ek sachha sentence mann ka bojh halka kar sakta hai.',
  },
  {
    id: 65,
    theme: 'small-steps',
    en: 'Five minutes of fresh air is better than zero minutes of perfection.',
    hi: 'ताज़ी हवा के पांच मिनट भी शून्य से कई गुना बेहतर हैं।',
    hinglish: '5 minute taazi hawa bhi zero minute se behtar hai.',
  },
  {
    id: 66,
    theme: 'small-steps',
    en: 'Focus solely on the next ten minutes. Nothing beyond that.',
    hi: 'सिर्फ अगले दस मिनट पर ध्यान दीजिए। उसके आगे कुछ नहीं।',
    hinglish: 'Sirf agle 10 minutes par dhyan dijiye. Uske aage kuch nahi.',
  },
  {
    id: 67,
    theme: 'small-steps',
    en: 'Gentle momentum builds from micro-choices.',
    hi: 'छोटे-छोटे फैसलों से ही जीवन में नई गति बनती है।',
    hinglish: 'Chhote-chhote micro choices se hi gentle momentum banta hai.',
  },
  {
    id: 68,
    theme: 'small-steps',
    en: 'Just opening your eyes and facing today is an act of bravery.',
    hi: 'आंखें खोलकर आज का सामना करना भी साहस का काम है।',
    hinglish: 'Subah uthkar aaj ka din face karna bhi ek courage ka kaam hai.',
  },
  {
    id: 69,
    theme: 'small-steps',
    en: 'One breath in. One breath out. You are already doing it.',
    hi: 'एक सांस अंदर, एक सांस बाहर। आप पहले से ही संभल रहे हैं।',
    hinglish: 'Ek saans andar, ek saans bahar. Aap already kar rahe hain.',
  },
  {
    id: 70,
    theme: 'small-steps',
    en: 'Do not underestimate the courage it takes to begin again quietly.',
    hi: 'चुपचाप फिर से शुरुआत करने के हौसले को कभी कम मत आंकिए।',
    hinglish: 'Shaanti se dobara shuruat karne ke hausle ko underestimate mat kijiye.',
  },

  // 8. Asking for Support
  {
    id: 71,
    theme: 'asking-for-support',
    en: 'You do not have to carry everything alone.',
    hi: 'सब कुछ अकेले ढोना आपकी ज़िम्मेदारी नहीं है।',
    hinglish: 'Sab kuch akele carry karna aapki responsibility nahi hai.',
  },
  {
    id: 72,
    theme: 'asking-for-support',
    en: 'Asking for help is not a sign of weakness; it is a refusal to surrender to despair.',
    hi: 'मदद मांगना कमजोरी नहीं, बल्कि खुद को बचाने की हिम्मत है।',
    hinglish: 'Help maangna weakness nahi, balki khud ko sambhaalne ki himmat hai.',
  },
  {
    id: 73,
    theme: 'asking-for-support',
    en: 'There are people who genuinely want to listen without judging you.',
    hi: 'ऐसे लोग मौजूद हैं जो बिना किसी निर्णय के आपकी बात सुनना चाहते हैं।',
    hinglish: 'Aise log hain jo bina judge kiye aapko sunna chahte hain.',
  },
  {
    id: 74,
    theme: 'asking-for-support',
    en: 'Letting someone in can make a heavy load half as heavy.',
    hi: 'किसी अपने से दिल की बात साझा करने से बोझ आधा रह जाता है।',
    hinglish: 'Kisi ko apna dard share karne se bojh aadha ho jaata hai.',
  },
  {
    id: 75,
    theme: 'asking-for-support',
    en: 'You are worthy of support even when you feel you have nothing to offer in return.',
    hi: 'आप सहायता के हकदार हैं, भले ही इस वक्त आप बदले में कुछ न दे सकें।',
    hinglish: 'Aap support deserve karte hain, chahe is waqt aap kuch return na kar sakein.',
  },
  {
    id: 76,
    theme: 'asking-for-support',
    en: 'Reaching out to a counselor or friend is a courageous act of self-care.',
    hi: 'किसी काउंसलर या दोस्त से बात करना खुद की देखभाल का सच्चा कदम है।',
    hinglish: 'Kisi counselor ya dost se baat karna self-care ka sachha step hai.',
  },
  {
    id: 77,
    theme: 'asking-for-support',
    en: 'Vulnerability is the birthplace of genuine connection and healing.',
    hi: 'सच्ची भावनाएं साझा करने से ही गहरे रिश्ते और सुकून पनपते हैं।',
    hinglish: 'Sachhe mann se baat share karne se hi healing aur connection banti hai.',
  },
  {
    id: 78,
    theme: 'asking-for-support',
    en: 'It is okay to say: "Things feel heavy today. Can you just sit with me?"',
    hi: 'यह कहना ठीक है: "आज मन भारी है। क्या तुम बस मेरे साथ बैठ सकते हो?"',
    hinglish: 'Yeh kehna theek hai: "Aaj mann heavy hai. Kya tum bas mere saath baith sakte ho?"',
  },
  {
    id: 79,
    theme: 'asking-for-support',
    en: 'Professional help exists because humans were never meant to heal in isolation.',
    hi: 'मदद के साधन इसलिए हैं क्योंकि इंसान अकेले सब कुछ सहने के लिए नहीं बना।',
    hinglish: 'Support systems isiliye hain kyunki koi bhi akele sab kuch jhelne ke liye nahi bana.',
  },
  {
    id: 80,
    theme: 'asking-for-support',
    en: 'Allowing others to support you gives them a chance to show love.',
    hi: 'दूसरों से मदद स्वीकार करना उन्हें भी अपना प्यार दिखाने का अवसर देता है।',
    hinglish: 'Doosron ki help accept karna unhe bhi care dikhane ka mauka deta hai.',
  },

  // 9. Difficult Days
  {
    id: 81,
    theme: 'difficult-days',
    en: 'Surviving a hard day is more than enough for today.',
    hi: 'एक मुश्किल दिन को बस पार कर लेना भी आज के लिए काफी है।',
    hinglish: 'Ek mushkil din ko guzaar lena bhi aaj ke liye kaafi hai.',
  },
  {
    id: 82,
    theme: 'difficult-days',
    en: 'Today can be heavy without tomorrow having to follow suit.',
    hi: 'आज का दिन भारी हो सकता है, पर इसका मतलब यह नहीं कि कल भी ऐसा ही होगा।',
    hinglish: 'Aaj ka din heavy ho sakta hai, par kal naya din hoga.',
  },
  {
    id: 83,
    theme: 'difficult-days',
    en: 'You do not have to find the silver lining right now. It is okay if it just hurts.',
    hi: 'हर बुरी बात में अच्छाई ढूंढना ज़रूरी नहीं। अभी सिर्फ दर्द महसूस होना भी ठीक है।',
    hinglish: 'Har cheez mein positive dhoondhna zaroori nahi. Dard hona natural hai.',
  },
  {
    id: 84,
    theme: 'difficult-days',
    en: 'Stormy skies run out of rain eventually.',
    hi: 'तूफानी बादलों का पानी भी एक दिन खत्म होता है।',
    hinglish: 'Toofani badalon ki baarish bhi aakhirkar tham jaati hai.',
  },
  {
    id: 85,
    theme: 'difficult-days',
    en: 'Be extra gentle with yourself on days when your energy is low.',
    hi: 'जब ऊर्जा कम हो, तो खुद के साथ और अधिक कोमलता बरतिए।',
    hinglish: 'Jab energy low ho, toh khud ke saath aur zyaada soft rahiye.',
  },
  {
    id: 86,
    theme: 'difficult-days',
    en: 'Lower your expectations for today. Survival is a valid goal.',
    hi: 'आज खुद से उम्मीदें थोड़ी कम रखिए। दिन पार करना भी एक लक्ष्य है।',
    hinglish: 'Aaj expectations thodi kam rakhiye. Din paar karna bhi ek achievement hai.',
  },
  {
    id: 87,
    theme: 'difficult-days',
    en: 'Your feelings right now are not your final destination.',
    hi: 'इस वक्त का अहसास आपकी अंतिम मंज़िल नहीं है।',
    hinglish: 'Is waqt ki feeling aapki permanent manzil nahi hai.',
  },
  {
    id: 88,
    theme: 'difficult-days',
    en: 'Let today be a soft, quiet survival.',
    hi: 'आज के दिन को बस एक शांत और सहज सफर बनने दीजिए।',
    hinglish: 'Aaj ke din ko bas ek shaant aur gentle din banne dijiye.',
  },
  {
    id: 89,
    theme: 'difficult-days',
    en: 'Night always yields to morning, no matter how dark the sky.',
    hi: 'चाहे रात कितनी भी अंधेरी हो, सुबह का सूरज हमेशा निकलता है।',
    hinglish: 'Chahe raat kitni bhi kaali ho, subah hamesha hoti hai.',
  },
  {
    id: 90,
    theme: 'difficult-days',
    en: 'You have made it through 100% of your hardest days so far.',
    hi: 'आप अपने जीवन के अब तक के सबसे कठिन दिनों को सफलतापूर्वक पार कर चुके हैं।',
    hinglish: 'Aapne apni life ke 100% mushkil din successfully paar kiye hain.',
  },

  // 10. Personal Growth
  {
    id: 91,
    theme: 'personal-growth',
    en: 'Roots grow in the dark before branches reach into the sunlight.',
    hi: 'धूप तक पहुंचने से पहले जड़ें अंधेरी मिट्टी में ही गहराई लेती हैं।',
    hinglish: 'Dhoop tak pahuchne se pehle roots andhere mein hi gehri hoti hain.',
  },
  {
    id: 92,
    theme: 'personal-growth',
    en: 'You are not behind; you are simply growing at your own organic speed.',
    hi: 'आप पीछे नहीं हैं; आप अपनी स्वाभाविक गति से विकसित हो रहे हैं।',
    hinglish: 'Aap peeche nahi hain; aap apni natural speed se grow kar rahe hain.',
  },
  {
    id: 93,
    theme: 'personal-growth',
    en: 'Every time you choose peace over conflict with yourself, you grow.',
    hi: 'हर बार जब आप खुद से लड़ने के बजाय शांति चुनते हैं, आप आगे बढ़ते हैं।',
    hinglish: 'Har baar jab aap khud se ladne ke bajaye peace choose karte hain, aap grow karte hain.',
  },
  {
    id: 94,
    theme: 'personal-growth',
    en: 'Healing is not about becoming someone new, but welcoming who you already are.',
    hi: 'सुलझने का मतलब नया बनना नहीं, बल्कि खुद को अपनाना है।',
    hinglish: 'Healing ka matlab naya banna nahi, balki khud ko accept karna hai.',
  },
  {
    id: 95,
    theme: 'personal-growth',
    en: 'Give yourself credit for the silent inner changes nobody else noticed.',
    hi: 'उन आंतरिक बदलावों के लिए खुद की पीठ थपथपाइए जो किसी और ने नहीं देखे।',
    hinglish: 'Un silent inner changes ke liye khud ko credit dijiye jo kisi ne nahi dekhe.',
  },
  {
    id: 96,
    theme: 'personal-growth',
    en: 'The version of you from five years ago would be so proud of how far you have come.',
    hi: 'पांच साल पहले का आपका रूप आज आपकी हिम्मत पर गर्व करता।',
    hinglish: '5 saal pehle ka aap aaj aapki himmat par proud feel karta.',
  },
  {
    id: 97,
    theme: 'personal-growth',
    en: 'Patience with your process is the highest form of self-love.',
    hi: 'अपने सफर के साथ धैर्य रखना आत्म-प्रेम का सबसे बड़ा रूप है।',
    hinglish: 'Apne process ke saath patience rakhna self-love ka sabse bada proof hai.',
  },
  {
    id: 98,
    theme: 'personal-growth',
    en: 'Mistakes are simply data points guiding you toward wiser choices.',
    hi: 'गलतियां केवल ऐसे संकेत हैं जो आपको बेहतर फैसलों की ओर ले जाते हैं।',
    hinglish: 'Mistakes bas aise data points hain jo aapko better decisions ki taraf le jaate hain.',
  },
  {
    id: 99,
    theme: 'personal-growth',
    en: 'You are allowed to outgrow old versions of yourself with gratitude.',
    hi: 'कृतज्ञता के साथ अपने पुराने रूपों से आगे बढ़ जाने की आपको पूरी छूट है।',
    hinglish: 'Gratitude ke saath apne purane self se aage badhne ki aapko poori permission hai.',
  },
  {
    id: 100,
    theme: 'personal-growth',
    en: 'Be proud of the quiet bravery it took to keep your heart open.',
    hi: 'अपने दिल को संवेदनशील और खुला रखने के शांत साहस पर गर्व कीजिए।',
    hinglish: 'Apne dil ko kind aur open rakhne ke shaant courage par proud rahiye.',
  },
  {
    id: 101,
    theme: 'small-steps',
    en: 'Being here right now is already a gentle, courageous start.',
    hi: 'इस वक्त यहां मौजूद होना भी एक सौम्य और साहसी शुरुआत है।',
    hinglish: 'Is waqt yahan present hona bhi ek gentle aur courageous start hai.',
  },
  {
    id: 102,
    theme: 'self-compassion',
    en: 'There is room for you in this world, exactly as you are today.',
    hi: 'इस संसार में आपके लिए पूरी जगह है, ठीक वैसे जैसे आप आज हैं।',
    hinglish: 'Is duniya mein aapke liye poori jagah hai, bilkul waise jaise aap aaj hain.',
  },
]

/**
 * Returns a deterministic thought based on the current date (Year + Day of Year).
 * This ensures Home, Dashboard, and Sidebar show the exact same thought all day,
 * without changing on page refresh.
 */
export function getDailyThought(date: Date = new Date(), lang: string = 'en', manualOffset: number = 0): DailyThought {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - startOfYear.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  // Deterministic seed incorporating year and day of year
  const total = DAILY_THOUGHTS_LIBRARY.length
  const seed = (date.getFullYear() * 366 + dayOfYear + manualOffset) % total
  const normalizedIndex = (seed + total) % total

  return DAILY_THOUGHTS_LIBRARY[normalizedIndex]
}

/**
 * Convenience helper to get the localized text of the thought.
 */
export function getDailyThoughtText(date: Date = new Date(), lang: string = 'en', manualOffset: number = 0): string {
  const thought = getDailyThought(date, lang, manualOffset)
  const l = (lang || 'en').toLowerCase()
  if (l.includes('hi') || l === 'hindi') {
    return thought.hi
  }
  if (l.includes('hinglish')) {
    return thought.hinglish
  }
  return thought.en
}
