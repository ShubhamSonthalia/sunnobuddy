'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProtectedRoute, useAuth } from '@/contexts/auth-context'
import { services, type EmotionAnalysis, type MindLogEntry, type ChatSession, type ComprehensiveInsights, type IntakeUserStatus } from '@/services/api'
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
  Bookmark,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Heart,
  Home,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  MoreHorizontal,
  Navigation,
  Pause,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  Waves,
  X,
  Copy,
} from 'lucide-react'
import { getDailyThoughtText } from '@/lib/daily-thoughts'

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
  const { lang, t } = useAppLanguage()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.isAnonymous ? t('nav_status') : user?.displayName || user?.email || t('nav_account')
  const userEmail = user?.isAnonymous ? 'Guest User' : user?.email || displayName

  const thoughtForToday = () => {
    return getDailyThoughtText(new Date(), lang)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logOut()
      setAccountMenuOpen(false)
      close()
      router.replace('/login')
    } finally {
      setSigningOut(false)
    }
  }

  // Close account menu on click outside or Escape
  useEffect(() => {
    if (!accountMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
        setShowSignOutConfirm(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false)
        setShowSignOutConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

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

          <div className="sidebar-profile-wrap" ref={menuRef}>
            {accountMenuOpen && (
              <div className="account-popover surface-card" role="dialog" aria-label="Account Menu">
                <div className="account-popover-header">
                  <div className="profile-avatar" style={{ width: '38px', height: '38px', fontSize: '15px' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="account-popover-info">
                    <b>{displayName}</b>
                    <small>{userEmail}</small>
                  </div>
                </div>

                <div className="account-popover-divider" />

                <Link
                  href="/dashboard/settings"
                  className="account-popover-item"
                  onClick={() => { setAccountMenuOpen(false); close(); }}
                >
                  <Settings size={16} />
                  <span>{t('nav_settings')}</span>
                </Link>

                {!showSignOutConfirm ? (
                  <button
                    type="button"
                    className="account-popover-item signout-item"
                    onClick={() => setShowSignOutConfirm(true)}
                  >
                    <LogOut size={16} />
                    <span>{t('nav_signout')}</span>
                  </button>
                ) : (
                  <div className="signout-confirm-box">
                    <p>Are you sure you want to sign out of SunnoBuddy?</p>
                    <div className="signout-confirm-actions">
                      <button
                        type="button"
                        className="button button-quiet"
                        style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}
                        onClick={() => setShowSignOutConfirm(false)}
                        disabled={signingOut}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="button button-primary signout-danger-btn"
                        onClick={() => void handleSignOut()}
                        disabled={signingOut}
                      >
                        {signingOut ? 'Signing out…' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="profile-row"
              onClick={() => {
                setAccountMenuOpen((prev) => !prev)
                setShowSignOutConfirm(false)
              }}
              aria-label={`Open account menu for ${displayName}`}
              aria-expanded={accountMenuOpen}
            >
              <div className="profile-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <span>
                <b>{displayName}</b>
                <small>{user?.isAnonymous ? t('nav_status') : (user?.email || 'Account')}</small>
              </span>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function DashboardShell({
  children,
  title,
  subtitle,
  active,
  hideFooterDisclaimer = false,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
  active: string
  hideFooterDisclaimer?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, logOut } = useAuth()
  const router = useRouter()
  const { t } = useAppLanguage()
  const accountName = user?.isAnonymous ? t('nav_status') : user?.displayName || user?.email || t('nav_account')

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await logOut()
    router.replace('/login')
  }

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
          <div className="header-right" style={{ position: 'relative' }}>
            <span className="header-date">
              {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
            </span>
            <ThemeToggle />
            <button
              className="header-avatar"
              aria-label={`${accountName} profile`}
              onClick={() => setDropdownOpen((v) => !v)}
              style={{ cursor: 'pointer' }}
            >
              {accountName.charAt(0).toUpperCase()}
            </button>
            {dropdownOpen && (
              <div
                className="surface-card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '240px',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  border: '1px solid var(--border-subtle, #e2eae8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle, #e2eae8)' }}>
                  <b style={{ fontSize: '13px', display: 'block', color: 'var(--text-main, #254148)' }}>{accountName}</b>
                  {user?.email && <small style={{ fontSize: '11px', color: '#83979c', wordBreak: 'break-all' }}>{user.email}</small>}
                  <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', background: 'rgba(83, 138, 132, 0.1)', color: '#538a84', padding: '2px 6px', borderRadius: '4px' }}>
                    {user?.isAnonymous ? 'Guest session' : 'Google account'}
                  </span>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '6px 4px', color: 'inherit', textDecoration: 'none' }}
                >
                  <Settings size={14} />
                  <span>{t('nav_settings')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    padding: '8px 4px',
                    background: 'none',
                    border: 'none',
                    color: '#c05252',
                    cursor: 'pointer',
                    fontWeight: 500,
                    textAlign: 'left',
                    width: '100%',
                    borderTop: '1px solid var(--border-subtle, #e2eae8)',
                    marginTop: '2px',
                  }}
                >
                  <LogOut size={14} />
                  <span>{t('nav_signout')}</span>
                </button>
              </div>
            )}
          </div>
        </header>
        {menuOpen && (
          <div className="mobile-open">
            <Sidebar active={active} close={() => setMenuOpen(false)} />
          </div>
        )}
        <main className="page-content">
          {children}
          {!hideFooterDisclaimer && (
            <footer className="shell-footer-disclaimer">
              <ShieldCheck size={14} />
              <span>{t('hdr_safety')}</span>
            </footer>
          )}
        </main>
        {/* Mobile Bottom Navigation for screens < 768px */}
        <nav className="mobile-bottom-nav" aria-label="Quick mobile navigation">
          <Link href="/dashboard" className={`mobile-bottom-nav-item ${active === '/dashboard' ? 'is-active' : ''}`}>
            <Home size={18} />
            <span>{t('nav_home')}</span>
          </Link>
          <Link href="/dashboard/companion" className={`mobile-bottom-nav-item ${active === '/dashboard/companion' ? 'is-active' : ''}`}>
            <MessageCircle size={18} />
            <span>{t('nav_companion')}</span>
          </Link>
          <Link href="/dashboard/intake" className={`mobile-bottom-nav-item ${active === '/dashboard/intake' ? 'is-active' : ''}`}>
            <Sparkles size={18} />
            <span>Reflect</span>
          </Link>
          <Link href="/dashboard/mindlog" className={`mobile-bottom-nav-item ${active === '/dashboard/mindlog' ? 'is-active' : ''}`}>
            <BookHeart size={18} />
            <span>{t('nav_mindlog')}</span>
          </Link>
          <Link href="/dashboard/therapists" className={`mobile-bottom-nav-item ${active === '/dashboard/therapists' ? 'is-active' : ''}`}>
            <MapPin size={18} />
            <span>Find Care</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}

function MindfulBreathWidget() {
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale')
  const [seconds, setSeconds] = useState(4)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const { t } = useAppLanguage()

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Soft chime on phase change (Web Audio API sine oscillator)
  const playPhaseChime = (freq: number) => {
    if (!soundEnabled || !audioCtxRef.current) return
    try {
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }
      const osc = ctx.createOscillator()
      const chimeGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      chimeGain.gain.setValueAtTime(0.0001, ctx.currentTime)
      chimeGain.gain.exponentialRampToValueAtTime(0.18 * volume, ctx.currentTime + 0.04)
      chimeGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.2)
      osc.connect(chimeGain)
      chimeGain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1.25)
    } catch {}
  }

  // Soft wave pink noise background
  const startAmbientAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const bufferSize = ctx.sampleRate * 2
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        output[i] = (b0 + b1 + b2) * 0.04
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(300, ctx.currentTime)

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.12 * volume, ctx.currentTime)

      whiteNoise.connect(filter)
      filter.connect(masterGain)
      masterGain.connect(ctx.destination)

      whiteNoise.start()
      noiseSourceRef.current = whiteNoise
      masterGainRef.current = masterGain
    } catch (e) {
      console.warn('Web Audio error:', e)
    }
  }

  const stopAmbientAudio = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
      } catch {}
      noiseSourceRef.current = null
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close()
      } catch {}
      audioCtxRef.current = null
    }
  }

  const toggleSound = () => {
    if (!soundEnabled) {
      setSoundEnabled(true)
      startAmbientAudio()
    } else {
      setSoundEnabled(false)
      stopAmbientAudio()
    }
  }

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(0.12 * volume, audioCtxRef.current.currentTime)
    }
  }, [volume])

  useEffect(() => {
    if (!active) {
      stopAmbientAudio()
      setSoundEnabled(false)
      setPhase('Inhale')
      setSeconds(4)
      return
    }
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1
        setPhase((current) => {
          let nextPhase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest' = 'Inhale'
          let freq = 528
          if (current === 'Inhale') {
            nextPhase = 'Hold'
            freq = 594
          } else if (current === 'Hold') {
            nextPhase = 'Exhale'
            freq = 440
          } else if (current === 'Exhale') {
            nextPhase = 'Rest'
            freq = 396
          } else {
            nextPhase = 'Inhale'
            freq = 528
          }
          if (soundEnabled) {
            playPhaseChime(freq)
          }
          return nextPhase
        })
        return 4
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [active, soundEnabled, volume])

  useEffect(() => {
    return () => {
      stopAmbientAudio()
    }
  }, [])

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="button button-quiet"
              onClick={toggleSound}
              style={{ padding: '6px', height: 'auto', borderRadius: '50%', color: soundEnabled ? '#538a84' : '#83979c' }}
              title={soundEnabled ? 'Mute ambient sound' : 'Unmute gentle ocean breathing audio'}
              aria-label={soundEnabled ? 'Mute ambient sound' : 'Unmute gentle ocean breathing audio'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              type="button"
              className="mindful-close"
              onClick={() => setActive(false)}
              aria-label="Close mindful pause"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardHome() {
  const { user } = useAuth()
  const { lang, t } = useAppLanguage()
  const name = user?.isAnonymous ? t('nav_status') : user?.displayName?.split(' ')[0] || 'friend'
  const [recentEntries, setRecentEntries] = useState<MindLogEntry[]>([])
  const [entryCount, setEntryCount] = useState(0)
  const [latestEmotion, setLatestEmotion] = useState<EmotionAnalysis | null>(null)
  const [intakeDone, setIntakeDone] = useState(false)
  const [intakeStatus, setIntakeStatus] = useState<IntakeUserStatus | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [thoughtOffset, setThoughtOffset] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sunnobuddy_thought_offset')
      return stored ? parseInt(stored, 10) : 0
    }
    return 0
  })
  const [copiedThought, setCopiedThought] = useState(false)

  const currentThoughtText = getDailyThoughtText(new Date(), lang, thoughtOffset)

  const nextThought = () => {
    setThoughtOffset((prev) => {
      const next = prev + 1
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sunnobuddy_thought_offset', String(next))
      }
      return next
    })
  }

  const copyThought = async () => {
    try {
      await navigator.clipboard.writeText(currentThoughtText)
      setCopiedThought(true)
      setTimeout(() => setCopiedThought(false), 2000)
    } catch {}
  }

  useEffect(() => {
    let active = true
    services.getIntakeStatus()
      .then((st) => {
        if (active) {
          setIntakeStatus(st)
          if (st.completed) setIntakeDone(true)
        }
      })
      .catch(() => {})

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="thought-refresh"
                  onClick={() => void copyThought()}
                  title="Save or copy this thought"
                  aria-label="Save or copy this thought"
                >
                  {copiedThought ? <Check size={12} style={{ color: '#538a84' }} /> : <Copy size={12} />}
                  <span>{copiedThought ? 'Saved!' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  className="thought-refresh"
                  onClick={nextThought}
                  title="Explore another comforting thought"
                  aria-label="Explore another comforting thought"
                >
                  <Sparkles size={12} />
                  <span>{t('dash_thought_refresh')}</span>
                </button>
              </div>
            </div>
            <p className="daily-thought-text">“{currentThoughtText}”</p>
          </div>

          {intakeStatus?.monthly_checkin_due && (
            <div className="monthly-checkin-banner">
              <div className="monthly-checkin-icon"><Sparkles size={20} /></div>
              <div className="monthly-checkin-info">
                <b>Monthly Wellness Check-In Ready</b>
                <p>
                  It has been ~{intakeStatus.days_since_last_checkin || 30} days since your last reflection. Take a few quiet minutes to see how your patterns and feelings have evolved.
                </p>
              </div>
              <Link href="/dashboard/intake" className="button button-primary" style={{ padding: '7px 14px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                Start Check-In <ArrowRight size={14} />
              </Link>
            </div>
          )}

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
            <span>
              {intakeStatus?.can_compare
                ? `${intakeStatus.total_assessments ?? 2} check-ins saved`
                : intakeDone
                ? 'Completed'
                : 'Open to view progress'}
            </span>
            <Link href="/dashboard/intake">{intakeDone ? 'View reflection & growth' : 'Continue reflection'}</Link>
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
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false)
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

  const loadHistory = async (targetId: string) => {
    setLoadingHistory(true)
    setApiError('')
    try {
      const history = await services.getChatHistory(targetId)
      const mapped = history.map((m) => ({
        who: m.role === 'user' ? 'you' : 'buddy',
        text: m.content,
      }))
      setMessages(mapped)
      setSessionId(targetId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sunnobuddy_active_session_id', targetId)
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err)
      setApiError('Could not restore conversation history.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const refreshSessionsList = async () => {
    try {
      setLoadingSessions(true)
      const list = await services.listChatSessions()
      setSessions(list)
      return list
    } catch (err) {
      console.warn('Failed to list sessions:', err)
      return []
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    let active = true
    const initSessions = async () => {
      const list = await refreshSessionsList()
      if (!active) return
      const storedId = typeof window !== 'undefined' ? localStorage.getItem('sunnobuddy_active_session_id') : null
      const target = storedId && list.some((s) => s.session_id === storedId)
        ? storedId
        : list[0]?.session_id
      if (target) {
        setSessionId(target)
        void loadHistory(target)
      }
    }
    void initSessions()
    return () => {
      active = false
    }
  }, [])

  const handleNewConversation = () => {
    setApiError('')
    setRetryMessage('')
    setText('')
    setMessages([])
    const tempId = `temp_${Date.now()}`
    setSessionId(tempId)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sunnobuddy_active_session_id')
    }
    setShowSessionsDrawer(false)
  }

  const handleDeleteSession = async (delId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await services.deleteChatSession(delId)
      const updated = sessions.filter((s) => s.session_id !== delId)
      setSessions(updated)
      if (sessionId === delId) {
        const next = updated[0]?.session_id
        if (next) {
          setSessionId(next)
          void loadHistory(next)
        } else {
          setSessionId(undefined)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sunnobuddy_active_session_id')
          }
          setMessages([])
        }
      }
    } catch (err) {
      console.warn('Could not delete session:', err)
    }
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
      const effectiveSessionId = sessionId && !sessionId.startsWith('temp_') ? sessionId : undefined
      const result = await services.sendChat(message, effLang, effectiveSessionId)
      setSessionId(result.session_id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sunnobuddy_active_session_id', result.session_id)
      }
      setCrisisNotice({ detected: Boolean(result.crisis_detected), helplines: result.helplines ?? [] })
      if (!result.crisis_detected) setMessages((old) => [...old, { who: 'buddy', text: result.reply }])
      void refreshSessionsList()
    } catch (cause) {
      setRetryMessage(message)
      const errMsg = cause instanceof Error ? cause.message : 'The message could not be sent. Please try again.'
      if (errMsg.toLowerCase().includes('session not found') || errMsg.toLowerCase().includes('not found')) {
        setSessionId(undefined)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sunnobuddy_active_session_id')
        }
      }
      setApiError(errMsg)
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
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="button button-quiet"
                style={{ fontSize: '11px', padding: '5px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setShowSessionsDrawer((v) => !v)}
                title="View previous conversations"
                aria-label="View previous conversations"
              >
                <Clock3 size={13} />
                <span>History ({sessions.length})</span>
              </button>
              <button
                type="button"
                className="button button-quiet"
                style={{ fontSize: '11px', padding: '5px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => void handleNewConversation()}
                disabled={sending}
                title="Start a new conversation"
                aria-label="Start a new conversation"
              >
                <Plus size={13} />
                <span>New</span>
              </button>
              <span className="chat-private"><LockKeyhole size={13} /> Private</span>
            </div>
          </header>

          {showSessionsDrawer && (
            <div
              className="surface-card"
              style={{
                margin: '10px 18px',
                padding: '12px 16px',
                border: '1px solid var(--border-subtle, #e6edef)',
                borderRadius: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', color: '#6c9289' }}>
                  CONVERSATION HISTORY
                </span>
                <button
                  type="button"
                  onClick={() => setShowSessionsDrawer(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#83979c', padding: 2 }}
                >
                  <X size={14} />
                </button>
              </div>
              {sessions.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#83979c', margin: '4px 0' }}>No previous conversations saved yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sessions.map((s) => (
                    <div
                      key={s.session_id}
                      onClick={() => {
                        void loadHistory(s.session_id)
                        setShowSessionsDrawer(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: s.session_id === sessionId ? 'rgba(83, 138, 132, 0.12)' : 'transparent',
                        fontSize: '12px',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '78%' }}>
                        <span style={{ fontWeight: s.session_id === sessionId ? 600 : 400 }}>{s.title || 'Conversation'}</span>
                        {s.created_at && (
                          <span style={{ fontSize: '10px', color: '#83979c', marginLeft: '8px' }}>
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => void handleDeleteSession(s.session_id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a4b2b6', padding: '3px' }}
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="chat-thread">
            <div className="chat-date">TODAY · A FRESH START</div>
            {loadingHistory && (
              <p role="status" className="chat-status" style={{ textAlign: 'center', padding: '12px 0' }}>
                Restoring conversation history…
              </p>
            )}
            {messages.length === 0 && !loadingHistory && (
              <div className="chat-message">
                <div className="tiny-mascot"><Logo variant="mascot" alt="" /></div>
                <div>
                  <div className="bubble bubble-buddy">
                    {t('chat_welcome')}
                  </div>
                  <span className="message-time">Just now</span>
                </div>
              </div>
            )}

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
              <div className="crisis-panel-container" role="alert" aria-live="assertive">
                <div className="crisis-panel-header">
                  <ShieldCheck size={20} />
                  <h3>You deserve immediate care and gentle support</h3>
                </div>
                <p className="crisis-panel-intro">
                  Things feel intensely heavy right now, and you do not have to carry this alone. SunnoBuddy is an AI companion and cannot replace human emergency support. If you or someone you know may be in immediate danger, please connect with someone you trust or reach out to these free, confidential, 24/7 helplines right now.
                </p>

                <div className="crisis-immediate-alert">
                  <Phone size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <b>Immediate danger or self-harm emergency?</b>
                    <span> Call <b>112</b> (All-India Emergency) immediately, or sit with a family member or friend you trust.</span>
                  </div>
                </div>

                <div className="crisis-cards-grid">
                  {(crisisNotice.helplines && crisisNotice.helplines.length > 0
                    ? crisisNotice.helplines
                    : [
                        { name: 'Tele-MANAS (Govt. of India)', number: '14416', hours: '24/7 Toll-Free Support (20+ Languages)', url: 'https://telemanas.mohfw.gov.in' },
                        { name: 'KIRAN Helpline (Govt. of India)', number: '1800-599-0019', hours: '24/7 Multi-language Assistance', url: 'https://www.mentalhealthindia.org' },
                        { name: 'Vandrevala Foundation', number: '+91 9999 666 555', hours: '24/7 Call & WhatsApp Support', url: 'https://www.vandrevalafoundation.com' },
                        { name: 'Emergency Services', number: '112', hours: 'Immediate 24/7 Police, Ambulance, Fire', url: 'https://112.gov.in' },
                      ]
                  ).map((line: any) => {
                    const cleanPhone = (line.phone || line.number || '').replace(/[^\d+]/g, '')
                    return (
                      <div className="crisis-card-item" key={line.name}>
                        <div>
                          <span className="crisis-card-title">{line.name}</span>
                          <span className="crisis-card-desc">{line.hours || line.desc || 'Free & confidential crisis care'}</span>
                        </div>
                        <a href={`tel:${cleanPhone}`} className="crisis-call-btn">
                          <Phone size={13} /> Call {line.number || line.phone}
                        </a>
                      </div>
                    )
                  })}
                </div>

                <div className="crisis-dismiss-row">
                  <button
                    type="button"
                    className="crisis-continue-btn"
                    onClick={() => setCrisisNotice({ detected: false, helplines: [] })}
                  >
                    I am safe right now · Continue companion conversation
                  </button>
                </div>
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
                  'Press Enter ↵ to send · Shift+Enter for new line'
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
  const [assessmentReport, setAssessmentReport] = useState<any>(null)
  const [intakeHistory, setIntakeHistory] = useState<Array<any>>([])
  const [selectedHistorySession, setSelectedHistorySession] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'report' | 'comparison'>('report')
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [comparePrevId, setComparePrevId] = useState<string>('')

  const loadComparison = async (prevId?: string) => {
    setLoadingComparison(true)
    try {
      const data = await services.getIntakeComparison(undefined, prevId || undefined)
      setComparisonData(data)
      if (data?.previous_session_id) {
        setComparePrevId(data.previous_session_id)
      }
    } catch (err) {
      console.warn('Could not load monthly comparison:', err)
    } finally {
      setLoadingComparison(false)
    }
  }

  const unwrapReport = (raw: any): any => {
    if (!raw) return null
    if (raw.assessment_report && typeof raw.assessment_report === 'object') return unwrapReport(raw.assessment_report)
    if (raw.report && typeof raw.report === 'object') return unwrapReport(raw.report)
    return raw
  }

  const loadAssessmentData = async (activeSessionId?: string, fallbackReport?: any) => {
    if (fallbackReport) {
      const u = unwrapReport(fallbackReport)
      if (u) setAssessmentReport(u)
    }
    try {
      const history = await services.getIntakeHistory()
      setIntakeHistory(history || [])
      const targetId = activeSessionId || history?.[0]?.session_id
      if (targetId) {
        setSelectedHistorySession(targetId)
        const report = await services.getIntakeAssessment(targetId)
        const unwrapped = unwrapReport(report)
        if (unwrapped) setAssessmentReport(unwrapped)
      }
    } catch (err) {
      console.warn('Could not load assessment report:', err)
    }
  }

  useEffect(() => {
    let active = true
    const checkStatus = async () => {
      try {
        const res = await services.getIntakeStatus()
        if (!active) return
        if (res.completed) {
          setFinished(true)
          setStarted(true)
          setCompletedCount(res.answers_count || 26)
          setTotalCount(res.total_questions || 26)
          const direct = unwrapReport(res.latest_report || res.assessment_report || res.report)
          if (direct) setAssessmentReport(direct)
          void loadAssessmentData(res.session_id, direct)
        }
      } catch (err) {
        console.warn('Could not check intake completion status:', err)
      }
    }
    void checkStatus()
    return () => {
      active = false
    }
  }, [])

  const retakeReflection = async () => {
    setIntakeLoading(true)
    setIntakeError('')
    try {
      const res = await services.retakeIntake()
      setFinished(false)
      setActiveTab('report')
      setComparisonData(null)
      setAnswers([])
      setAssessmentReport(null)
      setCompletedCount(0)
      setTotalCount(res.total_questions ?? 26)
      setCurrentQuestion(res.question || 'How are you feeling in this moment?')
      setQuestionId(res.question_id ?? 'Q1')
      setIsFollowUp(Boolean(res.follow_up_required))
      setStarted(true)
    } catch (err) {
      setIntakeError(err instanceof Error ? err.message : 'Could not restart intake.')
    } finally {
      setIntakeLoading(false)
    }
  }

  const selectHistoryVersion = async (sid: string) => {
    setSelectedHistorySession(sid)
    try {
      const report = await services.getIntakeAssessment(sid)
      const unwrapped = unwrapReport(report)
      if (unwrapped) setAssessmentReport(unwrapped)
    } catch (err) {
      console.warn('Could not load selected assessment version:', err)
    }
  }

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
        void loadAssessmentData()
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
        void loadAssessmentData()
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
          <section className="intake-done" style={{ textAlign: 'left', maxWidth: '860px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="done-check" style={{ margin: '0 auto 12px' }}><Check size={27} /></div>
              <span className="eyebrow">THAT’S A LOVELY START</span>
              <h2>Thank you for<br />showing up <em>for you.</em></h2>
              <p style={{ maxWidth: '540px', margin: '8px auto' }}>
                You’ve completed your guided reflection. {completedCount !== null && <>You answered {completedCount}{totalCount !== null ? ` of ${totalCount}` : ''} questions. </>}
                Here is your comprehensive, non-diagnostic Guided Intake Assessment Report.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/dashboard" className="button button-primary">Back to your space <ArrowRight size={16} /></Link>
                <button
                  type="button"
                  className="button button-quiet"
                  onClick={() => void retakeReflection()}
                  disabled={intakeLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={15} /> {intakeLoading ? 'Restarting…' : 'Retake Guided Intake (New Version)'}
                </button>
              </div>
            </div>

            {/* View Tabs: Current Report vs. Monthly Comparison */}
            <div className="comparison-tabs-bar" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className={`comparison-tab-btn ${activeTab === 'report' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                <FileText size={16} /> Current Reflection Report
              </button>
              <button
                type="button"
                className={`comparison-tab-btn ${activeTab === 'comparison' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('comparison')
                  if (!comparisonData && !loadingComparison) {
                    void loadComparison()
                  }
                }}
              >
                <Sparkles size={16} /> Monthly Comparison & Growth
              </button>
            </div>

            {activeTab === 'report' ? (
              <>
                {/* Assessment History Versions */}
                {intakeHistory.length > 1 && (
                  <div className="surface-card" style={{ padding: '16px 20px', marginBottom: '24px', borderRadius: '12px' }}>
                    <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>INTAKE ASSESSMENT HISTORY</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {intakeHistory.map((item, idx) => (
                        <button
                          key={item.session_id}
                          type="button"
                          onClick={() => void selectHistoryVersion(item.session_id)}
                          className={`button ${selectedHistorySession === item.session_id ? 'button-primary' : 'button-outline'}`}
                          style={{ fontSize: '12px', padding: '6px 12px', height: 'auto' }}
                        >
                          Version {item.version || (intakeHistory.length - idx)} · {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Assessment'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10-Section Comprehensive Guided Intake Assessment Report */}
                {assessmentReport ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="surface-card" style={{ padding: '24px 28px', borderRadius: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <span className="eyebrow">GUIDED INTAKE ASSESSMENT REPORT</span>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Personal Wellness Synthesis</h3>
                        </div>
                        <span className="soft-pill" style={{ background: 'rgba(83,138,132,0.15)', color: 'var(--text-main, #254148)', fontWeight: 600, fontSize: '11px' }}>
                          Non-Diagnostic Educational Overview
                        </span>
                      </div>

                      {/* Executive Summary */}
                      <div className="report-summary-highlight">
                        <h4>Executive Reflection Summary</h4>
                        <p>
                          {assessmentReport.summary ||
                            'A comprehensive, supportive synthesis of your 26 guided reflection responses, designed to honor your lived experiences and inform future SunnoBuddy Companion dialogues.'}
                        </p>
                        {assessmentReport.version && (
                          <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>
                            Assessment Version {assessmentReport.version} · {assessmentReport.generated_at ? new Date(assessmentReport.generated_at).toLocaleDateString() : 'Personal Report'}
                          </div>
                        )}
                      </div>

                      {/* Group 1: Foundation & Emotional Landscape */}
                      <div className="report-section-group">
                        <div className="report-group-title">
                          <span>01</span> Foundation & Emotional Landscape
                        </div>
                        <div className="report-grid-duo">
                          <div className="report-card-rich">
                            <h5>1. Personal Background & Daily Context</h5>
                            <p>{assessmentReport.personal_context || assessmentReport.personal_background || 'Background and routines captured from your guided check-in.'}</p>
                          </div>
                          <div className="report-card-rich">
                            <h5>2. Current Emotional State & Concerns</h5>
                            <p>{assessmentReport.emotional_state || assessmentReport.emotional_concerns || assessmentReport.primary_emotional_concerns || 'Emotional landscape and felt experiences identified in your responses.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Group 2: Pressures & Observed Connections */}
                      <div className="report-section-group">
                        <div className="report-group-title">
                          <span>02</span> Pressures & Observed Connections
                        </div>
                        <div className="report-grid-duo">
                          <div className="report-card-rich">
                            <h5>3. Main Stressors & Daily Pressures</h5>
                            <p>{assessmentReport.main_stressors || assessmentReport.current_challenges || assessmentReport.stressors_and_triggers || 'Key situational, interpersonal, and environmental pressures.'}</p>
                          </div>
                          <div className="report-card-rich">
                            <h5>4. Patterns & Emotional Triggers</h5>
                            <p>{assessmentReport.patterns_and_triggers || assessmentReport.patterns_themes || 'Observed connections across daily demands, fatigue, and emotional triggers.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Group 3: Resources & Support Systems */}
                      <div className="report-section-group">
                        <div className="report-group-title">
                          <span>03</span> Resources & Support Systems
                        </div>
                        <div className="report-grid-duo">
                          <div className="report-card-rich">
                            <h5>5. Coping Strategies Currently Used</h5>
                            <p>{assessmentReport.coping_strategies || assessmentReport.strengths_coping || 'Existing coping patterns, self-soothing methods, and recovery habits noted in your responses.'}</p>
                          </div>
                          <div className="report-card-rich">
                            <h5>6. Support System & Connection Preferences</h5>
                            <p>{assessmentReport.support_system || assessmentReport.support_preferences || 'Connection comfort levels with friends, family, and professional mental health support.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Group 4: Resilience & Growth Themes */}
                      <div className="report-section-group">
                        <div className="report-group-title">
                          <span>04</span> Resilience & Growth Themes
                        </div>
                        <div className="report-grid-duo">
                          <div className="report-card-rich">
                            <h5>7. Personal Strengths & Resilience Factors</h5>
                            <p>{assessmentReport.personal_strengths || assessmentReport.strengths_and_resilience || 'Inner resources, self-honesty, and adaptive strengths demonstrated across your reflection.'}</p>
                          </div>
                          <div className="report-card-rich">
                            <h5>8. Core Recurring Themes</h5>
                            <p>{assessmentReport.recurring_themes || assessmentReport.patterns_themes || 'Core threads of balance, boundaries, and personal meaning highlighted in your answers.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Group 5: Actionable Companion Takeaways */}
                      <div className="report-section-group" style={{ marginBottom: '14px' }}>
                        <div className="report-group-title">
                          <span>05</span> Actionable Companion Takeaways
                        </div>
                        <div className="report-card-rich" style={{ marginBottom: '12px' }}>
                          <h5>9. Suggested Focus Areas for SunnoBuddy Companion</h5>
                          <p>{assessmentReport.companion_focus || assessmentReport.focus_areas || assessmentReport.companion_goals || 'Recommended focus topics and gentle reflection intentions for future Companion dialogues.'}</p>
                        </div>

                        <div className="report-card-rich">
                          <h5>10. Recommended Self-Care & Wellness Practices</h5>
                          {Array.isArray(assessmentReport.personalized_next_steps || assessmentReport.recommended_self_care || assessmentReport.self_care_recommendations) ? (
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.7 }}>
                              {(assessmentReport.personalized_next_steps || assessmentReport.recommended_self_care || assessmentReport.self_care_recommendations).map((item: string, i: number) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
                              {assessmentReport.self_care_recommendations || assessmentReport.recommended_self_care || 'Gentle daily mindfulness, breathwork, and emotional pacing suggestions.'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Non-Diagnostic Summary / Disclaimer Notice */}
                      <div className="intake-summary-card" style={{ marginTop: '16px' }}>
                        <b style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Non-Diagnostic Summary & Ethical Transparency Notice</b>
                        <p style={{ fontSize: '11px', margin: 0, lineHeight: 1.5, opacity: 0.9 }}>
                          {assessmentReport.disclaimer || assessmentReport.non_diagnostic_summary || 'This synthesis is created to foster gentle self-reflection and assist your companion conversations. It does not replace medical or mental health evaluation.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              /* Monthly Comparison & Growth View */
              <div>
                {loadingComparison ? (
                  <div className="surface-card" style={{ padding: '40px 24px', textAlign: 'center', borderRadius: '14px' }}>
                    <p className="chat-status" style={{ margin: 0 }}>
                      Synthesizing your monthly reflections and personal growth…
                    </p>
                  </div>
                ) : !comparisonData?.can_compare ? (
                  <div className="surface-card comparison-baseline-card">
                    <div className="comparison-baseline-icon"><Calendar size={26} /></div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 10px', color: 'var(--text-main, #254148)' }}>
                      This is your baseline reflection
                    </h3>
                    <p style={{ maxWidth: '580px', margin: '0 auto 20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-subtle, #53727a)' }}>
                      {comparisonData?.message ||
                        "This is your starting point. Your future monthly check-ins will help you reflect on changes over time. Once you complete your next monthly wellness check-in, you'll see a thoughtful side-by-side comparison of your emotional patterns, coping strategies, and personal growth right here."}
                    </p>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => void retakeReflection()}
                      disabled={intakeLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RotateCcw size={15} /> Start Next Check-in (New Version)
                    </button>
                  </div>
                ) : (
                  <div className="comparison-wrap">
                    {/* Version Selector Bar */}
                    <div className="surface-card" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span className="eyebrow" style={{ display: 'block' }}>COMPARING REFLECTION SESSIONS</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #254148)' }}>
                          Version {comparisonData.current_version} ({comparisonData.current_completed_at ? new Date(comparisonData.current_completed_at).toLocaleDateString() : 'Current'})
                          {' '}vs.{' '}
                          Version {comparisonData.previous_version} ({comparisonData.previous_completed_at ? new Date(comparisonData.previous_completed_at).toLocaleDateString() : 'Previous'})
                        </span>
                      </div>
                      {comparisonData.available_versions && comparisonData.available_versions.length > 2 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle, #53727a)' }}>Compare against:</span>
                          <select
                            value={comparePrevId}
                            onChange={(e) => {
                              setComparePrevId(e.target.value)
                              void loadComparison(e.target.value)
                            }}
                            style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-subtle, #e2eae8)', background: 'var(--surface, #ffffff)', color: 'var(--text-main, #254148)' }}
                          >
                            {comparisonData.available_versions
                              .filter((v: any) => v.session_id !== comparisonData.current_session_id)
                              .map((v: any) => (
                                <option key={v.session_id} value={v.session_id}>
                                  Version {v.version} · {v.completed_at ? new Date(v.completed_at).toLocaleDateString() : 'Previous'}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Executive Summary Card */}
                    <div className="comparison-header-card">
                      <span className="eyebrow" style={{ color: 'var(--teal, #538a84)' }}>MONTHLY WELLNESS TRAJECTORY</span>
                      <h3>Reflection & Growth Synthesis</h3>
                      <p>{comparisonData.comparison?.executive_summary || 'A side-by-side comparative analysis of your monthly wellness check-ins, honoring shifts in coping, stressors, and emotional resilience.'}</p>
                    </div>

                    {/* 6 Dimension Cards */}
                    {comparisonData.comparison?.dimensions && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                          { key: 'emotional_wellbeing', icon: <Heart size={16} />, defaultTitle: 'Emotional Well-being' },
                          { key: 'stressors_and_triggers', icon: <ShieldAlert size={16} />, defaultTitle: 'Stressors & Daily Demands' },
                          { key: 'coping_strategies', icon: <Sparkles size={16} />, defaultTitle: 'Coping Strategies & Practices' },
                          { key: 'support_system', icon: <Users size={16} />, defaultTitle: 'Support System & Relationships' },
                          { key: 'personal_strengths', icon: <Sun size={16} />, defaultTitle: 'Personal Strengths & Resilience' },
                          { key: 'recurring_themes', icon: <Bookmark size={16} />, defaultTitle: 'Recurring Themes & Reflections' },
                        ].map(({ key, icon, defaultTitle }) => {
                          const dim = comparisonData.comparison.dimensions[key]
                          if (!dim) return null
                          const tagClass = dim.status_tag === 'deepened' || dim.status_tag === 'lighter' || dim.status_tag === 'improving'
                            ? 'comparison-badge-lighter'
                            : dim.status_tag === 'challenging' || dim.status_tag === 'needs_nurturing'
                            ? 'comparison-badge-challenging'
                            : 'comparison-badge-evolving'
                          return (
                            <div className="comparison-dimension-card" key={key}>
                              <div className="comparison-dimension-header">
                                <h4>{icon} {dim.title || defaultTitle}</h4>
                                {dim.status_tag && (
                                  <span className={`comparison-badge ${tagClass}`}>
                                    {dim.status_tag.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="comparison-duo">
                                <div className="comparison-side">
                                  <span className="comparison-side-label">Previous Check-in</span>
                                  <p className="comparison-side-text">{dim.previous_state || 'Baseline observation recorded.'}</p>
                                </div>
                                <div className="comparison-side">
                                  <span className="comparison-side-label">Current Check-in</span>
                                  <p className="comparison-side-text">{dim.current_state || 'Current state captured.'}</p>
                                </div>
                              </div>
                              {dim.shift_description && (
                                <div className="comparison-insights-box">
                                  <b>Observed Shift:</b> {dim.shift_description}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Overall Progress Narrative */}
                    {comparisonData.comparison?.overall_progress_narrative && (
                      <div className="comparison-dimension-card" style={{ marginTop: '4px' }}>
                        <div className="comparison-dimension-header">
                          <h4><Compass size={16} /> Your Ongoing Wellness Narrative</h4>
                          <span className="soft-pill" style={{ fontSize: '11px' }}>Non-Diagnostic</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--text-main, #254148)' }}>
                          {comparisonData.comparison.overall_progress_narrative}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
  const [comprehensive, setComprehensive] = useState<ComprehensiveInsights | null>(null)
  const [chatStats, setChatStats] = useState<{ total_conversations: number; total_user_messages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      services.listMindLogs().then(async (logs) => {
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
      }),
      services.getComprehensiveInsights().then((comp) => {
        if (active) setComprehensive(comp)
      }),
      services.getChatStats().then((stats) => {
        if (active) setChatStats(stats)
      }),
    ])
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

  const EMOTION_COLORS: Record<string, string> = {
    joy: '#F59E0B',      // gold
    sadness: '#3B82F6',  // blue
    anger: '#EF4444',    // bright coral/red (visible in dark mode)
    fear: '#F97316',     // orange
    love: '#EC4899',     // pink
    surprise: '#8B5CF6', // purple
    neutral: '#64748B',  // slate grey
    peace: '#10B981',    // green
    hope: '#14B8A6',     // teal
  }

  const getEmotionColor = (emotion: string): string => {
    const k = (emotion || '').toLowerCase().trim()
    return EMOTION_COLORS[k] || '#538a84'
  }

  const rawDist = comprehensive?.emotion_distribution
    ? Object.entries(comprehensive.emotion_distribution).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value > 0)
    : (latest?.analysis.distribution
        ? Object.entries(latest.analysis.distribution).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
        : [])

  const totalDistValue = rawDist.reduce((acc, [, val]) => acc + val, 0) || 1
  const chartData = rawDist.map(([label, value], index) => {
    const emotionKey = label.toLowerCase().trim()
    const fill = getEmotionColor(emotionKey)
    const pct = Math.round((value / totalDistValue) * 100)
    return {
      key: `emotion_${emotionKey}_${index}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: Math.round(value * 100) / 100,
      percentage: pct,
      fill,
    }
  })
  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((item) => [item.key, { label: `${item.label} (${item.percentage}%)`, color: item.fill }])
  )
  const analyzedAt = comprehensive?.generated_at
    ? new Date(comprehensive.generated_at)
    : (latest?.analysis.analyzedAt ? new Date(latest.analysis.analyzedAt) : null)

  const sections = comprehensive?.sections as any
  const structuredList = [
    { title: 'Overall Emotional Patterns', data: sections?.emotional_overview || sections?.overall_patterns, icon: Waves },
    { title: 'Recent Mood Trends', data: sections?.mood_trends, icon: Activity },
    { title: 'Recurring Themes', data: sections?.recurring_themes, icon: Sparkles },
    { title: 'Possible Stressors', data: sections?.stressors, icon: CircleHelp },
    { title: 'Positive Patterns & Strengths', data: sections?.positive_patterns || sections?.strengths, icon: Heart },
    { title: 'Patterns Across Conversations', data: sections?.conversation_patterns, icon: MessageCircle },
    { title: 'MindLog Observations', data: sections?.mindlog_observations, icon: BookHeart },
    { title: 'Personal Context from Guided Intake', data: sections?.intake_context, icon: Sun },
    { title: 'Personal Strengths & Resilience', data: sections?.strengths, icon: ShieldCheck },
    { title: 'Progress Over Time', data: sections?.progress_over_time, icon: Clock3 },
  ].filter((item) => Boolean(item.data?.observed_data || item.data?.interpretation))

  const mindlogCount = comprehensive?.data_counts?.mindlog_count ?? entries.length
  const totalConversations = chatStats?.total_conversations ?? (comprehensive?.data_counts as any)?.conversation_count ?? (comprehensive?.data_counts as any)?.unique_conversations_count ?? 0
  const totalUserMessages = chatStats?.total_user_messages ?? (comprehensive?.data_counts as any)?.chat_messages_count ?? (comprehensive?.data_counts as any)?.total_user_messages_count ?? 0
  const intakeCount = (comprehensive?.data_counts as any)?.completed_intake_assessments ?? (comprehensive?.data_counts as any)?.intake_assessments_count ?? comprehensive?.data_counts?.intake_answers_count ?? 0

  return (
    <DashboardShell title="Mood insights" subtitle="Gentle reflections on your emotional patterns." active="/dashboard/insights">
      <div className="insights-wrap">
        <div className="insight-intro">
          <div>
            <span className="eyebrow">NOTICE, WITHOUT JUDGMENT</span>
            <h2>Your inner weather,<br /><em>over time.</em></h2>
            <p>Your emotional patterns are personal. These insights synthesize your journals, companion conversations, and guided reflections to help you notice and care for yourself.</p>
          </div>
          <div className="insight-cloud">
            <Sun size={38} />
            <Waves size={50} />
            <span>your pace,<br />your patterns</span>
          </div>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {loading && <p role="status">Loading your comprehensive reflections…</p>}

        <div className="insight-stats">
          <article>
            <span>MINDLOG ENTRIES</span>
            <b>{loading ? '…' : mindlogCount}</b>
            <small>{entries.length ? 'Saved journal reflections' : 'Journals recorded'}</small>
          </article>
          <article>
            <span>CONVERSATIONS</span>
            <b>{loading ? '…' : totalConversations}</b>
            <small>Authoritative sessions</small>
          </article>
          <article>
            <span>USER MESSAGES</span>
            <b>{loading ? '…' : totalUserMessages}</b>
            <small>Total messages sent</small>
          </article>
          <article>
            <span>PRIMARY EMOTION</span>
            <b>{comprehensive?.primary_emotion ?? latest?.analysis.primaryEmotion ?? '—'}</b>
            <small>Across recent reflections</small>
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
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="surface-card" style={{ padding: '8px 12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.fill }} />
                            <b style={{ fontSize: '12px' }}>{d.label}</b>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-subtle, #53727a)' }}>
                            Weight: {d.value} ({d.percentage}%)
                          </p>
                        </div>
                      )
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="chart-empty">
                <div className="chart-rings"><i /><i /><i /><span><Waves size={20} /></span></div>
                <b>{loading ? 'Gathering your analysis.' : 'Your landscape will take shape over time.'}</b>
                <p>As you write in MindLog or chat with SunnoBuddy, your emotional landscape will bloom here.</p>
              </div>
            )}
          </article>

          <article className="surface-card trend-card">
            <div className="card-title-row">
              <div>
                <span className="eyebrow">MULTI-SOURCE SYNTHESIS</span>
                <h3>Synthesis status</h3>
              </div>
              <span className="soft-pill">
                <Activity size={12} /> {comprehensive?.data_sufficiency === 'sufficient' ? 'Sufficient data' : comprehensive?.data_sufficiency === 'minimal' ? 'Minimal data' : 'Fresh start'}
              </span>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: '#53727a', lineHeight: 1.6 }}>
                SunnoBuddy aggregates your <b>MindLog entries</b>, user messages from <b>Companion conversations</b>, and <b>Guided Intake</b> responses to provide holistic reflections without clinical judgment.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
                <div className="synthesis-metric-box">
                  <span style={{ fontSize: '10px', display: 'block' }}>MindLogs</span>
                  <b style={{ fontSize: '16px' }}>{mindlogCount}</b>
                </div>
                <div className="synthesis-metric-box">
                  <span style={{ fontSize: '10px', display: 'block' }}>Conversations</span>
                  <b style={{ fontSize: '16px' }}>{totalConversations}</b>
                </div>
                <div className="synthesis-metric-box">
                  <span style={{ fontSize: '10px', display: 'block' }}>Intake</span>
                  <b style={{ fontSize: '16px' }}>{intakeCount}</b>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Structured Multi-Source Sections */}
        {structuredList.length > 0 && (
          <section style={{ marginTop: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="eyebrow">COMPREHENSIVE REFLECTIONS</span>
              <h3 style={{ font: '500 20px var(--serif)', margin: '4px 0 0' }}>Synthesized insights across your space</h3>
              <p style={{ fontSize: '12px', color: '#677e84', margin: '4px 0 0' }}>
                Facts observed from your journals, chats, and intake are gently distinguished from AI reflections.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {structuredList.map((item) => (
                <article key={item.title} className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <item.icon size={16} style={{ color: '#538a84' }} />
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{item.title}</h4>
                    </div>
                  </div>

                  {item.data?.observed_data && (
                    <div className="observed-data-card">
                      <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.8px', color: '#538a84', textTransform: 'uppercase' }}>
                        Observed Data
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5 }}>
                        {item.data.observed_data}
                      </p>
                    </div>
                  )}

                  {item.data?.interpretation && (
                    <div className="ai-reflection-card">
                      <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.8px', color: '#c29864', textTransform: 'uppercase' }}>
                        AI Reflection
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.5 }}>
                        {item.data.interpretation}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Suggestions for Self-Care */}
        {sections?.self_care_suggestions && sections.self_care_suggestions.length > 0 && (
          <section className="surface-card self-care-container" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} style={{ color: '#538a84' }} />
              <div>
                <span className="eyebrow" style={{ color: '#538a84' }}>GENTLE NOURISHMENT</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Suggestions for self-care</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sections.self_care_suggestions.map((suggestion: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#538a84', fontWeight: 'bold' }}>•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {analyzed.length > 0 && (
          <section className="insight-entry-list" style={{ marginTop: '24px' }}>
            <h3>Recent entry analyses</h3>
            {analyzed.map(({ entry, analysis }) => {
              const emotionColor = getEmotionColor(analysis.primaryEmotion)
              const displayTitle = entry.title?.trim() || 'Untitled Reflection'
              const dateStr = new Date(entry.date || entry.created_at).toLocaleDateString()
              return (
                <article className="insight-entry" key={entry.id}>
                  <div>
                    <b>{displayTitle}</b>
                    <small>{dateStr}</small>
                  </div>
                  <span
                    className="emotion-badge-pill"
                    style={{
                      backgroundColor: `${emotionColor}18`,
                      color: emotionColor,
                      border: `1px solid ${emotionColor}40`,
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: emotionColor }} />
                    {analysis.primaryEmotion}
                    {typeof analysis.confidence === 'number' ? ` · ${Math.round(analysis.confidence * 100)}%` : ''}
                  </span>
                  <Link href={`/dashboard/mindlog/${encodeURIComponent(entry.id)}`} aria-label={`Open ${displayTitle}`}>
                    <ArrowRight size={16} />
                  </Link>
                </article>
              )
            })}
          </section>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link href="/dashboard/mindlog" className="button button-primary">
            <BookHeart size={16} /> Open MindLog Calendar <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}

function Reports() {
  const [period, setPeriod] = useState('30d')
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [sources, setSources] = useState<string[]>(['mindlog', 'companion', 'intake', 'emotions'])
  const [generating, setGenerating] = useState(false)
  const [reportError, setReportError] = useState('')
  const [generatedSuccess, setGeneratedSuccess] = useState(false)
  const [pastReports, setPastReports] = useState<Array<any>>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const refreshHistory = async () => {
    try {
      setLoadingHistory(true)
      const list = await services.listReports()
      setPastReports(list || [])
    } catch (err) {
      console.warn('Could not list reports:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    void refreshHistory()
  }, [])

  const toggleSource = (sourceKey: string) => {
    setSources((prev) =>
      prev.includes(sourceKey) ? prev.filter((s) => s !== sourceKey) : [...prev, sourceKey]
    )
  }

  const handleDownload = async (reportId: string) => {
    try {
      const blob = await services.downloadReport(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sunnobuddy-wellness-report-${reportId}.pdf`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setReportError('Could not download the requested report.')
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      await services.deleteReport(reportId)
      setPastReports((prev) => prev.filter((r) => r.report_id !== reportId))
    } catch (err) {
      console.warn('Failed to delete report:', err)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    setReportError('')
    setGeneratedSuccess(false)
    try {
      const res = await services.generateWellnessReport({
        period,
        start_date: period === 'custom' ? customStart : undefined,
        end_date: period === 'custom' ? customEnd : undefined,
        sources,
      })
      const reportId = res?.report_id || res?.reportId
      if (reportId) {
        await handleDownload(reportId)
        setGeneratedSuccess(true)
        void refreshHistory()
      } else {
        throw new Error('Server generated report without returning report ID.')
      }
    } catch (cause) {
      setReportError(cause instanceof Error ? cause.message : 'The report could not be generated. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <DashboardShell title="Your reports" subtitle="A multi-source look back at your wellness journey." active="/dashboard/reports">
      <div className="reports-wrap">
        <div className="reports-intro">
          <span className="eyebrow">MULTI-SOURCE SYNTHESIS</span>
          <h2>Comprehensive<br /><em>Wellness Reports.</em></h2>
          <p>
            Synthesize your MindLog journals, Companion conversations, Guided Intake assessments, and emotion patterns into a private, beautifully formatted multi-page PDF.
          </p>
        </div>

        <section className="report-card">
          <div className="report-card-art">
            <div className="report-sun"><Sun size={31} /></div>
            <Waves size={62} />
            <span>comprehensive<br />reflection</span>
          </div>

          <div className="report-details">
            <span className="eyebrow">CONFIGURE REPORT</span>
            <h3>Wellness Summary Report</h3>
            <p>Analyze your progress across days, weeks, or custom dates with 22 structured wellness sections.</p>

            {/* Time Period Selector */}
            <label htmlFor="report-period" style={{ display: 'block', marginTop: '12px', fontWeight: 600, fontSize: '12px' }}>
              Select Time Period
            </label>
            <div className="select-wrap" style={{ marginTop: '4px' }}>
              <select
                id="report-period"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value)
                  setGeneratedSuccess(false)
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time (full journey)</option>
                <option value="custom">Custom date range…</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {/* Custom Date Pickers */}
            {period === 'custom' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#83979c', display: 'block' }}>Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #c8d6d5', fontSize: '12px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#83979c', display: 'block' }}>End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #c8d6d5', fontSize: '12px' }}
                  />
                </div>
              </div>
            )}

            {/* Source Selection Checkboxes */}
            <label style={{ display: 'block', marginTop: '16px', fontWeight: 600, fontSize: '12px' }}>
              Data Sources to Include
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
              {[
                { id: 'mindlog', label: 'MindLog Journals' },
                { id: 'companion', label: 'Companion Chats' },
                { id: 'intake', label: 'Guided Intake' },
                { id: 'emotions', label: 'Emotion Trends' },
              ].map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sources.includes(s.id)}
                    onChange={() => toggleSource(s.id)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>

            {reportError && <p className="auth-error" role="alert" style={{ marginTop: '12px' }}>{reportError}</p>}

            {generatedSuccess ? (
              <div className="report-empty-message" role="status" style={{ marginTop: '16px' }}>
                <Check size={16} />
                <span>Your multi-page PDF report was downloaded successfully.</span>
              </div>
            ) : (
              <button
                className="button button-primary generate-button"
                disabled={generating || sources.length === 0}
                onClick={() => void generateReport()}
                style={{ marginTop: '18px' }}
              >
                {generating ? 'Synthesizing wellness report…' : 'Generate & Download PDF'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>

        {/* Report History */}
        <section className="surface-card" style={{ marginTop: '24px', padding: '20px 24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span className="eyebrow">REPORT ARCHIVE</span>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Past Wellness Reports</h3>
            </div>
            <span style={{ fontSize: '11px', color: '#83979c' }}>{pastReports.length} generated</span>
          </div>

          {loadingHistory ? (
            <p style={{ fontSize: '12px', color: '#83979c' }}>Loading your report history…</p>
          ) : pastReports.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#83979c', margin: 0 }}>
              No reports generated yet. Click above to generate your first multi-source PDF report.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastReports.map((r) => (
                <div
                  key={r.report_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f9fcfb',
                    border: '1px solid #e5eded',
                    fontSize: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <b style={{ color: '#254148', display: 'block' }}>
                      Report · {r.period ? r.period.toUpperCase() : 'Wellness Period'}
                    </b>
                    <span style={{ fontSize: '11px', color: '#83979c' }}>
                      Created: {r.created_at ? new Date(r.created_at).toLocaleString() : 'Recent'}
                      {r.start_date && r.end_date ? ` (${r.start_date} to ${r.end_date})` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => void handleDownload(r.report_id)}
                      style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={12} />
                      <span>Download PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(r.report_id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a4b2b6', padding: '4px' }}
                      title="Delete report"
                      aria-label="Delete report"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="report-privacy" style={{ marginTop: '20px' }}>
          <ShieldCheck size={17} />
          <span>
            <b>Private & confidential by design.</b>
            <small>Your generated reports and journal data stay strictly in your personal account.</small>
          </span>
        </div>
      </div>
    </DashboardShell>
  )
}

function TherapistLocator() {
  const [locationQuery, setLocationQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [therapistsData, setTherapistsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchRadius, setSearchRadius] = useState<number>(15)

  const quickCities = ['Kolkata', 'Delhi NCR', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', '712248']

  const performSearch = async (params: { lat?: number; lon?: number; query?: string; radius_km?: number }) => {
    setLoading(true)
    setHasSearched(true)
    const effRadius = params.radius_km || searchRadius || 15
    try {
      const res = await services.searchTherapists({ ...params, radius_km: effRadius })
      const normalizedClinics = res?.therapists || res?.providers || []
      const actualRadius = res?.radius_km || effRadius
      setSearchRadius(actualRadius)
      setTherapistsData({ ...res, therapists: normalizedClinics })
      const locName = res?.location || params.query || (params.lat ? `${params.lat.toFixed(2)}, ${params.lon?.toFixed(2)}` : 'your location')
      setActiveQuery(locName)
      if (normalizedClinics.length > 0) {
        setLocationStatus(`Found ${normalizedClinics.length} verified mental health clinics and providers within ${actualRadius} km of ${locName}.`)
      } else {
        setLocationStatus(`No local OpenStreetMap clinic nodes found within ${actualRadius} km of ${locName}. You can expand your search to 25 km or search on Google Maps.`)
      }
    } catch (err) {
      console.warn('Therapist search error:', err)
      setLocationStatus('Could not complete search right now. Showing verified national directories.')
    } finally {
      setLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location access is not available in this browser. You can enter any city or PIN code above.')
      return
    }
    setLocationStatus('Accessing your current location coordinates…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        void performSearch({ lat, lon, radius_km: searchRadius })
      },
      (err) => {
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              void performSearch({ lat: pos.coords.latitude, lon: pos.coords.longitude, radius_km: searchRadius })
            },
            () => {
              setLocationStatus('Location request timed out. Please enter your city or PIN code above.')
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
          )
          return
        }
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location permission was denied. You can select any city chip below or search by PIN code.')
        } else {
          setLocationStatus('Could not read location coordinates. Please search by city or PIN code above.')
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const place = locationQuery.trim()
    if (!place) return
    setActiveQuery(place)
    void performSearch({ query: place, radius_km: searchRadius })
  }

  const handleQuickSearch = (place: string) => {
    setLocationQuery(place)
    setActiveQuery(place)
    void performSearch({ query: place, radius_km: searchRadius })
  }

  const mapEmbedUrl = activeQuery
    ? `https://maps.google.com/maps?q=therapists+mental+health+near+${encodeURIComponent(activeQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
    : ''

  const verifiedHelplines = [
    {
      name: 'Tele-MANAS (Govt. of India)',
      role: 'National Tele Mental Health Programme',
      helpline: '14416 / 1800-891-4416',
      hours: '24/7 Toll-Free Support',
      url: 'https://telemanas.mohfw.gov.in',
    },
    {
      name: 'KIRAN Mental Health Helpline',
      role: 'Ministry of Social Justice & Empowerment',
      helpline: '1800-599-0019',
      hours: '24/7 Multi-language Assistance',
      url: 'https://www.mentalhealthindia.org',
    },
    {
      name: 'Vandrevala Foundation',
      role: 'Free 24/7 Professional Counseling Support',
      helpline: '+91 9999 666 555',
      hours: '24/7 Whatsapp & Calling Available',
      url: 'https://www.vandrevalafoundation.com',
    },
    {
      name: 'NIMHANS Helpline',
      role: 'National Institute of Mental Health & Neurosciences',
      helpline: '080-46110007',
      hours: 'Professional clinical guidance',
      url: 'https://nimhans.ac.in',
    },
  ]

  return (
    <DashboardShell title="Find a therapist" subtitle="Explore professional support near you." active="/dashboard/therapists">
      <div className="therapist-locator">
        <section className="therapist-intro">
          <span className="eyebrow">SUPPORT BEYOND THIS SPACE</span>
          <h2>Find care that feels<br /><em>right for you.</em></h2>
          <p>Search licensed mental health professionals, counseling spaces, and verified 24/7 helplines.</p>
        </section>

        <form className="therapist-search-card" onSubmit={handleSearch}>
          <label htmlFor="therapist-location">City, ZIP code, or neighborhood</label>
          <div className="therapist-search-row">
            <input
              id="therapist-location"
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="e.g. New Delhi, Mumbai, Bengaluru, Pune, 712248..."
              autoComplete="postal-code"
            />
            <button type="button" className="button button-outline location-button" onClick={useCurrentLocation} disabled={loading}>
              <MapPin aria-hidden="true" size={15} /> <span>{loading ? 'Locating…' : 'Use my location'}</span>
            </button>
          </div>

          {/* Quick Popular City Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle, #53727a)', fontWeight: 600 }}>POPULAR:</span>
            {quickCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleQuickSearch(c)}
                disabled={loading}
                style={{
                  background: activeQuery.includes(c) ? 'rgba(83,138,132,0.18)' : 'rgba(83,138,132,0.08)',
                  border: '1px solid rgba(83,138,132,0.25)',
                  borderRadius: '9999px',
                  padding: '2px 9px',
                  fontSize: '11px',
                  color: 'var(--text-main, #254148)',
                  cursor: 'pointer',
                  fontWeight: activeQuery.includes(c) ? 600 : 500,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search Radius Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle, #53727a)', fontWeight: 600 }}>SEARCH RADIUS:</span>
            {[5, 15, 25].map((rad) => (
              <button
                key={rad}
                type="button"
                onClick={() => {
                  setSearchRadius(rad)
                  if (activeQuery) {
                    void performSearch({ query: activeQuery, radius_km: rad })
                  }
                }}
                disabled={loading}
                style={{
                  background: searchRadius === rad ? '#538a84' : 'rgba(83,138,132,0.1)',
                  color: searchRadius === rad ? '#ffffff' : 'var(--text-main, #254148)',
                  border: '1px solid rgba(83,138,132,0.3)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {rad} km
              </button>
            ))}
          </div>

          <button type="submit" className="button button-primary therapist-submit" disabled={loading || !locationQuery.trim()} style={{ marginTop: '12px' }}>
            {loading ? 'Searching providers…' : 'Search nearby practices'} <ArrowRight aria-hidden="true" size={15} />
          </button>
          <p className="location-status" role="status" aria-live="polite">
            {locationStatus || (hasSearched ? `Showing therapists near ${activeQuery}.` : 'Search any city, PIN code, or use your location to discover nearby care.')}
          </p>
        </form>

        {!hasSearched ? (
          <div className="surface-card" style={{ padding: '36px 24px', textAlign: 'center', marginTop: '20px', borderRadius: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(83,138,132,0.12)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', color: '#538a84' }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main, #254148)', margin: '0 0 8px' }}>
              Find mental health support near you
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-subtle, #53727a)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              Enter your city, neighborhood, or postal code above, or click &ldquo;Use my location&rdquo; to discover verified mental health clinics, counselors, and support services.
            </p>
          </div>
        ) : (
          <>
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

            {/* Real Verified Clinics & Providers */}
            <section className="therapist-clinics-list">
              <div className="clinics-list-header">
                <span className="eyebrow">VERIFIED CARE PROVIDERS</span>
                <h3>Nearby practices & mental health centers</h3>
              </div>

              {loading ? (
                <p style={{ fontSize: '13px', color: '#83979c', padding: '16px 0' }}>Querying real providers and clinics near your location…</p>
              ) : therapistsData?.therapists?.length > 0 ? (
                <div className="clinics-grid">
                  {therapistsData.therapists.map((clinic: any) => {
                    const typeClass =
                      clinic.type === 'Psychologist'
                        ? 'clinic-type-psychologist'
                        : clinic.type === 'Psychiatrist'
                        ? 'clinic-type-psychiatrist'
                        : clinic.type === 'Counselling Centre'
                        ? 'clinic-type-counselling'
                        : clinic.type === 'Hospital'
                        ? 'clinic-type-hospital'
                        : 'clinic-type-clinic'

                    return (
                      <article className="surface-card clinic-card" key={clinic.id || clinic.name}>
                        <div className="clinic-badge-row">
                          <span className={`clinic-type-badge ${typeClass}`}>{clinic.type || 'Verified Practice'}</span>
                          {clinic.distance_km !== undefined && (
                            <span className="clinic-distance">{clinic.distance_km} km away</span>
                          )}
                        </div>
                        <h4>{clinic.name}</h4>
                        <p className="clinic-specialty">{clinic.specialty || clinic.type || 'Mental Health & Psychological Support'}</p>
                        <div className="clinic-meta">
                          <span className="clinic-address"><MapPin size={12} /> {clinic.address}</span>
                          {clinic.phone && <span className="clinic-phone">📞 {clinic.phone}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {clinic.actions?.directions_url && (
                            <a
                              href={clinic.actions.directions_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button button-outline"
                              style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <Navigation size={12} /> Directions
                            </a>
                          )}
                          {clinic.phone && (
                            <a
                              href={`tel:${clinic.phone}`}
                              className="button button-primary"
                              style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <Phone size={12} /> Call clinic
                            </a>
                          )}
                          {clinic.website && (
                            <a
                              href={clinic.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button button-quiet"
                              style={{ fontSize: '11px', padding: '4px 10px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <ExternalLink size={12} /> Website
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="surface-card" style={{ padding: '24px 20px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-subtle, #53727a)', lineHeight: 1.6 }}>
                    No registered OpenStreetMap clinic nodes found directly within {searchRadius} km of <b>{activeQuery}</b>.
                    You can expand your search radius to 25 km, explore on Google Maps, or reach out to the verified 24/7 helplines below.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                    {searchRadius < 25 && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => void performSearch({ query: activeQuery, radius_km: 25 })}
                        style={{ fontSize: '12px' }}
                      >
                        Expand radius to 25 km
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/psychologists+and+mental+health+therapists+near+${encodeURIComponent(activeQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '12px' }}
                    >
                      Search "{activeQuery}" on Google Maps <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* 24/7 Verified National Helplines & Directories */}
        <section style={{ marginTop: '28px' }}>
          <div className="clinics-list-header">
            <span className="eyebrow">ALWAYS AVAILABLE · CRISIS & DIRECTORIES</span>
            <h3>Verified National Mental Health Directories & 24/7 Helplines</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '12px' }}>
            {verifiedHelplines.map((h) => (
              <article key={h.name} className="surface-card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <b style={{ fontSize: '14px', color: '#254148', display: 'block' }}>{h.name}</b>
                  <span style={{ fontSize: '12px', color: '#53727a', display: 'block', marginTop: '2px' }}>{h.role}</span>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} style={{ color: '#538a84' }} />
                    <b style={{ fontSize: '13px', color: '#538a84' }}>{h.helpline}</b>
                  </div>
                  <small style={{ fontSize: '11px', color: '#83979c', display: 'block', marginTop: '2px' }}>{h.hours}</small>
                </div>
                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <a
                    href={`tel:${h.helpline.split('/')[0].trim()}`}
                    className="button button-primary"
                    style={{ fontSize: '11px', padding: '5px 10px', height: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Phone size={12} /> Call now
                  </a>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-outline"
                    style={{ fontSize: '11px', padding: '5px 10px', height: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={12} /> Directory
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}

function SettingsPage() {
  const { user, linkGoogleAccount, logOut } = useAuth()
  const router = useRouter()
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

        <section className="setting-row">
          <div>
            <b>Session & account access</b>
            <p>Safely end your session and sign out of SunnoBuddy on this browser.</p>
          </div>
          <div className="setting-control">
            <button
              type="button"
              className="button button-outline"
              onClick={async () => {
                await logOut()
                router.replace('/login')
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#c05252', borderColor: '#e6c8c8', cursor: 'pointer' }}
            >
              <LogOut size={14} />
              <span>{t('nav_signout')}</span>
            </button>
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
