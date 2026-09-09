import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getErrorMessage = (error: any) => {
    switch (error.code) {
      case "auth/invalid-credential":
        return "Email yoki parol noto'g'ri.";
      case "auth/invalid-email":
        return "Noto'g'ri email formati.";
      case "auth/weak-password":
        return "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
      case "auth/email-already-in-use":
        return "Bu email manzili allaqachon ro'yxatdan o'tgan.";
      case "auth/user-not-found":
        return "Bunday foydalanuvchi topilmadi.";
      case "auth/wrong-password":
        return "Kiritilgan parol noto'g'ri.";
      case "auth/too-many-requests":
        return "Juda ko'p urinishlar qilindi. Iltimos, birozdan so'ng qayta urinib ko'ring.";
      default:
        return error.message || "Tizimga kirishda xatolik yuz berdi. Iltimos qaytib qarang.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (userCred.user && fullName) {
          await updateProfile(userCred.user, { displayName: fullName });
        }
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Ushbu elektron pochta allaqachon ro'yxatdan o'tgan.");
        setIsLogin(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-250 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-zinc-900 dark:bg-zinc-100 rounded-lg shadow-sm">
            <Scale className="w-8 h-8 text-white dark:text-zinc-950" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
          {isLogin ? "Hisobingizga kiring" : "Yuridik portalda ro'yxatdan o'ting"}
        </h2>
        <p className="mt-1.5 text-center text-xs text-gray-500 dark:text-zinc-400">
          Yoki{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline transition-all cursor-pointer"
          >
            {isLogin ? "yangi hisob yaratish" : "mavjud hisobga kirish"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xs"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Ism-sharifingiz
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs text-gray-900 dark:text-zinc-200 transition-all font-medium"
                  placeholder="F.I.Sh."
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                E-Mail Manzil
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs text-gray-900 dark:text-zinc-200 transition-all font-medium"
                  placeholder="advokat@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Parol
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs text-gray-900 dark:text-zinc-200 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? "Kirish" : "Ro'yxatdan o'tish"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="px-2 bg-white dark:bg-zinc-900 text-gray-400">Yoki</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
              >
                <img
                  className="h-4.5 w-4.5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  referrerPolicy="no-referrer"
                />
                Google hisobidan kirish
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
