import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Account } from '../types';

interface AccountSelectorProps {
  accounts: Account[];
  value: string | null;
  onChange: (accountId: string | null) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accounts, value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getAccountDisplay = useCallback((accountId: string | null) => {
    if (!accountId) return '';
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.id} - ${account.name}` : '';
  }, [accounts]);

  useEffect(() => {
    setInputValue(getAccountDisplay(value));
  }, [value, getAccountDisplay]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setInputValue(getAccountDisplay(value));
    }
  }, [wrapperRef, value, getAccountDisplay]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (newInputValue === '') {
        onChange(null);
    }
  };

  const handleSelect = (account: Account) => {
    setInputValue(getAccountDisplay(account.id));
    onChange(account.id);
    setIsOpen(false);
  };

  const filteredAccounts = inputValue
    ? accounts.filter(acc =>
        acc.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        acc.id.toLowerCase().includes(inputValue.toLowerCase())
      )
    : accounts;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) return;

      const exactIdMatch = accounts.find(acc => acc.id === inputValue.trim());
      if (exactIdMatch) {
          handleSelect(exactIdMatch);
          return;
      }

      if (filteredAccounts.length === 1) {
        handleSelect(filteredAccounts[0]);
        return;
      }
      
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(getAccountDisplay(value));
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar ou selecionar conta..."
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 bg-inherit text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6"
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border dark:border-slate-600">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((acc) => (
              <li
                key={acc.id}
                onClick={() => handleSelect(acc)}
                className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="block truncate font-normal">{acc.id} - {acc.name}</span>
              </li>
            ))
          ) : (
            <li className="relative cursor-default select-none py-2 px-4 text-slate-700 dark:text-slate-400">
              Nenhuma conta encontrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AccountSelector;
