-- =====================================================================
-- STEP 1: Drop all foreign keys
-- =====================================================================

ALTER TABLE `archived_conversations_participants`
    DROP FOREIGN KEY `archived_conversations_participants_ibfk_1`,
    DROP FOREIGN KEY `archived_conversations_participants_ibfk_2`;

ALTER TABLE `archived_group_members`
    DROP FOREIGN KEY `archived_group_members_ibfk_1`,
    DROP FOREIGN KEY `archived_group_members_ibfk_2`;

ALTER TABLE `archived_messages`
    DROP FOREIGN KEY `archived_messages_ibfk_1`,
    DROP FOREIGN KEY `archived_messages_ibfk_2`;

ALTER TABLE `archived_user_groups`
    DROP FOREIGN KEY `archived_user_groups_ibfk_1`;

ALTER TABLE `blocked_users`
    DROP FOREIGN KEY `blocked_users_ibfk_1`,
    DROP FOREIGN KEY `blocked_users_ibfk_2`;

ALTER TABLE `contacts`
    DROP FOREIGN KEY `contacts_ibfk_1`,
    DROP FOREIGN KEY `contacts_ibfk_2`;

ALTER TABLE `contacts_requests`
    DROP FOREIGN KEY `contacts_requests_ibfk_1`,
    DROP FOREIGN KEY `contacts_requests_ibfk_2`;

ALTER TABLE `conversations`
    DROP FOREIGN KEY `conversations_ibfk_1`,
    DROP FOREIGN KEY `conversations_ibfk_2`;

ALTER TABLE `conversations_participants`
    DROP FOREIGN KEY `conversations_participants_ibfk_1`,
    DROP FOREIGN KEY `conversations_participants_ibfk_2`;

ALTER TABLE `group_members`
    DROP FOREIGN KEY `group_members_ibfk_1`,
    DROP FOREIGN KEY `group_members_ibfk_2`;

ALTER TABLE `messages`
    DROP FOREIGN KEY `messages_ibfk_1`,
    DROP FOREIGN KEY `messages_ibfk_2`;

ALTER TABLE `password_resets`
    DROP FOREIGN KEY `password_resets_ibfk_1`;

ALTER TABLE `password_reset_alarms`
    DROP FOREIGN KEY `password_reset_alarms_ibfk_1`;

ALTER TABLE `user_groups`
    DROP FOREIGN KEY `user_groups_ibfk_1`;

ALTER TABLE `user_system_details`
    DROP FOREIGN KEY `user_system_details_ibfk_1`,
    DROP FOREIGN KEY `user_system_details_ibfk_2`;

-- =====================================================================
-- STEP 2: Modify all integer columns to UNSIGNED
-- =====================================================================

ALTER TABLE `user_main_details`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key for users';

ALTER TABLE `user_system_details`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id',
    MODIFY COLUMN `default_max_chat_participants` SMALLINT UNSIGNED DEFAULT 10 COMMENT 'Default max chat participants for new conversations';

ALTER TABLE `contacts`
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who owns this contact',
    MODIFY COLUMN `contact_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who is the contact';

ALTER TABLE `contacts_requests`
    MODIFY COLUMN `request_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `requester_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `target_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `blocked_users`
    MODIFY COLUMN `blocker_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `blocked_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `user_groups`
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `group_members`
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `member_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `conversations`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `max_participants` SMALLINT UNSIGNED DEFAULT NULL,
    MODIFY COLUMN `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED DEFAULT NULL;

ALTER TABLE `conversations_participants`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `messages`
    MODIFY COLUMN `message_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `sender_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `archived_conversations`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `max_participants` SMALLINT UNSIGNED DEFAULT NULL,
    MODIFY COLUMN `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED DEFAULT NULL;

ALTER TABLE `archived_conversations_participants`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `archived_messages`
    MODIFY COLUMN `archive_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `message_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `sender_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `archived_user_groups`
    MODIFY COLUMN `archived_group_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `archived_group_members`
    MODIFY COLUMN `archived_group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `member_user_id` SMALLINT UNSIGNED NOT NULL;

ALTER TABLE `timezones`
    MODIFY COLUMN `timezone_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `password_resets`
    MODIFY COLUMN `resetoken_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id';

ALTER TABLE `password_reset_alarms`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id';

-- =====================================================================
-- STEP 3: Re-add all foreign keys (with original ON DELETE/UPDATE rules)
-- =====================================================================

ALTER TABLE `archived_conversations_participants`
    ADD CONSTRAINT `archived_conversations_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `archived_conversations` (`conversation_id`),
    ADD CONSTRAINT `archived_conversations_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `archived_group_members`
    ADD CONSTRAINT `archived_group_members_ibfk_1` FOREIGN KEY (`archived_group_id`) REFERENCES `archived_user_groups` (`archived_group_id`),
    ADD CONSTRAINT `archived_group_members_ibfk_2` FOREIGN KEY (`member_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `archived_messages`
    ADD CONSTRAINT `archived_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `archived_conversations` (`conversation_id`),
    ADD CONSTRAINT `archived_messages_ibfk_2` FOREIGN KEY (`sender_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `archived_user_groups`
    ADD CONSTRAINT `archived_user_groups_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `blocked_users`
    ADD CONSTRAINT `blocked_users_ibfk_1` FOREIGN KEY (`blocker_user_id`) REFERENCES `user_main_details` (`user_id`),
    ADD CONSTRAINT `blocked_users_ibfk_2` FOREIGN KEY (`blocked_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `contacts`
    ADD CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `user_main_details` (`user_id`),
    ADD CONSTRAINT `contacts_ibfk_2` FOREIGN KEY (`contact_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `contacts_requests`
    ADD CONSTRAINT `contacts_requests_ibfk_1` FOREIGN KEY (`requester_user_id`) REFERENCES `user_main_details` (`user_id`),
    ADD CONSTRAINT `contacts_requests_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `conversations`
    ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`creator_user_id`) REFERENCES `user_main_details` (`user_id`),
    ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`group_id`);

ALTER TABLE `conversations_participants`
    ADD CONSTRAINT `conversations_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`),
    ADD CONSTRAINT `conversations_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `group_members`
    ADD CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`group_id`),
    ADD CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`member_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `messages`
    ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`),
    ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `password_resets`
    ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_main_details` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `password_reset_alarms`
    ADD CONSTRAINT `password_reset_alarms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_main_details` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_groups`
    ADD CONSTRAINT `user_groups_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `user_main_details` (`user_id`);

ALTER TABLE `user_system_details`
    ADD CONSTRAINT `user_system_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_main_details` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `user_system_details_ibfk_2` FOREIGN KEY (`user_timezone`) REFERENCES `timezones` (`timezone_name`);

-- =====================================================================
-- STEP 4: Create the new infos table
-- =====================================================================

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`infos` (
    `info_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key for manual info entries',
    `heading_cube` VARCHAR(48) NOT NULL COMMENT 'Heading for the manual section',
    `language_code` VARCHAR(8) NOT NULL DEFAULT 'en' COMMENT 'Language code (e.g., en, de)',
    `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Order of display for manual sections',
    `text_description` TEXT NOT NULL COMMENT 'Text of the manual section',
    PRIMARY KEY (`info_id`),
    UNIQUE KEY `uq_infos_heading_language` (`heading_cube`, `language_code`),
    KEY `idx_infos_language_order` (`language_code`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Manual information for users';
