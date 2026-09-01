SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `cubcha_v1` DEFAULT CHARACTER SET utf8mb4;
USE `cubcha_v1`;

-- Create a user details 
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_main_details` (
    `user_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT 'Primary key for users',
    `ldap_uid_id` VARCHAR(32) NOT NULL UNIQUE COMMENT 'Unique LDAP user ID (immutable)',
    `display_name` VARCHAR(48) NOT NULL COMMENT 'User-chosen public display name',
    `last_seen_at` TIMESTAMP DEFAULT NULL COMMENT 'Last time user was seen online',
    `last_login_at` DATETIME DEFAULT NULL COMMENT 'Last login timestamp, admin purpose',
    `active` TINYINT(1) DEFAULT 0 COMMENT 'Indicates if the user account is deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores main user details';

-- Create a table for disabled user details, not created in live db yet. 
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_main_details_disabled` (
    `user_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL COMMENT 'Primary key for disabled users, matches user_id from user_main_details',
    `disabled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when user was disabled',
    `last_login_at` DATETIME DEFAULT NULL COMMENT 'Last login timestamp, admin purpose'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores details of disabled users to purge the database + activates archiving -NYI';

-- Create a table for banned users, not created in live db yet.
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`banned_users` (
    `ban_id` SMALLINT UNSIGNED PRIMARY KEY,
    `email_hash` VARCHAR(64) NOT NULL COMMENT 'HMAC-SHA256 of email, if available',
    `ban_expires_at` DATETIME DEFAULT NULL COMMENT 'NULL = permanent',
    `banned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ban_reason` VARCHAR(255) DEFAULT NULL COMMENT 'Admin notes, no PII',
    UNIQUE KEY `unique_email_hash` (`email_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Banned user identifiers — hashed only, no recoverable PII';

