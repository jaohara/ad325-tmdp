# tmdp.js - Targeting Marketing Data Parser

A real JavaScript program written to parse and insert JSON data from a fake social media platform into a fake targeted marketing databased.

## How To Run

This script requires both `node` and `npm` installed to run. 

1. Install the dependencies with `npm i`.
2. Run the script with `node tmdp.js`.

## Files

- `./post_data.json` - A snippet of a social media data feed represented as JSON.
- `./credentials.json` - A file to store the credentials for your MySQL database.

### Schema Update Notes

- On `Post`, remove `post_category_id`. 
- On `Group`, remove `group_category_id`. 
- On `Event`, remove `event_category_id`.
- On `PostCategory`, remove `category_detail_id`.
- On `GroupCategory`, remove `category_detail_id`.
- On `EventCategory`, remove `category_detail_id`.
- On `CategoryDetail`, add nullable foreign key columns `post_category_id`, `group_category_id`, and `event_category_id` to refer to each of those tables ids.
- On `PostCategory`, add a foreign key column `post_id` to refer to `Post.id`. 
- On `GroupCategory`, add a foreign key column `group_id` to refer to `Group.id`.
- On `EventCategory`, add a foreign key column `event_id` to refer to `Event.id`.
- Should `Gender.gender` just be a unique `VARCHAR` used as the PK to allow for user-specified gender?

**All new tables have to be recreated using the `targeted_marketing` database rather than `mydb`.**
