SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `cubcha_v1` DEFAULT CHARACTER SET utf8mb4;
USE `cubcha_v1`;

-- Create a user details 
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_main_details` (
    `user_id` SMALLINT PRIMARY KEY NOT NULL AUTO_INCREMENT COMMENT 'Primary key for users',
    `ldap_uid_id` VARCHAR(32) NOT NULL UNIQUE COMMENT 'Unique LDAP user ID (immutable)',
    `display_name` VARCHAR(64) NOT NULL COMMENT 'Display name surfaced in UI',
    `last_seen_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last time user was seen online',
    `last_login_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Last login timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores main user details';

-- Create user system details for profile setting
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_system_details` (
    `user_id` SMALLINT PRIMARY KEY NOT NULL COMMENT 'FK to user_main_details.user_id',
    `language_user` VARCHAR(32) NOT NULL COMMENT 'Preferred language for UI',
    `default_max_chat_participants` SMALLINT DEFAULT 10 COMMENT 'Default max chat participants for new conversations',
    `user_timezone` VARCHAR(32) DEFAULT 'UTC' COMMENT 'User timezone string',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Profile creation timestamp',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP on UPDATE CURRENT_TIMESTAMP COMMENT 'Last profile update timestamp',
    `last_login_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Last login timestamp',
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_timezone`) REFERENCES `cubcha_v1`.`timezones`(`timezone_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores user profile and system settings';


CREATE TABLE IF NOT EXISTS `cubcha_v1`.`contacts` (
    `owner_user_id` SMALLINT NOT NULL COMMENT 'User who owns this contact',
    `contact_user_id` SMALLINT NOT NULL COMMENT 'User who is the contact',
    `status` BOOLEAN DEFAULT TRUE COMMENT 'Contact status (active/blocked)',
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When contact was added',
    PRIMARY KEY (`owner_user_id`, `contact_user_id`),
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`contact_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores user-to-user contacts';

-- dorobit
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`contacts_requests` (
    `request_id` INT PRIMARY KEY AUTO_INCREMENT,
    -- Only one active (pending) request allowed per user pair. Unique key on (requester_user_id, target_user_id, status)
    -- allows new requests after approval/rejection, but prevents duplicate pending requests.
    `requester_user_id` SMALLINT NOT NULL,  -- Who sent request (FK to user_id)
    `target_user_id` SMALLINT NOT NULL,     -- Who receives request (FK to user_id)
    `requester_username` VARCHAR(64) NOT NULL,
    `target_username` VARCHAR(64) NOT NULL,
    `status` ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `responded_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `removed_at` DATETIME NULL,
    FOREIGN KEY (`requester_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`target_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    UNIQUE KEY `unique_pending_request` (`requester_user_id`, `target_user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`blocked_users` (
    `blocker_user_id` SMALLINT NOT NULL,      -- the user who is blocking
    `blocked_user_id` SMALLINT NOT NULL,      -- the user being blocked
    `blocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`blocker_user_id`, `blocked_user_id`),
    FOREIGN KEY (`blocker_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`blocked_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`user_groups` (
    `group_id` INT PRIMARY KEY AUTO_INCREMENT,
    `group_name` VARCHAR(64) NOT NULL,
    `owner_user_id` SMALLINT NOT NULL,   -- user_id of the group owner
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`group_members` (
    `group_id` INT NOT NULL,
    `member_user_id` SMALLINT NOT NULL,
    `is_admin` BOOLEAN DEFAULT FALSE,
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`group_id`, `member_user_id`),
    FOREIGN KEY (`group_id`) REFERENCES `cubcha_v1`.`user_groups`(`group_id`),
    FOREIGN KEY (`member_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conversations table (with optional link to user_groups)
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`conversations` (
    `conversation_id` INT PRIMARY KEY AUTO_INCREMENT,
    `max_participants` SMALLINT DEFAULT NULL, -- value set in user_system table
    `creator_user_id` SMALLINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `is_group` BOOLEAN DEFAULT FALSE,
    `title` VARCHAR(64) DEFAULT NULL,
    `group_id` INT DEFAULT NULL,
    FOREIGN KEY (`creator_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`),
    FOREIGN KEY (`group_id`) REFERENCES `cubcha_v1`.`user_groups`(`group_id`)
    ,KEY `idx_conversations_creator` (`creator_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Conversation participants table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`conversations_participants` (
    `conversation_id` INT NOT NULL,
    `user_id` SMALLINT NOT NULL,
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`conversation_id`, `user_id`),
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`conversations`(`conversation_id`),
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_participant_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS `cubcha_v1`.`messages` (
    `message_id` INT PRIMARY KEY AUTO_INCREMENT,
    `conversation_id` INT NOT NULL,
    `sender_user_id` SMALLINT NOT NULL,
    `sender_username` VARCHAR(32) NOT NULL, -- denormalized for fast display
    `sender_avatar_url` VARCHAR(255) DEFAULT NULL, -- denormalized for fast display
    `message_text` TEXT NOT NULL,
    `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`conversations`(`conversation_id`),
    FOREIGN KEY (`sender_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_messages_conv_sent` (`conversation_id`, `sent_at`)
    ,KEY `idx_messages_sender` (`sender_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_messages` (
    `archive_id` INT PRIMARY KEY AUTO_INCREMENT,
    `message_id` INT NOT NULL,
    `conversation_id` INT NOT NULL,
    `sender_user_id` SMALLINT NOT NULL,
    `sender_username` VARCHAR(32) NOT NULL, -- denormalized for fast display
    `sender_avatar_url` VARCHAR(255) DEFAULT NULL, -- denormalized for fast display
    `message_text` TEXT NOT NULL,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`archived_conversations`(`conversation_id`),
    FOREIGN KEY (`sender_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_archived_messages_conv_sent` (`conversation_id`, `archived_at`)
    ,KEY `idx_archived_messages_sender` (`sender_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_conversations` (
    `conversation_id` INT PRIMARY KEY,
    `max_participants` SMALLINT DEFAULT NULL,
    `creator_user_id` SMALLINT NOT NULL,
    `created_at` DATETIME DEFAULT NULL,
    `is_group` BOOLEAN DEFAULT FALSE,
    `title` VARCHAR(64) DEFAULT NULL,
    `group_id` INT DEFAULT NULL,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP
    ,KEY `idx_archived_conversations_creator` (`creator_user_id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_conversations_participants` (
    `conversation_id` INT NOT NULL,
    `user_id` SMALLINT NOT NULL,
    `joined_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`conversation_id`, `user_id`),
    FOREIGN KEY (`conversation_id`) REFERENCES `cubcha_v1`.`archived_conversations`(`conversation_id`),
    FOREIGN KEY (`user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`)
    ,KEY `idx_archived_participant_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_user_groups` (
    archived_group_id INT PRIMARY KEY AUTO_INCREMENT,
    `group_id` INT NOT NULL UNIQUE, -- Only one archived record per group_id allowed
    `group_name` VARCHAR(64) NOT NULL,
    `owner_user_id` SMALLINT NOT NULL,   -- user_id of the group owner
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `archived_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) -- PK for archived group
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`archived_group_members` (
    `archived_group_id` INT NOT NULL,
    `group_id` INT NOT NULL,
    `member_user_id` SMALLINT NOT NULL,
    `is_admin` BOOLEAN DEFAULT FALSE,
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`archived_group_id`, `member_user_id`),
    FOREIGN KEY (`archived_group_id`) REFERENCES `cubcha_v1`.`archived_user_groups`(`archived_group_id`),
    FOREIGN KEY (`member_user_id`) REFERENCES `cubcha_v1`.`user_main_details`(`user_id`) -- Consistent user reference
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `cubcha_v1`.`timezones` (
    `timezone_id` SMALLINT PRIMARY KEY AUTO_INCREMENT,
    `timezone_name` VARCHAR(64) NOT NULL UNIQUE,  -- e.g., 'Europe/Amsterdam'
    `utc_offset` VARCHAR(8) NOT NULL,             -- e.g., '+01:00'
    `display_name` VARCHAR(64) NOT NULL           -- e.g., 'Amsterdam (UTC+1)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
