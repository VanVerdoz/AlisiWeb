import React, { useState, useEffect } from 'react';
import databaseUser from './database.json'; 

export default function App() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    nim: '',
  });

  const [status, setStatus] = useState('idle'); 
  const [user, setUser] = useState(null); 
  const [progress, setProgress] = useState(0); 

  // --- AUDIO SYNTHESIZER ---
  const playSfx = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'type') {
      osc.type = 'square';
      const freq = 600 + Math.random() * 200; 
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
    else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; 
      notes.forEach((note, i) => {
        const oscNode = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscNode.type = 'triangle';
        oscNode.frequency.value = note;
        const startTime = now + (i * 0.1);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        oscNode.start(startTime);
        oscNode.stop(startTime + 0.5);
      });
    }
    else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
    else if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  };

  // --- HELPER ---
  const normalizeText = (text) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[.,]/g, "").trim();              
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status === 'error' || status === 'failed') setStatus('idle');
    playSfx('type');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    playSfx('click');

    if (!formData.email || !formData.nama || !formData.nim) {
        alert("SEMUA FIELD WAJIB DIISI!");
        return;
    }

    setStatus('loading');
    setProgress(0);

    const scanSound = setInterval(() => { playSfx('scan'); }, 100);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20); 
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      clearInterval(scanSound);
      
      const foundUser = databaseUser.find(u => 
        normalizeText(u.nama) === normalizeText(formData.nama) && 
        normalizeText(u.email) === normalizeText(formData.email) && 
        normalizeText(u.nim) === normalizeText(formData.nim)
      );

      if (foundUser) {
        setUser(foundUser);
        if (foundUser.status === 'lulus') {
            setStatus('success');
            playSfx('success');
        } else {
            setStatus('failed');
            playSfx('error');
        }
      } else {
        setStatus('error');
        playSfx('error');
      }
    }, 1800); 
  };

  const handleLogout = () => {
    playSfx('click');
    setUser(null);
    setStatus('idle');
    setFormData({ nama: '', email: '', nim: '' });
    setProgress(0);
  };

  const customStyles = `
    @keyframes move-grid {
      0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
      100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
    }
    @keyframes scanline-move {
      0% { top: 0%; opacity: 0; }
      50% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .grid-bg {
      background-image: linear-gradient(rgba(0, 255, 0, 0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 0, 0.15) 1px, transparent 1px);
      background-size: 40px 40px;
      width: 200%;
      height: 200%;
      position: absolute;
      top: -50%;
      left: -50%;
      transform: perspective(500px) rotateX(60deg);
      animation: move-grid 4s linear infinite;
      opacity: 0.2;
      pointer-events: none;
    }
    .scanline-bar {
      position: absolute;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(to bottom, transparent, rgba(0, 255, 0, 0.5), transparent);
      animation: scanline-move 3s linear infinite;
      pointer-events: none;
      z-index: 5;
    }
    /* Responsiveness adjustments */
    @media (max-width: 640px) {
      .grid-bg { background-size: 30px 30px; }
    }
  `;

  // --- 1. TAMPILAN FORM (INPUT) ---
  if (status === 'idle' || status === 'loading' || status === 'error') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-6 font-mono text-green-500 overflow-hidden relative selection:bg-green-500 selection:text-black">
        <style>{customStyles}</style>
        
        {/* ANIMASI BACKGROUND */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="grid-bg"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
            <div className="scanline-bar"></div>
        </div>

        {/* CONTAINER UTAMA (RESPONSIF) */}
        <div className="relative z-10 w-full max-w-md md:max-w-2xl animate-in zoom-in-95 duration-700">
          
          {/* Header */}
          <div className="text-center mb-6 md:mb-10 relative">
            <div className="inline-flex items-center gap-2 md:gap-3 border border-green-500/30 px-4 py-1 md:px-6 md:py-2 rounded-full mb-6 md:mb-8 bg-green-900/10 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <span className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] md:text-sm font-bold tracking-widest text-green-400">SYSTEM_ONLINE_V.2.0</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-4">
              <div className="relative group">
                <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                <img src="/logo.png" alt="Logo" className="relative w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] leading-none">
                    OPREC <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">ALISI</span>
                </h1>
                <p className="text-lg md:text-3xl font-normal text-green-600 tracking-widest drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] mt-1 md:mt-2">
                    SIBER UIN SUSKA
                </p>
              </div>
            </div>
          </div>

          {/* Card Container */}
          <div className="relative transition-all duration-500">
            <div className={`absolute -inset-1 bg-gradient-to-r ${status === 'error' ? 'from-red-600 to-orange-600' : 'from-green-500 to-emerald-900'} rounded-xl blur opacity-50`}></div>
            
            <div className={`relative bg-black/90 border-2 ${status === 'error' ? 'border-red-500' : 'border-green-500'} rounded-xl p-1 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]`}>
              
              <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border-b ${status === 'error' ? 'border-red-900/50 bg-red-950/20' : 'border-green-900/50 bg-green-950/20'} rounded-t-lg`}>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                </div>
                <div className={`ml-auto text-[10px] md:text-xs ${status === 'error' ? 'text-red-400' : 'text-green-600'} font-mono tracking-widest opacity-70`}>
                   SSH://ALISI_SERVER/LOGIN
                </div>
              </div>

              <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  
                  {['email', 'nama', 'nim'].map((field) => (
                    <div key={field} className="group relative">
                      <label className={`block text-[10px] md:text-sm uppercase tracking-widest mb-1.5 md:mb-2 font-bold ${status === 'error' ? 'text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]' : 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}>
                        root@user:~/{field}
                      </label>
                      <div className="relative">
                        <span className={`absolute left-3 md:left-4 top-3 md:top-4 text-base md:text-lg ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>$</span>
                        <input 
                          type={field === 'email' ? 'email' : 'text'}
                          name={field}
                          required
                          value={formData[field]}
                          onChange={handleChange}
                          placeholder={`Masukkan ${field.charAt(0).toUpperCase() + field.slice(1)}...`}
                          className={`w-full bg-black/50 border-2 rounded-lg px-8 md:px-10 py-3 md:py-4 outline-none font-mono text-sm md:text-lg transition-all duration-300
                            ${status === 'error' 
                              ? 'border-red-500 text-red-300 placeholder-red-900 shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                              : 'border-green-500 text-green-300 placeholder-green-800 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                            }`}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  ))}

                  <button 
                    type="submit" 
                    disabled={status === 'loading'} 
                    className={`w-full border-2 font-bold py-4 md:py-5 px-6 md:px-8 rounded-lg transition-all duration-300 uppercase tracking-[0.25em] text-sm md:text-xl disabled:opacity-70 disabled:cursor-not-allowed
                      ${status === 'error' 
                        ? 'border-red-600 text-red-500 hover:bg-red-600 hover:text-black shadow-[0_0_25px_rgba(220,38,38,0.5)]' 
                        : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black shadow-[0_0_25px_rgba(34,197,94,0.5)]'
                      }`}
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-3 animate-pulse">
                         [ HACKING... {progress}% ]
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 md:gap-3">
                        [ INITIATE_SEARCH ] <span className="text-lg md:text-2xl">»</span>
                      </span>
                    )}
                  </button>

                </form>

                {status === 'error' && (
                  <div className="mt-6 bg-red-950/40 border-l-4 md:border-l-8 border-red-500 p-4 md:p-6 animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-r-lg shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                    <div className="flex gap-4 md:gap-6 items-center">
                      <div className="text-4xl md:text-6xl grayscale-0 animate-bounce">🤡</div>
                      <div>
                        <h4 className="text-red-500 font-bold text-lg md:text-2xl tracking-widest drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">ACCESS DENIED</h4>
                        <p className="text-white text-sm md:text-lg font-bold mt-1 md:mt-2">"Upss mau ngapain lek?😹"</p>
                        <div className="mt-2 md:mt-3 text-[10px] md:text-xs text-red-400 font-mono space-y-1 opacity-70">
                          <p>&gt; ERROR: 0x0000404_DATA_NOT_FOUND</p>
                          <p>&gt; IDENTITY_UNKNOWN</p>
                          <p>&gt; IP_ADDRESS_LOGGED...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <footer className="mt-12 md:mt-16 text-center pb-8">
            <p className="text-green-800 text-[10px] md:text-xs tracking-[0.4em] drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">ENCRYPTED CONNECTION ESTABLISHED</p>
            <p className="text-green-900/50 text-[10px] md:text-xs mt-2">&copy; 2026 ALISI_UIN SUSKA RIAU</p>
          </footer>
        </div>
      </div>
    );
  }

  // --- 2. HALAMAN SUKSES (LULUS) ---
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-6 font-mono overflow-hidden relative">
        <style>{customStyles}</style>
        <div className="fixed inset-0 pointer-events-none">
            <div className="grid-bg"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
            <div className="scanline-bar"></div>
        </div>

        <div className="relative z-10 w-full max-w-md md:max-w-3xl text-center animate-in zoom-in-95 duration-500">
          
          <div className="mb-6 md:mb-8 flex justify-center relative">
             <div className="absolute inset-0 bg-green-500 blur-3xl opacity-30 rounded-full animate-pulse"></div>
             <img src="/logo.png" alt="Logo" className="relative w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_0_35px_rgba(34,197,94,1)] animate-bounce" />
          </div>

          <h1 className="text-5xl md:text-9xl font-black text-white mb-2 md:mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] tracking-tighter">
            ACCEPTED
          </h1>
          <div className="flex items-center justify-center gap-2 md:gap-4 text-green-400 text-lg md:text-2xl tracking-[0.5em] mb-8 md:mb-12 uppercase font-bold drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
             <span className="w-8 md:w-16 h-[2px] bg-green-500 box-shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
             OFFICIAL RECRUIT
             <span className="w-8 md:w-16 h-[2px] bg-green-500 box-shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
          </div>

          <div className="bg-black/80 border-2 border-green-500 p-1 md:p-2 rounded-2xl shadow-[0_0_120px_rgba(34,197,94,0.3)] max-w-xl mx-auto relative overflow-hidden group">
            <div className="border border-green-500/30 rounded-xl p-6 md:p-10 relative bg-green-950/20 backdrop-blur-md">
                <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 w-24 h-24 md:w-32 md:h-32 bg-green-600 text-black flex items-center justify-center border-4 border-black shadow-xl rotate-12 z-20 rounded-full">
                    <span className="font-black text-sm md:text-lg rotate-[-12deg] tracking-wider">VERIFIED</span>
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SELAMAT!</h2>
                <p className="text-green-300/80 mb-6 md:mb-10 text-sm md:text-lg">Anda di nyatakan lulus <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">seleksi</span>.</p>

                <div className="text-left space-y-4 md:space-y-6 font-mono">
                    <div className="border-l-4 border-green-500 pl-4 md:pl-6 py-2 shadow-[inset_10px_0_20px_-10px_rgba(34,197,94,0.3)]">
                        <span className="text-[10px] md:text-xs text-green-600 block tracking-widest mb-1 md:mb-2 font-bold">CODENAME</span>
                        <span className="text-xl md:text-3xl font-bold text-white uppercase drop-shadow-md">{user.nama}</span>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4 md:pl-6 py-2 shadow-[inset_10px_0_20px_-10px_rgba(34,197,94,0.3)]">
                        <span className="text-[10px] md:text-xs text-green-600 block tracking-widest mb-1 md:mb-2 font-bold">ID ACCESS (NIM)</span>
                        <span className="text-xl md:text-2xl font-bold text-green-400 tracking-[0.2em] drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">{user.nim}</span>
                    </div>
                </div>

                {/* --- QR CODE SECTION (RESPONSIVE) --- */}
                <div className="mt-6 md:mt-8 flex flex-col items-center justify-center border-t border-green-900/50 pt-6">
                    <p className="text-green-400 text-xs md:text-sm tracking-[0.2em] font-bold mb-4 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                        JOIN SECURE CHANNEL
                    </p>
                    
                    <div className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95">
                        <div className="absolute -inset-1 bg-green-500 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-black p-2 border-2 border-green-500 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <img 
                                src="/qrcode.png" 
                                alt="QR Code Grup WA" 
                                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded" 
                            />
                        </div>
                    </div>
                    
                    <p className="text-[9px] md:text-[10px] text-green-600 mt-3 font-mono">SCAN TO ACCESS LABSQUAD HQ</p>
                </div>

                <div className="mt-6 md:mt-8 pt-6 border-t border-green-900/50 flex flex-col gap-4">
                    <button onClick={handleLogout} className="w-full py-3 md:py-4 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest text-xs md:text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                        [ TERMINATE SESSION ]
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. HALAMAN GAGAL (REJECTED - MERAH) ---
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-6 font-mono overflow-hidden relative">
        <style>{customStyles}</style>
        <div className="fixed inset-0 pointer-events-none">
            {/* Override grid color for red theme */}
            <div className="grid-bg" style={{backgroundImage: 'linear-gradient(rgba(255, 0, 0, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 0, 0.15) 1px, transparent 1px)'}}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
        </div>

        <div className="relative z-10 w-full max-w-md md:max-w-3xl text-center animate-in zoom-in-95 duration-500">
          <div className="mb-6 md:mb-8 flex justify-center relative">
             <div className="absolute inset-0 bg-red-600 blur-3xl opacity-30 rounded-full animate-pulse"></div>
             <img src="/logo.png" alt="Logo" className="relative w-28 h-28 md:w-32 md:h-32 object-contain grayscale contrast-150 brightness-75 drop-shadow-[0_0_35px_rgba(220,38,38,0.8)]" />
          </div>

          <h1 className="text-5xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 mb-2 md:mb-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] tracking-tighter">
            REJECTED
          </h1>
          <div className="flex items-center justify-center gap-2 md:gap-4 text-red-500 text-lg md:text-2xl tracking-[0.5em] mb-8 md:mb-12 uppercase font-bold drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
             <span className="w-8 md:w-16 h-[2px] bg-red-600"></span>
             ACCESS DENIED
             <span className="w-8 md:w-16 h-[2px] bg-red-600"></span>
          </div>

          <div className="bg-black/80 border-2 border-red-600 p-1 md:p-2 rounded-2xl shadow-[0_0_120px_rgba(220,38,38,0.2)] max-w-xl mx-auto relative overflow-hidden">
            <div className="border border-red-600/30 rounded-xl p-6 md:p-10 relative bg-red-950/20 backdrop-blur-md">
                
                <div className="absolute -top-6 -right-6 md:-top-8 md:-right-8 w-24 h-24 md:w-32 md:h-32 bg-red-700 text-black flex items-center justify-center border-4 border-black shadow-xl rotate-12 z-20 rounded-full">
                    <span className="font-black text-xl md:text-3xl rotate-[-12deg]">X</span>
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">MOHON MAAF</h2>
                <p className="text-red-300 text-base md:text-xl mb-6 md:mb-10 border-b border-red-900/50 pb-6 md:pb-8 italic">
                  "Maaf anda tidak lulus, silahkan coba tahun depan ya."
                </p>

                <div className="text-left space-y-4 md:space-y-6 opacity-75 grayscale transition hover:grayscale-0 duration-500">
                    <div className="border-l-4 border-red-600 pl-4 md:pl-6 py-2 shadow-[inset_10px_0_20px_-10px_rgba(220,38,38,0.3)]">
                         <span className="text-[10px] md:text-xs text-red-500 block tracking-widest mb-1 md:mb-2 font-bold">APPLICANT</span>
                         <span className="text-xl md:text-2xl font-bold text-red-400 uppercase drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">{user.nama}</span>
                    </div>
                </div>

                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-red-900/50">
                    <button onClick={handleLogout} className="w-full py-3 md:py-4 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black font-bold uppercase tracking-widest text-xs md:text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                        [ RETRY LATER ]
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}