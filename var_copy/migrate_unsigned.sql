SET FOREIGN_KEY_CHECKS=0;

-- user_main_details
ALTER TABLE `cubcha_v1`.`user_main_details`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key for users';

-- user_system_details
ALTER TABLE `cubcha_v1`.`user_system_details`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id',
    MODIFY COLUMN `default_max_chat_participants` SMALLINT UNSIGNED DEFAULT 10 COMMENT 'Default max chat participants for new conversations';

-- contacts
ALTER TABLE `cubcha_v1`.`contacts`
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who owns this contact',
    MODIFY COLUMN `contact_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who is the contact';

-- contacts_requests
ALTER TABLE `cubcha_v1`.`contacts_requests`
    MODIFY COLUMN `request_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `requester_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `target_user_id` SMALLINT UNSIGNED NOT NULL;

-- blocked_users
ALTER TABLE `cubcha_v1`.`blocked_users`
    MODIFY COLUMN `blocker_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `blocked_user_id` SMALLINT UNSIGNED NOT NULL;

-- user_groups
ALTER TABLE `cubcha_v1`.`user_groups`
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL;

-- group_members
ALTER TABLE `cubcha_v1`.`group_members`
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `member_user_id` SMALLINT UNSIGNED NOT NULL;

-- conversations
ALTER TABLE `cubcha_v1`.`conversations`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `max_participants` SMALLINT UNSIGNED DEFAULT NULL,
    MODIFY COLUMN `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED DEFAULT NULL;

-- conversations_participants
ALTER TABLE `cubcha_v1`.`conversations_participants`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL;

-- messages
ALTER TABLE `cubcha_v1`.`messages`
    MODIFY COLUMN `message_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `sender_user_id` SMALLINT UNSIGNED NOT NULL;

-- archived_conversations
ALTER TABLE `cubcha_v1`.`archived_conversations`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `max_participants` SMALLINT UNSIGNED DEFAULT NULL,
    MODIFY COLUMN `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED DEFAULT NULL;

-- archived_conversations_participants
ALTER TABLE `cubcha_v1`.`archived_conversations_participants`
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL;

-- archived_messages
ALTER TABLE `cubcha_v1`.`archived_messages`
    MODIFY COLUMN `archive_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `message_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `conversation_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `sender_user_id` SMALLINT UNSIGNED NOT NULL;

-- archived_user_groups
ALTER TABLE `cubcha_v1`.`archived_user_groups`
    MODIFY COLUMN `archived_group_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `owner_user_id` SMALLINT UNSIGNED NOT NULL;

-- archived_group_members
ALTER TABLE `cubcha_v1`.`archived_group_members`
    MODIFY COLUMN `archived_group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `group_id` INT UNSIGNED NOT NULL,
    MODIFY COLUMN `member_user_id` SMALLINT UNSIGNED NOT NULL;

-- timezones
ALTER TABLE `cubcha_v1`.`timezones`
    MODIFY COLUMN `timezone_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- password_resets
ALTER TABLE `cubcha_v1`.`password_resets`
    MODIFY COLUMN `resetoken_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id';

-- password_reset_alarms
ALTER TABLE `cubcha_v1`.`password_reset_alarms`
    MODIFY COLUMN `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id';

-- CREATE new infos table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`infos` (
    `info_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT 'Primary key for manual info entries',
    `heading_cube` VARCHAR(48) NOT NULL COMMENT 'Heading for the manual section',
    `language_code` VARCHAR(8) NOT NULL DEFAULT 'en' COMMENT 'Language code for the manual section (e.g., en, de)',
    `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Order of display for manual sections',
    `text_description` TEXT NOT NULL COMMENT 'Text of the manual section',
    UNIQUE KEY `uq_infos_heading_language` (`heading_cube`, `language_code`),
    KEY `idx_infos_language_order` (`language_code`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Manual information for users';

SET FOREIGN_KEY_CHECKS=1;
