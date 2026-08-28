import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { t } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { register } from '../services/auth.service';
import { type RegisterFormData } from '../lib/formTypes';

export type { RegisterFormData };

export interface UseRegisterFaceReturn {
  registerForm: RegisterFormData;
  setRegisterForm: Dispatch<SetStateAction<RegisterFormData>>;
  registerErrors: string[] | null;
  registrationSuccess: boolean;
  loadingRegister: boolean;
  registerDisabled: boolean;
  handleRegister: () => Promise<void>;
}

const buildEmptyRegisterForm = (): RegisterFormData => ({
  firstName: '',
  lastName: '',
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

export function useRegisterFace(): UseRegisterFaceReturn {
  const { lang } = useLanguage();
  const tr = t(lang);
  const [registerForm, setRegisterForm] = useState<RegisterFormData>(buildEmptyRegisterForm);
  const [registerErrors, setRegisterErrors] = useState<string[] | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const registerDisabled = useMemo(() => {
    if (loadingRegister) return true;
    if (!registerForm.firstName || !registerForm.lastName) return true;
    if (!registerForm.displayName || registerForm.displayName.length < 3) return true;
    if (!registerForm.username || registerForm.username.length < 3) return true;
    if (!registerForm.email || !registerForm.email.includes('@')) return true;
    if (!registerForm.password || registerForm.password.length < 6) return true;
    if (registerForm.password !== registerForm.confirmPassword) return true;
    return false;
  }, [loadingRegister, registerForm]);

  const handleRegister = useCallback(async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterErrors([tr.passwordsMustMatch]);
      return;
    }
    setLoadingRegister(true);
    try {
      const { ok, data } = await register(registerForm);
      if (data.success === false) {
        const errs = data.errors ?? (data.error ? [data.error] : [tr.registrationFailed]);
        setRegisterErrors(errs);
        return;
      }
      setRegisterForm(buildEmptyRegisterForm());
      setRegisterErrors(null);
      setRegistrationSuccess(true);
      setTimeout(() => {
        setRegistrationSuccess(false);
      }, 2000);
    } catch (error) {
      const msg = (error as Error).message;
      setRegisterErrors([msg]);
    } finally {
      setLoadingRegister(false);
    }
  }, [registerForm, tr]);

  return {
    registerForm,
    setRegisterForm,
    registerErrors,
    registrationSuccess,
    loadingRegister,
    registerDisabled,
    handleRegister,
  };
}