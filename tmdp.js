import chalk from "chalk";
import fs from "fs";
import PromptSync from "prompt-sync";

const prompt = PromptSync();

const postDataPath = "./post_data.json";
// const dbName = "targeting_marketing";
const dbName = "tmdb";

// This is hacky to account for problems in our schema. We'll want to return to this.
const ids = {
  category_detail_id: 1,
}

// arrays to store parsed data
const htmlLines = [];
const queries   = [];

// TODO: Use MySQL2 to connect to a local database to avoid the extra step of 
//  needing to output to a SQL script.

// main program logic
function main() {
  console.log(boldBlue("\ntmdp.js - Targeted Marketing Data Parser"));
  console.log(chalk.bold(`Written by ${chalk.blue("John O'Hara")}\n`));

  console.log(`Reading '${postDataPath}'.....`)

  if (fs.existsSync(postDataPath)) {
    const postData = JSON.parse(fs.readFileSync(postDataPath));
    logSuccess(`'${postDataPath}' read successfully.`);
    parsePosts(postData);
    parsePostsAsHtml(postData);
    runMainLoop();
  }
  else {
    logFailure(`ERROR reading '${postDataPath}' - does the file exist?`);
  }
}

// main prompt loop after data has been parsed
const runMainLoop = () => {
  while(true) {
    let input = inputPrompt();

    if (Object.keys(promptOptions).includes(input)) {
      promptOptions[input]();
    }
    else if (input === "x" || input === null) {
      console.log("\n 🦐 🦐 🦐 🦐 \n");
      return;
    }
    else {
      logFailure(`Sorry, '${input}' is not a valid option.`);
    }
  };
};


//  ------------------------
//  Prompt-Related Functions
//  ------------------------

// f - output formatted html
// h - help
// s - output sql script to file
// v - view parsed queries 
// x - exit

const inputPrompt = () => {
  let promptResponse = prompt(printPromptString());
  return promptResponse !== null ? promptResponse.toLowerCase() : null; 
}

// prints the formatted prompt string
const printPromptString = () => 
  `${boldBlue("(V)")}iew Queries, Output ${boldBlue("(S)")}QL script, \
Output ${boldBlue("(F)")}ormatted HTML, ${boldBlue("(H)")}elp, E${boldBlue("(x)")}it: `;

const printFileOverwritePromptString = (fileName) => 
  `File ${boldBlue(fileName)} exists, do you want to overwrite it? ${boldBlue('(y/n/q)')}: `;


// TODO: A lot of code reuse between outputFormattedHtml and outputSqlScript - look into that.
// Outputs parsed JSON to a formatted html document - corresponds to "f"
const outputFormattedHtml = () => {
  while (true) {
    let fileName = prompt(`\nFilename? Hit enter for default ${boldBlue('(./data_feed.html)')}: `);
    fileName = fileName === "" ? `./data_feed.html` : `./${fileName}`;

    if (fileName === null) {
      return;
    }

    let fileNameIsSafe  = !fs.existsSync(fileName);

    if (!fileNameIsSafe) {
      let overwritePromptResponse = prompt(printFileOverwritePromptString(fileName)).toLowerCase();
      fileNameIsSafe = overwritePromptResponse === "y";

      if (overwritePromptResponse === "q" || overwritePromptResponse === null) {
        console.log("");
        return;
      }
    }

    if (fileNameIsSafe) {
      // write the file
      const htmlTemplate = fs.readFileSync("./templates/html_template.html", 
        {encoding: 'utf8'}).split("{DATAPLACEHOLDER}");

      const htmlData = [htmlTemplate[0], ...htmlLines, htmlTemplate[1]];

      // might need to remove the "\n" chars that readFileSync appends

      fs.writeFileSync(fileName, htmlData.join(" "));
      logSuccess(`Successfully written formatted data to '${fileName}'!\n`);
      return;
    }
  }
}

// Prints a more verbose help message - corresponds to "h"
const printHelpMessage = () => {
  console.log(`
  ${boldBlue("tmdp.js")} - A (real) program to analyze (fake) data for insertion into a database.

  This program reads in JSON-formatted data and builds SQL INSERT queries from what it parses.

  ${boldBlue("Input Options:")}

    ${boldBlue("v - V")}iew Queries
      Outputs all of the generated queries to the screen.

    ${boldBlue("s - ")}Output ${boldBlue("S")}QL script
      Outputs the generated SQL queries to a file.

    ${boldBlue("f - ")}Output ${boldBlue("f")}ormatted HTML
      Outputs the data from the JSON file into a human-readable HTML file.

    ${boldBlue("h - H")}elp
      Outputs this help message.

    ${boldBlue("x - ")}E${boldBlue("x")}it
      Exits the program.\n`);
}

