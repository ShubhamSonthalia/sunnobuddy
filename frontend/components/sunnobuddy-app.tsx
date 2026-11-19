'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProtectedRoute, useAuth } from '@/contexts/auth-context'
import { services, type EmotionAnalysis, type MindLogEntry } from '@/services/api'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BookHeart,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Heart,
  Home,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Waves,
  X,
} from 'lucide-react'

const dailyThoughts = [
  'Small steps matter. Take your time.',
  'You can rest without falling behind.',
  'One honest breath is enough for now.',
  'You do not have to tidy the feeling first.',
  'Soft days still count as days.',
  'It is okay to move slowly today.',
  'You are allowed to begin again.',
  'Nothing here needs to be perfect.',
  'A quiet pause is still progress.',
  'You can set the feeling down for a moment.',
  'Being here is already a gentle start.',
  'You do not have to carry it all at once.',
  'Kindness toward yourself is a real step.',
  'Today can be lighter than yesterday.',
  'There is room for you, exactly as you are.',
  'Your feelings make sense, even when they feel tangled.',
  'Give yourself permission to just be.',
  'Peace begins with releasing what you cannot control today.',
  'Honor how hard you have been trying.',
  'Every quiet breath is an act of self-care.',
  'You are doing better than your doubts tell you.',
  'Give your mind permission to soften and rest.',
  'Growth often happens in the quietest, unnoticed moments.',
  'Listen gently to what your body needs today.',
  'No difficult emotion lasts forever.',
  'You deserve the warmth you give to others.',
  'It is safe to let your shoulders drop and exhale.',
  'Small kindnesses to yourself create lasting peace.',
  'There is quiet courage in showing up today.',
  'Take today one breath, one heartbeat at a time.',
  'You are worthy of healing, safety, and care.',
]

