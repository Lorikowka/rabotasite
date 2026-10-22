'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SKILL_PRESETS } from '@teenwork/shared';
import type { AuthResponse } from '@teenwork/shared';
import { ApiError, clientApi } from '@/lib/api';

export function ProfileEditor({ session, redirectAfterSave }: { session: AuthResponse; redirectAfterSave?: string }) {
  const router = useRouter();
  const isTeen = session.user.role === 'teen';
  const profile = isTeen ? session.teenProfile : session.employerProfile;

  const [bio, setBio] = useState(session.teenProfile?.bio ?? '');
  const [skills, setSkills] = useState<string[]>(session.teenProfile?.skills ?? []);
  const [schoolType, setSchoolType] = useState(session.teenProfile?.schoolType ?? '');
  const [schoolShift, setSchoolShift] = useState(session.teenProfile?.schoolShift ?? '');
  const [radiusKm, setRadiusKm] = useState(session.teenProfile?.radiusKm ?? 2);
  const [parentConsent, setParentConsent] = useState(session.teenProfile?.parentConsentUploaded ?? false);
  const [selfEmployed, setSelfEmployed] = useState(session.teenProfile?.isSelfEmployed ?? false);

  const [companyName, setCompanyName] = useState(session.employerProfile?.companyName ?? '');
  const [inn, setInn] = useState(session.employerProfile?.inn ?? '');
  const [description, setDescription] = useState(session.employerProfile?.description ?? '');

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'w-full rounded-xl border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400';

  const toggleSkill = (id: string) => {
    setSkills((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const save = async () => {
    setStatus('saving');
    setError(null);

    const payload = isTeen
      ? {
          bio: bio.trim() || undefined,
          skills: skills.length ? skills : undefined,
          schoolType: schoolType || undefined,
          schoolShift: schoolShift.trim() || undefined,
          radiusKm,
        }
      : {
          companyName: companyName.trim() || undefined,
          inn: inn.trim() || undefined,
          description: description.trim() || undefined,
        };

    try {
      await clientApi('/api/profile', { method: 'PATCH', body: JSON.stringify(payload) });
      setStatus('saved');
      if (redirectAfterSave) router.push(redirectAfterSave);
      else router.refresh();
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить профиль');
    }
  };

  return (
    <div className="space-y-4">
      {isTeen ? (
        <>
          <div>
            <label htmlFor="bio" className="mb-1 block text-xs font-semibold text-ink-600">
              О себе
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Учусь в 9 классе, свободен после 17:00, монтирую видео в CapCut"
              className={inputClass}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-600">Навыки</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_PRESETS.map((skill) => {
                const active = skills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-brand-100 bg-surface text-ink-600'
                    }`}
                  >
                    {skill.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="schoolType" className="mb-1 block text-xs font-semibold text-ink-600">
                Тип школы
              </label>
              <select
                id="schoolType"
                value={schoolType}
                onChange={(event) => setSchoolType(event.target.value)}
                className={inputClass}
              >
                <option value="">Не указано</option>
                <option value="school">Школа</option>
                <option value="gymnasium">Гимназия</option>
                <option value="college">Колледж</option>
              </select>
            </div>
            <div>
              <label htmlFor="schoolShift" className="mb-1 block text-xs font-semibold text-ink-600">
                Смена
              </label>
              <input
                id="schoolShift"
                value={schoolShift}
                onChange={(event) => setSchoolShift(event.target.value)}
                placeholder="1 смена"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="radius" className="mb-1 block text-xs font-semibold text-ink-600">
              Радиус поиска работы: {radiusKm} км
            </label>
            <input
              id="radius"
              type="range"
              min={1}
              max={10}
              step={1}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <label className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={parentConsent}
              disabled
              onChange={(event) => setParentConsent(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-brand-200"
            />
            <span>
              Согласие родителей загружено{' '}
              <span className="text-ink-500">
                (отметьте после заполнения PDF-бланка — он доступен в разделе «Документы»)
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-xl bg-canvas p-3 text-xs text-ink-700">
            <input
              type="checkbox"
              checked={selfEmployed}
              disabled
              onChange={(event) => setSelfEmployed(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-brand-200"
            />
            <span>
              Оформлен статус самозанятого (НПД) — 4% налог вместо 13%
            </span>
          </label>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="company" className="mb-1 block text-xs font-semibold text-ink-600">
              Название компании
            </label>
            <input
              id="company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="inn" className="mb-1 block text-xs font-semibold text-ink-600">
              ИНН
            </label>
            <input
              id="inn"
              value={inn}
              onChange={(event) => setInn(event.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="companyDescription" className="mb-1 block text-xs font-semibold text-ink-600">
              О компании
            </label>
            <textarea
              id="companyDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Кофейня в центре, 2 смены, обучение на месте"
              className={inputClass}
            />
          </div>
        </>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === 'saving'}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {status === 'saving' ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {status === 'saved' && (
          <span className="text-xs font-semibold text-emerald-600">Сохранено ✓</span>
        )}
      </div>

      {profile === null && !isTeen && (
        <p className="text-xs text-ink-500">Профиль заказчика пока не заполнен.</p>
      )}
    </div>
  );
}
