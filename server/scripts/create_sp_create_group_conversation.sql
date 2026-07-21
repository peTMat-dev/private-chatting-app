-- Stored procedure to create a new group conversation with all participants
-- p_participant_ids is a comma-separated string of user IDs (e.g. "1,5,12")
-- The creator is automatically added as a participant
CREATE DEFINER=`admin`@`localhost` PROCEDURE `conversations_2create_group`(
    IN p_creator_id SMALLINT UNSIGNED,
    IN p_title VARCHAR(32),
    IN p_participant_ids TEXT
)
BEGIN
    DECLARE v_conversation_id INT UNSIGNED;
    DECLARE v_max_participants SMALLINT UNSIGNED;
    DECLARE v_all_ids TEXT;
    DECLARE v_values TEXT;
    DECLARE v_sql TEXT;
    DECLARE v_count INT;
    DECLARE v_idx INT DEFAULT 1;
    DECLARE v_pos INT;
    DECLARE v_id VARCHAR(10);

    -- Get creator's max participants setting (same logic as messages_2get_max_chat_participants)
    SELECT COALESCE(
        (SELECT usd.default_max_chat_participants
         FROM user_system_details usd
         WHERE usd.user_id = p_creator_id
         LIMIT 1),
        50
    ) INTO v_max_participants;

    -- Insert the group conversation
    INSERT INTO conversations (creator_user_id, is_group, title, max_participants)
    VALUES (p_creator_id, TRUE, p_title, v_max_participants);

    SET v_conversation_id = LAST_INSERT_ID();

    -- Build comma-separated list: creator_id + all participant_ids
    SET v_all_ids = CONCAT(CAST(p_creator_id AS CHAR), ',', p_participant_ids);

    -- Count how many IDs we have (number of commas + 1)
    SET v_count = LENGTH(v_all_ids) - LENGTH(REPLACE(v_all_ids, ',', '')) + 1;

    -- Build the VALUES clause: (conv_id, id1), (conv_id, id2), ...
    SET v_values = '';
    SET v_idx = 1;

    WHILE v_idx <= v_count DO
        IF v_idx = 1 THEN
            SET v_pos = LOCATE(',', v_all_ids);
            IF v_pos > 0 THEN
                SET v_id = SUBSTRING(v_all_ids, 1, v_pos - 1);
                SET v_all_ids = SUBSTRING(v_all_ids, v_pos + 1);
            ELSE
                SET v_id = v_all_ids;
            END IF;
        ELSE
            SET v_pos = LOCATE(',', v_all_ids);
            IF v_pos > 0 THEN
                SET v_id = SUBSTRING(v_all_ids, 1, v_pos - 1);
                SET v_all_ids = SUBSTRING(v_all_ids, v_pos + 1);
            ELSE
                SET v_id = v_all_ids;
            END IF;
        END IF;

        IF v_values = '' THEN
            SET v_values = CONCAT('(', v_conversation_id, ',', TRIM(v_id), ')');
        ELSE
            SET v_values = CONCAT(v_values, ',(', v_conversation_id, ',', TRIM(v_id), ')');
        END IF;

        SET v_idx = v_idx + 1;
    END WHILE;

    -- Execute the dynamic INSERT
    SET v_sql = CONCAT('INSERT INTO conversations_participants (conversation_id, user_id) VALUES ', v_values);
    PREPARE stmt FROM v_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- Return the new conversation_id
    SELECT v_conversation_id AS conversation_id;
END