export const APP_TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    nav_home: 'Home',
    nav_companion: 'Companion',
    nav_guided: 'Guided reflection',
    nav_mindlog: 'MindLog',
    nav_insights: 'Mood insights',
    nav_reports: 'Reports',
    nav_therapists: 'Find a therapist',
    nav_settings: 'Settings',
    nav_signout: 'Sign out',
    nav_anonymous: 'Anonymous session',
    nav_status: 'Guest user',
    nav_connected: 'Google account',
    hdr_safety: 'SunnoBuddy is an emotional support companion • Private & confidential',
    dash_eyebrow: 'A GENTLE CHECK-IN',
    dash_welcome_title: 'Your thoughts deserve a safe space.',
    dash_welcome_sub: 'Take a breath, write, talk, or check in with your feelings today.',
    dash_btn_talk: 'Start a conversation',
    dash_btn_breathe: 'Take a mindful breath',
    dash_breathe_inhale: 'Inhale slowly…',
    dash_breathe_hold: 'Hold gently…',
    dash_breathe_exhale: 'Softly exhale…',
    dash_breathe_rest: 'Rest and relax…',
    dash_thought_badge: 'A GENTLE REMINDER · THOUGHT FOR TODAY',
    dash_thought_refresh: 'Another thought',
    dash_quick_eyebrow: 'EXPLORE AT YOUR PACE',
    dash_quick_title: 'What feels most supportive right now?',
    dash_card_buddy_title: 'Talk with Buddy',
    dash_card_buddy_desc: 'Share your thoughts through text or voice.',
    dash_card_mindlog_title: 'MindLog Journal',
    dash_card_mindlog_desc: 'Read past entries or write today’s reflection.',
    dash_card_guided_title: 'Guided Reflection',
    dash_card_guided_desc: 'A calm space to reflect on how you feel.',
    dash_card_care_title: 'Find Local Care',
    dash_card_care_desc: 'Locate verified therapists and counseling clinics.',
    chat_title: 'SunnoBuddy Companion',
    chat_online: 'Always here for you • Private session',
    chat_placeholder: 'Type what’s on your mind, or tap the mic to speak…',
    chat_listening: 'Listening to your voice… Tap mic to stop & send',
    chat_send: 'Send message',
    chat_cancel_voice: 'Cancel voice input',
    chat_welcome: 'Hello! I’m SunnoBuddy. I’m here to listen, without any judgment. You can type a message or tap the microphone to send a voice note — whatever feels easiest right now. How are you feeling today?',
    chat_footer_note: 'SunnoBuddy provides AI support. In a crisis, reach out to local emergency services.',
    chat_speech_unsupported: 'Live speech recognition is not available in this browser. You can type your message anytime.',
    mindlog_eyebrow: 'A SPACE TO WRITE, A SPACE TO BREATHE',
    mindlog_title: 'Your thoughts, day by day.',
    mindlog_sub: 'Select any past day on the calendar to reflect on what you wrote. Today’s page is open for you to add your thoughts. Future dates stay gently closed.',
    mindlog_jump_label: 'Jump to date:',
    mindlog_back_today: 'Back to Today',
    mindlog_future_note: 'Future dates remain locked until they arrive.',
    mindlog_today_heading: 'TODAY’S REFLECTIONS',
    mindlog_past_heading: 'SAVED ENTRY FOR',
    mindlog_write_today: 'Write today’s entry',
    mindlog_add_another: 'Add another reflection',
    mindlog_empty: 'No journal entries saved for this date yet.',
    settings_eyebrow: 'YOUR PREFERENCES',
    settings_title: 'A few things about your space.',
    settings_sub: 'Personalize how SunnoBuddy looks, sounds, and keeps your private journey secure.',
    settings_theme_title: 'Appearance & theme',
    settings_theme_sub: 'Toggle between gentle daytime hues and restful dark mode.',
    settings_lang_title: 'App & conversation language',
    settings_lang_sub: 'Control the language for SunnoBuddy across the entire application.',
    settings_font_title: 'Text size & readability',
    settings_font_sub: 'Adjust font scaling across SunnoBuddy with the interactive slider.',
    settings_account_title: 'Your account status',
    settings_guest_note: 'You are currently using an anonymous session. Your data stays in this browser.',
    settings_google_note: 'Your Google account is securely connected.',
    settings_link_box_title: 'Keep your reflections safe',
    settings_link_box_sub: 'Connect your Google account with Firebase authentication to access your journal entries and progress across devices.',
    settings_link_google: 'Link Google account',
    settings_voice_title: 'Voice & microphone check-in',
    settings_voice_sub: 'Voice is converted to text right in your browser and processed safely.',
    settings_privacy_title: 'Privacy & confidentiality',
    settings_privacy_sub: 'Your journal entries, voice notes, and conversations are never shared, sold, or used for public training.',
    settings_guest_pill: 'Anonymous guest',
    settings_google_pill: 'Google connected',
  },
  Hindi: {
    nav_home: 'होम',
    nav_companion: 'साथी (Companion)',
    nav_guided: 'मार्गदर्शित चिंतन',
    nav_mindlog: 'माइंडलॉग',
    nav_insights: 'मनोदशा अंतर्दृष्टि',
    nav_reports: 'रिपोर्ट्स',
    nav_therapists: 'थेरेपिस्ट खोजें',
    nav_settings: 'सेटिंग्स',
    nav_signout: 'साइन आउट',
    nav_anonymous: 'अनाम सत्र (Guest)',
    nav_status: 'अतिथि उपयोगकर्ता',
    nav_connected: 'गूगल खाता',
    hdr_safety: 'सुनोबड्डी एक एआई मानसिक संबल साथी है • पूरी तरह से निजी और सुरक्षित',
    dash_eyebrow: 'एक सौम्य शुरुआत',
    dash_welcome_title: 'आपके विचारों को एक सुरक्षित स्थान मिलना चाहिए।',
    dash_welcome_sub: 'एक गहरी सांस लें, लिखें, बात करें या आज अपनी भावनाओं को समझें।',
    dash_btn_talk: 'बातचीत शुरू करें',
    dash_btn_breathe: 'सचेत श्वास लें (Mindful breath)',
    dash_breathe_inhale: 'धीरे-धीरे सांस अंदर लें…',
    dash_breathe_hold: 'हल्के से रोकें…',
    dash_breathe_exhale: 'धीमे से सांस छोड़ें…',
    dash_breathe_rest: 'विश्राम करें…',
    dash_thought_badge: 'एक सौम्य स्मरण · आज का सुविचार',
    dash_thought_refresh: 'नया विचार',
    dash_quick_eyebrow: 'अपनी गति से अन्वेषण करें',
    dash_quick_title: 'आज आपके लिए क्या सबसे मददगार है?',
    dash_card_buddy_title: 'बड्डी से बात करें',
    dash_card_buddy_desc: 'टेक्स्ट या आवाज़ द्वारा अपने विचार साझा करें।',
    dash_card_mindlog_title: 'माइंडलॉग डायरी',
    dash_card_mindlog_desc: 'पुरानी प्रविष्टियां देखें या आज का चिंतन लिखें।',
    dash_card_guided_title: 'मार्गदर्शित चिंतन',
    dash_card_guided_desc: 'अपनी भावनाओं को समझने के लिए सरल चरण।',
    dash_card_care_title: 'थेरेपिस्ट खोजें',
    dash_card_care_desc: 'आसपास के योग्य मनोवैज्ञानिक और केंद्र खोजें।',
    chat_title: 'सुनोबड्डी साथी (Companion)',
    chat_online: 'हमेशा आपके साथ • निजी सत्र',
    chat_placeholder: 'संदेश लिखें, या बोलने के लिए माइक दबाएं…',
    chat_listening: 'सुन रहे हैं… भेजने के लिए माइक फिर से दबाएं',
    chat_send: 'संदेश भेजें',
    chat_cancel_voice: 'आवाज़ रद्द करें',
    chat_welcome: 'नमस्ते! मैं सुनोबड्डी हूँ। मैं यहाँ बिना किसी निर्णय के सुनने के लिए उपस्थित हूँ। आप लिखकर या माइक दबाकर बात कर सकते हैं। आज आप कैसा महसूस कर रहे हैं?',
    chat_footer_note: 'सुनोबड्डी एआई संबल प्रदान करता है। किसी गंभीर संकट में आपातकालीन सेवाओं से संपर्क करें।',
    chat_speech_unsupported: 'इस ब्राउज़र में लाइव स्पीच पहचान समर्थित नहीं है। आप सीधे टाइप कर सकते हैं।',
    mindlog_eyebrow: 'लिखने और सांस लेने का स्थान',
    mindlog_title: 'आपके विचार, दिन-ब-दिन।',
    mindlog_sub: 'पुरानी प्रविष्टियां पढ़ने के लिए कोई तारीख चुनें, या आज की प्रविष्टि लिखें। भविष्य की तारीखें बंद रहती हैं।',
    mindlog_jump_label: 'तारीख पर जाएं:',
    mindlog_back_today: 'आज पर वापस जाएं',
    mindlog_future_note: 'भविष्य की तारीखें आने तक बंद रहेंगी।',
    mindlog_today_heading: 'आज का चिंतन',
    mindlog_past_heading: 'सहेजी गई प्रविष्टि:',
    mindlog_write_today: 'आज की प्रविष्टि लिखें',
    mindlog_add_another: 'एक और विचार जोड़ें',
    mindlog_empty: 'इस तारीख के लिए अभी तक कोई प्रविष्टि नहीं है।',
    settings_eyebrow: 'आपकी प्राथमिकताएं',
    settings_title: 'आपके इस स्थान के बारे में कुछ बातें।',
    settings_sub: 'सुनोबड्डी के रूप-रंग और सुरक्षा को अपनी पसंद के अनुसार अनुकूलित करें।',
    settings_theme_title: 'दिखावट और थीम',
    settings_theme_sub: 'हल्के दिन के रंगों और शांत डार्क मोड के बीच टॉगल करें।',
    settings_lang_title: 'ऐप और बातचीत की भाषा',
    settings_lang_sub: 'पूरी एप्लिकेशन में सुनोबड्डी की भाषा नियंत्रित करें।',
    settings_font_title: 'अक्षर का आकार (Text size)',
    settings_font_sub: 'आसान पढ़ने के लिए स्लाइडर द्वारा टेक्स्ट का आकार बदलें।',
    settings_account_title: 'आपके खाते की स्थिति',
    settings_guest_note: 'आप एक अनाम सत्र का उपयोग कर रहे हैं। आपका डेटा इसी ब्राउज़र में रहता है।',
    settings_google_note: 'आपका गूगल खाता सुरक्षित रूप से जुड़ा हुआ है।',
    settings_link_box_title: 'अपने चिंतन को सुरक्षित रखें',
    settings_link_box_sub: 'अन्य डिवाइसों पर अपनी प्रविष्टियां पाने के लिए गूगल खाते से कनेक्ट करें।',
    settings_link_google: 'गूगल खाता लिंक करें',
    settings_voice_title: 'आवाज़ और माइक्रोफ़ोन',
    settings_voice_sub: 'आवाज़ को ब्राउज़र में ही सुरक्षित रूप से टेक्स्ट में बदला जाता है।',
    settings_privacy_title: 'गोपनीयता और सुरक्षा',
    settings_privacy_sub: 'आपकी प्रविष्टियां और बातचीत कभी भी किसी के साथ साझा नहीं की जाती हैं।',
    settings_guest_pill: 'अनाम अतिथि',
    settings_google_pill: 'गूगल कनेक्टेड',
  },
  Hinglish: {
    nav_home: 'Home',
    nav_companion: 'Companion',
    nav_guided: 'Guided Reflection',
    nav_mindlog: 'MindLog',
    nav_insights: 'Mood Insights',
    nav_reports: 'Reports',
    nav_therapists: 'Find Therapist',
    nav_settings: 'Settings',
    nav_signout: 'Sign Out',
    nav_anonymous: 'Guest Session',
    nav_status: 'Guest User',
    nav_connected: 'Google Account',
    hdr_safety: 'SunnoBuddy aapka emotional support companion hai • 100% Private & Safe',
    dash_eyebrow: 'A GENTLE CHECK-IN',
    dash_welcome_title: 'Aapke thoughts ko ek safe space milni chahiye.',
    dash_welcome_sub: 'Ek gehri saans lo, likho, baat karo ya bas apne mann ko samjho.',
    dash_btn_talk: 'Baat shuru karein',
    dash_btn_breathe: 'Mindful breath lo',
    dash_breathe_inhale: 'Dheere se saans andar lo…',
    dash_breathe_hold: 'Gently hold karo…',
    dash_breathe_exhale: 'Aaram se saans bahar chodo…',
    dash_breathe_rest: 'Relax karo…',
    dash_thought_badge: 'A GENTLE REMINDER · AAJ KA THOUGHT',
    dash_thought_refresh: 'Naya thought',
    dash_quick_eyebrow: 'APNI PACE PAR EXPLORE KAREIN',
    dash_quick_title: 'Aaj aapke liye kya best rahega?',
    dash_card_buddy_title: 'Buddy se baat karein',
    dash_card_buddy_desc: 'Text ya voice se apne mann ki baat share karein.',
    dash_card_mindlog_title: 'MindLog Journal',
    dash_card_mindlog_desc: 'Purani entries dekhein ya aaj ka journal likhein.',
    dash_card_guided_title: 'Guided Reflection',
    dash_card_guided_desc: 'Apni feelings ko express karne ke aasan steps.',
    dash_card_care_title: 'Therapist dhoondein',
    dash_card_care_desc: 'Aas-paas ke verified clinics aur doctors dekhein.',
    chat_title: 'SunnoBuddy Companion',
    chat_online: 'Hamesha yahan aapke liye • Private session',
    chat_placeholder: 'Message likhein, ya mic daba kar bolein…',
    chat_listening: 'Sun rahe hain… Send karne ke liye mic dubara dabayein',
    chat_send: 'Send message',
    chat_cancel_voice: 'Cancel voice',
    chat_welcome: 'Hello! Main SunnoBuddy hoon. Yahan bina kisi judgment ke sunne ke liye hoon. Aap likh sakte hain ya mic daba kar baat kar sakte hain. Aaj kaisa feel ho raha hai?',
    chat_footer_note: 'SunnoBuddy AI emotional support deta hai. Emergency mein helpline se contact karein.',
    chat_speech_unsupported: 'Live speech recognition is browser mein available nahi hai. Aap type kar sakte hain.',
    mindlog_eyebrow: 'EK SHANT SPACE',
    mindlog_title: 'Aapke thoughts, din-ba-din.',
    mindlog_sub: 'Purani dates dekhne ke liye date choose karein, ya aaj ka thought likhein. Future dates locked rehti hain.',
    mindlog_jump_label: 'Date par jayein:',
    mindlog_back_today: 'Aaj par wapas aayein',
    mindlog_future_note: 'Future dates tab tak locked rahengi jab tak wo din na aaye.',
    mindlog_today_heading: 'AAJ KA REFLECTION',
    mindlog_past_heading: 'SAVED ENTRY FOR',
    mindlog_write_today: 'Aaj ki entry likho',
    mindlog_add_another: 'Aur entry add karo',
    mindlog_empty: 'Is date ke liye abhi koi entry nahi hai.',
    settings_eyebrow: 'YOUR PREFERENCES',
    settings_title: 'Aapke space ki setting.',
    settings_sub: 'SunnoBuddy ka look, feel aur language apne according customize karein.',
    settings_theme_title: 'Appearance & theme',
    settings_theme_sub: 'Light mode aur comfortable Dark mode toggle karein.',
    settings_lang_title: 'App & conversation language',
    settings_lang_sub: 'Puri app mein SunnoBuddy ki language choose karein.',
    settings_font_title: 'Text size & readability',
    settings_font_sub: 'Slider se text size aaram se adjust karein.',
    settings_account_title: 'Aapke account ka status',
    settings_guest_note: 'Aap anonymous session use kar rahe hain. Data isi browser mein rahega.',
    settings_google_note: 'Aapka Google account connected hai.',
    settings_link_box_title: 'Apne journal ko safe rakhein',
    settings_link_box_sub: 'Kisi bhi device se access karne ke liye Google account connect karein.',
    settings_link_google: 'Link Google account',
    settings_voice_title: 'Voice & mic check-in',
    settings_voice_sub: 'Aapki voice browser mein hi safe text banti hai.',
    settings_privacy_title: 'Privacy & security',
    settings_privacy_sub: 'Aapki journal entries aur baatein kisi ke sath share nahi hoti.',
    settings_guest_pill: 'Anonymous guest',
    settings_google_pill: 'Google connected',
  },
  Spanish: {
    nav_home: 'Inicio',
    nav_companion: 'Compañero',
    nav_guided: 'Reflexión guiada',
    nav_mindlog: 'MindLog',
    nav_insights: 'Estadísticas de ánimo',
    nav_reports: 'Informes',
    nav_therapists: 'Buscar terapeuta',
    nav_settings: 'Configuración',
    nav_signout: 'Cerrar sesión',
    nav_anonymous: 'Sesión anónima',
    nav_status: 'Usuario invitado',
    nav_connected: 'Cuenta de Google',
    hdr_safety: 'SunnoBuddy es un compañero de apoyo emocional con IA • Privado y confidencial',
    dash_eyebrow: 'UN ESPACIO DE CALMA',
    dash_welcome_title: 'Tus pensamientos merecen un espacio seguro.',
    dash_welcome_sub: 'Respira hondo, escribe, habla o reflexiona sobre lo que sientes hoy.',
    dash_btn_talk: 'Iniciar conversación',
    dash_btn_breathe: 'Tomar un respiro consciente',
    dash_breathe_inhale: 'Inhala lentamente…',
    dash_breathe_hold: 'Mantén suavemente…',
    dash_breathe_exhale: 'Exhala despacio…',
    dash_breathe_rest: 'Descansa y relájate…',
    dash_thought_badge: 'UN RECORDATORIO AMABLE · PENSAMIENTO DEL DÍA',
    dash_thought_refresh: 'Otra frase',
    dash_quick_eyebrow: 'EXPLORA A TU RITMO',
    dash_quick_title: '¿Qué te resulta más reconfortante hoy?',
    dash_card_buddy_title: 'Hablar con Buddy',
    dash_card_buddy_desc: 'Comparte lo que sientes por texto o voz.',
    dash_card_mindlog_title: 'Diario MindLog',
    dash_card_mindlog_desc: 'Lee entradas pasadas o escribe la reflexión de hoy.',
    dash_card_guided_title: 'Reflexión guiada',
    dash_card_guided_desc: 'Un espacio tranquilo para conectar contigo mismo.',
    dash_card_care_title: 'Buscar ayuda profesional',
    dash_card_care_desc: 'Encuentra terapeutas verificados cerca de ti.',
    chat_title: 'Compañero SunnoBuddy',
    chat_online: 'Siempre aquí para ti • Sesión privada',
    chat_placeholder: 'Escribe un mensaje o toca el micrófono para hablar…',
    chat_listening: 'Escuchando tu voz… Toca el micro para enviar',
    chat_send: 'Enviar mensaje',
    chat_cancel_voice: 'Cancelar voz',
    chat_welcome: '¡Hola! Soy SunnoBuddy. Estoy aquí para escuchar sin juzgar. Puedes escribirme o pulsar el micrófono para hablar. ¿Cómo te sientes hoy?',
    chat_footer_note: 'SunnoBuddy brinda apoyo emocional. En una emergencia, comunícate con servicios locales.',
    chat_speech_unsupported: 'El reconocimiento de voz no está disponible en este navegador. Puedes escribir directamente.',
    mindlog_eyebrow: 'UN ESPACIO PARA ESCRIBIR Y RESPIRAR',
    mindlog_title: 'Tus pensamientos, día a día.',
    mindlog_sub: 'Elige una fecha para ver entradas pasadas o escribe la de hoy. Las fechas futuras permanecen cerradas.',
    mindlog_jump_label: 'Ir a la fecha:',
    mindlog_back_today: 'Volver a hoy',
    mindlog_future_note: 'Las fechas futuras permanecen bloqueadas hasta que lleguen.',
    mindlog_today_heading: 'REFLEXIONES DE HOY',
    mindlog_past_heading: 'ENTRADA GUARDADA DE',
    mindlog_write_today: 'Escribir entrada de hoy',
    mindlog_add_another: 'Añadir otra reflexión',
    mindlog_empty: 'No hay entradas guardadas para esta fecha aún.',
    settings_eyebrow: 'TUS PREFERENCIAS',
    settings_title: 'Configura tu espacio.',
    settings_sub: 'Personaliza cómo se ve, suena y protege tu viaje privado SunnoBuddy.',
    settings_theme_title: 'Apariencia y tema',
    settings_theme_sub: 'Alterna entre tonos suaves de día y modo oscuro relajante.',
    settings_lang_title: 'Idioma de la aplicación',
    settings_lang_sub: 'Controla el idioma de SunnoBuddy en toda la app.',
    settings_font_title: 'Tamaño del texto',
    settings_font_sub: 'Ajusta el tamaño de letra con el control deslizante.',
    settings_account_title: 'Estado de tu cuenta',
    settings_guest_note: 'Estás usando una sesión anónima. Tus datos se quedan en este navegador.',
    settings_google_note: 'Tu cuenta de Google está conectada de forma segura.',
    settings_link_box_title: 'Protege tus reflexiones',
    settings_link_box_sub: 'Conecta tu cuenta de Google para acceder desde cualquier dispositivo.',
    settings_link_google: 'Vincular cuenta de Google',
    settings_voice_title: 'Voz y micrófono',
    settings_voice_sub: 'Tu voz se procesa de forma segura en tu navegador.',
    settings_privacy_title: 'Privacidad y confidencialidad',
    settings_privacy_sub: 'Tus reflexiones y conversaciones nunca se comparten ni se venden.',
    settings_guest_pill: 'Invitado anónimo',
    settings_google_pill: 'Google conectado',
  },
  French: {
    nav_home: 'Accueil',
    nav_companion: 'Compagnon',
    nav_guided: 'Réflexion guidée',
    nav_mindlog: 'MindLog',
    nav_insights: 'Aperçus de l’humeur',
    nav_reports: 'Rapports',
    nav_therapists: 'Trouver un thérapeute',
    nav_settings: 'Paramètres',
    nav_signout: 'Déconnexion',
    nav_anonymous: 'Session anonyme',
    nav_status: 'Utilisateur invité',
    nav_connected: 'Compte Google',
    hdr_safety: 'SunnoBuddy est un compagnon de soutien émotionnel par IA • Privé et confidentiel',
    dash_eyebrow: 'UN MOMENT DE CALME',
    dash_welcome_title: 'Vos pensées méritent un espace sécurisé.',
    dash_welcome_sub: 'Respirez profondément, écrivez, parlez ou faites le point sur vos émotions.',
    dash_btn_talk: 'Démarrer une conversation',
    dash_btn_breathe: 'Prendre une respiration consciente',
    dash_breathe_inhale: 'Inspirez lentement…',
    dash_breathe_hold: 'Maintenez doucement…',
    dash_breathe_exhale: 'Expirez calmement…',
    dash_breathe_rest: 'Reposez-vous et détendez-vous…',
    dash_thought_badge: 'UN RAPPEL APAISANT · PENSÉE DU JOUR',
    dash_thought_refresh: 'Autre citation',
    dash_quick_eyebrow: 'EXPLOREZ À VOTRE RYTHME',
    dash_quick_title: 'De quoi avez-vous le plus besoin aujourd’hui ?',
    dash_card_buddy_title: 'Parler à Buddy',
    dash_card_buddy_desc: 'Partagez vos pensées par texte ou par la voix.',
    dash_card_mindlog_title: 'Journal MindLog',
    dash_card_mindlog_desc: 'Consultez les notes passées ou écrivez celle d’aujourd’hui.',
    dash_card_guided_title: 'Réflexion guidée',
    dash_card_guided_desc: 'Des étapes douces pour vous recentrer.',
    dash_card_care_title: 'Trouver de l’aide',
    dash_card_care_desc: 'Localisez des thérapeutes et cliniques vérifiés.',
    chat_title: 'Compagnon SunnoBuddy',
    chat_online: 'Toujours là pour vous • Session privée',
    chat_placeholder: 'Tapez un message ou appuyez sur le micro pour parler…',
    chat_listening: 'Écoute en cours… Appuyez sur le micro pour envoyer',
    chat_send: 'Envoyer le message',
    chat_cancel_voice: 'Annuler la voix',
    chat_welcome: 'Bonjour ! Je suis SunnoBuddy. Je suis ici pour écouter sans jugement. Vous pouvez m’écrire ou parler avec le micro. Comment vous sentez-vous aujourd’hui ?',
    chat_footer_note: 'SunnoBuddy offre un soutien IA. En cas d’urgence, contactez les services locaux.',
    chat_speech_unsupported: 'La reconnaissance vocale n’est pas disponible dans ce navigateur. Vous pouvez taper directement.',
    mindlog_eyebrow: 'UN ESPACE POUR ÉCRIRE ET RESPIRER',
    mindlog_title: 'Vos pensées, jour après jour.',
    mindlog_sub: 'Choisissez une date pour relire vos notes ou écrivez celle du jour. Les dates futures restent fermées.',
    mindlog_jump_label: 'Aller à la date :',
    mindlog_back_today: 'Retour à aujourd’hui',
    mindlog_future_note: 'Les dates futures restent verrouillées jusqu’à leur arrivée.',
    mindlog_today_heading: 'RÉFLEXIONS DU JOUR',
    mindlog_past_heading: 'NOTE ENREGISTRÉE DU',
    mindlog_write_today: 'Écrire la note du jour',
    mindlog_add_another: 'Ajouter une autre note',
    mindlog_empty: 'Aucune note enregistrée pour cette date.',
    settings_eyebrow: 'VOS PRÉFÉRENCES',
    settings_title: 'Personnalisez votre espace.',
    settings_sub: 'Adaptez l’apparence, les sons et la sécurité de SunnoBuddy.',
    settings_theme_title: 'Apparence et thème',
    settings_theme_sub: 'Basculez entre des teintes douces de jour et un mode sombre reposant.',
    settings_lang_title: 'Langue de l’application',
    settings_lang_sub: 'Contrôlez la langue de SunnoBuddy dans toute l’application.',
    settings_font_title: 'Taille du texte',
    settings_font_sub: 'Ajustez la taille de police avec le curseur interactif.',
    settings_account_title: 'Statut de votre compte',
    settings_guest_note: 'Vous utilisez une session anonyme. Vos données restent dans ce navigateur.',
    settings_google_note: 'Votre compte Google est connecté en toute sécurité.',
    settings_link_box_title: 'Sécurisez vos écrits',
    settings_link_box_sub: 'Associez votre compte Google pour retrouver vos notes sur tous vos appareils.',
    settings_link_google: 'Associer un compte Google',
    settings_voice_title: 'Voix et microphone',
    settings_voice_sub: 'Votre voix est transcrite directement dans votre navigateur.',
    settings_privacy_title: 'Confidentialité et sécurité',
    settings_privacy_sub: 'Vos écrits et conversations ne sont jamais partagés ni vendus.',
    settings_guest_pill: 'Invité anonyme',
    settings_google_pill: 'Google connecté',
  },
}

