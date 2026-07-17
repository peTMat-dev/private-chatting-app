import { postJson } from "../lib/api";
import { type LoginFormData, type RegisterFormData } from "../lib/formTypes";

export interface AuthSuccess {
	success: true;
	message?: string;
	user?: { username: string; user_language: string };
	resetUrl?: string;
}

export interface AuthFailure {
	success: false;
	error?: string;
	errors?: string[];
}

export type AuthResponse = AuthSuccess | AuthFailure;

export interface LoginResult {
	ok: boolean;
	data: AuthResponse;
}

export async function login(form: LoginFormData): Promise<LoginResult> {
	return postJson("/auth/login", form);
}

export async function register(form: RegisterFormData): Promise<LoginResult> {
	const payload = {
		firstName: form.firstName,
		lastName: form.lastName,
		displayName: form.displayName,
		username: form.username,
		email: form.email,
		password: form.password,
	};
	return postJson("/auth/register", payload);
}

export async function forgotPassword(email: string): Promise<LoginResult> {
	return postJson("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string): Promise<LoginResult> {
	return postJson("/auth/reset-password", { token, password });
}

export async function logout(): Promise<LoginResult> {
	return postJson("/auth/logout", {});
}