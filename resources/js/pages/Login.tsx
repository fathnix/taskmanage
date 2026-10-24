import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardFooter, Alert } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { firstErrors } from '@/utils/helpers';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setGeneralError('');
    
    const result = await login(formData.email, formData.password, formData.remember);
    
    if (!result.success) {
      setGeneralError(result.message || 'Login failed. Please try again.');
      if (result.errors) {
        setErrors(firstErrors(result.errors));
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-blue-50 via-white to-pastel-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <LogoMark className="h-16 w-16 rounded-2xl mb-4 animate-scale-in" iconClassName="h-10 w-10" />
          <h1 className="text-3xl font-bold text-neutral-900">Welcome back</h1>
          <p className="mt-2 text-neutral-600">Sign in to your account to continue</p>
        </div>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          <form onSubmit={handleSubmit} noValidate>
            {generalError && (
              <Alert variant="error" dismissible onDismiss={() => setGeneralError('')} className="mb-6">
                {generalError}
              </Alert>
            )}

            <div className="space-y-5">
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                disabled={isSubmitting}
                aria-describedby={errors.email ? 'email-error' : undefined}
                leftIcon={<EnvelopeIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />}
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  leftIcon={showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  ) : (
                    <LockClosedIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-neutral-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting || isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>

          <CardFooter className="pt-6">
            <p className="text-center text-neutral-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center animate-fade-in">
          <p className="text-sm text-neutral-500">
            Demo credentials: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono text-xs">demo@example.com / password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}