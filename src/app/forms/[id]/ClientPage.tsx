'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  submittedAt: string;
  data: Record<string, any>;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  status: 'draft' | 'active' | 'archived';
  shareLink: string;
  createdAt: string;
  updatedAt: string;
  submissions: FormSubmission[];
}

const STORAGE_KEY = 'horsemanago-forms';

function isFieldEmpty(field: FormField, value: any): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (field.type === 'checkbox') {
    if (Array.isArray(value)) return value.length === 0;
    return !value;
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export default function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const forms: FormTemplate[] = raw ? JSON.parse(raw) : [];
    const found = forms.find((f) => f.id === id) || null;
    setForm(found);
    setLoading(false);
  }, [id]);

  const handleChange = (fieldId: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;

    for (const field of form.fields) {
      if (field.required && isFieldEmpty(field, values[field.id])) {
        alert(`Pole "${field.label}" jest wymagane`);
        return;
      }
    }

    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const forms: FormTemplate[] = raw ? JSON.parse(raw) : [];
    const submission: FormSubmission = {
      id: `sub-${Date.now()}`,
      formId: id as string,
      formName: form.name,
      submittedAt: new Date().toISOString().split('T')[0],
      data: Object.fromEntries(form.fields.map((field) => [field.label, values[field.id] ?? ''])),
      status: 'pending',
    };

    const updated = forms.map((f) =>
      f.id === id ? { ...f, submissions: [...f.submissions, submission] } : f
    );

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-oceanBlue animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex flex-col items-center justify-center p-6 text-center">
        <FileText className="w-16 h-16 text-marineBlue mb-4" />
        <h1 className="font-serif text-2xl font-bold text-deepNavy mb-2">Nie znaleziono formularza</h1>
        <p className="text-marineBlue mb-6">Link jest nieprawidłowy lub formularz został usunięty.</p>
        <Link href="/" className="text-oceanBlue hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Wróć do strony głównej
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-deepNavy mb-2">Dziękujemy!</h1>
        <p className="text-marineBlue mb-6 max-w-md">
          Formularz „{form.name}” został pomyślnie przesłany. Skontaktujemy się wkrótce.
        </p>
        <Link href="/" className="text-oceanBlue hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Wróć do strony głównej
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcticBlue via-white to-iceBlue">
      <header className="bg-white/80 backdrop-blur-sm border-b border-iceBlue sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-oceanBlue to-marineBlue flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-deepNavy">HORSEmanago</h1>
            <p className="text-xs text-marineBlue">Formularz zewnętrzny</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl border border-iceBlue p-6 md:p-10"
          >
            <div className="mb-8 border-b border-iceBlue pb-6">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-deepNavy mb-2">{form.name}</h1>
              {form.description && <p className="text-marineBlue">{form.description}</p>}
            </div>

            <div className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-deepNavy mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' || field.type === 'date') && (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={values[field.id] || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder}
                      value={values[field.id] || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm resize-none"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      required={field.required}
                      value={values[field.id] || ''}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-iceBlue focus:outline-none focus:ring-2 focus:ring-oceanBlue/40 text-deepNavy text-sm bg-white"
                    >
                      <option value="">Wybierz...</option>
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-iceBlue hover:bg-iceBlue/30 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name={field.id}
                            value={option}
                            required={field.required}
                            checked={values[field.id] === option}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="w-4 h-4 text-oceanBlue border-iceBlue focus:ring-oceanBlue"
                          />
                          <span className="text-sm text-deepNavy">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options && field.options.length > 0 ? (
                        field.options.map((option, idx) => (
                          <label key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-iceBlue hover:bg-iceBlue/30 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              value={option}
                              checked={((values[field.id] as string[]) || []).includes(option)}
                              onChange={(e) => {
                                const current = (values[field.id] as string[]) || [];
                                const next = e.target.checked ? [...current, option] : current.filter((v) => v !== option);
                                handleChange(field.id, next);
                              }}
                              className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                            />
                            <span className="text-sm text-deepNavy">{option}</span>
                          </label>
                        ))
                      ) : (
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-iceBlue hover:bg-iceBlue/30 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={!!values[field.id]}
                            onChange={(e) => handleChange(field.id, e.target.checked)}
                            className="w-4 h-4 rounded border-iceBlue text-oceanBlue focus:ring-oceanBlue"
                          />
                          <span className="text-sm text-deepNavy">Tak, zgadzam się</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-oceanBlue to-marineBlue text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Wyślij formularz
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
