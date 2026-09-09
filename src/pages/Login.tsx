import { useState } from "react";
import { TelegramBrowserFallback } from "../components/TelegramBrowserFallback";
import { devLoginBypass } from "../services/telegramAuthService";

interface LoginProps {
  onLoginSuccess?: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [devLoading, setDevLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDevLogin = async () => {
    setDevLoading(true);
    setErrorMessage("");
    try {
      const res = await devLoginBypass();
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Test hisobiga kirishda xatolik yuz berdi");
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <TelegramBrowserFallback
      onDevLogin={handleDevLogin}
      devLoading={devLoading}
      errorMessage={errorMessage}
    />
  );
}

export default Login;
