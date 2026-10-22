'use client';

import { useState, type ChangeEvent } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Инпут номера телефона под РФ: фиксированный префикс +7, только 10 цифр.
 * На выходе отдаём в формате +7XXXXXXXXXX, совместимый с существующей валидацией бэка.
 */
export function PhoneInput({
  value,
  onChange,
  id = 'phone',
  required = false,
  autoComplete = 'tel',
  className = '',
  placeholder = 'XXX XXX XX XX',
}: PhoneInputProps) {
  // Преобразуем любой формат (+7, 8, 7) в массив из 10 цифр
  const digitsOnly = value.replace(/\D/g, '');
  // `value` хранится в каноническом виде +7XXXXXXXXXX. Раньше короткое
  // значение вроде +71 не распознавалось как префикс, поэтому 7 попадала
  // обратно в поле и начинала дублироваться при удалении цифр.
  let localDigits = value.trim().startsWith('+7')
    ? digitsOnly.slice(1)
    : digitsOnly;
  if (!value.trim().startsWith('+7') && localDigits.length >= 11 && ['7', '8'].includes(localDigits[0] ?? '')) {
    localDigits = localDigits.slice(1);
  }
  localDigits = localDigits.slice(0, 10);

  const [focused, setFocused] = useState(false);

  const formatDisplay = (digits: string) => {
    if (digits.length === 0) return '';
    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 10));
    return parts.join(' ');
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, '').slice(0, 10);
    if (input.length === 0) {
      onChange('');
      return;
    }
    onChange(`+7${input}`);
  };

  const displayValue = focused || localDigits.length > 0 ? formatDisplay(localDigits) : '';

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-brand-100 bg-canvas px-3 py-2.5 ${className}`}>
      <span className="select-none text-sm font-semibold text-ink-700">+7</span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        pattern="[0-9 ]*"
        maxLength={13}
        required={required}
        className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
      />
    </div>
  );
}
