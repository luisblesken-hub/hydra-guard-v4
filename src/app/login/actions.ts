'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserRedirect } from '@/lib/auth/get-user-redirect';

const LoginSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z.string().min(1, 'Bitte dein Passwort eingeben.'),
});

export type LoginFormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !user) {
    return {
      success: false,
      message: 'E-Mail oder Passwort ist falsch.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const target = getUserRedirect(profile?.role ?? null);
  redirect(target);
}

