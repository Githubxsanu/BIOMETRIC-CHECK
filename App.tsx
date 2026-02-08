
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ScanSearch, 
  Database, 
  ShieldCheck, 
  Dna, 
  Save, 
  Trash2, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  BarChart3,
  Download,
  Lock,
  Unlock,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';
import { CameraView } from './components/CameraView';
import { Analytics } from './components/Analytics';
import { AppMode, BiometricProfile, AnalysisResult } from './types';
import { analyzeBiometrics, identifyBiometrics } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  
  const [mode, setMode] = useState<AppMode>(AppMode.IDENTIFICATION);
  const [profiles, setProfiles] = useState<BiometricProfile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [identificationResult, setIdentificationResult] = useState<{
    profile: BiometricProfile | null;
    confidence: number;
    reason: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    department: 'Engineering',
    accessLevel: 'Standard' as BiometricProfile['accessLevel']
  });

  useEffect(() => {
    const saved = localStorage.getItem('bioguard_profiles');
    if (saved) {
      setProfiles(JSON.parse(saved));
    }
  }, []);

  const saveProfiles = (newProfiles: BiometricProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('bioguard_profiles', JSON.stringify(newProfiles));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'SYSTEM_CORE' || passcode === '0000') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const handleCapture = async (base64: string) => {
    setIsProcessing(true);
    setCapturedImage(base64);
    
    try {
      const imagePart = { inlineData: { data: base64, mimeType: 'image/jpeg' } };
      
      if (mode === AppMode.REGISTRATION) {
        const result = await analyzeBiometrics(imagePart);
        setLastAnalysis(result);
      } else if (mode === AppMode.IDENTIFICATION) {
        const match = await identifyBiometrics(imagePart, profiles);
        const matchingProfile = profiles.find(p => p.id === match.profileId) || null;
        setIdentificationResult({
          profile: matchingProfile,
          confidence: match.confidence,
          reason: match.reason
        });
      }
    } catch (error) {
      console.error("Processing error:", error);
      alert("AI analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveProfile = () => {
    if (!lastAnalysis || !capturedImage || !formData.fullName) return;

    const newProfile: BiometricProfile = {
      id: crypto.randomUUID(),
      ...formData,
      facialDescription: lastAnalysis.face,
      earStructure: lastAnalysis.ears,
      irisPattern: lastAnalysis.iris,
      eyeSpacing: lastAnalysis.eyes,
      photoBase64: capturedImage,
      timestamp: Date.now()
    };

    saveProfiles([...profiles, newProfile]);
    setLastAnalysis(null);
    setCapturedImage(null);
    setFormData({ fullName: '', department: 'Engineering', accessLevel: 'Standard' });
    setMode(AppMode.DATABASE);
  };

  const deleteProfile = (id: string) => {
    if (confirm("Permanently delete this biometric profile?")) {
      saveProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    let content = '';
    let fileName = `bioguard_export_${Date.now()}`;
    
    if (format === 'json') {
      content = JSON.stringify(profiles, null, 2);
      fileName += '.json';
    } else {
      const headers = ['ID', 'Name', 'Dept', 'Access', 'Face', 'Iris', 'Ears', 'Eyes', 'Timestamp'];
      const rows = profiles.map(p => [
        p.id, p.fullName, p.department, p.accessLevel, 
        p.facialDescription, p.irisPattern, p.earStructure, p.eyeSpacing,
        new Date(p.timestamp).toISOString()
      ]);
      content = [headers, ...rows].map(r => r.join(',')).join('\n');
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden relative">
        <div className="absolute inset-0 biometric-grid opacity-20" />
        <div className="relative z-10 w-full max-w-md animate-in zoom-in duration-700">
           <div className="bg-slate-900/90 border-2 border-cyan-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-cyan-600/20 rounded-full flex items-center justify-center border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4 animate-pulse">
                  <ShieldCheck className="text-cyan-400" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-[0.2em]">BIOGUARD CORE</h1>
                <p className="text-[10px] text-cyan-600 font-mono mt-1">SECURITY CLEARANCE REQUIRED</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-2">Operator Identity Code</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/30" size={18} />
                    <input 
                      type="password" 
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className={`w-full bg-slate-800 border-2 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none transition-all ${authError ? 'border-red-500 animate-shake' : 'border-cyan-500/10 focus:border-cyan-500'}`}
                      placeholder="ENTER TERMINAL CODE"
                    />
                  </div>
                  {authError && <p className="text-red-500 text-[10px] mt-2 font-bold animate-pulse">ACCESS DENIED: INVALID SIGNATURE</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-3 group"
                >
                  <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                  <span>INITIALIZE SYSTEM CORE</span>
                </button>
                
                <div className="text-center pt-2">
                   <button 
                    type="button"
                    onClick={() => alert("Master Override Hint: SYSTEM_CORE or 0000")}
                    className="text-[9px] text-cyan-700 hover:text-cyan-500 uppercase tracking-widest transition-colors"
                   >
                     Forgot Override Signature?
                   </button>
                </div>
              </form>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0 border-b border-cyan-500/20 pb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-600 p-3 rounded-lg shadow-lg shadow-cyan-600/30">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-cyan-400">BIOGUARD CORE</h1>
            <p className="text-xs text-cyan-700 font-mono">NEURAL BIOMETRIC IDENTITY ENGINE v3.1</p>
          </div>
        </div>

        <nav className="flex space-x-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/10 overflow-x-auto no-scrollbar">
          {[
            { id: AppMode.IDENTIFICATION, label: 'Identify', icon: ScanSearch },
            { id: AppMode.REGISTRATION, label: 'Register', icon: UserPlus },
            { id: AppMode.DATABASE, label: 'Records', icon: Database },
            { id: AppMode.ANALYTICS, label: 'Analytics', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setIdentificationResult(null);
                setLastAnalysis(null);
              }}
              className={`flex items-center px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                mode === item.id 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <item.icon size={18} className="mr-2" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Unlock size={18} />
          </button>
        </nav>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {mode === AppMode.ANALYTICS ? (
            <Analytics profiles={profiles} />
          ) : (mode === AppMode.REGISTRATION || mode === AppMode.IDENTIFICATION) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center text-cyan-100 uppercase tracking-tighter">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-3" />
                  OPTICAL SENSOR FEED
                </h2>
                <div className="text-xs text-cyan-500/60 font-mono uppercase tracking-widest">
                  Secure Link Active
                </div>
              </div>
              <CameraView 
                onCapture={handleCapture} 
                scanning={isProcessing} 
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['FACIAL', 'IRIS', 'AURAL', 'OCULAR'].map((sys) => (
                  <div key={sys} className="bg-slate-900/50 border border-cyan-500/10 p-3 rounded-lg">
                    <div className="text-[10px] text-cyan-500/50 mb-1">{sys} SUBSYSTEM</div>
                    <div className="flex items-center text-xs text-cyan-400">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isProcessing ? 'bg-yellow-400' : 'bg-green-400'}`} />
                      {isProcessing ? 'CALCULATING' : 'READY'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : mode === AppMode.DATABASE && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-cyan-100 uppercase tracking-tighter">IDENTITY RECORDS</h2>
                <div className="flex space-x-2">
                   <button 
                    onClick={() => exportData('json')}
                    className="bg-slate-900 border border-cyan-500/20 hover:border-cyan-500/60 p-2 rounded-lg text-cyan-500 transition-all"
                    title="Export JSON"
                   >
                     <Download size={16} />
                   </button>
                   <button 
                    onClick={() => exportData('csv')}
                    className="bg-slate-900 border border-cyan-500/20 hover:border-cyan-500/60 px-3 py-2 rounded-lg text-cyan-500 transition-all text-[10px] font-bold"
                   >
                     CSV
                   </button>
                   <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/40" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search IDs..."
                      className="bg-slate-900 border border-cyan-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 text-cyan-100 w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profiles.map(p => (
                  <div key={p.id} className="bg-slate-900/80 border border-cyan-500/10 p-4 rounded-xl group hover:border-cyan-500/40 transition-all flex space-x-4">
                    <img 
                      src={`data:image/jpeg;base64,${p.photoBase64}`} 
                      className="w-16 h-16 rounded-lg object-cover border border-cyan-500/20 grayscale" 
                      alt={p.fullName}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-cyan-100 font-bold text-sm leading-tight">{p.fullName}</h3>
                          <p className="text-[10px] text-cyan-500/60 uppercase">{p.department} | {p.accessLevel}</p>
                        </div>
                        <button onClick={() => deleteProfile(p.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex space-x-1">
                        <span className="text-[9px] bg-cyan-900/30 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">VERIFIED</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">BIO-LINKED</span>
                      </div>
                    </div>
                  </div>
                ))}
                {profiles.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-cyan-500/10">
                    <Database className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-slate-500">No identity profiles found in local storage.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-6">
          {isProcessing ? (
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[400px]">
              <div className="relative">
                <Dna className="text-cyan-500 animate-[spin_3s_linear_infinite]" size={64} />
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-100 mb-2">NEURAL PROCESSING</h3>
                <p className="text-cyan-500/60 text-sm max-w-xs leading-relaxed">
                  Extracting biometric markers and matching patterns against neural identity signatures...
                </p>
              </div>
              <div className="w-full max-w-xs bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full animate-[loading_2s_ease-in-out_infinite] w-1/3" />
              </div>
            </div>
          ) : mode === AppMode.IDENTIFICATION ? (
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-6 h-full flex flex-col">
               <h2 className="text-sm font-bold text-cyan-500 mb-6 flex items-center tracking-widest uppercase">
                <ScanSearch size={16} className="mr-2" /> Identification Matrix
              </h2>

              {identificationResult ? (
                <div className="space-y-6 flex-1">
                  {identificationResult.profile ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                           <img 
                            src={`data:image/jpeg;base64,${identificationResult.profile.photoBase64}`} 
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-green-500 shadow-lg shadow-green-500/20" 
                            alt="Match Found"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-4 border-slate-900">
                            <CheckCircle2 size={20} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-green-500 font-bold mb-1 uppercase tracking-widest">ACCESS GRANTED</div>
                          <h3 className="text-2xl font-bold text-white leading-tight">{identificationResult.profile.fullName}</h3>
                          <div className="flex items-center mt-1 text-cyan-400 text-xs">
                             <Clock size={12} className="mr-1" />
                             Last login: {new Date(identificationResult.profile.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/10">
                            <div className="text-[10px] text-cyan-500/50 mb-1">DEPT</div>
                            <div className="text-xs font-bold text-cyan-100">{identificationResult.profile.department}</div>
                         </div>
                         <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/10">
                            <div className="text-[10px] text-cyan-500/50 mb-1">ACCESS</div>
                            <div className="text-xs font-bold text-cyan-100 uppercase">{identificationResult.profile.accessLevel}</div>
                         </div>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-green-500 uppercase">Match Confidence</span>
                          <span className="text-xs font-bold text-green-400">{identificationResult.confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${identificationResult.confidence}%` }} />
                        </div>
                        <p className="mt-3 text-[11px] text-green-400/70 leading-relaxed font-mono">
                          {identificationResult.reason}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 animate-in fade-in duration-500">
                      <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
                         <XCircle size={48} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-100 uppercase">UNIDENTIFIED SUBJECT</h3>
                        <p className="text-xs text-red-500/60 font-mono mt-1">NO PROFILE MATCHED IN CURRENT DATA-CORE</p>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        The biometric profile does not match any authorized users. Security protocols initiated.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600">
                   <ScanSearch size={48} className="mb-4 opacity-20" />
                   <p className="text-sm">Initiate scan to begin identification process.</p>
                </div>
              )}
            </div>
          ) : mode === AppMode.REGISTRATION ? (
            <div className="bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-6 h-full overflow-y-auto max-h-[calc(100vh-200px)]">
              <h2 className="text-sm font-bold text-cyan-500 mb-6 flex items-center tracking-widest uppercase">
                <UserPlus size={16} className="mr-2" /> Identity Enrollment
              </h2>

              {!lastAnalysis ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-600 border border-dashed border-cyan-500/10 rounded-xl">
                  <Camera size={32} className="mb-2 opacity-20" />
                  <p className="text-xs">Waiting for sensor capture...</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/jpeg;base64,${capturedImage}`} 
                      className="w-full h-40 object-cover rounded-xl border border-cyan-500/30 shadow-xl" 
                      alt="Capture"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-cyan-500/60 font-bold uppercase mb-1">Full Legal Name</label>
                      <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full bg-slate-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-cyan-500/60 font-bold uppercase mb-1">Department</label>
                        <select 
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full bg-slate-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-cyan-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                          <option>Engineering</option>
                          <option>Operations</option>
                          <option>Security</option>
                          <option>Executive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-cyan-500/60 font-bold uppercase mb-1">Clearance Level</label>
                        <select 
                          value={formData.accessLevel}
                          onChange={(e) => setFormData({...formData, accessLevel: e.target.value as BiometricProfile['accessLevel']})}
                          className="w-full bg-slate-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-cyan-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                          <option value="Standard">Standard</option>
                          <option value="Restricted">Restricted</option>
                          <option value="Administrator">Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-widest flex items-center">
                      <CheckCircle2 size={12} className="mr-2" /> AI Extracted Biometrics
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'FACE STRUCTURE', val: lastAnalysis.face },
                        { label: 'IRIS PATTERN', val: lastAnalysis.iris },
                        { label: 'AURAL GEOMETRY', val: lastAnalysis.ears },
                        { label: 'OCULAR SPACING', val: lastAnalysis.eyes },
                      ].map((attr) => (
                        <div key={attr.label} className="bg-slate-800/40 p-3 rounded-lg border border-cyan-500/5 group hover:border-cyan-500/20 transition-all">
                          <div className="text-[9px] text-cyan-500 mb-1">{attr.label}</div>
                          <p className="text-[10px] text-slate-300 leading-relaxed font-mono truncate hover:whitespace-normal transition-all duration-300">
                            {attr.val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveProfile}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <Save size={18} />
                    <span>FINALIZE ENROLLMENT</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
             <div className="bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[400px]">
                <div className="relative">
                  <ShieldCheck className="text-cyan-500/20" size={64} />
                  <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-cyan-100 uppercase tracking-tighter">DATA SYSTEM ACTIVE</h3>
                   <p className="text-xs text-slate-500 font-mono">ALL SUBSYSTEMS NOMINAL. READY FOR OPERATOR INPUT.</p>
                </div>
             </div>
          )}
        </div>
      </main>

      <footer className="mt-8 pt-6 border-t border-cyan-500/10 flex justify-between items-center text-[10px] text-cyan-500/40 uppercase tracking-widest font-mono">
        <div>SYSTEM STATUS: NOMINAL</div>
        <div>Uptime: 99.99% | AES-256 Quantum Encryption</div>
        <div>&copy; 2024 BIOGUARD SYSTEMS INC.</div>
      </footer>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