-- Create user system details for profile setting
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`timezones` (
    `timezone_id` SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `timezone_name` VARCHAR(64) NOT NULL UNIQUE,  -- e.g., 'Europe/Amsterdam'
    `utc_offset` VARCHAR(8) NOT NULL,             -- e.g., '+01:00'
    `display_name` VARCHAR(64) NOT NULL,          -- e.g., 'Amsterdam (UTC+1)'
    KEY `idx_display_name` (`display_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_system_details` (
    `user_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL COMMENT 'FK to user_main_details.user_id',
    `user_language` ENUM('en', 'sk', 'es', 'fr', 'de', 'cz') NOT NULL COMMENT 'Preferred language for UI',
    `system_color_theme` ENUM('light', 'dark', 'beige') NOT NULL DEFAULT 'dark' COMMENT 'User preferred color theme ',
    `cube_color` VARCHAR(7) DEFAULT '#06ec90' COMMENT 'User cube accent color (hex code or preset name)',
    `cube_color2` VARCHAR(7) DEFAULT '#06ec90' COMMENT 'User cube color (hex code or preset name)',
    `default_max_chat_participants` TINYINT UNSIGNED DEFAULT 10 COMMENT 'Default max chat participants for new conversations',
    `public_st` BOOLEAN DEFAULT TRUE COMMENT 'Indicates if the user profile is public(on) or private (off)',
    `can_be_added_to_contacts` BOOLEAN DEFAULT FALSE COMMENT 'Indicates if the user can be added to contacts',
    `user_timezone` VARCHAR(32) DEFAULT 'UTC' COMMENT 'User timezone string',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Profile creation timestamp',
    `updated_at` DATETIME DEFAULT NULL on UPDATE CURRENT_TIMESTAMP COMMENT 'Last profile update timestamp',
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_timezone`) REFERENCES `cubcha_v1`.`timezones`(`timezone_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores user profile and system settings';


CREATE TABLE IF NOT EXISTS `cubcha_v1`.`contacts` (
    `owner_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who owns this contact',
    `contact_user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'User who is the contact',
    `status_st` BOOLEAN DEFAULT TRUE COMMENT 'Contact status added/removed or closed account)',
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When contact was added',
    --`c_group_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK to user_groups.group_ug_id for contact grouping',
    PRIMARY KEY (`owner_user_id`, `contact_user_id`),
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`contact_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    --FOREIGN KEY (`c_group_id`) REFERENCES `cubcha_v1`.`user_groups`(`group_ug_id`) REMOVED BOTH AS limits no. of groups to one per user
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores user-to-user contacts';

-- to finish this table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`contacts_requests` (
    `request_id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    -- Only one active (pending) request allowed per user pair. Unique key on (requester_user_id, target_user_id, status)
    -- allows new requests after approval/rejection, but prevents duplicate pending requests.
    `requester_user_id` SMALLINT UNSIGNED NOT NULL,  -- Who sent request (FK to user_id)
    `target_user_id` SMALLINT UNSIGNED NOT NULL,     -- Who receives request (FK to user_id)
    `status_st` ENUM('pending','approved','rejected','cancelled','removed') DEFAULT 'pending',
    `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `responded_at` DATETIME NULL DEFAULT NULL,
    `removed_at` DATETIME NULL,
    CONSTRAINT `cr_fk_requester` FOREIGN KEY (`requester_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `cr_fk_target` FOREIGN KEY (`target_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `unique_pending_request` (`requester_user_id`, `target_user_id`, `status_st`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`contacts_blocked_users` (
    `blocker_user_id` SMALLINT UNSIGNED NOT NULL,      -- the user who is blocking
    `blocked_user_id` SMALLINT UNSIGNED NOT NULL,      -- the user being blocked
    `blocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`blocker_user_id`, `blocked_user_id`),
    FOREIGN KEY (`blocker_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`blocked_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_groups` (
    `group_ug_id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `group_name` VARCHAR(32) NOT NULL,
    `owner_user_id` SMALLINT UNSIGNED NOT NULL,   -- user_id of the group owner
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`group_members` (
    `group_gm_id` INT UNSIGNED NOT NULL,
    `member_user_id` SMALLINT UNSIGNED NOT NULL,
    `is_admin` BOOLEAN DEFAULT FALSE,
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`group_gm_id`, `member_user_id`),
    FOREIGN KEY (`group_gm_id`) REFERENCES `cubcha_v1`.`user_groups`(`group_ug_id`),
    FOREIGN KEY (`member_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conversations table (with optional link to user_groups.)
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`conversations` (
    `conversation_id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `max_participants` SMALLINT UNSIGNED DEFAULT NULL, -- value set in user_system table
    `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `is_group` BOOLEAN DEFAULT FALSE,
    `title` VARCHAR(32) DEFAULT NULL,
    `group_id` INT UNSIGNED DEFAULT NULL,
    `last_message_id` INT UNSIGNED DEFAULT NULL,
    FOREIGN KEY (`creator_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`group_id`) REFERENCES `cubcha_v1`.`user_groups`(`group_ug_id`)
    ,KEY `idx_conversations_creator` (`creator_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conversation participants table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`conversations_participants` (
    `conversation_id` INT UNSIGNED NOT NULL,
    `user_id` SMALLINT UNSIGNED NOT NULL,
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`conversation_id`, `user_id`),
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`conversations`(`conversation_id`),
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_participant_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`messages` (
    `message_id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `conversation_id` INT UNSIGNED NOT NULL,
    `sender_user_id` SMALLINT UNSIGNED NOT NULL,
    `sender_username` VARCHAR(32) NOT NULL, -- denormalized for fast display
    `sender_avatar_url` VARCHAR(255) DEFAULT NULL, -- denormalized for fast display
    `message_text` TEXT NOT NULL,
    `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`conversations`(`conversation_id`),
    FOREIGN KEY (`sender_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_messages_conv_sent` (`conversation_id`, `sent_at`)
    ,KEY `idx_messages_sender` (`sender_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_conversations` (
    `conversation_id` INT UNSIGNED PRIMARY KEY,
    `max_participants` SMALLINT UNSIGNED DEFAULT NULL,
    `creator_user_id` SMALLINT UNSIGNED NOT NULL,
    `created_at` DATETIME NOT NULL,
    `is_group` BOOLEAN DEFAULT FALSE,
    `title` VARCHAR(32) DEFAULT NULL,
    `group_id` INT UNSIGNED DEFAULT NULL,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    ,KEY `idx_archived_conversations_creator` (`creator_user_id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_messages` (
    `archive_id` INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `message_id` INT UNSIGNED NOT NULL,
    `conversation_id` INT UNSIGNED NOT NULL,
    `sender_user_id` SMALLINT UNSIGNED NOT NULL,
    `sender_username` VARCHAR(32) NOT NULL, -- denormalized for fast display
    `sender_avatar_url` VARCHAR(255) DEFAULT NULL, -- denormalized for fast display
    `message_text` TEXT NOT NULL,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP, -- to keep this column?
    `sent_at` DATETIME NOT NULL,
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`archived_conversations`(`conversation_id`),
    FOREIGN KEY (`sender_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_archived_messages_conv_sent` (`conversation_id`, `archived_at`)
    ,KEY `idx_archived_messages_sender` (`sender_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_conversations_participants` (
    `conversation_id` INT UNSIGNED NOT NULL,
    `user_id` SMALLINT UNSIGNED NOT NULL,
    `joined_at` DATETIME NOT NULL,
    PRIMARY KEY (`conversation_id`, `user_id`),
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`archived_conversations`(`conversation_id`),
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_archived_participant_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_user_groups` (
    archived_group_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `group_id` INT UNSIGNED NOT NULL UNIQUE, -- Only one archived record per group_id allowed
    `group_name` VARCHAR(32) NOT NULL,
    `owner_user_id` SMALLINT UNSIGNED NOT NULL,   -- user_id of the group owner
    `created_at` DATETIME NOT NULL,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) -- PK for archived group
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_group_members` (
    `archived_group_id` INT UNSIGNED NOT NULL,
    `group_id` INT UNSIGNED NOT NULL,
    `member_user_id` SMALLINT UNSIGNED NOT NULL,
    `is_admin` BOOLEAN DEFAULT FALSE,
    `joined_at` DATETIME NOT NULL,
    PRIMARY KEY (`archived_group_id`, `member_user_id`),
    FOREIGN KEY (`archived_group_id`) REFERENCES `cubcha_v1`.`archived_user_groups`(`archived_group_id`),
    FOREIGN KEY (`member_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) -- Consistent user reference
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create  password reset token table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`password_resets` (
    `resetoken_id` INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
    `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id',
    `resettoken` BOOLEAN NOT NULL COMMENT 'Password reset token created YES or NO',
    `resettokenexpiry` DATETIME NOT NULL COMMENT 'Expiry time of the reset token',
    `resetused` BOOLEAN DEFAULT FALSE COMMENT 'confirmation if the token was used',   
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='handles password reset tokens for users';


-- Table to track alarm triggers for excessive password resets
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`password_reset_alarms` (
    `user_id` SMALLINT UNSIGNED PRIMARY KEY COMMENT 'FK to user_main_details.user_id',
    `alarm_triggered` BOOLEAN DEFAULT FALSE COMMENT 'Whether alarm was triggered',
    `last_triggered` DATETIME DEFAULT NULL COMMENT 'When alarm was last triggered',
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks alarm state for excessive password resets';


-- Table to store manual information for users
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`infos` (
    `info_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT 'Primary key for manual info entries',
    `heading_cube` VARCHAR(48) NOT NULL COMMENT 'heading to the section of the manual',
    `category` ENUM('update', 'manual','announcement', 'reported_bugs') NOT NULL DEFAULT 'manual' COMMENT 'Distinguishes latest-update entries from manual/help entries',
    `language_code` ENUM('en', 'sk', 'es', 'fr', 'de', 'cz') NOT NULL COMMENT 'language code for the manual section (e.g., en, de)',
    `display_order`  SMALLINT(5) UNSIGNED NULL DEFAULT 1 COMMENT 'order of display for manual sections',
    `text_description` VARCHAR(256) NOT NULL COMMENT 'text of the section of the manual',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the selected info was created'   
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Manual information for users';

-- Table to store manual information for users
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`report_bug` (
    `bug_id` SMALLINT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT 'Primary key for bug reports',
    `user_id` SMALLINT UNSIGNED NOT NULL COMMENT 'FK to user_main_details.user_id',
    `title` VARCHAR(64) NOT NULL COMMENT 'Title of the bug',
    `category` ENUM('UI', 'Functionality', 'Performance', 'Security', 'Other') NOT NULL COMMENT 'Category of the bug',
    `bug_description` VARCHAR(256) NOT NULL COMMENT 'Description of the bug',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the bug was reported',
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores bug reports from users';


CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_sessions` (
  `session_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` CHAR(64) NOT NULL,
  `user_id` SMALLINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY   uq_token   (`token`),
  INDEX        idx_user_id (`user_id`),
  CONSTRAINT fk_user_sessions_user
  FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
