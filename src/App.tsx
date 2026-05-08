import React from 'react';
import { 
  Heart, 
  BookOpen, 
  ListOrdered, 
  Sparkles, 
  Printer, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2,
  Menu,
  X,
  Users,
  Mic,
  MicOff,
  Edit2,
  Eye,
  EyeOff,
  Rainbow
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';

// --- Types & Constants ---

interface VowData {
  partner1Name: string;
  partner2Name: string;
  vows: string;
}

interface Reading {
  id: string;
  title: string;
  author: string;
  content: string;
  category: 'Secular' | 'LGBTQ+' | 'Mixed Family' | 'Nature' | 'Poetry';
}

interface CeremonyStep {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'processional' | 'welcome' | 'readings' | 'vows' | 'rings' | 'proclamation' | 'recessional' | 'other';
}

const DEFAULT_READINGS: Reading[] = [
  {
    id: '1',
    title: 'Union',
    author: 'Robert Fulghum',
    category: 'Secular',
    content: "You have known each other from the first glance of acquaintance to this day of commitment. At some point, you decided that you were a much more powerful team than the two from which you came. Today, you are celebrating that power of union."
  },
  {
    id: '2',
    title: 'Excerpt from Goodridge v. Dept. of Public Health',
    author: 'Chief Justice Margaret Marshall',
    category: 'LGBTQ+',
    content: "Marriage is a vital social institution. The decision whether and whom to marry is among life's momentous acts of self-definition. Because it fulfils yearnings for security, safe haven, and connexion that express our common humanity, civil marriage is an esteemed institution, and the decision whether and whom to marry is among life's momentous acts of self-definition."
  },
  {
    id: '3',
    title: 'The Blending of Families',
    author: 'Anonymous',
    category: 'Mixed Family',
    content: "Today we don't just celebrate a union between two people, but the coming together of a family. Love is not a finite resource; it expands with every new heart that joins the circle. We acknowledge the children and family members who make this life complete."
  },
  {
    id: '4',
    title: 'On Friendship and Marriage',
    author: 'Kahlil Gibran (Adapted)',
    category: 'Secular',
    content: "Love one another, but make not a bond of love: Let it rather be a moving sea between the shores of your souls. Fill each other's cup but drink not from one cup. Give one another of your bread but eat not from the same loaf. Sing and dance together and be joyous, but let each one of you be alone, even as the strings of a lute are alone though they quiver with the same music."
  },
  {
    id: '5',
    title: 'A Queer Kind of Love',
    author: 'Anonymous',
    category: 'LGBTQ+',
    content: "Our love is a quiet revolution. It is built on the courage to be exactly who we are. In a world that often asks for masks, we choose to stand bare before one another, pledging not just our fidelity, but our radical honesty and our shared future."
  },
  {
    id: '6',
    title: 'Love Is Love',
    author: 'Lin-Manuel Miranda',
    category: 'LGBTQ+',
    content: "We rise and fall and light from dying embers, remembrances that hope and love last longer. And love is love is love is love is love is love is love is love, cannot be killed or swept aside."
  },
  {
    id: '7',
    title: 'Authentic Connection',
    author: 'Anonymous',
    category: 'LGBTQ+',
    content: "We stand outside the lines drawn by tradition, creating a geometry of love that is entirely our own. Our marriage is not a surrender to expectation, but a celebration of the truth we found in each other's eyes."
  },
  {
    id: '8',
    title: 'Everything I Know About Love',
    author: 'Dolly Alderton',
    category: 'Secular',
    content: "You will realize that a life of shared domesticity is a series of tiny adjustments. It's the decision to stay, day after day, through the washing up and the bills, because the person beside you makes the world more bearable."
  },
  {
    id: '9',
    title: 'The Invitation',
    author: 'Oriah Mountain Dreamer',
    category: 'Secular',
    content: "It doesn't interest me what you do for a living. I want to know what you ache for and if you dare to dream of meeting your heart’s longing. I want to know if you can sit with pain, mine or your own, without moving to hide it, or fade it, or fix it."
  },
  {
    id: '10',
    title: 'The Bonus Parent Promise',
    author: 'Anonymous',
    category: 'Mixed Family',
    content: "I did not give you the gift of life, but life gave me the gift of you. Today I promise to be a soft place for you to land, a steady hand to hold, and a heart that loves you as my own."
  },
  {
    id: '11',
    title: 'Two Houses, One Heart',
    author: 'Anonymous',
    category: 'Mixed Family',
    content: "We are not losing an old life, we are expanding into a new one. This family is not defined by blood, but by the shared meals, the bedtime stories, and the choice to show up for each other every single day."
  },
  {
    id: '12',
    title: 'The Architecture of Choice',
    author: 'Anonymous',
    category: 'Mixed Family',
    content: "Some families are born, others are engineered with intention. We are building a home where everyone has a seat at the table, where history is honored but the future is wide open for us to write together."
  },
  {
    id: '13',
    title: 'The Wisdom of Trees',
    author: 'Inspired by Peter Wohlleben',
    category: 'Nature',
    content: "Like trees in an ancient forest, our roots are now entwined. We will share our nutrients, our strength, and our stability. When the winds of life blow hard, we will lean into one another, standing taller together than we ever could alone."
  },
  {
    id: '14',
    title: 'The River Journey',
    author: 'Paulo Coelho',
    category: 'Nature',
    content: "A river never returns to its source. Life is a flow, a constant movement toward the great ocean of the unknown. We are two streams joining together, our currents merging into a single powerful force, carving a new path through the landscape of time."
  },
  {
    id: '15',
    title: 'The Shoreline',
    author: 'Anonymous',
    category: 'Nature',
    content: "You are the shore and I am the sea. We meet at the edge of everything, in a constant rhythmic dance of giving and receiving. We are two different elements that create a beautiful horizon when we touch."
  },
  {
    id: '16',
    title: 'Seasons of Love',
    author: 'Anonymous',
    category: 'Nature',
    content: "Our love will have its winters of reflection, its springs of growth, its summers of abundance, and its autumns of harvest. We promise to cherish every season, knowing that each one is necessary for the garden of our life to thrive."
  },
  {
    id: '17',
    title: 'I Carry Your Heart With Me',
    author: 'E.E. Cummings',
    category: 'Poetry',
    content: "i carry your heart with me(i carry it in my heart)i am never without it(anywhere i go you go,my dear;and whatever is done by only me is your doing,my darling) i fear no fate(for you are my fate,my sweet)i want no world(for true you are my world,my true)"
  },
  {
    id: '18',
    title: 'Sonnet 18 (Inclusive Adaptation)',
    author: 'William Shakespeare',
    category: 'Poetry',
    content: "Shall I compare thee to a summer’s day? Thou art more lovely and more temperate. Rough winds do shake the darling buds of May, And summer's lease hath all too short a date. But thy eternal summer shall not fade, Nor lose possession of that fair thou ow’st; Nor shall death brag thou wander’st in his shade, When in eternal lines to time thou grow’st."
  },
  {
    id: '19',
    title: 'The Guest House',
    author: 'Rumi',
    category: 'Poetry',
    content: "This being human is a guest house. Every morning a new arrival. A joy, a depression, a meanness, some momentary awareness comes as an unexpected visitor. Welcome and entertain them all! The dark thought, the shame, the malice, meet them at the door laughing, and invite them in."
  },
  {
    id: '20',
    title: 'Instructions on Not Giving Up',
    author: 'Ada Limón',
    category: 'Poetry',
    content: "More than the fuchsia funnels of the cosmos, more than the heavy-headed hibiscus, it’s the fine, bare branches of the crabapple tree that first bloom in spring. It's the persistence of life, the messy, green, glorious work of continuing."
  }
];

const INITIAL_STEPS: CeremonyStep[] = [
  { id: 'p1', title: 'Processional', description: 'Entrance of the wedding party and couple.', content: '', type: 'processional' },
  { id: 'w1', title: 'Welcome', description: 'Greeting guests and setting the tone.', content: 'Welcome friends and family to this celebration of love...', type: 'welcome' },
  { id: 'r1', title: 'Readings', description: 'Selected poems or texts.', content: '', type: 'readings' },
  { id: 'fm1', title: 'Family Promises', description: 'Acknowledging children or extended family.', content: 'We promise to support and love the children of this family...', type: 'other' },
  { id: 'v1', title: 'Vows', description: 'The exchange of promises.', content: '', type: 'vows' },
  { id: 'rg1', title: 'Ring Exchange', description: 'Giving and receiving of rings.', content: 'With this ring, I thee wed...', type: 'rings' },
  { id: 'pr1', title: 'Proclamation', description: 'The official announcement.', content: 'By the power of your love, I now pronounce you...', type: 'proclamation' },
];

const VOW_PROMPTS = [
  "What was the moment you knew they were 'the one'?",
  "What is a small, everyday thing they do that makes you smile?",
  "What is a promise you want to keep even when things are hard?",
  "How have they changed you for the better?",
  "What do you look forward to most in your shared future?"
];

const VOW_TEMPLATES = [
  {
    tone: 'Heartfelt',
    content: "I promise to be your partner in all things, to walk beside you through the quiet moments and the loud ones. I choose you today, and I will choose you every day after, with all that I am and all that I will become."
  },
  {
    tone: 'Humorous',
    content: "I promise to love you even when you're hangry, to always let you have the last bite of dessert, and to never spoil the ending of the show we're binge-watching. Most importantly, I promise to be your biggest fan and your best friend, forever."
  },
  {
    tone: 'Brief',
    content: "Today, I pledge my life to yours. I promise to support you, to honor you, and to love you without reservation, through all the seasons of our lives together."
  },
  {
    tone: 'Inclusive',
    content: "In you, I have found my chosen family. I promise to build a home with you that is filled with radical honesty, deep respect, and a love that celebrates exactly who we are, individually and together."
  }
];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-editorial-ink text-editorial-cream hover:bg-black',
    secondary: 'bg-editorial-beige text-editorial-ink border border-editorial-ink/10 hover:bg-editorial-accent hover:text-white',
    ghost: 'bg-transparent text-editorial-ink border border-editorial-ink/20 hover:bg-editorial-ink hover:text-white',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 transition-all flex items-center justify-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function UnionWeddingKit() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [partner1Vows, setPartner1Vows] = React.useState('');
  const [partner2Vows, setPartner2Vows] = React.useState('');
  const [brainstormNotes1, setBrainstormNotes1] = React.useState('');
  const [brainstormNotes2, setBrainstormNotes2] = React.useState('');
  const [ceremonySteps, setCeremonySteps] = React.useState<CeremonyStep[]>(INITIAL_STEPS);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isListening, setIsListening] = React.useState<{ partner: 1 | 2 | null }>({ partner: null });
  const [readingFilter, setReadingFilter] = React.useState<Reading['category'] | 'All'>('All');
  const [aiSuggestions, setAiSuggestions] = React.useState<{ partner: 1 | 2; options: string[] } | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = React.useState(false);
  const [revealedPartner, setRevealedPartner] = React.useState<1 | 2 | null>(null);
  const [isPerformanceMode, setIsPerformanceMode] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'welcome' | 'brainstorm' | 'vows' | 'readings' | 'flow' | 'export' | 'merchant'>('welcome');

  const OWNER_EMAIL = 'andrea.donald.1@gmail.com';

  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Auth setup
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Validation connection
  React.useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Load user data
  React.useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const docRef = doc(db, 'ceremonies', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.partner1Vows !== undefined) setPartner1Vows(data.partner1Vows);
          if (data.partner2Vows !== undefined) setPartner2Vows(data.partner2Vows);
          if (data.brainstormNotes1 !== undefined) setBrainstormNotes1(data.brainstormNotes1);
          if (data.brainstormNotes2 !== undefined) setBrainstormNotes2(data.brainstormNotes2);
          if (data.ceremonySteps !== undefined) setCeremonySteps(data.ceremonySteps);
        }
      } catch (error) {
        console.error("Error loading ceremony data:", error);
      }
    };

    loadData();
  }, [user]);

  // Auto-save logic (debounced)
  React.useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, 'ceremonies', user.uid);
        await setDoc(docRef, {
          userId: user.uid,
          partner1Vows,
          partner2Vows,
          brainstormNotes1,
          brainstormNotes2,
          ceremonySteps,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error saving ceremony data:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(saveData, 2000);
    return () => clearTimeout(timeoutId);
  }, [user, partner1Vows, partner2Vows, brainstormNotes1, brainstormNotes2, ceremonySteps]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const roadmapItems = [
    { label: 'Foundations', tab: 'welcome', check: () => activeTab !== 'welcome' },
    { label: 'Brainstorming', tab: 'brainstorm', check: () => brainstormNotes1.length > 20 || brainstormNotes2.length > 20 },
    { label: 'Declarations', tab: 'vows', check: () => partner1Vows.length > 50 && partner2Vows.length > 50 },
    { label: 'Readings', tab: 'readings', check: () => ceremonySteps.find(s=>s.type === 'readings')?.content.length ?? 0 > 10 },
    { label: 'Sequence', tab: 'flow', check: () => ceremonySteps.length > 5 },
    { label: 'Finalize', tab: 'export', check: () => activeTab === 'export' },
  ];

  const completionPercent = Math.round((roadmapItems.filter(i => i.check()).length / roadmapItems.length) * 100);

  // Speech Recognition Setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
  }

  const toggleListening = (partner: 1 | 2) => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening.partner === partner) {
      recognition.stop();
      setIsListening({ partner: null });
    } else {
      if (isListening.partner !== null) recognition.stop();
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (partner === 1) setBrainstormNotes1(prev => prev + ' ' + transcript);
        else setBrainstormNotes2(prev => prev + ' ' + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        recognition.stop();
        setIsListening({ partner: null });
      };

      recognition.start();
      setIsListening({ partner });
    }
  };
  
  // AIS specific: Gemini SDK
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleAiHelp = async (partner: 1 | 2) => {
    setIsGenerating(true);
    setAiSuggestions(null); // Clear previous suggestions
    try {
      const currentVows = partner === 1 ? partner1Vows : partner2Vows;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a secular, inclusive, and poetic wedding officiant. Help me refine these wedding vows. 
        Provide exactly three distinct alternative phrasing options. 
        Option 1 should be a polished version of what's already there. 
        Option 2 should be more poetic and rhythmic. 
        Option 3 should be more modern and conversational.
        Format your response as three distinct sections separated by the delimiter "---SECTION---". 
        Do not include any other text. 
        ${currentVows ? `Current text: "${currentVows}"` : "If the text is empty, provide 3 short, modern, secular vow examples following the same formats."}`,
      });
      
      const text = response.text || "";
      const options = text.split("---SECTION---").map(opt => opt.trim()).filter(Boolean);
      
      if (options.length > 0) {
        setAiSuggestions({ partner, options });
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addStep = () => {
    const newStep: CeremonyStep = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Section',
      description: 'Add your custom content here.',
      content: '',
      type: 'other'
    };
    setCeremonySteps([...ceremonySteps, newStep]);
  };

  const removeStep = (id: string) => {
    setCeremonySteps(ceremonySteps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<CeremonyStep>) => {
    setCeremonySteps(ceremonySteps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
  const getReadTime = (text: string) => Math.ceil(getWordCount(text) / 130); // ~130 words per minute for speech

  return (
    <div className="min-h-screen bg-editorial-cream text-editorial-ink font-serif selection:bg-editorial-ink/10 flex flex-col">
      {/* Progress Roadmap (Phase 4) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-editorial-ink/5 z-[60]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          className="h-full bg-editorial-accent shadow-[0_0_10px_rgba(196,158,103,0.5)]"
        />
      </div>

      {/* Editorial Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-editorial-cream/95 backdrop-blur-sm border-b border-editorial-ink/10 px-6 md:px-10 flex items-center justify-between z-50 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-editorial-ink p-2 -ml-2"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="hidden md:flex gap-2 text-[10px] uppercase tracking-[0.2em] font-sans font-black">
          {(['brainstorm', 'vows', 'readings', 'flow', 'export', 'merchant'] as const).filter(t => t !== 'merchant' || user?.email === OWNER_EMAIL).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 transition-all px-4 py-2 rounded-sm cursor-pointer whitespace-nowrap ${activeTab === tab 
                ? 'bg-editorial-ink text-editorial-cream' 
                : 'text-stone-900 hover:bg-editorial-ink/10 hover:text-editorial-ink'}`}
            >
              {tab === 'brainstorm' && <Sparkles size={12} />}
              {tab === 'vows' && <Heart size={12} />}
              {tab === 'readings' && <BookOpen size={12} />}
              {tab === 'flow' && <ListOrdered size={12} />}
              {tab === 'export' && <Printer size={12} />}
              {tab === 'merchant' && <Rainbow size={12} className="text-editorial-accent" />}
              {tab === 'flow' ? 'Ceremony Flow' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           {user && (
             <div className="hidden sm:flex items-center gap-2 text-[8px] uppercase font-sans font-black tracking-widest text-editorial-accent">
               <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-editorial-accent animate-pulse' : 'bg-green-500'}`} />
               {isSaving ? 'Saving' : 'Synced'}
             </div>
           )}
           {user ? (
             <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                   <span className="text-[9px] font-sans font-black uppercase tracking-widest whitespace-nowrap">{user.displayName}</span>
                   <button onClick={handleLogout} className="text-[8px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer">Sign Out</button>
                </div>
                {user.photoURL && <img src={user.photoURL} className="w-8 h-8 rounded-full border border-editorial-ink/10" alt="" referrerPolicy="no-referrer" />}
             </div>
           ) : (
             <Button onClick={handleLogin} variant="secondary" className="h-10 px-4 text-[10px]">Sign In</Button>
           )}
           {activeTab !== 'export' && (
             <Button variant="primary" onClick={() => setActiveTab('export')} className="h-10 px-4 sm:px-8">
               Finalize
             </Button>
           )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-20 bg-editorial-cream z-40 p-10 flex flex-col gap-8 md:hidden"
          >
            {(['brainstorm', 'vows', 'readings', 'flow', 'export', 'merchant'] as const).filter(t => t !== 'merchant' || user?.email === OWNER_EMAIL).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
                className={`text-2xl italic font-serif text-left pb-4 border-b border-editorial-ink/5 flex items-center justify-between ${activeTab === tab ? 'text-editorial-accent italic' : 'text-editorial-ink'}`}
              >
                <span>{tab === 'flow' ? 'Ceremony Flow' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                <span className="opacity-40">
                  {tab === 'brainstorm' && <Sparkles size={18} />}
                  {tab === 'vows' && <Heart size={18} />}
                  {tab === 'readings' && <BookOpen size={18} />}
                  {tab === 'flow' && <ListOrdered size={18} />}
                  {tab === 'export' && <Printer size={18} />}
                  {tab === 'merchant' && <Rainbow size={18} />}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 pt-20 h-screen overflow-hidden print:block print:h-auto print:overflow-visible print:pt-0">
        {/* Left Aside: Prompts & Info */}
        <aside className="hidden lg:flex col-span-3 border-r border-editorial-ink/10 p-10 flex-col gap-10 overflow-y-auto custom-scrollbar print:hidden">
          {activeTab !== 'welcome' && (
            <section>
              <h3 className="font-sans text-[13px] uppercase tracking-widest font-black mb-8 text-editorial-accent">Reflection Prompts</h3>
              <ul className="space-y-10">
                {VOW_PROMPTS.map((prompt, i) => (
                  <li key={i} className="group cursor-pointer">
                    <p className="text-base leading-relaxed mb-2 italic text-editorial-ink/80 group-hover:text-editorial-ink transition-colors">"{prompt}"</p>
                    <button 
                      onClick={() => {
                        const addition = `Prompt Reflection: ${prompt}\n\n`;
                        setPartner1Vows(prev => prev + addition);
                      }}
                      className="text-[10px] font-sans font-bold uppercase tracking-widest text-editorial-ink/30 group-hover:text-editorial-accent transition-all"
                    >
                      Add to partner one +
                    </button>
                    <div className="mt-1">
                      <button 
                        onClick={() => {
                          const addition = `Prompt Reflection: ${prompt}\n\n`;
                          setPartner2Vows(prev => prev + addition);
                        }}
                        className="text-[10px] font-sans font-bold uppercase tracking-widest text-editorial-ink/30 group-hover:text-editorial-accent transition-all"
                      >
                        Add to partner two +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-auto">
            <div className="p-8 bg-editorial-highlight border border-editorial-ink/5">
              <p className="text-[13px] font-sans leading-relaxed tracking-tight">
                <span className="font-black uppercase block mb-2 text-editorial-ink">Inclusivity Mandate</span>
                This kit is gender-blind and honors chosen kin, non-traditional bonds, and the diverse ethics of human partnership.
              </p>
            </div>
          </section>
        </aside>

        {/* Center Canvas: Active View */}
        <section className="col-span-1 md:col-span-12 lg:col-span-6 bg-editorial-paper p-6 md:p-12 overflow-y-auto relative custom-scrollbar print:p-0 print:overflow-visible print:block print:w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'welcome' && (
              <motion.div key="welcome-editorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full flex flex-col justify-center text-center space-y-16 py-20 px-6">
                <div className="space-y-4">
                  <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-editorial-accent">The Ceremony Design Tool</span>
                  <h2 className="text-5xl sm:text-7xl md:text-9xl serif italic leading-[0.9] text-editorial-ink">Union</h2>
                </div>
                
                <div className="max-w-xl mx-auto space-y-12">
                  <div className="h-[1px] w-24 bg-editorial-accent mx-auto"></div>
                  <p className="text-xl md:text-3xl leading-relaxed text-editorial-ink/60 italic font-light">
                    A distinctive, AI-assisted toolkit for <br className="hidden md:block"/> drafting the promises that define your partnership.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                    <div className="space-y-2">
                       <p className="text-[10px] font-sans font-black uppercase tracking-widest">Inclusive</p>
                       <div className="h-px bg-editorial-ink/20"></div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-sans font-black uppercase tracking-widest">Secular</p>
                       <div className="h-px bg-editorial-ink/20"></div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-sans font-black uppercase tracking-widest">Collaborative</p>
                       <div className="h-px bg-editorial-ink/20"></div>
                    </div>
                  </div>

                  <Button onClick={() => setActiveTab('brainstorm')} variant="primary" className="mx-auto h-16 px-16 text-sm uppercase tracking-[0.2em] font-sans font-black shadow-2xl hover:translate-y-[-2px] transition-transform">
                    Initialize Workshop
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'brainstorm' && (
              <motion.div key="brainstorm-editorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                <div className="border-b border-editorial-ink/10 pb-6 mb-10 flex justify-between items-end">
                  <h2 className="text-4xl font-light italic">Brainstorming Workshop</h2>
                  <span className="text-[10px] font-sans font-black tracking-widest uppercase text-editorial-accent">Phase 01</span>
                </div>

                <div className="bg-editorial-beige/20 p-8 border border-editorial-ink/5 mb-10">
                  <h3 className="font-sans text-[11px] font-black uppercase tracking-widest mb-4">How to use this space</h3>
                  <p className="text-base italic leading-relaxed text-editorial-ink/70">
                    Use this section to dump raw thoughts, feelings, and memories. Speak freely using the microphone or type without filtering. These notes are your private "messy desk"—you can pull the best parts into your final declarations later.
                  </p>
                </div>

                {/* Partner 1 Brainstorm */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans text-[13px] font-black uppercase tracking-widest">Partner One Ideas</h3>
                    <div className="flex gap-2">
                       <Button 
                         variant={isListening.partner === 1 ? 'danger' : 'ghost'} 
                         onClick={() => toggleListening(1)} 
                         className="h-8 px-4"
                       >
                         {isListening.partner === 1 ? <MicOff size={12}/> : <Mic size={12}/>}
                         {isListening.partner === 1 ? 'Stop Recording' : 'Voice to Text'}
                       </Button>
                    </div>
                  </div>
                  <textarea 
                    value={brainstormNotes1}
                    onChange={(e) => setBrainstormNotes1(e.target.value)}
                    placeholder="Capture your raw thoughts here... memories, jokes, serious promises..."
                    className="w-full min-h-[400px] p-10 bg-editorial-cream border border-editorial-ink/5 shadow-inner text-xl font-serif italic leading-loose focus:outline-none focus:ring-1 focus:ring-editorial-ink/10"
                  />
                  <Button variant="ghost" onClick={() => setPartner1Vows(prev => prev + (prev ? '\n\n' : '') + brainstormNotes1)} className="w-full h-10 border-dashed">
                    Transfer to Declarations Area ↓
                  </Button>
                </div>

                <div className="h-[1px] bg-editorial-ink/10 my-20"></div>

                {/* Partner 2 Brainstorm */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-sans text-[13px] font-black uppercase tracking-widest">Partner Two Ideas</h3>
                    <div className="flex gap-2">
                       <Button 
                         variant={isListening.partner === 2 ? 'danger' : 'ghost'} 
                         onClick={() => toggleListening(2)} 
                         className="h-8 px-4"
                       >
                         {isListening.partner === 2 ? <MicOff size={12}/> : <Mic size={12}/>}
                         {isListening.partner === 2 ? 'Stop Recording' : 'Voice to Text'}
                       </Button>
                    </div>
                  </div>
                  <textarea 
                    value={brainstormNotes2}
                    onChange={(e) => setBrainstormNotes2(e.target.value)}
                    placeholder="Capture your raw thoughts here..."
                    className="w-full min-h-[400px] p-10 bg-editorial-cream border border-editorial-ink/5 shadow-inner text-xl font-serif italic leading-loose focus:outline-none focus:ring-1 focus:ring-editorial-ink/10"
                  />
                  <Button variant="ghost" onClick={() => setPartner2Vows(prev => prev + (prev ? '\n\n' : '') + brainstormNotes2)} className="w-full h-10 border-dashed text-xs">
                    Transfer to Declarations Area ↓
                  </Button>
                </div>

                {/* Prompt Cards in the center canvas for brainstorming context */}
                <div className="pt-20">
                   <h3 className="font-sans text-[11px] font-black uppercase tracking-widest mb-10 text-editorial-accent text-center">Brainstorming Context</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                     {VOW_PROMPTS.map((prompt, i) => (
                       <div key={i} className="p-8 border border-editorial-ink/10 bg-editorial-paper hover:bg-editorial-beige/10 transition-colors">
                          <p className="font-serif italic text-lg leading-relaxed">"{prompt}"</p>
                       </div>
                     ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'vows' && (
              <motion.div key="vows-editorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                <div className="border-b border-editorial-ink/10 pb-6 mb-10 flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-light italic">Declarations</h2>
                    <span className="text-[10px] font-sans font-black tracking-widest uppercase text-editorial-accent">Draft v.2</span>
                  </div>
                  
                  {/* Privacy Mode Toggle */}
                  <div className="flex items-center gap-4 bg-editorial-beige/30 p-2 border border-editorial-ink/10 ">
                    <span className="text-[9px] font-sans font-black uppercase tracking-widest opacity-60">Privacy Mode</span>
                    <button 
                      onClick={() => {
                        setIsPrivacyMode(!isPrivacyMode);
                        setRevealedPartner(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${isPrivacyMode ? 'bg-editorial-accent text-white shadow-lg' : 'bg-editorial-ink/5 text-editorial-ink'}`}
                    >
                      {isPrivacyMode ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span className="text-[9px] font-sans font-black uppercase tracking-widest">{isPrivacyMode ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Partner 1 Editor */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-sans text-[13px] font-black uppercase tracking-widest">Partner One</h3>
                      <span className="text-[10px] font-sans font-bold text-editorial-ink/40 uppercase tracking-tighter">
                        {getWordCount(partner1Vows)} words &bull; ~{getReadTime(partner1Vows)} min read
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex bg-editorial-beige/30 p-1 border border-editorial-ink/5">
                        {VOW_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.tone}
                            onClick={() => setPartner1Vows(tmpl.content)}
                            className="px-3 py-1 text-[9px] font-sans font-bold uppercase tracking-widest hover:bg-editorial-ink hover:text-white transition-colors"
                            title={`Insert ${tmpl.tone} template`}
                          >
                            {tmpl.tone}
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" onClick={() => handleAiHelp(1)} disabled={isGenerating} className="h-8 px-4"><Sparkles size={12}/>AI Refinement</Button>
                    </div>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={partner1Vows}
                      onChange={(e) => setPartner1Vows(e.target.value)}
                      placeholder="Enter vows..."
                      className={`w-full min-h-[300px] p-10 bg-editorial-cream border border-editorial-ink/5 shadow-inner text-2xl font-serif italic leading-[1.8] focus:outline-none focus:ring-1 focus:ring-editorial-ink/10 transition-all duration-500 ${isPrivacyMode && revealedPartner !== 1 ? 'blur-md select-none pointer-events-none opacity-40' : ''}`}
                    />
                    
                    {isPrivacyMode && revealedPartner !== 1 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-editorial-paper/80 backdrop-blur-sm z-10 border border-editorial-ink/5">
                        <Heart className="text-editorial-accent mb-4 opacity-40" size={32} />
                        <h4 className="text-xl italic mb-4">Partner One's Workspace</h4>
                        <p className="text-xs font-sans font-black uppercase tracking-widest opacity-40 mb-8 max-w-xs">Content is hidden to preserve local surprise. only reveal if you are partner one.</p>
                        <Button 
                          variant="primary" 
                          className="h-10 px-8"
                          onClick={() => setRevealedPartner(1)}
                        >
                          Reveal My Vows
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* AI Suggestions for Partner 1 */}
                  <AnimatePresence>
                    {aiSuggestions && aiSuggestions.partner === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-editorial-beige/40 p-8 border border-editorial-ink/10 space-y-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-sans text-[9px] font-black uppercase tracking-widest text-editorial-accent">AI Phrasing Options</h4>
                          <button onClick={() => setAiSuggestions(null)} className="text-[9px] font-sans font-bold uppercase tracking-widest hover:text-editorial-accent transition-colors">Discard All</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {aiSuggestions.options.map((option, idx) => (
                            <div key={idx} className="space-y-4">
                              <p className="text-xs font-sans font-bold uppercase tracking-tighter opacity-40">Option 0{idx+1}</p>
                              <p className="text-base italic leading-relaxed text-editorial-ink/70 h-32 overflow-y-auto custom-scrollbar">{option}</p>
                              <Button 
                                variant="ghost" 
                                className="w-full h-8 text-[9px] border border-editorial-ink/20"
                                onClick={() => {
                                  setPartner1Vows(option);
                                  setAiSuggestions(null);
                                }}
                              >
                                Apply Choice
                              </Button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Partner 2 Editor */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                      <h3 className="font-sans text-[13px] font-black uppercase tracking-widest">Partner Two</h3>
                      <span className="text-[10px] font-sans font-bold text-editorial-ink/40 uppercase tracking-tighter">
                        {getWordCount(partner2Vows)} words &bull; ~{getReadTime(partner2Vows)} min read
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <div className="flex bg-editorial-beige/30 p-1 border border-editorial-ink/5">
                        {VOW_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.tone}
                            onClick={() => setPartner2Vows(tmpl.content)}
                            className="px-3 py-1 text-[9px] font-sans font-bold uppercase tracking-widest hover:bg-editorial-ink hover:text-white transition-colors"
                            title={`Insert ${tmpl.tone} template`}
                          >
                            {tmpl.tone}
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" onClick={() => handleAiHelp(2)} disabled={isGenerating} className="h-8 px-4"><Sparkles size={12}/>AI Refinement</Button>
                    </div>
                  </div>
                  <div className="relative group">
                    <textarea 
                      value={partner2Vows}
                      onChange={(e) => setPartner2Vows(e.target.value)}
                      placeholder="Enter vows..."
                      className={`w-full min-h-[300px] p-10 bg-editorial-cream border border-editorial-ink/5 shadow-inner text-2xl font-serif italic leading-[1.8] focus:outline-none focus:ring-1 focus:ring-editorial-ink/10 transition-all duration-500 ${isPrivacyMode && revealedPartner !== 2 ? 'blur-md select-none pointer-events-none opacity-40' : ''}`}
                    />

                    {isPrivacyMode && revealedPartner !== 2 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-editorial-paper/80 backdrop-blur-sm z-10 border border-editorial-ink/5">
                        <Heart className="text-editorial-accent mb-4 opacity-40" size={32} />
                        <h4 className="text-xl italic mb-4">Partner Two's Workspace</h4>
                        <p className="text-xs font-sans font-black uppercase tracking-widest opacity-40 mb-8 max-w-xs">Content is hidden to preserve local surprise. only reveal if you are partner two.</p>
                        <Button 
                          variant="primary" 
                          className="h-10 px-8"
                          onClick={() => setRevealedPartner(2)}
                        >
                          Reveal My Vows
                        </Button>
                      </div>
                    )}
                  </div>

                   {/* AI Suggestions for Partner 2 */}
                   <AnimatePresence>
                    {aiSuggestions && aiSuggestions.partner === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-editorial-beige/40 p-8 border border-editorial-ink/10 space-y-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-sans text-[9px] font-black uppercase tracking-widest text-editorial-accent">AI Phrasing Options</h4>
                          <button onClick={() => setAiSuggestions(null)} className="text-[9px] font-sans font-bold uppercase tracking-widest hover:text-editorial-accent transition-colors">Discard All</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {aiSuggestions.options.map((option, idx) => (
                            <div key={idx} className="space-y-4">
                              <p className="text-xs font-sans font-bold uppercase tracking-tighter opacity-40">Option 0{idx+1}</p>
                              <p className="text-sm italic leading-relaxed text-editorial-ink/70 h-32 overflow-y-auto custom-scrollbar">{option}</p>
                              <Button 
                                variant="ghost" 
                                className="w-full h-8 text-[9px] border border-editorial-ink/20"
                                onClick={() => {
                                  setPartner2Vows(option);
                                  setAiSuggestions(null);
                                }}
                              >
                                Apply Choice
                              </Button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'readings' && (
              <motion.div key="readings-editorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                <div className="border-b border-editorial-ink/10 pb-6 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <h2 className="text-4xl font-light italic">Reading Library</h2>
                  
                  {/* Category Dropdown */}
                  <div className="relative group min-w-[200px]">
                    <select 
                      value={readingFilter}
                      onChange={(e) => setReadingFilter(e.target.value as any)}
                      className="w-full bg-editorial-beige/30 border border-editorial-ink/10 px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-editorial-ink/20"
                    >
                      <option value="All">All Categories</option>
                      <option value="Secular">Secular</option>
                      <option value="LGBTQ+">LGBTQ+</option>
                      <option value="Mixed Family">Mixed Family</option>
                      <option value="Nature">Nature</option>
                      <option value="Poetry">Poetry</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-editorial-ink/40">
                      <ChevronRight size={12} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {DEFAULT_READINGS
                    .filter(r => readingFilter === 'All' || r.category === readingFilter)
                    .map(reading => (
                    <div key={reading.id} className="pb-12 border-b border-editorial-ink/5 space-y-6 group">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-widest bg-editorial-beige px-2 py-1">{reading.category}</span>
                        <Button 
                          variant="ghost" 
                          className="h-8 px-4"
                          onClick={() => {
                            const step = ceremonySteps.find(s => s.type === 'readings');
                            if (step) {
                              updateStep(step.id, { content: `${step.content}\n\n--- ${reading.title} ---\n${reading.content}` });
                              setActiveTab('flow');
                            }
                          }}
                        >
                          Append to script +
                        </Button>
                      </div>
                      <h4 className="text-2xl italic">{reading.title}</h4>
                      <p className="text-stone-400 text-sm italic">Authored by {reading.author}</p>
                      <p className="text-xl leading-relaxed opacity-80">{reading.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'flow' && (
              <motion.div key="flow-editorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                <div className="border-b border-editorial-ink/10 pb-6 mb-10 flex justify-between items-end">
                  <h2 className="text-4xl font-light italic">The Sequence</h2>
                  <Button variant="secondary" onClick={addStep} className="h-8 px-4">New Module +</Button>
                </div>
                <div className="space-y-16">
                  {ceremonySteps.map((step, idx) => (
                    <div key={step.id} className="relative group">
                      <div className="absolute -left-12 top-0 text-[10px] font-sans font-black text-editorial-ink/20">0{idx+1}</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <input 
                            value={step.title}
                            onChange={(e) => updateStep(step.id, { title: e.target.value })}
                            className="text-xl italic bg-transparent border-none focus:ring-0 p-0 w-full"
                          />
                          <button onClick={() => removeStep(step.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-editorial-accent hover:text-red-600">
                             <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea 
                          value={step.content || (step.type === 'vows' ? `Partner 1:\n${partner1Vows}\n\nPartner 2:\n${partner2Vows}` : '')}
                          onChange={(e) => updateStep(step.id, { content: e.target.value })}
                          className="w-full min-h-[150px] p-8 bg-editorial-cream border-none focus:ring-1 focus:ring-editorial-ink/10 text-lg leading-relaxed italic"
                          placeholder={`${step.description}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <div key="export-preview" className={`bg-editorial-cream -m-6 md:-m-12 p-6 md:p-12 min-h-full ${isPerformanceMode ? 'bg-editorial-ink text-editorial-cream' : ''}`}>
                 
                 {/* Performance Mode Header Overlay */}
                 <div className="max-w-2xl mx-auto mb-12 flex justify-between items-center print:hidden">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-sans font-black uppercase tracking-widest opacity-40">View Mode</h3>
                      <p className="text-xl italic">{isPerformanceMode ? 'Performance Script' : 'Print Preview'}</p>
                    </div>
                    <button 
                      onClick={() => setIsPerformanceMode(!isPerformanceMode)}
                      className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${isPerformanceMode ? 'bg-editorial-accent border-editorial-accent text-white' : 'border-editorial-ink/20 hover:border-editorial-ink'}`}
                    >
                      <ListOrdered size={14} className={isPerformanceMode ? 'animate-pulse' : ''} />
                      <span className="text-[10px] font-sans font-black uppercase tracking-widest">{isPerformanceMode ? 'Tablet Mode Active' : 'Enable Tablet Mode'}</span>
                    </button>
                 </div>

                 <div id="printable-ceremony" className={`transition-all duration-700 mx-auto ${isPerformanceMode ? 'bg-editorial-ink space-y-32 max-w-4xl p-0' : 'bg-white p-8 md:p-20 shadow-2xl space-y-16 md:space-y-24 max-w-2xl print:shadow-none print:p-0'}`}>
                    <header className={`text-center space-y-4 md:space-y-8 border-b pb-8 md:pb-16 ${isPerformanceMode ? 'border-editorial-cream/10' : 'border-editorial-ink/10'}`}>
                       <h1 className={`italic ${isPerformanceMode ? 'text-6xl md:text-8xl' : 'text-3xl md:text-5xl'}`}>Order of Solemnity</h1>
                       <div className="flex flex-wrap justify-center gap-4 md:gap-10 text-[8px] md:text-[10px] uppercase font-sans font-black tracking-widest text-editorial-accent">
                          <span>Secular</span>
                          <span>&bull;</span>
                          <span>Inclusive</span>
                          <span>&bull;</span>
                          <span>Unified</span>
                       </div>
                    </header>
                    <div className={isPerformanceMode ? 'space-y-40' : 'space-y-20'}>
                      {ceremonySteps.map((step, stepIdx) => (
                        <div key={step.id} className="space-y-8">
                          <div className="flex items-center gap-6">
                             <div className={`h-[1px] flex-1 ${isPerformanceMode ? 'bg-editorial-cream/10' : 'bg-editorial-ink/10'}`}></div>
                             <div className="flex items-center gap-4 px-2">
                               {isPerformanceMode && <span className="text-editorial-accent font-sans text-xs font-black">ST-0{stepIdx+1}</span>}
                               <h3 className={`font-sans font-black uppercase tracking-[0.3em] ${isPerformanceMode ? 'text-2xl opacity-100' : 'text-sm opacity-100'}`}>{step.title}</h3>
                               {!isPerformanceMode && (step.type === 'vows' || step.type === 'readings' || step.type === 'welcome') && (
                                 <button 
                                   onClick={() => setActiveTab(step.type === 'welcome' ? 'welcome' : step.type === 'vows' ? 'vows' : 'readings')}
                                   className="print:hidden p-1.5 hover:bg-editorial-ink/5 rounded-full transition-colors text-editorial-accent"
                                   title={`Edit ${step.title}`}
                                 >
                                   <Edit2 size={10} />
                                 </button>
                               )}
                             </div>
                             <div className={`h-[1px] flex-1 ${isPerformanceMode ? 'bg-editorial-cream/10' : 'bg-editorial-ink/10'}`}></div>
                          </div>
                          <div className={`whitespace-pre-wrap italic text-center px-4 transition-all ${isPerformanceMode ? 'text-3xl md:text-5xl leading-[1.6] text-editorial-cream' : 'text-xl leading-[1.8] opacity-80'}`}>
                            {step.content || (step.type === 'vows' ? `${partner1Vows}\n\n***\n\n${partner2Vows}` : step.description)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <footer className={`pt-20 border-t text-center opacity-30 text-[10px] font-sans font-black uppercase tracking-[0.4em] ${isPerformanceMode ? 'border-editorial-cream/10 text-editorial-cream' : 'border-editorial-ink/10 text-editorial-ink'}`}>
                      The Union Wedding Kit
                    </footer>
                 </div>
              </div>
            )}

            {activeTab === 'merchant' && user?.email === OWNER_EMAIL && (
              <motion.div key="merchant-toolkit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-16">
                 <div className="border-b border-editorial-ink/10 pb-6 mb-10 flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-light italic">Seller Toolkit</h2>
                    <span className="text-[10px] font-sans font-black tracking-widest uppercase text-editorial-accent">Merchant v.01</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-sans font-black opacity-40 italic">
                    <Rainbow size={12} className="text-editorial-accent" />
                    Owner Exclusive
                  </div>
                </div>

                <div className="max-w-xl mx-auto space-y-12">
                   <div className="space-y-4 text-center">
                      <h3 className="text-2xl italic font-light tracking-tight">Generate Customer Access Asset</h3>
                      <p className="text-sm opacity-60 leading-relaxed max-w-md mx-auto">This asset is what your buyers will download from Etsy. It contains their unique entry point to the Union Wedding Kit.</p>
                   </div>

                   <section className="p-8 md:p-12 bg-editorial-beige/30 border border-editorial-ink/10 space-y-8 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                         <Rainbow size={120} />
                      </div>
                      
                      <div id="etsy-access-card" className="aspect-[3/4] bg-editorial-cream shadow-2xl p-12 flex flex-col justify-between border border-editorial-ink/5 mx-auto relative z-10 print:fixed print:inset-0 print:m-0 print:shadow-none print:border-none print:w-[100vw] print:h-[100vh] print:z-[1000] print:bg-white">
                         <div className="space-y-8">
                            <div className="space-y-2">
                               <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-editorial-accent">Authorized Kit</span>
                               <h4 className="text-5xl italic leading-none border-b-2 border-editorial-ink/10 pb-8">Union Toolkit <br/> Access</h4>
                            </div>
                            
                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <p className="text-[10px] font-sans font-black uppercase tracking-widest opacity-40">Digital Access Code</p>
                                  <p className="text-xl font-mono tracking-tighter bg-white p-3 border border-editorial-ink/5">UNION-PREM-2026</p>
                                </div>
                               
                               <p className="text-sm italic opacity-60 leading-relaxed">To initialize your personalized ceremony builder and access all premium templates, visit the private link below.</p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="p-5 bg-editorial-ink text-white text-center rounded-sm">
                               <p className="text-[9px] font-sans font-black uppercase tracking-[0.3em] mb-2 opacity-50">Private Entry Link</p>
                               <p className="text-[11px] break-all font-mono opacity-100 selection:bg-white selection:text-editorial-ink">{window.location.origin}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[10px] font-sans font-extrabold uppercase tracking-[0.5em] opacity-30 italic">Collection No. 04 &bull; Inclusive Design</p>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button 
                          variant="secondary" 
                          className="h-14 font-sans font-black uppercase tracking-widest text-[10px]"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            alert("Link copied to clipboard!");
                          }}
                        >
                          Copy Access Link
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={handlePrint} 
                          className="h-14 font-sans font-black uppercase tracking-widest text-[10px] shadow-lg"
                        >
                          Export PDF Asset
                        </Button>
                      </div>
                   </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Aside: Status & Printing */}
        <aside className="hidden lg:flex col-span-3 border-l border-editorial-ink/10 p-10 flex-col gap-10 overflow-y-auto custom-scrollbar print:hidden">
          <section>
            <h3 className="font-sans text-[11px] uppercase tracking-widest font-black mb-8 text-editorial-accent">Kit Progress</h3>
            <div className="space-y-6">
                {roadmapItems.map((item, i) => (
                 <button 
                   key={i}
                   onClick={() => setActiveTab(item.tab as any)}
                   className="w-full flex justify-between items-center group text-left"
                 >
                   <span className={`text-xs font-sans font-bold uppercase tracking-widest ${activeTab === item.tab ? 'text-editorial-ink' : 'text-editorial-ink/40 group-hover:text-editorial-ink'}`}>
                     {item.label}
                   </span>
                   {item.check() ? <div className="w-2 h-2 bg-editorial-accent"></div> : <div className="w-2 h-2 border border-editorial-ink/20 group-hover:border-editorial-ink"></div>}
                 </button>
               ))}
               <div className="pt-4 border-t border-editorial-ink/5">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[9px] font-sans font-black uppercase tracking-[0.2em] opacity-40">Ready to Finalize</span>
                   <span className="text-xs font-sans font-black text-editorial-accent">{completionPercent}%</span>
                 </div>
                 <div className="h-1 bg-editorial-ink/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-editorial-accent" 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                    />
                 </div>
               </div>
            </div>
          </section>

          <section className="mt-auto space-y-6">
             <div className="h-40 border border-dashed border-editorial-ink/20 flex items-center justify-center text-center p-6 bg-editorial-beige/30">
                <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-editorial-ink/40 leading-loose">
                  Ceremony Script Builder<br />Editorial v.04
                </p>
             </div>
             <Button variant="primary" onClick={handlePrint} className="w-full h-12">
               Print Kit
             </Button>

             {user?.email === OWNER_EMAIL && (
               <button 
                 onClick={() => setActiveTab('merchant')}
                 className={`w-full p-6 border border-editorial-ink/20 flex flex-col gap-4 text-left transition-all ${activeTab === 'merchant' ? 'bg-editorial-ink text-white' : 'hover:bg-editorial-beige/40'}`}
               >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em]">Merchant Toolkit</span>
                    <Rainbow size={14} className="text-editorial-accent" />
                  </div>
                  <p className="text-[9px] font-sans opacity-50 font-bold uppercase tracking-widest leading-loose">Owner exclusive: Generate assets for your Etsy shop listing.</p>
               </button>
             )}

          </section>
        </aside>
      </main>

      <footer className="h-12 bg-editorial-ink text-white px-10 flex items-center justify-between text-[9px] font-sans font-black tracking-[0.2em] relative overflow-hidden">
        <div>&copy; 2026 UNION INCLUSIVE DESIGN</div>
        <div className="hidden md:flex gap-10">
          <span>LGBTQ+ INCLUSIVE DESIGN</span>
          <span>SECULAR-FOCUSED</span>
          <span>MADE FOR ALL FAMILIES</span>
        </div>
      </footer>

      {/* Decorative Rail */}
      <div className="fixed top-1/2 -left-12 transform -rotate-90 text-[10px] uppercase tracking-[0.5em] font-sans font-black opacity-10 pointer-events-none">
        Vow Builder Experience
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(45, 41, 38, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(45, 41, 38, 0.2); }
      `}</style>
    </div>
  );
}
