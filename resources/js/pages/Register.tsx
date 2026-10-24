import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardFooter, Alert } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { firstErrors } from '@/utils/helpers';
import { EnvelopeIcon, LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const nextValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setGeneralError('');
    
    const result = await register(
      formData.name.trim(),
      formData.email,
      formData.password,
      formData.password_confirmation
    );
    
    if (!result.success) {
      setGeneralError(result.message || 'Registration failed. Please try again.');
      if (result.errors) {
        setErrors(firstErrors(result.errors));
      }
    } else {
      setSuccessMessage(result.message || 'Registration successful. Your account is waiting for admin approval.');
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
      });
    }
    
    setIsSubmitting(false);
  };

  const passwordStrength = () => {
    if (!formData.password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (formData.password.length >= 12) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/[a-z]/.test(formData.password)) score++;
    if (/\d/.test(formData.password)) score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) score++;
    
    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, label: 'Fair', color: 'bg-pastel-orange-500' };
    if (score <= 5) return { level: 3, label: 'Good', color: 'bg-pastel-blue-500' };
    return { level: 4, label: 'Strong', color: 'bg-pastel-green-500' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 via-white to-pastel-pink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <LogoMark className="h-16 w-16 rounded-2xl mb-4 animate-scale-in" iconClassName="h-10 w-10" />
          <h1 className="text-3xl font-bold text-neutral-900">Create an account</h1>
          <p className="mt-2 text-neutral-600">Start managing your tasks today</p>
        </div>

        <Card variant="elevated" padding="lg" className="animate-slide-up">
          <form onSubmit={handleSubmit} noValidate>
            {successMessage && (
              <Alert variant="success" dismissible onDismiss={() => setSuccessMessage('')} className="mb-6">
                {successMessage}
              </Alert>
            )}

            {generalError && (
              <Alert variant="error" dismissible onDismiss={() => setGeneralError('')} className="mb-6">
                {generalError}
              </Alert>
            )}

            <div className="space-y-5">
              <Input
                label="Full name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="John Doe"
                disabled={isSubmitting}
                leftIcon={<UserIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />}
              />

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
                leftIcon={<EnvelopeIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />}
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Create a strong password"
                  disabled={isSubmitting}
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

              {formData.password && (
                <div className="space-y-2" aria-live="polite">
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 ease-out"
                      style={{
                        width: `${(strength.level / 4) * 100}%`,
                        backgroundColor: strength.color.replace('bg-', ''),
                      }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Password strength: <span className="font-medium">{strength.label}</span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Use 8+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>
              )}

              <div className="relative">
                <Input
                  label="Confirm password"
                  name="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  error={errors.password_confirmation}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                  leftIcon={showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  ) : (
                    <LockClosedIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-[38px] text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting || isLoading}
              >
                Create account
              </Button>
            </div>
          </form>

          <CardFooter className="pt-6">
            <p className="text-center text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}