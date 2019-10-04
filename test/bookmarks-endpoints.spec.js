const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

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
      });
    });

    context('Given that there is no data', () => {
      it('responds with a status 200 and an empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('Insert malicious bookmark', () => {
        return db.insert([maliciousBookmark]).into('bookmark_table');
      });

      it('removes XSS content', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
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
          .expect(404, {error: {message: 'Bookmark not found'}});
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmark_table')
          .insert([maliciousBookmark]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });


  describe('POST /bookmarks', () => {
    it('responds with 400 missing title if not supplied', () => {
      const newBookmarkMissingTitle = {
        // title: 'test-title',
        url: 'https://test.com',
        rating: 1,
        description: 'Lorem ipsum'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmarkMissingTitle)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'Title is required' }
        });
    });

    it('responds with 400 missing url if not supplied', () => {
      const newBookmarkMissingUrl = {
        title: 'test-title',
        // url: 'https://test.com',
        rating: 1,
        description: 'Lorem ipsum'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmarkMissingUrl)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'URL is required' }
        });
    });

    it('responds with 400 missing rating if not supplied', () => {
      const newBookmarkMissingRating = {
        title: 'test-title',
        url: 'https://test.com',
        // rating: 1,
        description: 'Lorem ipsum'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmarkMissingRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'Rating is required' }
        });
    });

    it('responds with 400 missing description if not supplied', () => {
      const newBookmarkMissingDescription = {
        title: 'test-title',
        url: 'https://test.com',
        rating: 1,
        // description: 'Lorem ipsum'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmarkMissingDescription)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: 'Description is required' }
        });
    });

    it('responds with 400 status if URL is not valid', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'www.test.com',
        rating: 1,
        description: 'Lorem ipsum'
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {error: {message: 'Not a valid URL'}});
    });

    it('responds with 400 status if rating is not a whole number between 1 and 5', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://www.test.com',
        rating: 'string',
        description: 'Lorem ipsum'
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {error: {message: 'Rating must be a whole number between 1-5'}});
    });

    it('returns a 201 and adds a new bookmark', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://test.com',
        description: 'test description',
        rating: 1
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        });
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      return supertest(app)
        .post('/bookmarks')
        .send(maliciousBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.url).to.eql(expectedBookmark.url);
          expect(res.body.description).to.eql(expectedBookmark.description);
          expect(res.body.rating).to.eql(expectedBookmark.rating);
          expect(res.body).to.have.property('id');
        });
    });
  });


  describe('DELETE /bookmarks/:id', () => {
    context('Given that data does not exist', () => {
      it('returns a 404 status with message of bookmark not found', () => {
        const id = 9999;
        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {error: {message: 'Bookmark not found'}});
      });
    });

    context('Given that the data exists', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('populate data table', () => {
        return db.insert(testBookmarks).into('bookmark_table');
      });


      it('returns a status of 204 and deletes the bookmark', () => {
        const id = 2;
        const expectedResult = testBookmarks.filter(bookmark => bookmark.id !== id);

        return supertest(app)
          .delete(`/bookmarks/${id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get('/articles')
              .expect(expectedResult);
          });
      });
    });
  });
});