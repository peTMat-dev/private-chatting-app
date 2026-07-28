// =============================================================================
// Auth Form Types (existing)
// =============================================================================

export interface LoginFormData {
	username: string;
	password: string;
}

export interface RegisterFormData {
	firstName: string;
	lastName: string;
	displayName: string;
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}

// =============================================================================
// Info Types (from auth/InfoFace.tsx - shared between auth and home cubes)
// =============================================================================

export type InfoItem = {
	heading_cube: string;
	text_description?: string;
	descriptions?: string[];
	created_at?: string;
};

export type ReportedBug = {
	bug_id: number;
	title: string;
	category: string;
	bug_description: string;
	created_at: string;
	display_name: string;
};

export type InfoTab = "update" | "manual" | "announcement" | "reported_bugs";

// =============================================================================
// Home Types (from home/types.ts)
// =============================================================================

export type ContactSummary = {
	id: number | string;
	name: string;
	lastMessage: string;
	isGroup: boolean;
};

export type ContactItem = {
	id: number;
	displayName: string;
	status_st: boolean;
	addedAt: string;
	isPublic: boolean;
};

export type ApiChatsResponse = {
	success: boolean;
	count?: number;
	personal?: Array<{ id: number; name: string; lastMessage: string; isGroup: boolean }>;
	groups?: Array<{ id: number; name: string; lastMessage: string; isGroup: boolean }>;
	error?: string;
};

export type ApiContactsResponse = {
	success: boolean;
	count?: number;
	data?: ContactItem[];
	error?: string;
};

export type PublicUser = {
	id: number;
	displayName: string;
	isAlreadyContact: boolean;
	canBeAddedToContacts: boolean;
	hasPendingRequest: boolean;
};

export type ContactRequest = {
	requestId: number;
	userId: number;
	displayName: string;
	requestedAt: string;
};

export type MemberGroup = {
	groupId: number;
	groupName: string;
	ownerId: number;
	ownerDisplayName: string;
};

export type ContactGroup = {
	id: number;
	name: string;
	memberIds: number[];
};

export type ApiPublicUsersResponse = {
	success: boolean;
	count?: number;
	data?: PublicUser[];
	error?: string;
	message?: string;
};

export type UserSettings = {
	user_language: string;
	default_max_chat_participants: number;
	public_st: boolean;
	user_timezone: string;
	can_be_added_to_contacts: boolean;
	system_color_theme: 'light' | 'dark';
	cube_color?: string;
	cube_color2?: string;
	display_name?: string;
};

export type ApiSettingsResponse = {
	success: boolean;
	data?: UserSettings;
	error?: string;
};

export type ApiTimezonesResponse = {
	success: boolean;
	data?: Array<{ timezone_name: string; display_name: string }>;
	error?: string;
};

export type ChatMessage = {
	messageId: number;
	text: string;
	senderUserId: number;
	senderDisplayName: string;
	sentAt: string;
	isOwn: boolean;
};

// =============================================================================
// Dialog Types (NEW - from home/page.tsx inline types)
// =============================================================================

export type ConfirmDialog = {
	show: boolean;
	message: string;
	onConfirm: () => void;
};

export type AlertDialog = {
	show: boolean;
	message: string;
	title?: string;
};

// =============================================================================
// Socket Event Payload Types (NEW - documented from server routes)
// =============================================================================

export type ContactApprovedPayload = {
	userId: number;
	displayName: string;
};

export type NewMessagePayload = {
	conversationId: number;
	messageId: number;
	text: string;
	senderUserId: number;
	senderDisplayName: string;
	sentAt: string;
};

// Socket event map for type-safe listeners
export interface SocketEventMap {
	contact_approved: ContactApprovedPayload;
	new_message: NewMessagePayload;
}

// =============================================================================
// API Response Types for Contacts
// =============================================================================

export type ApiContactRequestsResponse = {
	success: boolean;
	incoming?: ContactRequest[];
	outgoing?: ContactRequest[];
	error?: string;
};

export type ApiContactGroupsResponse = {
	success: boolean;
	data?: ContactGroup[];
	error?: string;
};

export type ApiWhoseContactAmIResponse = {
	success: boolean;
	data?: MemberGroup[];
	error?: string;
};

export type ApiMessagesResponse = {
	success: boolean;
	data?: ChatMessage[];
	error?: string;
};