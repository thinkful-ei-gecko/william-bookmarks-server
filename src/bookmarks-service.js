const BookmarksService = {
  getAllBookmarks(db) {
    return db
      .select('*')
      .from('bookmark_table');
  },

  getBookmarkById(db,id) {
    return db
      .select('*')
      .from('bookmark_table')
      .where( {id: id} )
      .first();
  },

  postBookmark(db,newBookmark) {
    return db
      .insert(newBookmark)
      .into('bookmark_table')
      .returning('*')
      .then(res => res[0]);
  },

  deleteBookmark(db, id) {
    return db
      .from('bookmark_table')
      .where( {id: id} )
      .delete();
  }
};

module.exports = BookmarksService;