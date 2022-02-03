import chalk from "chalk";
import fs from "fs";

const postDataPath = "./post_data.json";

// This is hacky to account for problems in our schema. We'll want to return to this.
const ids = {
  category_detail_id: 1,
}

const queries = [];

// some output-related helpers
const boldBlue    = (input) => chalk.bold(chalk.blue(input));
const boldGreen   = (input) => chalk.bold(chalk.green(input));
const boldRed     = (input) => chalk.bold(chalk.red(input));
const logSuccess  = (input) => console.log(boldGreen(`✓ - ${input}`));
const logFailure  = (input) => console.log(boldRed(`X - ${input}`));

// main program logic
function main() {
  console.log(boldBlue("tmdp.js - Targeted Marketing Data Parser"));
  console.log(chalk.bold(`Written by ${chalk.blue("John O'Hara")}\n\n`));

  console.log(`Reading '${postDataPath}'.....`)

  if (fs.existsSync(postDataPath)) {
    const postData = JSON.parse(fs.readFileSync(postDataPath));
    logSuccess(`'${postDataPath}' read successfully.`);


    parsePosts(postData);

    // make the loop to record input here - logAllQueries should only be called by request.
    logAllQueries();
  }
  else {
    logFailure(`ERROR reading '${postDataPath}' - does the file exist?`);
  }
}

// parses JSON posts
const parsePosts = (postData) => {
  if (postData.posts !== null) {
    // parse the top-level posts
    postData.posts.forEach(post => {
      addPostQuery(post);

      post.categories.forEach(category => addPostCategoryQuery(category, post));
      post.comments.forEach(comment => addPostCommentQuery(comment, post));
      post.likes.forEach(like => addPostLikeQuery(like, post));
      post.tags.forEach(tag => addPostTagQuery(tag, post));

    });

    logSuccess("Post Data parsed successfully.");
  }
};

// functions to add built queries to the queries array
const addPostQuery = (post) => queries.push(buildPostQuery(post));
const addPostCategoryQuery = (category, post) => queries.push(buildPostCategoryQuery(category, post));
const addPostCommentQuery = (comment, post) => queries.push(buildPostCommentQuery(comment, post));
const addPostLikeQuery = (like, post) => queries.push(buildPostLikeQuery(like, post));
const addPostTagQuery = (tag, post) => queries.push(buildPostTagQuery(tag, post));
const addCategoryDetailQuery = (id, name, detail) => queries.push(buildCategoryDetailQuery(id, name, detail));
const addCommentLikeQuery = (like, comment) => queries.push(buildCommentLikeQuery(like, comment));
const addCommentTagQuery = (tag, comment) => queries.push(buildCommentTagQuery(tag, comment));

// functions to build insert queries for specific database tables
const buildPostQuery = (post) =>
  buildInsertQuery("Post", stripUndefinedProperties({
    id: parseInt(post.id),
    social_id: parseInt(post.social_id),
    content: post.content,
    date: post.date,
  }));

const buildPostCategoryQuery = (category, post) => {
  // yeah, this is hacky garbage.
  if (category.detail_description !== undefined) {
    addCategoryDetailQuery(ids.category_detail_id, category.name, category.detail_description);
    ids.category_detail_id++;
  }

  let cleanedPostCategory = stripUndefinedProperties({
    id: parseInt(category.id),
    category_name: category.name,
    post_id: post.id,
  });

  return buildInsertQuery("PostCategory", cleanedPostCategory);
};

const buildCategoryDetailQuery = (id, name, detail) =>
  buildInsertQuery("CategoryDetail", stripUndefinedProperties({
    id: parseInt(id),
    category_name: name,
    category_detail_description: detail,
  }));

const buildPostCommentQuery = (comment, post) => {
  comment.tags  !== undefined && comment.tags.forEach(tag => addCommentTagQuery(tag, comment));

  comment.likes !== undefined && comment.likes.forEach(like => addCommentLikeQuery(like, comment));

  let cleanedComment = stripUndefinedProperties({
    id: parseInt(comment.id),
    content: comment.content,
    date: comment.date,
    post_id: parseInt(post.id),
    social_id: parseInt(comment.social_id),
  });

  return buildInsertQuery("PostComment", cleanedComment);
};

const buildPostLikeQuery = (like, post) => 
  buildInsertQuery("PostLike", stripUndefinedProperties({
    id: parseInt(like.id),
    date: like.date,
    post_id: parseInt(post.id),
    social_id: parseInt(like.social_id),
  }));

const buildPostTagQuery = (tag, post) => 
  buildInsertQuery("PostTag", stripUndefinedProperties({
    id: parseInt(tag.id),
    post_id: parseInt(post.id),
    tagger_social_id: parseInt(post.social_id),
    tagged_social_id: parseInt(tag.tagged_social_id),
  }));

const buildCommentLikeQuery = (like, comment) => 
  buildInsertQuery("PostCommentLike", stripUndefinedProperties({
    id: parseInt(like.id),
    comment_id: parseInt(comment.id),
    social_id: parseInt(like.social_id),
    date: like.date,
  }));

const buildCommentTagQuery = (tag, comment) =>
  buildInsertQuery("PostCommentTag", stripUndefinedProperties({
    id: parseInt(tag.id),
    comment_id: parseInt(comment.id),
    tagger_social_id: parseInt(comment.social_id),
    tagged_social_id: parseInt(tag.tagged_social_id),
  }));

const buildInsertQuery = (table, data) => 
  `INSERT INTO ${table} (${getFields(data)})\n    VALUES(${getValues(data)});`;

const logAllQueries = () => {
  console.log(boldBlue("\nAll Generated Queries: \n"));

  let queryNum = 1;

  // TODO: This padding will break for three digit numbers... and four digit numbers...
  //  I should probably think of a better way to do this.

  queries.forEach(query => {
    console.log(`${boldBlue(`${queryNum < 10 ? ` ${queryNum}` : queryNum}: `)}${query}\n`);
    queryNum++;
  });
};

// strips undefined properties from an object and returns the modified copy
const stripUndefinedProperties = (object) => {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  return object;
};

// gets the field names as a comma-separated string for all of the data present in an object
const getFields  = (object) => Object.keys(object).join(", ");

// gets the values as a comma-separated string for all of the data present in an object
const getValues  = (object) => 
  Object.values(object).map(value => typeof value === "string" ? `'${value}'` : value).join(", ");

main();