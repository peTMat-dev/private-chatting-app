-- Stored procedure to get latest messages for a conversation to list the conversations for a user
CREATE DEFINER=`admin`@`localhost` PROCEDURE `conversations_2read_by_user`(
    IN p_user_id SMALLINT UNSIGNED
)
BEGIN
    SELECT c.conversation_id,
           c.title,
           c.is_group,
           lm.message_text AS last_message_text,
           DATE_FORMAT(CONVERT_TZ(lm.sent_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%sZ') AS last_message_at,
           (
             SELECT GROUP_CONCAT(DISTINCT umd.display_name SEPARATOR ', ')
             FROM conversations_participants cp2
             JOIN user_main_details umd ON umd.user_id = cp2.user_id
             WHERE cp2.conversation_id = c.conversation_id AND cp2.user_id <> p_user_id
           ) AS participants
    FROM conversations c
    JOIN conversations_participants cp ON cp.conversation_id = c.conversation_id
    LEFT JOIN messages lm ON lm.message_id = (
        SELECT m2.message_id
        FROM messages m2
        WHERE m2.conversation_id = c.conversation_id
        ORDER BY m2.sent_at DESC, m2.message_id DESC
        LIMIT 1
    )
    WHERE cp.user_id = p_user_id
ORDER BY c.conversation_id DESC;
END