// Ouputs parsed created SQL statements to a script - corresponds to "s"
const outputSqlScript = () => {
  while (true) {
    let fileName = prompt(`\nFilename? Hit enter for default ${boldBlue('(./insert_script.sql)')}: `);
    fileName = fileName === "" ? `./insert_script.sql` : `./${fileName}`;

    if (fileName === null) {
      return;
    }

    let fileNameIsSafe  = !fs.existsSync(fileName);

    if (!fileNameIsSafe) {
      let overwritePromptResponse = prompt(printFileOverwritePromptString(fileName)).toLowerCase();
      fileNameIsSafe = overwritePromptResponse === "y";

      if (overwritePromptResponse === "q" || overwritePromptResponse === null) {
        console.log("");
        return;
      }
    }

    if (fileNameIsSafe) {
      // write the file
      const outputQueries = [`USE ${dbName};`, ...queries, ""];
      fs.writeFileSync(fileName, outputQueries.join("\n"));
      logSuccess(`Successfully written SQL queries to '${fileName}'!\n`);
      return;
    }
  }
}

// Outputs all parsed queries - corresponds to "v"
const logAllQueries = () => {
  console.log(boldBlue("\nAll Generated Queries: \n"));

  let queryNum = 1;

  // TODO: This padding will break for three digit numbers... and four digit numbers...
  //  I should probably think of a better way to do this.

  queries.forEach(query => {
    console.log(`    ${boldBlue(`${queryNum < 10 ? ` ${queryNum}` : queryNum}: `)}${query}\n`);
    queryNum++;
  });
};

const promptOptions = {
  f: outputFormattedHtml, 
  h: printHelpMessage, 
  s: outputSqlScript,
  v: logAllQueries, 
};


//  ----------------------
//  JSON-Parsing Functions
//  ----------------------

// parses JSON post data, deferring to other functions with each subsequent 
const parsePosts = (postData) => {
  if (postData.posts !== null) {
    // parse the top-level posts
    postData.posts.forEach(post => {
      addPostQuery(post);

      post.categories.forEach(category => {
        addPostCategoryQuery(category, post);
        if (category.detail_description !== undefined) {
          addCategoryDetailQuery(ids.category_detail_id, category.name, category.detail_description);
          ids.category_detail_id++;
        }
      });

      post.comments.forEach(comment => {
        addPostCommentQuery(comment, post);

        comment.tags  !== undefined && comment.tags.forEach(tag => addCommentTagQuery(tag, comment));
        comment.likes !== undefined && comment.likes.forEach(like => addCommentLikeQuery(like, comment));
      });
      
      post.likes.forEach(like => addPostLikeQuery(like, post));
      post.tags.forEach(tag => addPostTagQuery(tag, post));
    });

    logSuccess("Post Data parsed successfully.\n");
  }
};

const parsePostsAsHtml = (postData) => {
  if (postData.posts !== null) {
    postData.posts.forEach(post => {
      htmlLines.push(`
        <div class="post-container">
          <div class="post-info">
            Post by <span class="detail">User ${post.social_id}</span> on <span class="detail">${post.date} 📣</span>
            <div class="post-categories">  
              ${post.categories.map(category => `<span class="category">${category.name}</span>`).join(" ")}
            </div>
          </div>

          <div class="post-body">
            ${post.content}
          </div>

          <div class="post-likes">
            <span class="detail">${post.likes !== undefined || post.likes !== null ? post.likes.length : "0"} likes 👍</span>
          </div>

          <div class="post-comments">
            <span class="detail">${post.comments !== undefined || post.comments !== null ? post.comments.length : "0"} comments 📨</span>
            ${
              (post.comments !== undefined || post.comments !== null) &&
              post.comments.map(comment => 
                `
                <div class="comment">
                  <div class="comment-info">
                    Comment by <span class="detail">User ${comment.social_id}</span> on <span class="detail">${comment.date}</span>
                  </div>

                  <div class="comment-body">${comment.content}</div>
                </div>
                `).join(" ")
            }
          </div>
        </div>
      `);
    })
  }
}


//  ----------------------
//  Query-Adding Functions
//  ----------------------

