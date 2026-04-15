'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SignupSchema = z.object({
  full_name: z.string().min(2, 'Bitte vollständigen Namen eingeben.').max(200),
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z
    .string()
    .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.')
    .max(100),
  role_choice: z.enum(['owner', 'sanierer', 'versicherung']),
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
  // Align with DB enum values in `profiles.role`.
  const dbRole = role_choice;

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

  // Profile via Admin-Client (bypasst RLS).
  const admin = createAdminClient();
  const profilePayload: Record<string, string | null> = {
    id: data.user.id,
    email: data.user.email ?? email,
    role: dbRole,
  };
  // full_name nur setzen wenn die Spalte existiert (Migration 0004).
  // Via Type-Workaround, da database.types.ts evtl. noch nicht regeneriert.
  (profilePayload as Record<string, string | null>).full_name = full_name;
  await admin
    .from('profiles')
    .upsert(profilePayload as never, { onConflict: 'id' });

  // Erfolg: Hinweis auf E-Mail-Bestätigung.
  return {
    success: true,
    message:
      'Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse, bevor du dich anmeldest.',
  };
}

