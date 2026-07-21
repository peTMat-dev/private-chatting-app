-- Stored procedure to create a new 1-on-1 conversation with both participants
CREATE DEFINER=`admin`@`localhost` PROCEDURE `conversations_2create_new`(
    IN p_user_id SMALLINT UNSIGNED,
    IN p2_user_id SMALLINT UNSIGNED
)
BEGIN
    DECLARE v_conversation_id INT UNSIGNED;

    INSERT INTO conversations (creator_user_id, is_group, max_participants)
    VALUES (p_user_id, FALSE, 2);

    SET v_conversation_id = LAST_INSERT_ID();

    INSERT INTO conversations_participants (conversation_id, user_id)
    VALUES (v_conversation_id, p_user_id), (v_conversation_id, p2_user_id);

    SELECT v_conversation_id AS conversation_id,
           (SELECT display_name FROM user_main_details WHERE user_id = p2_user_id LIMIT 1) AS display_name;
END