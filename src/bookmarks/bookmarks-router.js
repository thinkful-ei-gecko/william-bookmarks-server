const express = require('express');
const logger = require('../logger');
const validUrl = require('valid-url');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');
const path = require('path');

const bookmarksRouter = express.Router();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating)
});

bookmarksRouter
  .route('/')
  .get((req,res,next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then(bookmarks => {
        res.status(200).json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post((req,res,next) => {
    const { title, url, rating, description } = req.body;
    const ratingNum = Number(rating);

    if(!title) {
      logger.error('Title is required');
      return res.status(400).send({error: {message: 'Title is required'}});
    }
    if(!url) {
      logger.error('URL is required');
      return res.status(400).send({error: {message: 'URL is required'}});
    }
    if(!rating) {
      logger.error('Rating is required');
      return res.status(400).send({error: {message: 'Rating is required'}});
    }
    if(!description) {
      logger.error('Description is required');
      return res.status(400).send({error: {message: 'Description is required'}});
    }

    if(url) {
      if(!validUrl.isWebUri(url)) {
        logger.error(`The URL: ${url} is not a valid url`);
        return res.status(400).send({error: {message: 'Not a valid URL'}});
      }
    }
    if(rating) {
      if(!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        logger.error(`Rating of ${ratingNum} was not a whole number between 1-5.`);
        return res.status(400).send({error: {message: 'Rating must be a whole number between 1-5'}});
      }
    }


    const db = req.app.get('db');
    const newBookmark = { title, url, rating, description };
    BookmarksService.postBookmark(db,newBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${newBookmark.id} created`);
        res.status(201).location(path.posix.join(req.originalUrl, `/${bookmark.id}`)).json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route('/:id')
  .all((req,res,next) => {
    const db = req.app.get('db');
    const id = req.params.id;

    BookmarksService.getBookmarkById(db,id)
      .then(bookmark => {
        if(!bookmark) {
          logger.error(`Bookmark with id ${id} not found`);
          return res.status(404).send({error: {message: 'Bookmark not found'}});
        }
        res.bookmark = bookmark; // what is res.bookmark???
        next();
      })
      .catch(next);
  })
  .get((req,res,next) => {
    res.status(200).json(serializeBookmark(res.bookmark));
  })
  .delete((req,res,next) => {
    const db = req.app.get('db');
    const id = req.params.id;

    BookmarksService.deleteBookmark(db,id)
      .then(() => {
        logger.info(`Bookmark with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch((req,res,next) => {
    const { title, url, rating, description } = req.body;
    const bookmarkToUpdate = { title, url, rating, description };
    const id = req.params.id;

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if(numberOfValues === 0) {
      return res.status(400).json({error: {message: 'Request body must contain title, url, rating, or description'}});
    }


    const db = req.app.get('db');
    BookmarksService.updateBookmark(db,id,bookmarkToUpdate)
      .then(numRowsAffected => {
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;