// functions to add built queries to the queries array
const addPostQuery = (post) => queries.push(buildPostQuery(post));
const addPostCategoryQuery = (category, post) => {
  let query = buildPostCategoryQuery(category, post);
  !queries.includes(query) && queries.push(query);
};
const addPostCommentQuery = (comment, post) => queries.push(buildPostCommentQuery(comment, post));
const addPostLikeQuery = (like, post) => queries.push(buildPostLikeQuery(like, post));
const addPostTagQuery = (tag, post) => queries.push(buildPostTagQuery(tag, post));
const addCategoryDetailQuery = (id, name, detail) => queries.push(buildCategoryDetailQuery(id, name, detail));
const addCommentLikeQuery = (like, comment) => queries.push(buildCommentLikeQuery(like, comment));
const addCommentTagQuery = (tag, comment) => queries.push(buildCommentTagQuery(tag, comment));


//  ------------------------
//  Query-Building Functions
//  ------------------------

// builds a query to insert data into the Post table
const buildPostQuery = (post) =>
  buildInsertQuery("Post", stripUndefinedProperties({
    id: parseInt(post.id),
    social_id: parseInt(post.social_id),
    content: escapeSingleQuotes(post.content),
    date: convertDateString(post.date),
  }));

// builds a query to insert data into the PostCategory table
const buildPostCategoryQuery = (category, post) => {
  // yeah, this is hacky garbage.
  // if (category.detail_description !== undefined) {
  //   addCategoryDetailQuery(ids.category_detail_id, category.name, category.detail_description);
  //   ids.category_detail_id++;
  // }

  let cleanedPostCategory = stripUndefinedProperties({
    // id: parseInt(category.id),
    category_name: escapeSingleQuotes(category.name),
    // post_id: post.id,
  });

  return buildInsertQuery("PostCategory", cleanedPostCategory);
};

// builds a query to insert data into the CategoryDetail table
const buildCategoryDetailQuery = (id, name, detail) =>
  buildInsertQuery("CategoryDetail", stripUndefinedProperties({
    id: parseInt(id),
    post_category_name: escapeSingleQuotes(name),
    detail_description: escapeSingleQuotes(detail),
  }));

  // builds a query to insert data into the PostComment table
const buildPostCommentQuery = (comment, post) => {
  let cleanedComment = stripUndefinedProperties({
    id: parseInt(comment.id),
    content: escapeSingleQuotes(comment.content),
    date: convertDateString(comment.date),
    post_id: parseInt(post.id),
    social_id: parseInt(comment.social_id),
  });

  return buildInsertQuery("PostComment", cleanedComment);
};

// builds a query to insert data into the PostLike table
const buildPostLikeQuery = (like, post) => 
  buildInsertQuery("PostLike", stripUndefinedProperties({
    id: parseInt(like.id),
    date: convertDateString(like.date),
    post_id: parseInt(post.id),
    social_id: parseInt(like.social_id),
  }));

// builds a query to insert data into the PostTag table
const buildPostTagQuery = (tag, post) => 
  buildInsertQuery("PostTag", stripUndefinedProperties({
    id: parseInt(tag.id),
    post_id: parseInt(post.id),
    tagger_social_id: parseInt(post.social_id),
    tagged_social_id: parseInt(tag.tagged_social_id),
  }));

// builds a query to insert data into the PostCategory table
const buildCommentLikeQuery = (like, comment) => 
  buildInsertQuery("PostCommentLike", stripUndefinedProperties({
    id: parseInt(like.id),
    comment_id: parseInt(comment.id),
    social_id: parseInt(like.social_id),
    date: convertDateString(like.date),
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


//  ----------------------
//  Data-Related Functions
//  ----------------------

// strips undefined properties from an object and returns the modified copy
const stripUndefinedProperties = (object) => {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  return object;
};

// converts a date string from "MM/DD/YYYY" to "YYYY-MM-DD"
const convertDateString = (dateString) => {
  let dateComponents = dateString.split("/");
  return `${dateComponents[2]}-${dateComponents[0]}-${dateComponents[1]}`;
}

const escapeSingleQuotes = (dataString) => dataString.replaceAll("'", "''");

// gets the field names as a comma-separated string for all of the data present in an object
const getFields  = (object) => Object.keys(object).join(", ");

// gets the values as a comma-separated string for all of the data present in an object
const getValues  = (object) => 
  Object.values(object).map(value => typeof value === "string" ? `'${value}'` : value).join(", ");


//  ------------------------------
//  Miscellaneous Helper Functions
//  ------------------------------

// some output-related helpers
const boldBlue    = (input) => chalk.bold(chalk.blue(input));
const boldGreen   = (input) => chalk.bold(chalk.green(input));
const boldRed     = (input) => chalk.bold(chalk.red(input));
const logSuccess  = (input) => console.log(boldGreen(`✓ - ${input}`));
const logFailure  = (input) => console.log(boldRed(`X - ${input}`));

main();
