-- Stored procedure to get messages for a conversation
CREATE DEFINER=`admin`@`localhost` PROCEDURE `messages_2read_by_conversation`(
IN p_conversation_id INT UNSIGNED
)
BEGIN
  SELECT m.message_id, 
         m.message_text, 
         DATE_FORMAT(CONVERT_TZ(m.sent_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%sZ') AS sent_at,
         umd.display_name AS sender_display_name, 
         umd.user_id AS sender_user_id
  FROM messages m
  JOIN user_main_details umd ON umd.user_id = m.sender_user_id
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.sent_at ASC
  LIMIT 100;
END