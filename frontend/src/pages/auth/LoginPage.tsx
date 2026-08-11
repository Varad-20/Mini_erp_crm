import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Lock, Mail, AlertCircle, Sun, Moon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getApiErrorMessage } from '../../utils/formatters';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (!authLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: LoginFormData) => {
    setApiError('');
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative">
      {/* Top right theme toggle button */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm transition-all cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg shadow-sm mb-3">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">MINI ERP</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase mt-1">Operations Portal</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 transition-colors duration-150">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Enter your credentials to access the portal</p>
          </div>

          {apiError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-md mb-5">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <Input
              id="email"
              type="email"
              label="Email address"
              autoComplete="email"
              placeholder="you@company.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            {/* Password */}
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              leftIcon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              required
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
