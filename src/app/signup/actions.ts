'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SignupSchema = z.object({
  full_name: z.string().min(2, 'Bitte vollständigen Namen eingeben.').max(200),
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z
    .string()
    .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.')
    .max(100),
  role_choice: z.enum(['owner', 'sanierer', 'insurance_agent']),
});

export type SignupFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signupAction(
  _prev: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const parsed = SignupSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role_choice: formData.get('role_choice'),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { full_name, email, password, role_choice } = parsed.data;

  const ROLE_TO_DB: Record<string, string> = {
    owner: 'versicherung',
    sanierer: 'sanierer',
    insurance_agent: 'versicherung',
  };
  const dbRole = ROLE_TO_DB[role_choice] ?? role_choice;

  const supabase = await createClient();

  const {
    data,
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !data.user) {
    return {
      success: false,
      message: 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.',
    };
  }

  await supabase.from('profiles').insert({
    id: data.user.id,
    full_name,
    role: dbRole,
  });

  // Erfolg: Hinweis auf E-Mail-Bestätigung.
  return {
    success: true,
    message:
      'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.',
  };
}

