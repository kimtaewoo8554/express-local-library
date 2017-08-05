var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');


// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });

};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next) {

  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });

};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res, next) {

    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    if (req.body.due_back != null) {
        req.body.due_back.setDate(req.body.due_back.getDate()+1);
    }

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
    });

    var bookstatus = ['Available', 'Maintenance', 'Loaned', 'Reserved'];

    var errors = req.validationErrors();
    if (errors) {

        Book.find({},'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          //Successful, so render
          res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors, bookinstance:bookinstance, bookstatus: bookstatus });
          console.log(bookstatus);
        });
        return;
    }
    else {
    // Data from form is valid

        bookinstance.save(function (err) {
            if (err) { return next(err); }
               //successful - redirect to new book-instance record.
               res.redirect(bookinstance.url);
            });
    }

};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstances) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_delete', {title: 'Delete Bookinstnace', bookinstance: bookinstances});
    });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {

    req.checkBody('bookinstanceid', 'Bookinstnace id must exist').notEmpty();

    BookInstance.findById(req.body.bookinstanceid)
    .populate('book')
    .exec(function (err, bookinstances) {
      if (err) { return next(err); }
      //Success
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
        if (err) { return next(err); }
        //Success - got to bookinstance list
        res.redirect('/catalog/bookinstances');
      });
    })
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res, next) {

    req.sanitize('id').escape();
    req.sanitize('id').trim();

    var bookstatus = ['Available', 'Maintenance', 'Loaned', 'Reserved'];

    async.parallel({
      bookinstance: function(callback) {
        BookInstance.findById(req.params.id).populate('book').exec(callback);
      },
      books: function(callback) {
        Book.find(callback);
      },
    }, function(err, results) {
        if (err) { return next(err); }

        res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.books, bookstatus: bookstatus, bookinstance: results.bookinstance});
    });

};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res, next) {

    //Sanitize id passed in.
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //Check other Data
    req.checkBody('book', 'Book must not be empty.').notEmpty();
    req.checkBody('imprint', 'Imprint must not be empty').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    if (req.body.due_back != null) {
        req.body.due_back.setDate(req.body.due_back.getDate()+1);
    }

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        due_back: req.body.due_back,
        status: req.body.status,
        _id:req.params.id
    });

    var bookstatus = ['Available', 'Maintenance', 'Loaned', 'Reserved'];

    var errors = req.validationErrors();
    if (errors) {
      // Re-render bookinstnace with error information
      // Get all authors and genres for form
      Book.find()
      .exec(function (err, books) {
        if (err) { return next(err); }

        res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: books, bookstatus: bookstatus, bookinstance: bookinstance, errors: errors});
      });
    }
    else {
      // Data from form is valid. Update the record.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
        if (err) { return next(err); }
        //successful - redirect to bookinstnace detail page.
        res.redirect(thebookinstance.url);
      });
    }
};