export function useAppLanguage() {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sunnobuddy-app-lang') || 'English'
    }
    return 'English'
  })

  useEffect(() => {
    const handleLangChange = (e: any) => {
      setLang(e.detail || (typeof window !== 'undefined' ? localStorage.getItem('sunnobuddy-app-lang') : null) || 'English')
    }
    window.addEventListener('sunno-lang-change', handleLangChange)
    return () => window.removeEventListener('sunno-lang-change', handleLangChange)
  }, [])

  const t = (key: string): string => {
    const activeDict = (APP_TRANSLATIONS as any)[lang] || APP_TRANSLATIONS['English']
    return activeDict[key] || (APP_TRANSLATIONS['English'] as any)[key] || key
  }

  return { lang, t }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function thoughtForToday(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000)
  return dailyThoughts[(dayOfYear - 1 + dailyThoughts.length) % dailyThoughts.length]
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

const navItems = [
  { key: 'nav_home', label: 'Home', href: '/dashboard', icon: Home },
  { key: 'nav_therapists', label: 'Find a therapist', href: '/dashboard/therapists', icon: MapPin },
  { key: 'nav_companion', label: 'Companion', href: '/dashboard/companion', icon: MessageCircle },
  { key: 'nav_guided', label: 'Guided reflection', href: '/dashboard/intake', icon: Sparkles },
  { key: 'nav_mindlog', label: 'MindLog', href: '/dashboard/mindlog', icon: BookHeart },
  { key: 'nav_insights', label: 'Mood insights', href: '/dashboard/insights', icon: Activity },
  { key: 'nav_reports', label: 'Reports', href: '/dashboard/reports', icon: FileText },
]

const features = [
  { icon: MessageCircle, title: 'A companion who listens', body: 'A gentle space to share what’s on your mind, at your own pace.' },
  { icon: Mic, title: 'Talk it out or type', body: 'Send a voice note or type in the same chat whenever speaking feels easier.' },
  { icon: Sparkles, title: 'Guided reflection', body: 'Thoughtful questions help you make sense of how you’ve been feeling.' },
  { icon: BookHeart, title: 'Your MindLog calendar', body: 'Put your thoughts into words and track your moments day by day.' },
  { icon: Waves, title: 'Notice your patterns', body: 'Explore emotional patterns gently, without judgment or diagnosis.' },
  { icon: FileText, title: 'Personal reports', body: 'Create a clear reflection of your MindLog over time.' },
]

