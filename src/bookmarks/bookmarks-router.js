const express = require('express');
const bookmarks = require('../store');
const logger = require('../logger');
const validUrl = require('valid-url');
const uuid = require('uuid/v4');
const BookmarksService = require('../bookmarks-service');

const bookmarksRouter = express.Router();

bookmarksRouter
  .route('/')
  .get((req,res,next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then(bookmarks => {
        res.status(200).json(bookmarks);
      });
  })
  .post((req,res) => {
    const { name, url, rating, description } = req.body;

    if(!name) {
      logger.error('Name is required');
      return res.status(400).send('Name is required');
    }
    if(!url) {
      logger.error('URL is required');
      return res.status(400).send('URL is required');
    }
    if(!rating) {
      logger.error('Rating is required');
      return res.status(400).send('Rating is required');
    }
    if(!description) {
      logger.error('Description is required');
      return res.status(400).send('Description is required');
    }


    if(url) {
      if(!validUrl.isWebUri(url)) {
        logger.error(`The URL: ${url} is not a valid url`);
        return res.status(400).send('Not a valid URL');
      }
    }
    if(rating) {
      if(!Number.isInteger(rating) || rating < 1 || rating > 5) {
        logger.error(`Rating of ${rating} was not a whole number between 1-5.`);
        return res.status(400).send('Rating must be a whole number between 1-5');
      }
    }

    const newBookmark = {
      id: uuid(),
      name,
      url,
      rating,
      description
    };

    bookmarks.push(newBookmark);

    logger.info(`Bookmark with id ${newBookmark.id} created`);
    res.status(201).location(`http://localhost:8000/bookmarks/${newBookmark.id}`).json(newBookmark);
  });

bookmarksRouter
  .route('/:id')
  .get((req,res) => {
    const db = req.app.get('db');
    const id = req.params.id;

    return BookmarksService.getBookmarkById(db,id)
      .then(bookmark => {
        if(!bookmark) {
          logger.error(`Bookmark with id ${id} not found`);
          return res.status(404).send('Bookmark not found');
        }
        return res.status(200).json(bookmark);
      });
  })
  .delete((req,res) => {
    const id = req.params.id;
  
    const index = bookmarks.findIndex(bookmark => bookmark.id === id);

    if(index === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res.status(404).send('Bookmark not found');
    }

    bookmarks.splice(index, 1);
    logger.info(`Bookmark with id ${id} deleted`);
    res.status(204).end();
  });

module.exports = bookmarksRouter;