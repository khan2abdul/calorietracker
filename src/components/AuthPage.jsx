import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, checkConnection } from '../firebase.js';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import gymBg from '../assets/gym_bg.png';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transform transition-all active:scale-95 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
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
