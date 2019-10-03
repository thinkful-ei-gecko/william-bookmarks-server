const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoint', () => {
  let db;

  before('setup connection to DB before all tests', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db',db);
  });

  before('clear the table data before all tests', () => {
    return db('bookmark_table').truncate();
  });

  afterEach('clear table data after each test', () => {
    return db('bookmark_table').truncate();
  });

  after('stop connection to DB after all tests', () => {
    return db.destroy();
  });


  describe('GET /bookmarks', () => {
    context('Given that there is data', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('Insert table with data before each test in this context', () => {
        return db.insert(testBookmarks).into('bookmark_table');
      });

      it('responds with status 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      }); //closes the IT block
    }); // closes the context
    context('Given that there is no data', () => {
      it('responds with a status 200 and an empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });
  });


  describe('GET /bookmarks/:bookmarkId', () => {
    context('Given that there is data', () => {

      const testBookmarks = makeBookmarksArray();

      beforeEach('Populate table with data', () => {
        return db.insert(testBookmarks).into('bookmark_table');
      });

      it('returns a status 200 with the specified bookmark', () => {
        const id = 2;
        const expectedBookmark = testBookmarks[id - 1];
        return supertest(app)
          .get(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
    context('Given that data does not exist', () => {
      it('returns status 404 with an error message', () => {
        const id = 9999;
        return supertest(app)
          .get(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, 'Bookmark not found');
      });
    });
  });
});