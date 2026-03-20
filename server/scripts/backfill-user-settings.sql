-- Backfill user_system_details for existing users who don't have settings yet
-- This handles users created before the registration workflow was updated

INSERT INTO cubcha_v1.user_system_details (user_id, user_language, default_max_chat_participants, public_st, user_timezone, last_login_at)
SELECT 
    u.user_id,
    'en' as user_language,
    10 as default_max_chat_participants,
    TRUE as public_st,
    'UTC' as user_timezone,
    u.last_login_at
FROM cubcha_v1.user_main_details u
LEFT JOIN cubcha_v1.user_system_details s ON u.user_id = s.user_id
WHERE s.user_id IS NULL;

-- Check results
SELECT COUNT(*) as backfilled_users FROM cubcha_v1.user_system_details;
