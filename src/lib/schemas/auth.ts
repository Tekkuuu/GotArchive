import { z } from 'zod/v4';

export const LoginFormSchema = z.object({
	email: z.email('Please enter a valid email address.'),
	password: z.string().min(1, 'Password is required.')
});

export const RegisterFormSchema = z.object({
	name: z.string().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
	email: z.email('Please enter a valid email address.'),
	password: z.string().min(8, 'Password must be at least 8 characters.'),
	registrationCode: z.string().min(1, 'Registration code is required.')
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;
