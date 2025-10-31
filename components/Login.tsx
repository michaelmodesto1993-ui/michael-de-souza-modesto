import React, { useState, useEffect } from 'react';
import { LogoIcon, SpinnerIcon } from './Icons';

interface LoginProps {
  onLoginSuccess: () => void;
}

const REGISTERED_USERS_KEY = 'conciliaFacil_registeredUsers';
const BASE_USERS = ['AURELIO', 'MARA', 'MARCIA', 'JOE', 'MICHAEL', 'MARCELO'];
const CORRECT_PASSWORD = 'Ampla@#1';


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState<string[]>(BASE_USERS);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
      if (storedUsers) {
        const registered = JSON.parse(storedUsers) as string[];
        // Combine and deduplicate
        setAllowedUsers(prev => [...new Set([...prev, ...registered])]);
      }
    } catch (e) {
      console.error("Failed to load registered users from localStorage", e);
    }
  }, []);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const isUserValid = allowedUsers.includes(username.toUpperCase());
      const isPasswordValid = password === CORRECT_PASSWORD;

      if (isUserValid && isPasswordValid) {
        onLoginSuccess();
      } else {
        setError('Usuário ou senha inválidos.');
        setIsLoading(false);
      }
    }, 500);
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    setTimeout(() => {
        const trimmedUser = username.trim();
        if (!trimmedUser) {
            setError('O nome de usuário não pode estar vazio.');
            setIsLoading(false);
            return;
        }

        if (password !== CORRECT_PASSWORD) {
            setError("A senha para cadastro deve ser exatamente 'Ampla@#1'.");
            setIsLoading(false);
            return;
        }

        const upperUser = trimmedUser.toUpperCase();
        if (allowedUsers.includes(upperUser)) {
            setError('Este nome de usuário já existe.');
            setIsLoading(false);
            return;
        }

        try {
            const storedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
            const currentRegistered = storedUsers ? JSON.parse(storedUsers) : [];
            const updatedRegistered = [...currentRegistered, upperUser];
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedRegistered));

            // Automatically log in the new user
            onLoginSuccess();

        } catch (err) {
            console.error("Error saving new user:", err);
            setError('Ocorreu um erro ao salvar o novo usuário.');
            setIsLoading(false);
        }

    }, 500);
  };
  
  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError(null);
      setUsername('');
      setPassword('');
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
            <LogoIcon className="w-10 h-10 text-teal-500" />
            <h1 className="text-3xl font-bold ml-3 text-slate-800 dark:text-slate-100">ConciliaFácil</h1>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200">
            {isRegistering ? 'Cadastro' : 'Login'}
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            {isRegistering ? 'Crie uma nova conta.' : 'Acesse sua conta para continuar.'}
          </p>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Usuário
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 px-3 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm"
                  placeholder="Seu nome de usuário"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 px-3 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm"
                  placeholder="Sua senha"
                />
                {isRegistering && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">A senha deve ser <code className="font-mono bg-slate-200 dark:bg-slate-700 p-0.5 rounded">Ampla@#1</code></p>}
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:bg-teal-400 disabled:cursor-not-allowed"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Cadastrar e Entrar' : 'Entrar')}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={toggleMode} className="text-sm font-medium text-teal-600 hover:text-teal-500 dark:text-teal-500 dark:hover:text-teal-400">
                {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;