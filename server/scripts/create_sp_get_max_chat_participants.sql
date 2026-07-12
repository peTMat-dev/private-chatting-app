-- Stored procedure to get default max chat participants for a user
CREATE DEFINER=`admin`@`localhost` PROCEDURE `messages_2get_max_chat_participants`(
    IN p_user_id SMALLINT UNSIGNED
)
BEGIN
    SELECT usd.default_max_chat_participants
    FROM user_system_details usd
    WHERE usd.user_id = p_user_id
    LIMIT 1;
END
