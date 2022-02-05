/*
  Targeted Marketing Database Schema
  Version 2/5/2022
*/
DROP SCHEMA IF EXISTS tmdb;
CREATE SCHEMA
USE tmdb;

/*
  Notes:

  - Should `Post`, `Comment`, etc, have a `datetime` field rather than `date`?
  - Should ids be AUTO_INCREMENT specified in every case?
  - Should TIMESTAMPs have "DEFAULT CURRENT_TIMESTAMP"?
  - Are these tables all created in the proper order?
*/

-- User-related Tables
CREATE TABLE User (
  -- potentially AUTO INCREMENT
  id                            INT UNSIGNED NOT NULL,
  first_name                    VARCHAR(64),
  last_name                     VARCHAR(64),
  dob                           DATE,

  PRIMARY KEY (id)
);

CREATE TABLE UserPhone (
  number                        VARCHAR(32) NOT NULL,
  is_work                       TINYINT,
  user_id                       INT NOT NULL,

  CONSTRAINT userphone_pk PRIMARY KEY (number, user_id),

  CONSTRAINT userphone_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE UserEmail (
  email                         VARCHAR(128) NOT NULL,
  user_id                       INT NOT NULL,

  CONSTRAINT useremail_pk PRIMARY KEY (email, user_id),

  CONSTRAINT useremail_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE UserLocation (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  long                          FLOAT NOT NULL,
  lat                           FLOAT NOT NULL,
  user_id                       INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT userlocation_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE UserFriend (
  user_id                       INT NOT NULL, 
  friend_id                     INT NOT NULL, 

  CONSTRAINT userfriend_pk PRIMARY KEY (user_id, friend_id),

  CONSTRAINT userfriend_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT userfriend_friend_id_fk FOREIGN KEY (friend_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE UserViewpoint (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  user_id                       INT NOT NULL,
  political_view_id             INT,
  religion_id                   INT,
  social_issue_id               INT,

  PRIMARY KEY (id),

  CONSTRAINT userviewpoint_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT userviewpoint_political_view_id_fk FOREIGN KEY (political_view_id)
    REFERENCES PoliticalView (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT userviewpoint_religion_id_fk FOREIGN KEY (religion_id)
    REFERENCES Religion (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT userviewpoint_social_issue_id_fk FOREIGN KEY (social_issue_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Maybe reconsider the structure of PoliticalView/SocialIssue/Religion a bit. 
-- This will cause the FKs in UserViewpoint to also need to be revisited.

CREATE TABLE PoliticalView (
  -- not sure I like the IDs here - we could have multiple entries with the same
  -- name and intensity.

  -- maybe another table? We'll figure it out. 

  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  name                          VARCHAR(45) NOT NULL,
  intensity                     INT NOT NULL, -- what is the scale for this?

  PRIMARY KEY (id)
);

CREATE TABLE SocialIssue (
  id                            INT NOT NULL,
  name                          VARCHAR(45) NOT NULL,
  intensity                     INT NOT NULL, -- what is the scale for this?

  PRIMARY KEY (id)
);

CREATE TABLE Religion (
  id                            INT NOT NULL,
  name                          VARCHAR(45) NOT NULL,
  intensity                     INT NOT NULL, -- what is the scale for this?

  PRIMARY KEY (id)
);

CREATE TABLE Gender (
  gender                        VARCHAR(128) NOT NULL,

  PRIMARY KEY (gender)
)

-- could users have multiple genders? Should this PK be composite?
CREATE TABLE UserGender (
  user_id                       INT NOT NULL,
  gender                        VARCHAR(128) NOT NULL,

  PRIMARY KEY (user_id),

  CONSTRAINT usergender_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT usergender_gender_fk FOREIGN KEY (gender)
    REFERENCES Gender (gender)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- is this just partner? Could we avoid a lot of confusion by naming this "Partner"?
CREATE TABLE UserSocialMatePreference (
  user_id                       INT NOT NULL,
  social_mate_gender            VARCHAR(128) NOT NULL,

  CONSTRAINT usersocialmatepreference_pk (user_id, social_mate_gender),

  CONSTRAINT usersocialmatepreference_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT usersocialmatepreference_social_mate_gender_fk FOREIGN KEY (social_mate_gender)
    REFERENCES Gender (gender)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Social Platform-related Tables
CREATE TABLE Platform (
  name                          VARCHAR(128) NOT NULL,

  PRIMARY KEY (name)
);

CREATE TABLE SocialAccount (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  handle                        VARCHAR(128) NOT NULL,
  user_id                       INT NOT NULL,
  platform_name                 INT NOT NULL,

  -- considering making this id + user_id, but I guess a user could have multiple accounts 
  PRIMARY KEY (id),

  CONSTRAINT socialaccount_user_id_fk FOREIGN KEY (user_id)
    REFERENCES User (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT socialaccount_platform_name_fk FOREIGN KEY (platform_name)
    REFERENCES Platform (name)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


-- Post-related Tables

CREATE TABLE Post (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  social_id                     INT NOT NULL,
  content                       TEXT,
  -- Oh shit, this should be datetime instead, right?
  date                          DATE,

  PRIMARY KEY (id),

  CONSTRAINT post_social_id_fk FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE PostCategory (
  category_name                 VARCHAR(128) NOT NULL,

  PRIMARY KEY category_name
);

CREATE TABLE PostComment (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  social_id                     INT NOT NULL,
  post_id                       INT NOT NULL,
  content                       TEXT,
  date                          DATE,

  PRIMARY KEY (id),

  CONSTRAINT post_comment_social_id_fk FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT post_comment_post_id_fk FOREIGN KEY (post_id)
    REFERENCES Post (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE PostLike (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  date                          DATE,
  post_id                       INT NOT NULL,
  social_id                     INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT postlike_post_id_fk FOREIGN KEY (post_id)
    REFERENCES Post (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT postlike_social_id_fk FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE PostTag (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  post_id                       INT NOT NULL,
  -- do we actually need this column, or is it implied, like date?
  tagger_social_id              INT NOT NULL,
  tagged_social_id              INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT posttag_post_id_fk FOREIGN KEY (post_id)
    REFERENCES Post (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT posttag_tagger_social_id_fk FOREIGN KEY (tagger_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT posttag_tagged_social_id_fk FOREIGN KEY (tagged_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE PostCommentLike (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  date                          DATE,
  comment_id                    INT NOT NULL,
  social_id                     INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT postcommentlike_comment_id_fk FOREIGN KEY (comment_id)
    REFERENCES Comment (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT postcommentlike_social_id_fk FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE PostCommentTag (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  comment_id                       INT NOT NULL,
  -- do we actually need this column, or is it implied, like date?
  tagger_social_id              INT NOT NULL,
  tagged_social_id              INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT postcommenttag_comment_id_fk FOREIGN KEY (comment_id)
    REFERENCES Comment (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT postcommenttag_tagger_social_id_fk FOREIGN KEY (tagger_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT postcommenttag_tagged_social_id_fk FOREIGN KEY (tagged_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


-- Group-related Tables
CREATE TABLE Group (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  name                          VARCHAR(128) NOT NULL,
  creator_social_id             INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT group_creator_social_id_fk FOREIGN KEY (creator_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE GroupMember (
  group_id                      INT NOT NULL,
  social_id                     INT NOT NULL,

  CONSTRAINT group_member_pk PRIMARY KEY (group_id, social_id),

  CONSTRAINT group_member_group_id FOREIGN KEY (group_id)
    REFERENCES Group (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,  
  CONSTRAINT group_member_social_id FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE GroupCategory (
  category_name                 VARCHAR(128) NOT NULL,

  PRIMARY KEY category_name
);

-- Event-related Tables
CREATE TABLE Event (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  name                          VARCHAR(128) NOT NULL,
  datetime                      DATETIME NOT NULL,
  creator_social_id             INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT event_creator_social_id_fk FOREIGN KEY (creator_social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE EventMember (
  event_id                      INT NOT NULL,
  social_id                     INT NOT NULL,

  CONSTRAINT event_member_pk PRIMARY KEY (event_id, social_id),

  CONSTRAINT event_member_group_id FOREIGN KEY (event_id)
    REFERENCES Event (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,  
  CONSTRAINT event_member_social_id FOREIGN KEY (social_id)
    REFERENCES SocialAccount (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE EventCategory (
  category_name                 VARCHAR(128) NOT NULL,

  PRIMARY KEY category_name
);


-- Category-related Tables

-- maybe reconsider how we're using ids here? Also might not be an issue
CREATE TABLE CategoryDetail (
  -- potentially AUTO INCREMENT
  id                            INT NOT NULL,
  post_category_name            VARCHAR(128) NOT NULL,
  group_category_name           VARCHAR(128) NOT NULL,
  event_category_name           VARCHAR(128) NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT categorydetail_post_category_name FOREIGN KEY (post_category_name)
    REFERENCES PostCategory (category_name)
    ON DELETE CASCADE
    ON UPDATE CASCADE,  
  CONSTRAINT categorydetail_group_category_name FOREIGN KEY (group_category_name)
    REFERENCES GroupCategory (category_name)
    ON DELETE CASCADE
    ON UPDATE CASCADE,  
  CONSTRAINT categorydetail_event_category_name FOREIGN KEY (post_category_name)
    REFERENCES EventCategory (category_name)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);