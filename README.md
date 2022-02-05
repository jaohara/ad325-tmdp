# tmdp.js - Targeting Marketing Data Parser

A (real) JavaScript program written to parse and insert JSON data from a (fake) social media platform into a (fake) targeted marketing database.

## How To Run

This script requires both `node` and `npm` installed to run. 

1. Install the dependencies with `npm i`.
2. Run the script with `node tmdp.js`.


## How to Use

The command prompt will display a short list of options - further info can be viewed by inputting "h" for the help menu.

The basic functionality of the program will write out the generated SQL queries into a `.sql` script file. The JSON data can assembled as an HTML page for easier viewing of the managed dataset.


## Files

- `./tmdp.js` - The program script.
- `./post_data.json` - A snippet of a social media data feed represented as JSON.
- `./credentials.json` - A file to store the credentials for your MySQL database.
	- *Not yet implemented*
- `./templates/html_template.html` - The document template that is used for HTML output


### Schema Update Notes

- Should `Post`, `Comment`, etc, have a `datetime` field rather than `date`?

**All new tables have to be recreated using the `targeted_marketing` database rather than `mydb`.**

## Todo

- Escape single quotes in string data values
