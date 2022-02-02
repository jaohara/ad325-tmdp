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

    // parse the data 
    parsePosts(postData);

    console.log("\n");

    console.log(boldBlue("All Generated Queries: \n"));

    let queryNum = 1;

    queries.forEach(query => {
      console.log(`${boldBlue(`${queryNum}: `)}${query}\n`);
      queryNum++;
    });
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

// TODO: The "VALUES" portion of the buildQuery functions need to take into account the fact
//  that certain fields might be null.

const addPostQuery = (post) => queries.push(buildPostQuery(post));
const addPostCategoryQuery = (category, post) => queries.push(buildPostCategoryQuery(category, post));
const addPostCommentQuery = (comment, post) => queries.push(buildPostCommentQuery(comment, post));
const addPostLikeQuery = (like, post) => queries.push(buildPostLikeQuery(like, post));
const addPostTagQuery = (tag, post) => queries.push(buildPostTagQuery(tag, post));
const addCategoryDetailQuery = (id, name, detail) => queries.push(buildCategoryDetailQuery(id, name, detail));
const addCommentLikeQuery = (like, comment) => queries.push(buildCommentLikeQuery(like, comment));
const addCommentTagQuery = (tag, comment) => queries.push(buildCommentTagQuery(tag, comment));

const buildPostQuery = (post) => 
  `INSERT INTO Post (id, social_id, content, date) 
    VALUES (${parseInt(post.id)}, ${parseInt(post.social_id)}, '${post.content}', '${post.date}');`;

const buildPostCategoryQuery = (category, post) => {
  if (category.detail_description !== undefined) {
    addCategoryDetailQuery(ids.category_detail_id, category.name, category.detail_description);
    ids.category_detail_id++;
  }

  return `INSERT INTO PostCategory (id, category_name, post_id) 
    VALUES (${parseInt(category.id)}, '${category.name}', ${parseInt(post.id)})`;
};

const buildCategoryDetailQuery = (id, name, detail) => 
  `INSERT INTO CategoryDetail (id, category_name, category_detail_description) 
    VALUES (${parseInt(id)}, '${name}', '${detail}')`;

const buildPostCommentQuery = (comment, post) => {
  comment.tags !== undefined && comment.tags.forEach(tag => addCommentTagQuery(tag, comment));
  comment.likes !== undefined && comment.likes.forEach(like => addCommentLikeQuery(like, comment));

  return `INSERT INTO PostComment (id, content, date, post_id, social_id) VALUES
    (${parseInt(comment.id)}, '${comment.content}', '${comment.date}', ${parseInt(post.id)}, ${parseInt(comment.social_id)})`;
};

const buildPostLikeQuery = (like, post) => 
  `INSERT INTO PostLike (id, date, post_id, social_id)
    VALUES (${parseInt(like.id)}, '${like.date}', ${parseInt(post.id)}, ${parseInt(like.social_id)});`;

const buildPostTagQuery = (tag, post) => 
  `INSERT INTO PostTag (id, post_id, tagger_social_id, tagged_social_id)
    VALUES (${parseInt(tag.id)}, ${parseInt(post.id)}, ${parseInt(post.social_id)}, ${parseInt(tag.tagged_social_id)});`;

const buildCommentLikeQuery = (like, comment) => 
  `INSERT INTO PostCommentLike (id, comment_id, social_id, date)
    VALUES (${parseInt(like.id)}, ${parseInt(comment.id)}, ${parseInt(like.social_id)}, '${like.date}');`;

const buildCommentTagQuery = (tag, comment) => 
  `INSERT INTO PostCommentTag (id, comment_id, tagger_social_id, tagged_social_id) 
    VALUES (${parseInt(tag.id)}, ${parseInt(comment.id)}, ${parseInt(comment.social_id)}, ${parseInt(tag.tagged_social_id)});`;

main();