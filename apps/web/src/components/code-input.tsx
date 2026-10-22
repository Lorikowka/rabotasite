'use client';

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface CodeInputProps {
  /** Склеенное значение кода (только цифры). */
  value: string;
  onChange: (value: string) => void;
  /** Количество отдельных полей. */
  length?: number;
  /** Ставить фокус в первое поле при появлении. */
  autoFocus?: boolean;
  disabled?: boolean;
  /** Подпись группы полей. */
  label?: string;
  /** Ошибка под полями. */
  error?: string | null;
}

/**
 * Поле ввода кода из нескольких однозначных инпутов.
 * Значение наружу отдаётся одной склеенной строкой цифр.
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  disabled = false,
  label = 'Код подтверждения',
  error = null,
}: CodeInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.slice(0, length).split('');

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    const element = inputsRef.current[clamped];
    if (!element) return;
    element.focus();
    element.select();
  };

  // Первый пустой бокс получает фокус, когда компонент появляется.
  useEffect(() => {
    if (!autoFocus) return;
    focusAt(digits.length < length ? digits.length : length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, length]);

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      // Поле очистили — убираем цифру и подтягиваем соседние влево.
      const next = value.slice(0, index) + value.slice(index + 1);
      onChange(next);
      focusAt(Math.max(0, index - 1));
      return;
    }

    const chars = clean.split('');
    const before = value.slice(0, index);
    const after = value.slice(index + chars.length);
    const next = (before + chars.join('') + after).slice(0, length);
    onChange(next);
    focusAt(Math.min(index + chars.length, length - 1));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value) return; // непустое поле очистит сам браузер
      event.preventDefault();
      if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    const chars = text.split('').slice(0, length - index);
    const before = value.slice(0, index);
    const after = value.slice(index + chars.length);
    onChange((before + chars.join('') + after).slice(0, length));
    focusAt(Math.min(index + chars.length, length - 1));
  };

  return (
    <div role="group" aria-label={label}>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            value={digits[index] ?? ''}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            aria-label={`Цифра ${index + 1} из ${length}`}
            aria-invalid={error ? true : undefined}
            className={`h-12 w-full rounded-xl border bg-canvas text-center text-lg font-bold text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${
              error ? 'border-rose-300' : 'border-brand-100'
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
