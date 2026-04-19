import React, { useState, useRef, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, checkConnection } from '../firebase.js';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import gymBg from '../assets/gym_bg.png';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);
    const recaptchaWidgetId = useRef(null);

    // Render or reset reCAPTCHA widget
    useEffect(() => {
        let timeoutId;
        let cancelled = false;

        const initCaptcha = () => {
            if (cancelled || !recaptchaRef.current) return;

            if (!window.grecaptcha?.render) {
                // Script not loaded yet, retry
                timeoutId = setTimeout(initCaptcha, 300);
                return;
            }

            setCaptchaToken(null);

            if (recaptchaWidgetId.current !== null) {
                // Widget already rendered — just reset it
                try {
                    window.grecaptcha.reset(recaptchaWidgetId.current);
                } catch (e) { /* ignore */ }
            } else {
                // First render
                try {
                    recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                        sitekey: RECAPTCHA_SITE_KEY,
                        callback: (token) => setCaptchaToken(token),
                        'expired-callback': () => setCaptchaToken(null),
                        theme: 'dark',
                        size: 'normal',
                    });
                } catch (e) {
                    console.error('reCAPTCHA render error:', e);
                }
            }
        };

        initCaptcha();

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Verify captcha is completed
        if (!captchaToken) {
            setError('Please complete the reCAPTCHA verification.');
            return;
        }

        setLoading(true);

        if (!auth) {
            console.log("Auth not initialized, checking connection...");
            const status = await checkConnection();
            console.log("Connection status:", status);
            if (!status.success) {
                setError(status.message);
            } else {
                setError("Firebase Auth not initialized. Please refresh or check configuration.");
            }
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                await updateProfile(userCredential.user, { displayName: formData.name });
            }
        } catch (err) {
            console.error("Auth Error:", err);
            let msg = "Authentication failed.";
            if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
            else if (err.code === 'auth/user-disabled') msg = "User disabled.";
            else if (err.code === 'auth/user-not-found') msg = "User not found.";
            else if (err.code === 'auth/wrong-password') msg = "Wrong password.";
            else if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
            else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            else if (err.code === 'auth/network-request-failed') msg = "Network error. Check your connection.";
            else msg = `Error: ${err.message} (${err.code || 'unknown'})`;
            setError(msg);

            // Reset captcha on error so user must re-verify
            if (recaptchaWidgetId.current !== null) {
                try { window.grecaptcha.reset(recaptchaWidgetId.current); } catch (e) { /* ignore */ }
            }
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img src={gymBg} alt="Gym Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Auth Card */}
            <div className="relative z-10 w-full max-w-md p-8 mx-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">FitTrack<span className="text-blue-500">.AI</span></h1>
                    <p className="text-gray-300">Your personal AI fitness companion</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full py-3.5 pl-12 pr-4 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {/* Google reCAPTCHA v2 */}
                    <div className="flex justify-center">
                        <div ref={recaptchaRef} id="recaptcha-container"></div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !captchaToken}
                        className={`w-full py-4 rounded-2xl font-bold text-white transform transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                            captchaToken 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25' 
                                : 'bg-gray-600 cursor-not-allowed opacity-60'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-bold text-white hover:text-blue-400 transition-colors"
                        >
                            {isLogin ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
