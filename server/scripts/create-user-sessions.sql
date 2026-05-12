-- Migration: create user_sessions table for session-based auth
-- Run once against the cubcha_v1 database

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id   INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  token        CHAR(64)            NOT NULL,
  user_id      SMALLINT UNSIGNED   NOT NULL,
  created_at   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME            NOT NULL,
  PRIMARY KEY  (session_id),
  UNIQUE KEY   uq_token   (token),
  INDEX        idx_user_id (user_id),
  CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES user_main_details (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