function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="SunnoBuddy home">
      <Logo variant={small ? 'compact' : 'full'} />
    </Link>
  )
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const syncTheme = (event?: Event) => {
      const nextTheme = event instanceof CustomEvent ? Boolean(event.detail) : document.documentElement.classList.contains('dark')
      const variant = nextTheme ? 'dark' : 'light'
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((icon) => {
        const size = icon.sizes.value === '16x16' ? 16 : 32
        icon.href = `/icon-${variant}-${size}x${size}.png`
      })
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = nextTheme ? '#10232B' : '#FFF8ED'
      })
      setIsDark(nextTheme)
    }
    syncTheme()

    const syncFontScale = (e?: any) => {
      const storedScale = e?.detail ?? (typeof window !== 'undefined' ? localStorage.getItem('sunnobuddy-font-scale') : null)
      if (storedScale) {
        document.documentElement.style.setProperty('--font-scale', String(storedScale))
      }
    }
    syncFontScale()

    window.addEventListener('sunno-theme-change', syncTheme)
    window.addEventListener('sunno-font-scale-change', syncFontScale)
    return () => {
      window.removeEventListener('sunno-theme-change', syncTheme)
      window.removeEventListener('sunno-font-scale-change', syncFontScale)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', nextTheme)
    document.cookie = `sunnobuddy-theme=${nextTheme ? 'dark' : 'light'}; Path=/; Max-Age=31536000; SameSite=Lax`
    window.dispatchEvent(new CustomEvent('sunno-theme-change', { detail: nextTheme }))
  }

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? ' is-dark' : ''}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="theme-switch" aria-hidden="true">
        <span className="theme-track">
          <span className="theme-stars" aria-hidden="true">
            <span className="theme-star star-sm" />
            <span className="theme-star star-lg" />
          </span>
          <span className="theme-knob">
            <Sun className="theme-icon theme-icon-sun" size={12} />
            <Moon className="theme-icon theme-icon-moon" size={12} />
          </span>
        </span>
      </span>
      <span className="theme-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function Landing() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Brand />
        <nav className="landing-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link className="button button-primary nav-cta" href="/login">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="hero" id="about">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little more room to breathe</div>
          <h1>Your thoughts deserve<br />a <em>safe space.</em></h1>
          <p>Meet SunnoBuddy, your AI-powered emotional companion. Talk freely, understand your emotions, and take small steps towards feeling better.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/login">
              Start your journey <ArrowRight size={17} />
            </Link>
            <a className="button button-quiet button-large" href="#features">
              Explore features <ArrowDownRight size={17} />
            </a>
          </div>
          <div className="trust-line">
            <span className="avatar-stack"><i>J</i><i>M</i><i>A</i></span>
            <span>A gentle space, just for you</span>
            <span className="trust-divider" />
            <LockKeyhole size={14} />
            <span>Private by design</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-glow" />
          <Logo variant="mascot" alt="SunnoBuddy’s peaceful sleeping mascot" priority />
          <div className="floating-note note-one">
            <span className="note-icon peach"><Heart size={15} fill="currentColor" /></span>
            <span><b>You’re doing just fine</b><small>One moment at a time</small></span>
          </div>
          <div className="floating-note note-two">
            <span className="note-icon mint"><Waves size={16} /></span>
            <span><b>A space to exhale</b><small>Here whenever you need</small></span>
          </div>
          <div className="art-caption"><span className="caption-line" /> a softer place to land</div>
        </div>
      </section>

      <section className="marquee-strip">
        <span>LISTEN WITHOUT JUDGMENT</span><i>✳</i><span>REFLECT AT YOUR OWN PACE</span><i>✳</i><span>SMALL STEPS MATTER</span>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div>
            <div className="eyebrow">MADE FOR YOUR EVERYDAY</div>
            <h2>Support that meets<br />you <em>where you are.</em></h2>
          </div>
          <p>There’s no right way to feel. SunnoBuddy gives you gentle ways to check in with yourself.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, body }, index) => (
            <article className={`feature-card feature-${index + 1}`} key={title}>
              <span className="feature-icon"><Icon size={21} /></span>
              <span className="feature-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-intro">
          <span className="eyebrow">A GENTLER ROUTINE</span>
          <h2>Start wherever<br />you <em>are.</em></h2>
          <p>No pressure to have it all figured out. Just a few small steps, taken in your own time.</p>
          <Link className="button button-light" href="/login">
            Find your starting point <ArrowRight size={16} />
          </Link>
        </div>
        <div className="steps-list">
          {[
            'Join in the way that feels right',
            'Connect with your companion',
            'Share a thought or write it down',
            'Reflect on what you notice',
          ].map((step, i) => (
            <div className="step-row" key={step}>
              <span className="step-index">0{i + 1}</span>
              <div>
                <h3>{step}</h3>
                <p>
                  {[
                    'Start with an account or simply come in as a guest.',
                    'Open one chat and choose to write, or send a voice note.',
                    'There’s no perfect way to express what you feel.',
                    'Find gentle patterns and celebrate small steps.',
                  ][i]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="privacy-band">
        <span className="privacy-emblem"><ShieldCheck size={24} /></span>
        <div>
          <span className="eyebrow">YOUR SPACE, YOURS ALONE</span>
          <h2>A little privacy goes<br />a <em>long way.</em></h2>
          <p>Come anonymously, write privately, and keep your most personal thoughts in a space built with care.</p>
        </div>
        <div className="privacy-points">
          <span><Check size={15} /> Anonymous access</span>
          <span><Check size={15} /> Private MindLog</span>
          <span><Check size={15} /> Secure by design</span>
          <span><Check size={15} /> No judgment, ever</span>
        </div>
      </section>

      <section className="disclaimer">
        <CircleHelp size={18} />
        <p>SunnoBuddy is an AI-powered emotional support companion, not a replacement for professional mental healthcare.</p>
        <Link href="/login">Begin gently <ArrowRight size={15} /></Link>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand-wrap">
          <Brand small />
          <p className="footer-tagline">A softer space to land, reflect, and grow.</p>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="mailto:hello@sunnobuddy.com">Contact</a>
        </div>
        <span className="footer-copy">© 2025 SunnoBuddy. A softer space to land.</span>
      </footer>
    </main>
  )
}

function Login() {
  const { user, signInGoogle, continueAnonymously } = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const authenticate = async (method: () => Promise<void>) => {
    setPending(true)
    setError('')
    try {
      await method()
      router.replace('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in could not be completed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [router, user])

  return (
    <main className="login-page">
      <Link href="/" className="login-back"><ArrowLeft size={16} /> Back to home</Link>
      <div className="login-card">
        <div className="login-brand-row">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="login-mascot">
          <div className="mascot-halo" />
          <Logo variant="mascot" alt="SunnoBuddy mascot" />
        </div>
        <span className="eyebrow">YOUR SPACE IS READY</span>
        <h1>Welcome to your<br /><em>safe space.</em></h1>
        <p>Come as you are. There’s no pressure to have the right words or know where to start.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => void authenticate(signInGoogle)}
          className="button button-primary login-button"
        >
          <span className="google-mark">G</span> {pending ? 'Signing you in…' : 'Continue with Google'} <ArrowRight size={16} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void authenticate(continueAnonymously)}
          className="button button-outline login-button"
        >
          <span className="guest-icon">G</span> {pending ? 'Entering safe space…' : 'Continue anonymously'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="login-privacy"><LockKeyhole size={13} /> Your thoughts are private, always.</div>
        <div className="login-disclaimer">SunnoBuddy supports your emotional wellbeing, but isn’t a substitute for professional mental healthcare.</div>
      </div>
      <span className="login-bottom">A little more room to breathe.</span>
    </main>
  )
}

function Sidebar({ active, close }: { active: string; close: () => void }) {
  const { user, logOut } = useAuth()
  const router = useRouter()
  const { t } = useAppLanguage()
  const displayName = user?.isAnonymous ? t('nav_status') : user?.displayName || user?.email || t('nav_account')
  const logout = async () => {
    await logOut()
    router.replace('/')
  }
  return (
    <>
      <button className="mobile-shade" aria-label="Close navigation" onClick={close} />
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand small />
          <button className="mobile-close" onClick={close} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="side-label">YOUR SPACE</div>
        <nav className="side-nav">
          {navItems.map(({ key, label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={close} className={`side-link ${active === href ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{t(key) || label}</span>
              {active === href && <span className="active-mark" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-sun"><Sun size={16} /></div>
            <span>
              <b>{t('dash_thought_badge')}</b>
              <small>{thoughtForToday()}</small>
            </span>
          </div>
          <Link href="/dashboard/settings" className="side-link">
            <Settings size={18} />
            <span>{t('nav_settings')}</span>
          </Link>
          <button className="profile-row" onClick={() => void logout()} aria-label={`Sign out ${displayName}`}>
            <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <span>
              <b>{displayName}</b>
              <small>{t('nav_signout')}</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
    </>
  )
}

function DashboardShell({ children, title, subtitle, active }: { children: React.ReactNode; title: string; subtitle: string; active: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const { t } = useAppLanguage()
  const accountName = user?.isAnonymous ? t('nav_status') : user?.displayName || user?.email || t('nav_account')
  return (
    <div className="app-shell">
      <Sidebar active={active} close={() => setMenuOpen(false)} />
      <div className="app-main">
        <header className="app-header">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="header-titles">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-right">
            <span className="header-date">
              {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
            </span>
            <ThemeToggle />
            <button className="header-avatar" aria-label={`${accountName} profile`}>
              {accountName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className="mobile-open">
            <Sidebar active={active} close={() => setMenuOpen(false)} />
          </div>
        )}
        <main className="page-content">
          {children}
          <div className="safety-foot">
            <ShieldCheck size={14} /> {t('hdr_safety')}
          </div>
        </main>
      </div>
    </div>
  )
}

function MindfulBreathWidget() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale')
  const [seconds, setSeconds] = useState(4)
  const { t } = useAppLanguage()

  useEffect(() => {
    if (!active) {
      setPhase('Inhale')
      setSeconds(4)
      return
    }
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1
        setPhase((current) => {
          if (current === 'Inhale') return 'Hold'
          if (current === 'Hold') return 'Exhale'
          if (current === 'Exhale') return 'Rest'
          return 'Inhale'
        })
        return 4
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [active])

  return (
    <div className={`mindful-widget ${active ? 'is-active' : ''}`}>
      {!active ? (
        <button
          type="button"
          className="button button-quiet mindful-trigger"
          onClick={() => setActive(true)}
          aria-label="Start a gentle mindful breathing pause"
        >
          <Sparkles size={15} />
          <span>{t('dash_btn_breathe')}</span>
        </button>
      ) : (
        <div className="mindful-box">
          <div className={`breathe-circle phase-${phase.toLowerCase()}`}>
            <span className="breathe-label">{phase}</span>
            <span className="breathe-timer">{seconds}s</span>
          </div>
          <div className="mindful-text">
            <b>
              {phase === 'Inhale'
                ? t('dash_breathe_inhale')
                : phase === 'Hold'
                ? t('dash_breathe_hold')
                : phase === 'Exhale'
                ? t('dash_breathe_exhale')
                : t('dash_breathe_rest')}
            </b>
            <small>Take your time. Ground yourself in this present moment.</small>
          </div>
          <button
            type="button"
            className="mindful-close"
            onClick={() => setActive(false)}
            aria-label="Close mindful pause"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function DashboardHome() {
  const { user } = useAuth()
  const { t } = useAppLanguage()
  const name = user?.isAnonymous ? t('nav_status') : user?.displayName?.split(' ')[0] || 'friend'
  const [recentEntries, setRecentEntries] = useState<MindLogEntry[]>([])
  const [entryCount, setEntryCount] = useState(0)
  const [latestEmotion, setLatestEmotion] = useState<EmotionAnalysis | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [thoughtIndex, setThoughtIndex] = useState(() => {
    const date = new Date()
    const start = new Date(date.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000)
    return (dayOfYear - 1 + dailyThoughts.length) % dailyThoughts.length
  })

  useEffect(() => {
    let active = true
    services.listMindLogs()
      .then(async (logs) => {
        const sorted = [...logs].sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
        if (active) {
          setRecentEntries(sorted.slice(0, 3))
          setEntryCount(logs.length)
        }
        if (sorted[0]) {
          try {
            const analysis = await services.getMindLogEmotion(sorted[0].id)
            if (active) setLatestEmotion(analysis)
          } catch {
            if (active) setLatestEmotion(null)
          }
        }
      })
      .catch((cause) => {
        if (active) setDashboardError(cause instanceof Error ? cause.message : 'Your summary could not be loaded.')
      })
      .finally(() => {
        if (active) setDashboardLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const nextThought = () => {
    setThoughtIndex((prev) => (prev + 1) % dailyThoughts.length)
  }

  return (
    <DashboardShell title="A moment for you" subtitle={`Welcome back, ${name}. How are you feeling today?`} active="/dashboard">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="eyebrow">{t('dash_eyebrow')}</span>
          <h2>{t('dash_welcome_title')}</h2>
          <p>{t('dash_welcome_sub')}</p>

          <div className="daily-thought-card">
            <div className="daily-thought-top">
              <span className="daily-thought-badge">
                <Sun size={13} />
                <span>{t('dash_thought_badge')}</span>
              </span>
              <button
                type="button"
                className="thought-refresh"
                onClick={nextThought}
                title="Get another comforting thought"
                aria-label="Get another comforting thought"
              >
                <Sparkles size={12} />
                <span>{t('dash_thought_refresh')}</span>
              </button>
            </div>
            <p className="daily-thought-text">“{dailyThoughts[thoughtIndex]}”</p>
          </div>

          <div className="welcome-actions">
            <MindfulBreathWidget />
          </div>
        </div>

        <div className="welcome-image">
          <div className="welcome-circle" />
          <Logo variant="mascot" alt="SunnoBuddy sleeping peacefully" />
          <span className="welcome-sparkle sparkle-a">✳</span>
          <span className="welcome-sparkle sparkle-b">✳</span>
          <span className="welcome-note">a safe space<br />to just be</span>
        </div>
      </section>

      <div className="quick-head">
        <div>
          <span className="eyebrow">{t('dash_quick_eyebrow')}</span>
          <h2>{t('dash_quick_title')}</h2>
        </div>
        <span className="soft-date"><Sun size={15} /> One step is enough</span>
      </div>

      <section className="quick-grid">
        <Link href="/dashboard/companion" className="quick-card quick-blue">
          <span className="quick-icon"><MessageCircle size={20} /></span>
          <span className="quick-arrow"><ArrowRight size={17} /></span>
          <h3>{t('dash_card_buddy_title')}</h3>
          <p>{t('dash_card_buddy_desc')}</p>
          <span className="quick-tag">COMPANION</span>
        </Link>
        <Link href="/dashboard/mindlog" className="quick-card quick-peach">
          <span className="quick-icon"><BookHeart size={20} /></span>
          <span className="quick-arrow"><ArrowRight size={17} /></span>
          <h3>{t('dash_card_mindlog_title')}</h3>
          <p>{t('dash_card_mindlog_desc')}</p>
          <span className="quick-tag">MINDLOG</span>
        </Link>
        <Link href="/dashboard/intake" className="quick-card quick-lilac">
          <span className="quick-icon"><Sparkles size={20} /></span>
          <span className="quick-arrow"><ArrowRight size={17} /></span>
          <h3>{t('dash_card_guided_title')}</h3>
          <p>{t('dash_card_guided_desc')}</p>
          <span className="quick-tag">REFLECTION</span>
        </Link>
        <Link href="/dashboard/therapists" className="quick-card quick-teal">
          <span className="quick-icon"><MapPin size={20} /></span>
          <span className="quick-arrow"><ArrowRight size={17} /></span>
          <h3>{t('dash_card_care_title')}</h3>
          <p>{t('dash_card_care_desc')}</p>
          <span className="quick-tag">SUPPORT</span>
        </Link>
      </section>

      <section className="home-bottom-grid">
        <article className="surface-card mood-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">YOUR INNER WEATHER</span>
              <h3>Mood overview</h3>
            </div>
            <span className="soft-pill"><Activity size={13} /> MindLog</span>
          </div>
          {dashboardLoading ? (
            <p role="status">Loading your MindLog summary…</p>
          ) : recentEntries.length ? (
            <div className="empty-mood">
              <div className="mood-illustration"><Waves size={27} /><span>✳</span></div>
              <b>{latestEmotion?.primaryEmotion ?? 'Analysis not available yet'}</b>
              <p>{entryCount} journal {entryCount === 1 ? 'entry' : 'entries'} saved. {latestEmotion ? 'This is the latest available emotion analysis.' : 'Emotion analysis will appear when provided by the backend.'}</p>
              <Link href="/dashboard/insights">Explore your insights <ArrowRight size={14} /></Link>
            </div>
          ) : (
            <div className="empty-mood">
              <div className="mood-illustration"><Waves size={27} /><span>✳</span></div>
              <b>{dashboardError ? 'Your summary is unavailable right now.' : 'Your patterns will find their way here.'}</b>
              <p>{dashboardError || 'As you add MindLog entries, your mood insights will gently take shape.'}</p>
              <Link href="/dashboard/mindlog">Open your calendar journal <ArrowRight size={14} /></Link>
            </div>
          )}
        </article>

        <article className="surface-card activity-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">LITTLE MOMENTS ADD UP</span>
              <h3>Recent activity</h3>
            </div>
            <Clock3 size={17} className="muted-icon" />
          </div>
          {dashboardLoading ? (
            <p role="status">Loading your recent activity…</p>
          ) : recentEntries.length ? (
            <div className="dashboard-recent">
              {recentEntries.map((item) => (
                <Link href={`/dashboard/mindlog/${encodeURIComponent(item.id)}`} key={item.id}>
                  <span className="activity-mark"><BookHeart size={16} /></span>
                  <span>
                    <b>{item.title}</b>
                    <small>{new Date(item.date || item.created_at).toLocaleDateString()}</small>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="activity-empty">
              <span className="activity-mark"><CalendarDays size={19} /></span>
              <div>
                <b>{dashboardError ? 'Recent activity is unavailable.' : 'Your story starts here'}</b>
                <p>{dashboardError || 'Your reflections will appear here once you begin.'}</p>
              </div>
            </div>
          )}
          <div className="intake-progress">
            <span>Guided reflection</span>
            <span>Open to view progress</span>
            <Link href="/dashboard/intake">Continue reflection</Link>
          </div>
        </article>
      </section>
    </DashboardShell>
  )
}

function Companion() {
  const { lang, t } = useAppLanguage()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<{ who: string; text: string; audioUrl?: string; duration?: number }[]>([])
  const [retryMessage, setRetryMessage] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const [apiError, setApiError] = useState('')
  const [crisisNotice, setCrisisNotice] = useState<{ detected: boolean; helplines: Array<{ name: string; phone: string; url?: string }> } | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)
  const transcriptRef = useRef('')
  const audioUrlsRef = useRef<string[]>([])
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null)
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null)

  const getEffectiveLang = () => {
    if (typeof window === 'undefined') return 'en'
    const stored = localStorage.getItem('sunnobuddy-app-lang') || 'English'
    if (stored.toLowerCase().includes('hindi')) return 'hi'
    if (stored.toLowerCase().includes('hinglish')) return 'hinglish'
    if (stored.toLowerCase().includes('spanish')) return 'es'
    if (stored.toLowerCase().includes('french')) return 'fr'
    return 'en'
  }

  const stopAllVoice = () => {
    isRecordingRef.current = false
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }
    setRecording(false)
    setRecordSeconds(0)
  }

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, apiError, crisisNotice, recording])

  useEffect(() => {
    return () => {
      stopAllVoice()
      audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const send = async (retryText?: string) => {
    const message = (retryText ?? text).trim()
    if (!message || sending || recording) return
    if (!retryText) setMessages((old) => [...old, { who: 'you', text: message }])
    setText('')
    setRetryMessage('')
    setApiError('')
    setSending(true)
    try {
      const effLang = getEffectiveLang()
      const result = await services.sendChat(message, effLang, sessionId)
      setSessionId(result.session_id)
      setCrisisNotice({ detected: Boolean(result.crisis_detected), helplines: result.helplines ?? [] })
      if (!result.crisis_detected) setMessages((old) => [...old, { who: 'buddy', text: result.reply }])
    } catch (cause) {
      setRetryMessage(message)
      setApiError(cause instanceof Error ? cause.message : 'The message could not be sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      const speechText = transcriptRef.current.trim() || text.trim()
      stopAllVoice()
      if (speechText) {
        transcriptRef.current = ''
        void send(speechText)
      }
      return
    }

    setApiError('')
    transcriptRef.current = ''

    const SpeechRecognitionClass =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRecognitionClass) {
      setApiError(t('chat_speech_unsupported'))
      return
    }

    try {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true

      const effLang = getEffectiveLang()
      recognition.lang =
        effLang === 'hi'
          ? 'hi-IN'
          : effLang === 'es'
          ? 'es-ES'
          : effLang === 'fr'
          ? 'fr-FR'
          : 'en-US'

      recognition.onresult = (event: any) => {
        let fullTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' '
        }
        const clean = fullTranscript.trim()
        if (clean) {
          transcriptRef.current = clean
          setText(clean)
        }
      }

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition notice:', err)
        if (err.error === 'not-allowed') {
          setApiError('Microphone permission was not allowed. Please enable microphone permissions in your browser.')
          stopAllVoice()
        } else if (err.error === 'audio-capture') {
          setApiError('Could not access microphone hardware. Please check your system audio settings.')
          stopAllVoice()
        }
      }

      recognition.onend = () => {
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            recognition.start()
          } catch {}
        }
      }

      recognitionRef.current = recognition
      isRecordingRef.current = true
      recognition.start()

      setRecording(true)
      setRecordSeconds(0)
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1)
      }, 1000)
    } catch {
      setApiError('Microphone could not be started. Please check permissions.')
      stopAllVoice()
    }
  }

  const cancelRecording = () => {
    transcriptRef.current = ''
    stopAllVoice()
    setText('')
  }

  const togglePlayAudio = (url: string) => {
    if (playingAudioUrl === url && activeAudioElementRef.current) {
      activeAudioElementRef.current.pause()
      setPlayingAudioUrl(null)
      return
    }
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause()
    }
    const audio = new Audio(url)
    activeAudioElementRef.current = audio
    audio.play()
    setPlayingAudioUrl(url)
    audio.onended = () => setPlayingAudioUrl(null)
    audio.onpause = () => {
      if (playingAudioUrl === url) setPlayingAudioUrl(null)
    }
  }

  return (
    <DashboardShell title={t('chat_title')} subtitle={t('chat_online')} active="/dashboard/companion">
      <div className="companion-page">
        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-avatar"><Logo variant="mascot" alt="" /></div>
            <div>
              <b>SunnoBuddy</b>
              <small><i /> {t('chat_online')}</small>
            </div>
            <span className="chat-private"><LockKeyhole size={13} /> Private conversation</span>
          </header>

          <div className="chat-thread">
            <div className="chat-date">TODAY · A FRESH START</div>
            <div className="chat-message">
              <div className="tiny-mascot"><Logo variant="mascot" alt="" /></div>
              <div>
                <div className="bubble bubble-buddy">
                  {t('chat_welcome')}
                </div>
                <span className="message-time">Just now</span>
              </div>
            </div>

            {messages.map((message, index) => (
              <div className={`chat-message ${message.who === 'you' ? 'user-message' : ''}`} key={`${index}-${message.who}`}>
                {message.who === 'buddy' && <div className="tiny-mascot"><Logo variant="mascot" alt="" /></div>}
                <div>
                  <div className={`bubble ${message.who === 'you' ? 'bubble-user' : 'bubble-buddy'}`}>
                    {message.audioUrl ? (
                      <div className="voice-note-card">
                        <button
                          type="button"
                          className="voice-play-button"
                          onClick={() => togglePlayAudio(message.audioUrl!)}
                          aria-label={playingAudioUrl === message.audioUrl ? 'Pause voice note' : 'Play voice note'}
                        >
                          {playingAudioUrl === message.audioUrl ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                        <div className="voice-wave-track">
                          <span className={`voice-wave-bar bar-1 ${playingAudioUrl === message.audioUrl ? 'is-playing' : ''}`} />
                          <span className={`voice-wave-bar bar-2 ${playingAudioUrl === message.audioUrl ? 'is-playing' : ''}`} />
                          <span className={`voice-wave-bar bar-3 ${playingAudioUrl === message.audioUrl ? 'is-playing' : ''}`} />
                          <span className={`voice-wave-bar bar-4 ${playingAudioUrl === message.audioUrl ? 'is-playing' : ''}`} />
                          <span className={`voice-wave-bar bar-5 ${playingAudioUrl === message.audioUrl ? 'is-playing' : ''}`} />
                        </div>
                        <span className="voice-duration">
                          <Mic size={11} aria-hidden="true" />
                          <span>{formatDuration(message.duration || 0)}</span>
                        </span>
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sending && <p role="status" className="chat-status">SunnoBuddy is listening and reflecting…</p>}

            {apiError && (
              <div role="alert" className="auth-error">
                <p>{apiError}</p>
                {retryMessage && (
                  <button className="button button-quiet" disabled={sending} onClick={() => void send(retryMessage)}>
                    Retry message
                  </button>
                )}
              </div>
            )}

            {crisisNotice?.detected && (
              <div className="safety-alert" role="alert">
                <b>You deserve immediate care and support.</b>
                <p>If you may be in danger, contact local emergency services. Support options from your care team:</p>
                {crisisNotice.helplines.map((line) => (
                  <p key={`${line.name}-${line.phone}`}>
                    {line.name}: <a href={`tel:${line.phone}`}>{line.phone}</a>
                    {line.url && <> · <a href={line.url} target="_blank" rel="noreferrer">Visit</a></>}
                  </p>
                ))}
              </div>
            )}

            <div ref={threadEndRef} />
          </div>

          <div className="chat-suggestions">
            <span>A gentle prompt:</span>
            {['I’ve had a heavy day', 'Help me untangle what I’m feeling', 'I’m not sure where to begin'].map((prompt) => (
              <button key={prompt} onClick={() => setText(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className="chat-composer">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder={recording ? t('chat_listening') : t('chat_placeholder')}
              aria-label="Write a message"
            />

            <div className="composer-footer">
              <span className={`composer-hint ${recording ? 'is-recording' : ''}`}>
                {recording ? (
                  <span className="record-status-pill">
                    <span className="record-red-dot" /> {t('chat_listening')} ({formatDuration(recordSeconds)})
                  </span>
                ) : (
                  t('chat_placeholder')
                )}
              </span>

              <div className="composer-actions">
                {recording && (
                  <button
                    type="button"
                    className="composer-cancel-record"
                    onClick={cancelRecording}
                    title={t('chat_cancel_voice')}
                    aria-label={t('chat_cancel_voice')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}

                <button
                  type="button"
                  className={`mic-button${recording ? ' recording' : ''}`}
                  onClick={() => void toggleRecording()}
                  aria-pressed={recording}
                  aria-label={recording ? 'Finish speaking and send' : 'Speak to SunnoBuddy'}
                  title={recording ? 'Finish and send message' : 'Speak to SunnoBuddy'}
                >
                  <Mic size={16} />
                </button>

                <button
                  type="button"
                  className="send-button"
                  disabled={!text.trim() || sending || recording}
                  onClick={() => void send()}
                  aria-label={t('chat_send')}
                  title={t('chat_send')}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="companion-note">
          <ShieldCheck size={15} /> {t('chat_footer_note')}
        </div>
      </div>
    </DashboardShell>
  )
}

function Intake() {
  const { user } = useAuth()
  const [started, setStarted] = useState(false)
  const [answer, setAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionId, setQuestionId] = useState('')
  const [completedCount, setCompletedCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([])
  const [isFollowUp, setIsFollowUp] = useState(false)
  const [finished, setFinished] = useState(false)
  const [intakeLoading, setIntakeLoading] = useState(false)
  const [intakeError, setIntakeError] = useState('')

  const beginReflection = async () => {
    if (!user) return
    setIntakeLoading(true)
    setIntakeError('')
    try {
      const result = await services.getCurrentIntakeQuestion(user.uid)
      setCompletedCount(result.completed_questions ?? null)
      setTotalCount(result.total_questions ?? null)
      if (result.completed) {
        setFinished(true)
        setStarted(true)
      } else if (result.question) {
        setCurrentQuestion(result.question)
        setQuestionId(result.question_id ?? '')
        setIsFollowUp(Boolean(result.follow_up_required))
        setStarted(true)
      } else {
        throw new Error('The intake service returned an invalid question.')
      }
    } catch (cause) {
      setIntakeError(cause instanceof Error ? cause.message : 'The reflection could not be started. Please try again.')
    } finally {
      setIntakeLoading(false)
    }
  }

  const submitReflection = async () => {
    if (!user || !answer.trim() || intakeLoading) return
    setIntakeLoading(true)
    setIntakeError('')
    try {
      const submittedAnswer = answer.trim()
      const progress = questionId ? await services.trackIntakeProgress(user.uid, questionId, submittedAnswer) : null
      const result = await services.getNextIntakeQuestion(user.uid, submittedAnswer)
      setAnswers((old) => [...old, { question: currentQuestion, answer: submittedAnswer }])
      setCompletedCount(result.completed_questions ?? progress?.completed_questions ?? null)
      setTotalCount(result.total_questions ?? progress?.total_questions ?? null)
      setAnswer('')
      if (result.completed) {
        setFinished(true)
      } else if (result.question) {
        setCurrentQuestion(result.question)
        setQuestionId(result.question_id ?? '')
        setIsFollowUp(Boolean(result.follow_up_required))
      } else {
        throw new Error('The intake service returned an invalid response.')
      }
    } catch (cause) {
      setIntakeError(cause instanceof Error ? cause.message : 'Your response could not be submitted. Please try again.')
    } finally {
      setIntakeLoading(false)
    }
  }

  return (
    <DashboardShell title="Guided reflection" subtitle="A few thoughtful questions, at your own pace." active="/dashboard/intake">
      <div className="intake-wrap">
        {!started ? (
          <>
            <section className="intake-hero">
              <div className="intake-art">
                <div className="intake-ring" />
                <div className="intake-sun"><Sun size={42} /></div>
                <span className="intake-star star-1">✳</span>
                <span className="intake-star star-2">✳</span>
                <span className="intake-quote">no rush<br />to begin</span>
              </div>
              <div className="intake-copy">
                <span className="eyebrow">A LITTLE TIME FOR YOURSELF</span>
                <h2>Let’s understand<br />how you’re <em>feeling.</em></h2>
                <p>This guided reflection is a gentle way to explore your emotional experiences. There are no right or wrong answers, and you can take a pause whenever you need.</p>
                <div className="intake-assurances">
                  <span><LockKeyhole size={15} /> Your responses stay private</span>
                  <span><Clock3 size={15} /> Take it at your own pace</span>
                </div>
                <button className="button button-primary button-large" disabled={intakeLoading} onClick={() => void beginReflection()}>
                  {intakeLoading ? 'Preparing…' : 'Begin reflection'} <ArrowRight size={16} />
                </button>
                {intakeError && <p className="auth-error" role="alert">{intakeError}</p>}
                <div className="intake-small">You’re always in control of what you share.</div>
              </div>
            </section>
            <section className="intake-steps">
              <div>
                <span>01</span>
                <b>We ask gently</b>
                <small>One thoughtful question at a time.</small>
              </div>
              <ArrowRight size={17} />
              <div>
                <span>02</span>
                <b>You share what you can</b>
                <small>There’s no pressure to say more.</small>
              </div>
              <ArrowRight size={17} />
              <div>
                <span>03</span>
                <b>We reflect together</b>
                <small>Your answers help guide your support.</small>
              </div>
            </section>
          </>
        ) : finished ? (
          <section className="intake-done">
            <div className="done-check"><Check size={27} /></div>
            <span className="eyebrow">THAT’S A LOVELY START</span>
            <h2>Thank you for<br />showing up <em>for you.</em></h2>
            <p>You’ve completed this reflection. {completedCount !== null && <>You answered {completedCount}{totalCount !== null ? ` of ${totalCount}` : ''} questions. </>}It’s okay to take a moment and notice how that felt.</p>
            <Link href="/dashboard" className="button button-primary">Back to your space <ArrowRight size={16} /></Link>
          </section>
        ) : (
          <section className="question-card">
            <button className="back-button" onClick={() => setStarted(false)}><ArrowLeft size={15} /> Back to introduction</button>
            <div className="question-progress">
              <span>Reflection in progress</span>
              <span>{completedCount !== null && totalCount !== null ? `${completedCount} / ${totalCount} complete` : 'Progress will appear when available'}</span>
              {completedCount !== null && totalCount !== null && totalCount > 0 && (
                <div role="progressbar" aria-label="Intake progress" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={completedCount}>
                  <i style={{ width: `${Math.min(100, Math.max(0, (completedCount / totalCount) * 100))}%` }} />
                </div>
              )}
            </div>
            {answers.map((item, index) => (
              <article className="intake-answer" key={`${index}-${item.question}`}>
                <span>Question</span>
                <p>{item.question}</p>
                <span>Your response</span>
                <p>{item.answer}</p>
              </article>
            ))}
            <span className="eyebrow">{isFollowUp ? 'A FOLLOW-UP, JUST FOR YOU' : 'A MOMENT TO CHECK IN'}</span>
            <h2>{currentQuestion}</h2>
            <p>Share as much or as little as feels right. Your response is submitted when you continue.</p>
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Take your time…" aria-label="Your reflection" />
            {intakeError && <p className="auth-error" role="alert">{intakeError}</p>}
            <button className="button button-primary" onClick={() => void submitReflection()} disabled={!answer.trim() || intakeLoading}>
              {intakeLoading ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
            </button>
          </section>
        )}
      </div>
    </DashboardShell>
  )
}

function MindLog() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useAppLanguage()
  const entryId = pathname.startsWith('/dashboard/mindlog/') && pathname !== '/dashboard/mindlog/calendar' ? pathname.split('/').pop() : null
  const [entryDetail, setEntryDetail] = useState<MindLogEntry | null>(null)
  const [detailLoading, setDetailLoading] = useState(Boolean(entryId))
  const [editor, setEditor] = useState(false)
  const [title, setTitle] = useState('')
  const [entry, setEntry] = useState('')
  const [entryDate, setEntryDate] = useState(localDateKey())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [entries, setEntries] = useState<MindLogEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(localDateKey())
  const todayKey = localDateKey()

  const DEFAULT_ENTRIES: MindLogEntry[] = [
    {
      id: 'demo-entry-2025-01-15',
      title: 'A quiet winter afternoon',
      content: 'Took a slow walk in the crisp air today. Noticing that rest is also a form of moving forward. Grateful for this calm, peaceful moment.',
      date: '2025-01-15',
      created_at: '2025-01-15T15:30:00.000Z',
    },
    {
      id: 'demo-entry-today',
      title: 'Taking gentle steps forward',
      content: 'Reminding myself that small quiet steps still count. Feeling a bit lighter having written this down.',
      date: todayKey,
      created_at: new Date().toISOString(),
    },
  ]

  const loadStoredOrDemoEntries = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sunnobuddy_mindlog_entries')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEntries(parsed)
            return
          }
        }
      } catch {}
      localStorage.setItem('sunnobuddy_mindlog_entries', JSON.stringify(DEFAULT_ENTRIES))
      setEntries(DEFAULT_ENTRIES)
    }
  }

  const reloadEntries = () => {
    setLoadingEntries(true)
    services
      .listMindLogs()
      .then((data) => {
        if (data && data.length > 0) {
          setEntries(data)
        } else {
          loadStoredOrDemoEntries()
        }
      })
      .catch(() => {
        loadStoredOrDemoEntries()
      })
      .finally(() => setLoadingEntries(false))
  }

  useEffect(() => {
    reloadEntries()
  }, [])

  useEffect(() => {
    if (!entryId) return
    setDetailLoading(true)
    services
      .getMindLog(entryId)
      .then(setEntryDetail)
      .catch((cause) => {
        const localMatch = entries.find((e) => e.id === entryId)
        if (localMatch) {
          setEntryDetail(localMatch)
        } else {
          setSaveError(cause instanceof Error ? cause.message : 'This entry could not be loaded.')
        }
      })
      .finally(() => setDetailLoading(false))
  }, [entryId, entries])

  const entryDay = (item: MindLogEntry) => (item.date || item.created_at).slice(0, 10)

  const saveEntry = async () => {
    if (!title.trim() || !entry.trim() || !entryDate || saving) return
    if (!editingId && entryDate !== todayKey) return
    setSaving(true)
    setSaveError('')
    try {
      const result = editingId
        ? await services.updateMindLog(editingId, title.trim(), entry.trim(), entryDate)
        : await services.createMindLog(title.trim(), entry.trim(), entryDate)
      const next = [result, ...entries.filter((item) => item.id !== result.id)]
      setEntries(next)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sunnobuddy_mindlog_entries', JSON.stringify(next))
      }
      setTitle('')
      setEntry('')
      setEditingId(null)
      setEditor(false)
      setSelectedDate(entryDay(result))
    } catch {
      // Local storage fallback for frontend prototype
      const localResult: MindLogEntry = {
        id: editingId || 'entry_' + Date.now(),
        title: title.trim(),
        content: entry.trim(),
        date: entryDate,
        created_at: new Date().toISOString(),
      }
      const next = [localResult, ...entries.filter((item) => item.id !== localResult.id)]
      setEntries(next)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sunnobuddy_mindlog_entries', JSON.stringify(next))
      }
      setTitle('')
      setEntry('')
      setEditingId(null)
      setEditor(false)
      setSelectedDate(entryDay(localResult))
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Delete this MindLog entry? This cannot be undone.')) return
    setSaveError('')
    try {
      await services.deleteMindLog(id)
    } catch {}
    const next = entries.filter((item) => item.id !== id)
    setEntries(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sunnobuddy_mindlog_entries', JSON.stringify(next))
    }
    if (id === entryId) router.replace('/dashboard/mindlog')
  }

  const openTodayEditor = () => {
    setTitle('')
    setEntry('')
    setEntryDate(todayKey)
    setEditingId(null)
    setEditor(true)
    setSaveError('')
    setSelectedDate(todayKey)
  }

  const openEditorFor = (item: MindLogEntry) => {
    setEditingId(item.id)
    setTitle(item.title)
    setEntry(item.content)
    setEntryDate(entryDay(item))
    setEditor(true)
    setSaveError('')
  }

  if (entryId) {
    return (
      <DashboardShell title="MindLog entry" subtitle="A moment, just as you wrote it." active="/dashboard/mindlog">
        <div className="mindlog-wrap">
          {detailLoading ? (
            <p role="status">Loading your entry…</p>
          ) : entryDetail ? (
            <article className="saved-entry">
              <span className="entry-date">
                {new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(entryDetail.date || entryDetail.created_at))}
              </span>
              <h2>{entryDetail.title}</h2>
              <p>{entryDetail.content}</p>
              {entryDetail.updated_at && (
                <small>Updated {new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(entryDetail.updated_at))}</small>
              )}
              <div className="entry-actions">
                <button
                  className="button button-quiet"
                  onClick={() => {
                    openEditorFor(entryDetail)
                    router.replace('/dashboard/mindlog')
                  }}
                >
                  Edit
                </button>
                <button className="button button-quiet" onClick={() => void deleteEntry(entryDetail.id)}>Delete</button>
                <Link className="button button-outline" href="/dashboard/mindlog">Back to journal</Link>
              </div>
              {saveError && <p className="auth-error" role="alert">{saveError}</p>}
            </article>
          ) : (
            <p className="auth-error" role="alert">{saveError || 'This entry is unavailable.'}</p>
          )}
        </div>
      </DashboardShell>
    )
  }

  const firstDayOfWeek = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const dayKey = (day: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const atCurrentMonth = month.getFullYear() === currentYear && month.getMonth() === currentMonth
  const selectedEntries = entries.filter((item) => entryDay(item) === selectedDate)
  const selectedLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - i)

  return (
    <DashboardShell title={t('mindlog_title')} subtitle={t('mindlog_sub')} active="/dashboard/mindlog">
      <div className="mindlog-wrap">
        <div className="mindlog-top">
          <div>
            <span className="eyebrow">{t('mindlog_eyebrow')}</span>
            <h2>{t('mindlog_title')}</h2>
            <p>{t('mindlog_sub')}</p>
          </div>
          {selectedDate === todayKey && !editor && (
            <button className="button button-primary" onClick={openTodayEditor}>
              <Plus size={16} /> {selectedEntries.length ? t('mindlog_add_another') : t('mindlog_write_today')}
            </button>
          )}
        </div>

        {saveError && !editor && <p className="auth-error" role="alert">{saveError}</p>}

        <div className="calendar-card mindlog-calendar">
          <div className="calendar-jump-bar">
            <div className="jump-controls">
              <label htmlFor="mindlog-jump-date" className="jump-label">
                <CalendarDays size={14} />
                <span>{t('mindlog_jump_label')}</span>
              </label>
              <input
                id="mindlog-jump-date"
                type="date"
                max={todayKey}
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value
                  if (val && val <= todayKey) {
                    setSelectedDate(val)
                    const [y, m] = val.split('-').map(Number)
                    setMonth(new Date(y, m - 1, 1))
                    setEditor(false)
                  }
                }}
                className="jump-date-input"
                title="Select any past date to jump directly to its entries"
              />
            </div>
            {(!atCurrentMonth || selectedDate !== todayKey) && (
              <button
                type="button"
                className="jump-today-btn"
                onClick={() => {
                  const today = new Date()
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                  setSelectedDate(todayKey)
                  setEditor(false)
                }}
                title="Return to today's date"
              >
                <RotateCcw size={13} />
                <span>{t('mindlog_back_today')}</span>
              </button>
            )}
          </div>

          <div className="calendar-toolbar">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => {
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                setEditor(false)
              }}
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="calendar-select-group">
              <select
                aria-label="Select month"
                className="calendar-nav-select"
                value={month.getMonth()}
                onChange={(e) => {
                  const newM = parseInt(e.target.value, 10)
                  setMonth(new Date(month.getFullYear(), newM, 1))
                  setEditor(false)
                }}
              >
                {monthNames.map((mName, idx) => (
                  <option
                    key={mName}
                    value={idx}
                    disabled={month.getFullYear() === currentYear && idx > currentMonth}
                  >
                    {mName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Select year"
                className="calendar-nav-select"
                value={month.getFullYear()}
                onChange={(e) => {
                  const newY = parseInt(e.target.value, 10)
                  const targetM = newY === currentYear && month.getMonth() > currentMonth ? currentMonth : month.getMonth()
                  setMonth(new Date(newY, targetM, 1))
                  setEditor(false)
                }}
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
              disabled={atCurrentMonth}
              title={atCurrentMonth ? 'Future months are not yet available' : 'Next month'}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span className="calendar-weekday" key={d}>{d}</span>
            ))}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <span key={`blank-${i}`} className="calendar-blank" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const key = dayKey(day)
              const count = entries.filter((item) => entryDay(item) === key).length
              const isToday = key === todayKey
              const isFuture = key > todayKey
              const isSelected = selectedDate === key
              return (
                <button
                  type="button"
                  key={key}
                  disabled={isFuture}
                  className={`calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'has-entry' : ''} ${isSelected ? 'selected' : ''} ${isFuture ? 'is-future' : ''}`}
                  aria-label={isFuture ? `${key}, future date unavailable` : `${key}, ${count} journal entries`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedDate(key)
                    setEditor(false)
                  }}
                >
                  <span className="day-number">{day}</span>
                  {count > 0 && <span className="day-dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {loadingEntries && <p role="status" className="calendar-status">Loading your journal entries…</p>}

          <div className="calendar-legend">
            <span className="legend-item"><i className="legend-today" /> Today</span>
            <span className="legend-item"><i className="legend-dot" /> Has journal entry</span>
            <span className="calendar-empty-note">{t('mindlog_future_note')}</span>
          </div>
        </div>

        {!loadingEntries && (
          <section className="calendar-selected surface-card">
            <div className="selected-date-header">
              <div>
                <span className="eyebrow">{selectedDate === todayKey ? t('mindlog_today_heading') : t('mindlog_past_heading')}</span>
                <h3>{selectedLabel}</h3>
              </div>
              {selectedDate === todayKey && !editor && (
                <button className="button button-primary calendar-add" onClick={openTodayEditor}>
                  <Plus size={15} /> {selectedEntries.length ? t('mindlog_add_another') : t('mindlog_write_today')}
                </button>
              )}
            </div>

            {selectedEntries.length > 0 ? (
              <div className="selected-entries-list">
                {selectedEntries.map((item) => (
                  <article className="saved-entry calendar-day-entry" key={item.id}>
                    <h3>{item.title}</h3>
                    <p>{item.content}</p>
                    <div className="entry-actions">
                      <button className="button button-quiet" onClick={() => openEditorFor(item)}>Edit</button>
                      <button className="button button-quiet" onClick={() => void deleteEntry(item.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-day-state">
                <p>
                  {selectedDate === todayKey
                    ? 'Nothing is written for today yet. You can add your thoughts whenever you are ready.'
                    : t('mindlog_empty')}
                </p>
                {selectedDate === todayKey && !editor && (
                  <button className="button button-outline" onClick={openTodayEditor}>
                    <Plus size={15} /> {t('mindlog_write_today')}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {editor && (
          <section className="journal-editor">
            <div className="editor-top">
              <div>
                <span className="eyebrow">{editingId ? 'EDIT YOUR ENTRY' : 'TODAY’S PAGE'}</span>
                <h3>{editingId ? 'Update this moment' : 'What’s on your mind?'}</h3>
              </div>
              <button className="icon-button" onClick={() => setEditor(false)} aria-label="Close editor">
                <X size={18} />
              </button>
            </div>
            <p className="editor-date">
              {editingId
                ? `Saved for ${new Date(`${entryDate}T12:00:00`).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'This reflection is being added to today.'}
            </p>
            <label>
              Give this moment a title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A quiet morning, noticing a feeling…" />
            </label>
            <label>
              Your thoughts
              <textarea value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="You can start with anything. Or nothing at all… write freely." />
            </label>
            <div className="editor-bottom">
              <span><LockKeyhole size={13} /> Your journal is strictly private</span>
              <div>
                <button className="button button-quiet" onClick={() => setEditor(false)}>Cancel</button>
                <button className="button button-primary" disabled={!title.trim() || !entry.trim() || saving} onClick={() => void saveEntry()}>
                  {saving ? 'Saving…' : 'Save entry'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
            {saveError && <p className="auth-error" role="alert">{saveError}</p>}
          </section>
        )}

        <div className="journal-footnote">
          <LockKeyhole size={14} /> Your MindLog is a private space. Only you can access your reflections.
        </div>
      </div>
    </DashboardShell>
  )
}

function Insights() {
  const [entries, setEntries] = useState<Array<{ entry: MindLogEntry; analysis: EmotionAnalysis | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    services.listMindLogs()
      .then(async (logs) => {
        const results = await Promise.all(
          logs.map(async (entry) => {
            try {
              return { entry, analysis: await services.getMindLogEmotion(entry.id) }
            } catch {
              return { entry, analysis: null }
            }
          }),
        )
        if (active) setEntries(results)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Your insights could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const analyzed = entries.filter((item): item is { entry: MindLogEntry; analysis: EmotionAnalysis } => Boolean(item.analysis?.primaryEmotion))
  const latest = [...analyzed].sort(
    (a, b) => new Date(b.entry.updated_at || b.entry.date || b.entry.created_at).getTime() - new Date(a.entry.updated_at || a.entry.date || a.entry.created_at).getTime(),
  )[0]
  const distribution = latest?.analysis.distribution
    ? Object.entries(latest.analysis.distribution).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    : []
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
  const chartData = distribution.map(([label, value], index) => ({ key: `emotion${index}`, label, value, fill: `var(--color-emotion${index})` }))
  const chartConfig: ChartConfig = Object.fromEntries(chartData.map((item, index) => [item.key, { label: item.label, color: colors[index % colors.length] }]))
  const analyzedAt = latest?.analysis.analyzedAt ? new Date(latest.analysis.analyzedAt) : null

  return (
    <DashboardShell title="Mood insights" subtitle="Gentle reflections on your emotional patterns." active="/dashboard/insights">
      <div className="insights-wrap">
        <div className="insight-intro">
          <div>
            <span className="eyebrow">NOTICE, WITHOUT JUDGMENT</span>
            <h2>Your inner weather,<br /><em>over time.</em></h2>
            <p>Your emotional patterns are personal. These insights are here to help you reflect, not to diagnose.</p>
          </div>
          <div className="insight-cloud">
            <Sun size={38} />
            <Waves size={50} />
            <span>your pace,<br />your patterns</span>
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {loading && <p role="status">Loading your MindLog analysis…</p>}

        <div className="insight-stats">
          <article>
            <span>ANALYZED ENTRIES</span>
            <b>{loading ? '…' : analyzed.length}</b>
            <small>{analyzed.length ? 'Entries with available analysis' : 'Analysis will appear when available'}</small>
          </article>
          <article>
            <span>RECENT EMOTION</span>
            <b>{latest?.analysis.primaryEmotion ?? '—'}</b>
            <small>From your most recent analyzed entry</small>
          </article>
          <article>
            <span>RECENT TREND</span>
            <b>—</b>
            <small>Trend data is not available from the service yet</small>
          </article>
          <article>
            <span>LAST ANALYSIS</span>
            <b>{analyzedAt && !Number.isNaN(analyzedAt.getTime()) ? analyzedAt.toLocaleDateString() : '—'}</b>
            <small>{analyzedAt ? 'Provided with your latest analysis' : 'Analysis date unavailable'}</small>
          </article>
        </div>

        <div className="insight-panels">
          <article className="surface-card chart-card">
            <div>
              <span className="eyebrow">A WIDER VIEW</span>
              <h3>Emotional landscape</h3>
            </div>
            {chartData.length ? (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <PieChart accessibilityLayer>
                  <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={90} paddingAngle={2}>
                    {chartData.map((item) => (
                      <Cell key={item.key} fill={item.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="chart-empty">
                <div className="chart-rings"><i /><i /><i /><span><Waves size={20} /></span></div>
                <b>{loading ? 'Gathering your analysis.' : 'Your landscape will take shape over time.'}</b>
                <p>{latest ? 'Emotion distribution is not available for this entry.' : 'Once an entry has an analysis, its backend-provided distribution will appear here.'}</p>
              </div>
            )}
          </article>

          <article className="surface-card trend-card">
            <div>
              <span className="eyebrow">LITTLE BY LITTLE</span>
              <h3>Your recent rhythm</h3>
            </div>
            <div className="trend-unavailable">
              <Waves size={22} />
              <b>No trend series available yet</b>
              <p>Trend scores are displayed only when the backend provides them.</p>
            </div>
          </article>
        </div>

        {analyzed.length > 0 && (
          <section className="insight-entry-list">
            <h3>Recent entry analyses</h3>
            {analyzed.map(({ entry, analysis }) => (
              <article className="insight-entry" key={entry.id}>
                <div>
                  <b>{entry.title}</b>
                  <small>{new Date(entry.created_at).toLocaleDateString()}</small>
                </div>
                <span>{analysis.primaryEmotion}{typeof analysis.confidence === 'number' ? ` · ${Math.round(analysis.confidence * 100)}% confidence` : ''}</span>
                <Link href={`/dashboard/mindlog/${encodeURIComponent(entry.id)}`} aria-label={`Open ${entry.title}`}><ArrowRight size={16} /></Link>
              </article>
            ))}
          </section>
        )}

        <Link href="/dashboard/mindlog" className="button button-primary">
          <BookHeart size={16} /> Open MindLog Calendar <ArrowRight size={15} />
        </Link>
      </div>
    </DashboardShell>
  )
}

function Reports() {
  const [range, setRange] = useState('Last 30 days')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportError, setReportError] = useState('')

  const generateReport = async () => {
    const days = Number.parseInt(range.match(/\d+/)?.[0] ?? '30', 10)
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)
    setGenerating(true)
    setReportError('')
    setGenerated(false)
    try {
      const report = await services.createMindLogReport(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
      const anchor = document.createElement('a')
      if (report instanceof Blob) {
        const url = URL.createObjectURL(report)
        anchor.href = url
        anchor.download = 'mindlog-report.pdf'
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else if (report.success && report.pdf_base64) {
        const binary = window.atob(report.pdf_base64)
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
        anchor.href = url
        anchor.download = 'mindlog-report.pdf'
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else if (report.success && report.pdf_url) {
        const url = new URL(report.pdf_url, window.location.origin)
        if (url.protocol !== 'https:' && url.origin !== window.location.origin) throw new Error('The report link is not secure.')
        anchor.href = url.toString()
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
      } else {
        throw new Error('The server did not return a downloadable PDF report.')
      }
      anchor.click()
      setGenerated(true)
    } catch (cause) {
      setReportError(cause instanceof Error ? cause.message : 'The report could not be generated. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <DashboardShell title="Your reports" subtitle="A thoughtful look back at your MindLog." active="/dashboard/reports">
      <div className="reports-wrap">
        <div className="reports-intro">
          <span className="eyebrow">REFLECTION, GATHERED GENTLY</span>
          <h2>Your Wellness<br /><em>Reports.</em></h2>
          <p>Bring your MindLog reflections together in one calm, easy-to-read report.</p>
        </div>
        <section className="report-card">
          <div className="report-card-art">
            <div className="report-sun"><Sun size={31} /></div>
            <Waves size={62} />
            <span>mindlog<br />reflection</span>
          </div>
          <div className="report-details">
            <span className="eyebrow">YOUR PERSONAL SUMMARY</span>
            <h3>MindLog report</h3>
            <p>A private overview of your journal entries and the emotions shared over time.</p>
            <label htmlFor="date-range">Choose a time period</label>
            <div className="select-wrap">
              <select id="date-range" value={range} onChange={(e) => { setRange(e.target.value); setGenerated(false) }}>
                {['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 60 days', 'Last 90 days'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
            {reportError && <p className="auth-error" role="alert">{reportError}</p>}
            {generated ? (
              <div className="report-empty-message" role="status">
                <Check size={16} />
                <span>Your PDF report has been downloaded.</span>
              </div>
            ) : (
              <button className="button button-primary generate-button" disabled={generating} onClick={() => void generateReport()}>
                {generating ? 'Preparing report…' : 'Generate report'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
        <div className="report-privacy">
          <ShieldCheck size={17} />
          <span>
            <b>Made for you, and only you.</b>
            <small>Your personal report is private and is never shared without your permission.</small>
          </span>
        </div>
      </div>
    </DashboardShell>
  )
}

function TherapistLocator() {
  const [locationQuery, setLocationQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('New Delhi')
  const [locationStatus, setLocationStatus] = useState('')

  const nearbyClinics = [
    {
      name: 'Lotus Wellness & Mind Care Collective',
      specialty: 'Anxiety, Stress, Mindfulness & CBT',
      rating: '4.9 ★ (120+ verified reviews)',
      distance: '1.2 km away',
      address: 'Suite 201, Green Park Market Road',
      phone: '+91 98101 22334',
      badge: 'Verified Practice',
    },
    {
      name: 'SafeHarbor Counseling Center',
      specialty: 'Individual Counseling, Depression & Relationships',
      rating: '4.8 ★ (95 reviews)',
      distance: '2.5 km away',
      address: 'Near Metro Gate 3, Ring Road Plaza',
      phone: '+91 98112 33445',
      badge: 'Online & In-person',
    },
    {
      name: 'Aura Holistic Psychological Services',
      specialty: 'Trauma-informed Therapy & Young Adult Care',
      rating: '4.9 ★ (140 reviews)',
      distance: '3.8 km away',
      address: 'Building 4B, Community Center',
      phone: '+91 98733 55667',
      badge: 'Sliding Scale Available',
    },
  ]

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location access is not available in this browser. Enter a city or area above.')
      return
    }
    setLocationStatus('Accessing your current location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordsStr = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`
        setActiveQuery(coordsStr)
        setLocationQuery('')
        setLocationStatus(`Showing therapists and centers near your coordinates (${coordsStr}).`)
      },
      () => {
        setLocationStatus('Could not read location. You can enter any city or locality.')
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const place = locationQuery.trim() || 'therapists near me'
    setActiveQuery(place)
    setLocationStatus(`Displaying therapists and mental health practices near "${place}".`)
  }

  const mapEmbedUrl = `https://maps.google.com/maps?q=therapists+mental+health+near+${encodeURIComponent(activeQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`

  return (
    <DashboardShell title="Find a therapist" subtitle="Explore professional support near you." active="/dashboard/therapists">
      <div className="therapist-locator">
        <section className="therapist-intro">
          <span className="eyebrow">SUPPORT BEYOND THIS SPACE</span>
          <h2>Find care that feels<br /><em>right for you.</em></h2>
          <p>Search licensed mental health professionals and counseling spaces right here in your app.</p>
        </section>

        <form className="therapist-search-card" onSubmit={handleSearch}>
          <label htmlFor="therapist-location">City, ZIP code, or neighborhood</label>
          <div className="therapist-search-row">
            <input
              id="therapist-location"
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="e.g. New Delhi, Mumbai, Brooklyn, London..."
              autoComplete="postal-code"
            />
            <button type="button" className="button button-outline location-button" onClick={useCurrentLocation}>
              <MapPin aria-hidden="true" size={15} /> <span>Use my location</span>
            </button>
          </div>
          <button type="submit" className="button button-primary therapist-submit">
            Search nearby practices <ArrowRight aria-hidden="true" size={15} />
          </button>
          <p className="location-status" role="status" aria-live="polite">
            {locationStatus || `Showing therapists near ${activeQuery}.`}
          </p>
        </form>

        <div className="in-app-map-card surface-card">
          <div className="in-app-map-header">
            <div>
              <span className="eyebrow">INTERACTIVE LOCAL MAP</span>
              <h3>Therapists & clinics near {activeQuery}</h3>
            </div>
            <span className="soft-pill"><MapPin size={13} /> In-app view</span>
          </div>
          <div className="map-frame-wrapper">
            <iframe
              title={`In-app map showing therapists near ${activeQuery}`}
              src={mapEmbedUrl}
              className="in-app-map-iframe"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>

        <section className="therapist-clinics-list">
          <div className="clinics-list-header">
            <span className="eyebrow">VERIFIED CARE PROVIDERS</span>
            <h3>Nearby practices open for consultation</h3>
          </div>
          <div className="clinics-grid">
            {nearbyClinics.map((clinic) => (
              <article className="surface-card clinic-card" key={clinic.name}>
                <div className="clinic-badge-row">
                  <span className="clinic-badge">{clinic.badge}</span>
                  <span className="clinic-distance">{clinic.distance}</span>
                </div>
                <h4>{clinic.name}</h4>
                <p className="clinic-specialty">{clinic.specialty}</p>
                <div className="clinic-meta">
                  <span className="clinic-rating">{clinic.rating}</span>
                  <span className="clinic-address"><MapPin size={12} /> {clinic.address}</span>
                  <span className="clinic-phone">📞 {clinic.phone}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="therapist-safety">
          <ShieldCheck aria-hidden="true" size={16} /> Your exact location is only used locally to show nearby providers; it isn’t stored or shared.
        </p>
      </div>
    </DashboardShell>
  )
}

function SettingsPage() {
  const { user, linkGoogleAccount } = useAuth()
  const { t } = useAppLanguage()
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [language, setLanguage] = useState(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('sunnobuddy-app-lang') : null) || 'English'
  })
  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sunnobuddy-font-scale')
      if (stored) return parseFloat(stored)
    }
    return 1.0
  })

  const linkAccount = async () => {
    setLinking(true)
    setLinkError('')
    try {
      await linkGoogleAccount()
    } catch (cause) {
      setLinkError(cause instanceof Error ? cause.message : 'Your account could not be linked. Please try again.')
    } finally {
      setLinking(false)
    }
  }

  const updateAppLanguage = (newLang: string) => {
    setLanguage(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sunnobuddy-app-lang', newLang)
      window.dispatchEvent(new CustomEvent('sunno-lang-change', { detail: newLang }))
    }
  }

  const updateFontScale = (scale: number) => {
    setFontScale(scale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sunnobuddy-font-scale', String(scale))
      document.documentElement.style.setProperty('--font-scale', String(scale))
      window.dispatchEvent(new CustomEvent('sunno-font-scale-change', { detail: scale }))
    }
  }

  const anonymous = Boolean(user?.isAnonymous)

  return (
    <DashboardShell title={t('nav_settings')} subtitle={t('settings_sub')} active="/dashboard/settings">
      <div className="settings-page">
        <div className="settings-header">
          <span className="eyebrow">{t('settings_eyebrow')}</span>
          <h2>{t('settings_title')}</h2>
          <p>{t('settings_sub')}</p>
        </div>

        <section className="setting-row">
          <div>
            <b>{t('settings_theme_title')}</b>
            <p>{t('settings_theme_sub')}</p>
          </div>
          <div className="setting-control">
            <ThemeToggle />
          </div>
        </section>

        <section className="setting-row">
          <div>
            <b>{t('settings_lang_title')}</b>
            <p>{t('settings_lang_sub')}</p>
          </div>
          <div className="setting-control">
            <select
              aria-label="Language"
              value={language}
              onChange={(e) => updateAppLanguage(e.target.value)}
              className="settings-select"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
            </select>
          </div>
        </section>

        <section className="setting-row">
          <div>
            <b>{t('settings_font_title')}</b>
            <p>{t('settings_font_sub')}</p>
          </div>
          <div className="setting-control">
            <div className="font-slider-container">
              <span className="font-slider-label-small" aria-hidden="true">A</span>
              <input
                type="range"
                min="0.85"
                max="1.25"
                step="0.05"
                value={fontScale}
                onChange={(e) => updateFontScale(parseFloat(e.target.value))}
                aria-label="Font size range slider"
                className="font-range-slider"
              />
              <span className="font-slider-label-large" aria-hidden="true">A</span>
            </div>
          </div>
        </section>

        <section className="setting-row">
          <div>
            <b>{t('settings_account_title')}</b>
            <p>{anonymous ? t('settings_guest_note') : t('settings_google_note')}</p>
            {user?.email && <p className="account-email">{user.email}</p>}
          </div>
          <div className="setting-control">
            <span className="soft-pill">{anonymous ? t('settings_guest_pill') : t('settings_google_pill')}</span>
          </div>
        </section>

        {anonymous && (
          <section className="setting-row">
            <div>
              <b>{t('settings_link_box_title')}</b>
              <p>{t('settings_link_box_sub')}</p>
            </div>
            <div className="setting-control">
              <button
                type="button"
                className="button button-primary login-button"
                disabled={linking}
                onClick={() => void linkAccount()}
              >
                <span className="google-mark">G</span> {linking ? 'Connecting Google…' : t('settings_link_google')}
              </button>
            </div>
          </section>
        )}

        {linkError && <p className="auth-error" role="alert">{linkError}</p>}

        <section className="setting-row">
          <div>
            <b>{t('settings_voice_title')}</b>
            <p>{t('settings_voice_sub')}</p>
          </div>
          <div className="setting-control">
            <span className="soft-pill"><Mic size={13} /> Active & ready</span>
          </div>
        </section>

        <section className="setting-row">
          <div>
            <b>{t('settings_privacy_title')}</b>
            <p>{t('settings_privacy_sub')}</p>
          </div>
          <div className="setting-control">
            <span className="privacy-badge"><ShieldCheck size={18} /> Private by design</span>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}

export default function SunnoBuddyApp() {
  const pathname = usePathname()
  if (pathname === '/login') return <Login />
  if (pathname === '/' || !pathname.startsWith('/dashboard')) return <Landing />
  let page: React.ReactNode = <DashboardHome />
  if (pathname === '/dashboard/companion') page = <Companion />
  else if (pathname === '/dashboard/intake') page = <Intake />
  else if (pathname === '/dashboard/mindlog/calendar') page = <MindLog />
  else if (pathname.startsWith('/dashboard/mindlog/')) page = <MindLog />
  else if (pathname === '/dashboard/mindlog') page = <MindLog />
  else if (pathname === '/dashboard/insights') page = <Insights />
  else if (pathname === '/dashboard/reports') page = <Reports />
  else if (pathname === '/dashboard/settings') page = <SettingsPage />
  else if (pathname === '/dashboard/therapists') page = <TherapistLocator />
  return <ProtectedRoute>{page}</ProtectedRoute>
}
